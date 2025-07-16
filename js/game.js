import { Player } from './player.js';
import { DragAndDropManager } from './ui/index.js';
import { LocalStorageManager } from './localStorage/index.js';
import { Hand, Deck, ActiveCardZone, Timer, CardModal, QuitModal, DiscardPile, BattleSystem, ChatSystem } from './components/index.js';

export class Game {
   constructor(playerDeck, opponentDeck, maxHandSize = 5) {
      // === CONFIGURATION ===
      this.maxHandSize = maxHandSize;
      this.drawCooldown = 5 * 60; // 5 minutes en secondes
      this.timeLeft = 0;
      this.canDraw = true;

      // === GESTIONNAIRES ===
      this.storageManager = new LocalStorageManager();
      this.emergencyCleanup();

      // === JOUEURS ===
      this.player = new Player(playerDeck, maxHandSize);
      this.opponent = new Player(opponentDeck, maxHandSize);


      // === COMPOSANTS UI ===
      this.cardModal = new CardModal();
      this.quitModal = new QuitModal();

      // === ÉLÉMENTS DOM ===
      this.initializeDOMElements();

      // === COMPOSANTS DE JEU ===
      this.initializeGameComponents();

      // === CONFIGURATION INITIALE ===
      this.initializeGameSettings();

      console.log("🎮 Jeu initialisé avec succès");
   }

   // === MÉTHODES D'INITIALISATION ===

   initializeDOMElements() {
      this.playerActive = document.getElementById("player-active");
      this.opponentActive = document.getElementById("opponent-active");
      this.results = document.getElementById("results");
      this.deckContainer = document.getElementById("deck");
      this.handContainer = document.getElementById("hand");
      this.opponentDeckContainer = document.getElementById("opponent-deck");
      this.opponentHandContainer = document.getElementById("opponent-hand");
      this.drawTimerElement = document.getElementById("draw-timer");

      // Vérifier que tous les éléments critiques existent
      const criticalElements = {
         playerActive: this.playerActive,
         opponentActive: this.opponentActive,
         handContainer: this.handContainer,
         deckContainer: this.deckContainer,
         opponentHandContainer: this.opponentHandContainer,
         opponentDeckContainer: this.opponentDeckContainer
      };

      const missingElements = Object.entries(criticalElements)
         .filter(([name, element]) => !element)
         .map(([name]) => name);

      if (missingElements.length > 0) {
         throw new Error(`Éléments DOM manquants: ${missingElements.join(', ')}`);
      }

   }

   initializeGameComponents() {
      // Drag and Drop
      this.dragAndDrop = new DragAndDropManager(this);

      // Composants de cartes
      this.playerHand = new Hand(this.handContainer, true, this.cardModal, this.dragAndDrop);
      this.opponentHand = new Hand(this.opponentHandContainer, false, this.cardModal, this.dragAndDrop);
      this.playerDeck = new Deck(this.deckContainer, this.player.deck, this.dragAndDrop.createDragStartHandler());
      this.opponentDeck = new Deck(this.opponentDeckContainer, this.opponent.deck);

      console.log('🃏 Deck joueur à la création du Game :', this.playerDeck);
      console.log('🃏 Deck adversaire à la création du Game :', this.opponentDeck);

      // Composants de défausse
      this.playerDiscard = new DiscardPile('player-discard', 'player', this.cardModal);
      this.opponentDiscard = new DiscardPile('opponent-discard', 'opponent', this.cardModal);

      // Composants de bataille
      this.battleSystem = new BattleSystem(this);
      this.playerActiveZone = new ActiveCardZone(this.playerActive, this.cardModal, true); // Zone joueur
      this.opponentActiveZone = new ActiveCardZone(this.opponentActive, this.cardModal, false); // Zone adversaire
      
      // Système de messagerie
      this.chatSystem = new ChatSystem(this.battleSystem);
      this.opponentActiveZone = new ActiveCardZone(this.opponentActive, this.cardModal, false); // Zone adversaire

      // Timer
      const timerDisplay = document.getElementById("timer-display");
      this.timer = new Timer(timerDisplay, this);
      this.configureTimerCallbacks();

      // Synchroniser les données initiales
      this.synchronizeComponentData();
   }

   configureTimerCallbacks() {
      this.timer.setOnExpired(() => {
         this.canDraw = true;
         this.saveGameState();
      });

      this.timer.setOnTick((timeLeft) => {
         this.timeLeft = timeLeft;
      });
   }

   synchronizeComponentData() {
      // Synchroniser les mains
      this.playerHand.cards = this.player.hand.cards;
      this.opponentHand.cards = this.opponent.hand.cards;
   }

   initializeGameSettings() {
      this.hasSavedGame = this.storageManager.checkSavedGameValidity();
      this.setupAutoSave();
      this.initializeDropZones();
   }

   // === MÉTHODES UTILITAIRES ===

   emergencyCleanup() {
      this.storageManager.emergencyCleanup();
   }

   initializeDropZones() {

      const elements = [this.playerActive, this.opponentActive, this.handContainer];
      const missingElements = elements.filter(el => !el);

      if (missingElements.length > 0) {
         return;
      }

      this.dragAndDrop.initializeDropZones(
         this.playerActive,
         this.opponentActive,
         this.handContainer
      );

   }

   // === GESTION DES CARTES ===

   attemptDrawCard() {
      // Validations
      if (!this.canDraw) {
         this.showMessage("Attends que le timer expire pour tirer une nouvelle carte !", "warning");
         return null;
      }

      if (this.player.hand.cards.length >= this.maxHandSize) {
         this.showMessage("Ta main est pleine !", "warning");
         return null;
      }

      if (this.player.deck.length === 0) {
         this.showMessage("Ta pioche est vide !", "warning");
         return null;
      }

      // Exécuter le tirage
      this.canDraw = false;
      const cardFromDeck = this.player.deck.shift();

      // Notifier le système de chat
      if (this.chatSystem) {
         this.chatSystem.addGameMessage('draw', { player: 'player' });
      }

      // Recyclage de carte si la main n'est pas vide
      if (this.player.hand.cards.length > 0) {
         const recycledCard = this.player.hand.cards.shift();
         this.player.deck.push(recycledCard);
         this.showCardRecycleAnimation();
      }

      // Ajouter la nouvelle carte
      this.player.hand.cards.push(cardFromDeck);
      console.log(`Carte "${cardFromDeck.name}" tirée de la pioche`);

      // Démarrer le timer et sauvegarder
      this.timer.start(this.drawCooldown);
      this.saveGameState();

      return cardFromDeck;
   }

   drawInitialCards(player, count = 5) {
      const playerType = player === this.player ? 'joueur' : 'adversaire';


      // Correction : toujours reconstituer la pioche à partir de toutes les cartes (main + deck + activeCard)
      let allCards = [];
      if (player.deck && Array.isArray(player.deck)) allCards = allCards.concat(player.deck);
      if (player.hand && Array.isArray(player.hand.cards)) allCards = allCards.concat(player.hand.cards);
      if (player.activeCard) allCards.push(player.activeCard);
      // Remplacer le contenu du deck sans casser la référence
      player.deck.length = 0;
      player.deck.push(...allCards);
      player.hand.cards = [];
      player.activeCard = null;

      // Tirer les cartes pour la main (max 5 ou moins si la pioche est plus petite)
      for (let i = 0; i < count; i++) {
         if (player.deck.length === 0) break;
         const drawnCard = player.deck.shift();
         if (drawnCard) {
            player.hand.cards.push(drawnCard);
         }
      }
   }


   renderPlayerCards() {

      // S'assurer que les données sont synchronisées
      this.playerHand.cards = this.player.hand.cards;
      this.playerDeck.cards = this.player.deck;

      // Rendu des composants
      this.playerHand.render();
      this.playerDeck.render();

   }

   renderOpponentCards() {

      // S'assurer que les données sont synchronisées
      this.opponentHand.cards = this.opponent.hand.cards;

      // Rendu des composants
      this.opponentHand.render();
      this.opponentDeck.render();

   }

   renderCards() {
      this.renderPlayerCards();
      this.renderOpponentCards();
      this.renderDiscardPiles();
   }

   renderDiscardPiles() {
      this.playerDiscard.setCards(this.player.discardPile);
      this.opponentDiscard.setCards(this.opponent.discardPile);
   }

   renderActiveCard(container, card) {
      if (container === this.playerActive) {
         this.playerActiveZone.setActiveCard(card);
         this.playerActiveZone.updateHPDisplay(document.getElementById("player-hp"));
      } else if (container === this.opponentActive) {
         this.opponentActiveZone.setActiveCard(card);
         this.opponentActiveZone.updateHPDisplay(document.getElementById("opponent-hp"));
      }
   }

   displayResults() {
      const playerCard = this.player.activeCard;
      const opponentCard = this.opponent.activeCard;

      if (!playerCard || !opponentCard) {
         return;
      }

      console.log("⚔️ Affichage des résultats de combat via BattleSystem");
      // Les résultats sont maintenant gérés par le BattleSystem
   }

   // === MÉTHODES DE MODAL ET UI ===

   showCardModal(card) {
      this.cardModal.showCardModal(card);
   }

   showMessage(message, type = "info") {
      // Méthode unifiée pour afficher des messages
      if (type === "warning") {
         alert(message); // Temporaire, peut être remplacé par une modal personnalisée
      } else {
         console.log(message);
      }
   }

   showCardRecycleAnimation() {
      const animElement = document.createElement("div");
      animElement.style.cssText = `
         position: fixed;
         top: 20%;
         left: 50%;
         transform: translateX(-50%) scale(0);
         z-index: 999;
         background: rgba(255, 255, 255, 0.9);
         backdrop-filter: blur(5px);
         border-radius: 8px;
         padding: 8px 16px;
         box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
         border: 2px solid #10b981;
         color: #065f46;
         font-weight: bold;
         transition: all 0.5s ease-out;
      `;
      animElement.innerHTML = `♻️ Carte recyclée dans la pioche!`;

      document.body.appendChild(animElement);

      // Animation
      setTimeout(() => {
         animElement.style.transform = "translateX(-50%) scale(1)";
      }, 50);

      setTimeout(() => {
         animElement.style.opacity = "0";
         setTimeout(() => {
            if (animElement.parentNode) {
               animElement.parentNode.removeChild(animElement);
            }
         }, 500);
      }, 1500);
   }

   showTutorialMessage(message) {
      console.log("📚 Tutoriel:", message);
      // Ici, on pourrait implémenter une modal de tutoriel plus élégante
      setTimeout(() => alert(message), 1000);
   }

   showStorageErrorMessage() {
      this.showTutorialMessage("⚠️ Des données corrompues ont été détectées et supprimées. Un nouveau jeu a été créé.");
   }

   showErrorMessage(message) {
      console.error("❌", message);
      alert(message);
   }

   // === GESTION DU JEU ===

   startGame() {
      const hadCorruptedData = !this.hasSavedGame && this.storageManager.hadCorruptedData();
      this.storageManager.clearCorruptedDataFlag();

      const gameLoaded = this.loadGameState();


      if (!gameLoaded) {
         console.log("🎮 === NOUVEAU JEU - TIRAGE DES CARTES INITIALES ===");

         // Tirer pour le joueur
         this.drawInitialCards(this.player);

         // Tirer pour l'adversaire
         this.drawInitialCards(this.opponent);


         if (hadCorruptedData) {
            this.showStorageErrorMessage();
         }
      } else {
         console.log("🎮 Jeu chargé depuis localStorage");
         this.showTutorialMessage("Ton jeu précédent a été restauré! 🎮 Continue de jouer où tu t'étais arrêté.");
      }

      this.finishGameInitialization();
   }

   finishGameInitialization() {

      // Synchroniser les données avant le rendu
      this.synchronizeComponentData();

      // Configuration finale
      this.addQuitButton();
      this.timer.start(this.drawCooldown, this.timeLeft);
      this.addDropListeners(this.playerActive, this.opponentActive, this.handContainer);

      if (this.playerDeck) this.playerDeck.render();
      if (this.opponentDeck) this.opponentDeck.render();
      this.renderCards();

      // Rendu des cartes actives
      this.renderActiveCards();

      // Affichage des résultats
      this.displayResults();

      // Vérifier si le joueur doit choisir une attaque après rechargement
      this.checkAttackSelectionAfterReload();

      // Diagnostic post-initialisation
      this.schedulePostInitDiagnostic();
   }

   checkAttackSelectionAfterReload() {
      // Vérifier si nous sommes dans un état de combat où le joueur doit choisir une attaque
      if (!this.battleSystem) return;

      // Utiliser la méthode de vérification robuste du BattleSystem
      this.battleSystem.checkStateAfterRefresh();
   }

   renderActiveCards() {
      if (this.player.activeCard) {
         this.playerActiveZone.setActiveCard(this.player.activeCard);
      }

      if (this.opponent.activeCard) {
         this.opponentActiveZone.setActiveCard(this.opponent.activeCard);
      }
   }

   schedulePostInitDiagnostic() {
      setTimeout(() => {
         const diagnostic = this.runGameDiagnostic();
         if (diagnostic?.hasData && !diagnostic?.hasDisplay) {
            this.attemptDisplayFix();
         }
      }, 3000);
   }

   attemptDisplayFix() {
      this.showErrorMessage("Problème d'affichage détecté. Correction en cours...");
      setTimeout(() => {
         this.renderCards();
         this.verifyCardsDisplay();
      }, 2000);
   }

   runGameDiagnostic() {
      // Méthode de diagnostic du jeu (à implémenter selon les besoins)
      return {
         hasData: this.player.hand.cards.length > 0,
         hasDisplay: this.handContainer.children.length > 0
      };
   }

   verifyCardsDisplay() {
      // Vérification de l'affichage des cartes (à implémenter selon les besoins)
      console.log("🔍 Vérification de l'affichage des cartes");
   }

   // === SAUVEGARDE ET CHARGEMENT ===

   saveGameState() {
      const gameData = {
         player: {
            deck: Array.isArray(this.player.deck) ? [...this.player.deck] : [],
            hand: Array.isArray(this.player.hand?.cards) ? [...this.player.hand.cards] : [],
            activeCard: this.player.activeCard || null,
            discardPile: Array.isArray(this.player.discardPile) ? [...this.player.discardPile] : []
         },
         opponent: {
            deck: Array.isArray(this.opponent.deck) ? [...this.opponent.deck] : [],
            hand: Array.isArray(this.opponent.hand?.cards) ? [...this.opponent.hand.cards] : [],
            activeCard: this.opponent.activeCard || null,
            discardPile: Array.isArray(this.opponent.discardPile) ? [...this.opponent.discardPile] : []
         },
         battleSystem: this.battleSystem,
         canDraw: this.canDraw,
         timeLeft: this.timer.getTimeLeft(),
         timerState: this.timer.getState()
      };

      console.log('[DEBUG SAVE] gameData envoyé au localStorage:', gameData);
      this.storageManager.saveGameState(gameData);
   }

   loadGameState() {
      const gameState = this.storageManager.loadGameState();
      if (!gameState) return false;

      try {
         this.restorePlayersState(gameState);
         this.restoreGameState(gameState);
         this.restoreTimerState(gameState);
         return true;
      } catch (error) {
         console.error("Erreur lors de la restauration:", error);
         return false;
      }
   }

   restorePlayersState(gameState) {

      // Restaurer l'état du joueur sans casser la référence du deck
      this.player.deck.length = 0;
      this.player.deck.push(...(Array.isArray(gameState.player.deck) ? gameState.player.deck : []));
      this.player.hand.cards.length = 0;
      if (Array.isArray(gameState.player.hand)) {
         this.player.hand.cards.push(...gameState.player.hand);
      }
      this.player.activeCard = gameState.player.activeCard;
      this.player.discardPile = Array.isArray(gameState.player.discardPile) ? gameState.player.discardPile : [];
      // Synchroniser la référence du composant Deck
      if (this.playerDeck) this.playerDeck.cards = this.player.deck;

      // Restaurer l'état de l'adversaire sans casser la référence du deck
      this.opponent.deck.length = 0;
      this.opponent.deck.push(...(Array.isArray(gameState.opponent.deck) ? gameState.opponent.deck : []));
      this.opponent.hand.cards.length = 0;
      if (Array.isArray(gameState.opponent.hand)) {
         this.opponent.hand.cards.push(...gameState.opponent.hand);
      }
      this.opponent.activeCard = gameState.opponent.activeCard;
      this.opponent.discardPile = Array.isArray(gameState.opponent.discardPile) ? gameState.opponent.discardPile : [];
      // Synchroniser la référence du composant Deck adversaire
      if (this.opponentDeck) this.opponentDeck.cards = this.opponent.deck;

      // Forcer le rendu des mains après restauration pour éviter tout bug d'affichage
      if (this.playerHand) {
         this.playerHand.cards = this.player.hand.cards;
         this.playerHand.render();
      }
      if (this.opponentHand) {
         this.opponentHand.cards = this.opponent.hand.cards;
         this.opponentHand.render();
      }

      // Restaurer l'état du système de bataille
      if (gameState.battleSystem && this.battleSystem) {
         this.battleSystem.playerHP = gameState.battleSystem.playerHP;
         this.battleSystem.opponentHP = gameState.battleSystem.opponentHP;
         this.battleSystem.maxPlayerHP = gameState.battleSystem.maxPlayerHP;
         this.battleSystem.maxOpponentHP = gameState.battleSystem.maxOpponentHP;
         this.battleSystem.selectedPlayerAttack = gameState.battleSystem.selectedPlayerAttack;
         this.battleSystem.selectedOpponentAttack = gameState.battleSystem.selectedOpponentAttack;
         this.battleSystem.isInBattle = gameState.battleSystem.isInBattle || false;
         this.battleSystem.battlePhase = gameState.battleSystem.battlePhase;
         this.battleSystem.opponentAttacksFirst = gameState.battleSystem.opponentAttacksFirst || false;
         this.battleSystem.attackSelectionStarted = gameState.battleSystem.attackSelectionStarted || false;
      }
   }

   restoreGameState(gameState) {
      this.canDraw = gameState.canDraw !== undefined ? gameState.canDraw : true;
      this.timeLeft = gameState.timeLeft || 0;
   }

   restoreTimerState(gameState) {
      if (gameState.timerState) {
         this.timer.setState(gameState.timerState);
      } else if (this.timeLeft > 0) {
         this.timer.start(this.drawCooldown, this.timeLeft);
      }
   }

   setupAutoSave() {
      // Configuration de la sauvegarde automatique
      this.storageManager.setupAutoSave?.();
   }

   // === GESTION DE LA SORTIE DU JEU ===

   addQuitButton() {
      if (document.getElementById('quit-button')) return;

      const quitButton = this.createQuitButton();
      document.body.appendChild(quitButton);
   }

   createQuitButton() {
      const button = document.createElement("button");
      button.id = "quit-button";
      button.innerHTML = "🚪 Quitter le jeu";
      button.className = "fixed bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 hover:scale-105";
      button.onclick = this.handleQuitButtonClick.bind(this);
      return button;
   }

   handleQuitButtonClick() {

      if (!this.quitModal) {
         this.fallbackQuitConfirmation();
         return;
      }

      this.quitModal.show(
         () => this.confirmQuit(),
         () => this.cancelQuit()
      );
   }

   fallbackQuitConfirmation() {
      if (confirm("Êtes-vous sûr de vouloir quitter le jeu? Toutes les données seront supprimées.")) {
         this.quitGame();
      }
   }

   confirmQuit() {
      this.quitGame();
   }

   cancelQuit() {
      console.log("❌ Annulation de la sortie");
   }

   quitGame() {

      // Nettoyer les données
      this.storageManager.clearGameState();

      // Masquer les éléments de jeu
      this.hideGameElements();

      // Afficher le message final
      this.showFinalMessage();
   }

   hideGameElements() {
      const elementsToHide = [
         'game-area',
         'game-header',
         'quit-button'
      ];

      elementsToHide.forEach(id => {
         const element = document.getElementById(id);
         if (element) {
            element.style.display = 'none';
         }
      });

      // Masquer les overlays
      document.querySelectorAll('.overlay, .modal').forEach(overlay => {
         overlay.style.display = 'none';
      });
   }

   showFinalMessage() {
      const messageDiv = document.createElement('div');
      messageDiv.style.cssText = `
         position: fixed;
         top: 50%;
         left: 50%;
         transform: translate(-50%, -50%);
         background: white;
         padding: 40px;
         border-radius: 12px;
         box-shadow: 0 10px 30px rgba(0,0,0,0.3);
         text-align: center;
         z-index: 10000;
      `;

      messageDiv.innerHTML = `
         <h2 style="margin-bottom: 20px; color: #dc2626;">🚪 Jeu terminé</h2>
         <p style="margin-bottom: 20px; color: #6b7280;">Toutes les données ont été supprimées.</p>
         <button onclick="window.location.reload()" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
            🎮 Nouvelle partie
         </button>
      `;

      document.body.appendChild(messageDiv);
   }

   resetGame() {
      this.storageManager.clearGameState();
      window.location.reload();
   }

   // === MÉTHODES DÉPRÉCIÉES (RÉTROCOMPATIBILITÉ) ===

   dragstart_handler(ev) {
      return this.dragAndDrop.handleDragStart(ev);
   }

   dragover_handler(ev) {
      return this.dragAndDrop.handleDragOver(ev);
   }

   drop_handler(ev) {
      return this.dragAndDrop.handleDrop(ev);
   }

   addDropListeners(...elements) {
      this.dragAndDrop.initializeDropZones(...elements);
   }
}
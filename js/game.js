
import { Player } from './player.js';
import { DragAndDropManager } from './ui/index.js';
import { LocalStorageManager } from './localStorage/index.js';
import { Hand, ActiveCardZone, Timer, CardModal, QuitModal, DiscardPile, BattleSystem, ChatSystem } from './components/index.js';
import { DeckSelectionModal } from './components/modals/DeckSelectionModal.js';

export class Game {
   constructor(playerDeck, opponentDeck, maxHandSize = 5) {
      this.maxHandSize = maxHandSize;
      this.storageManager = new LocalStorageManager();
      this.emergencyCleanup();
      this.player = new Player(playerDeck, maxHandSize);
      this.opponent = new Player(opponentDeck, maxHandSize);
      this.cardModal = new CardModal();
      this.quitModal = new QuitModal();
      this.initDOMElements();
      this.initGameComponents();
      this.initGameSettings();
   }

   showInitialDeckSelection(deck, onComplete) {
      const modal = new DeckSelectionModal(deck, onComplete);
      modal.show();
   }

   initDOMElements() {
      this.playerActive = document.getElementById("player-active");
      this.opponentActive = document.getElementById("opponent-active");
      this.results = document.getElementById("results");
      this.handContainer = document.getElementById("hand");
      this.opponentHandContainer = document.getElementById("opponent-hand");
      // Suppression de l'élément draw-timer (plus de timer de pioche)

      // Vérifier que tous les éléments critiques existent
      const criticalElements = {
         playerActive: this.playerActive,
         opponentActive: this.opponentActive,
         handContainer: this.handContainer,
         opponentHandContainer: this.opponentHandContainer,
      };

      const missingElements = Object.entries(criticalElements)
         .filter(([name, element]) => !element)
         .map(([name]) => name);

      if (missingElements.length > 0) {
         throw new Error(`Éléments DOM manquants: ${missingElements.join(', ')}`);
      }

   }

   initGameComponents() {
      this.dragAndDrop = new DragAndDropManager(this);
      this.playerHand = new Hand(this.handContainer, true, this.cardModal, this.dragAndDrop);
      this.opponentHand = new Hand(this.opponentHandContainer, false, this.cardModal, this.dragAndDrop);
      this.playerDiscard = new DiscardPile('player-discard', 'player', this.cardModal);
      this.opponentDiscard = new DiscardPile('opponent-discard', 'opponent', this.cardModal);
      this.battleSystem = new BattleSystem(this);
      this.playerActiveZone = new ActiveCardZone(this.playerActive, this.cardModal, true);
      this.opponentActiveZone = new ActiveCardZone(this.opponentActive, this.cardModal, false);
      this.chatSystem = new ChatSystem(this.battleSystem);
      this.opponentActiveZone = new ActiveCardZone(this.opponentActive, this.cardModal, false);
      this.synchronizeComponentData();
   }

   synchronizeComponentData() {
      this.playerHand.cards = this.player.hand.cards;
      this.opponentHand.cards = this.opponent.hand.cards;
   }

   initGameSettings() {
      this.hasSavedGame = this.storageManager.checkSavedGameValidity();
      this.setupAutoSave();
      this.initializeDropZones();
   }

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

   renderPlayerCards() {
      this.playerHand.cards = this.player.hand.cards;
      this.playerHand.render();
   }

   renderOpponentCards() {
      this.opponentHand.cards = this.opponent.hand.cards;
      this.opponentHand.render();
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
   }


   showCardModal(card) {
      this.cardModal.showCardModal(card);
   }

   showMessage(message, type = "info") {
      if (type === "warning") {
         alert(message);
      } else {
         console.log(message);
      }
   }

   showTutorialMessage(message) {
      setTimeout(() => alert(message), 1000);
   }

   showStorageErrorMessage() {
      this.showTutorialMessage("⚠️ Des données corrompues ont été détectées et supprimées. Un nouveau jeu a été créé.");
   }

   showErrorMessage(message) {
      console.error("❌", message);
      alert(message);
   }

   startGame() {
      const hadCorruptedData = !this.hasSavedGame && this.storageManager.hadCorruptedData();
      this.storageManager.clearCorruptedDataFlag();

      const gameLoaded = this.loadGameState();

      if (!gameLoaded) {
         // Sélection manuelle de la main de départ par le joueur
         this.showInitialDeckSelection(this.player.deck, (selectedCards) => {
            // Retirer les cartes sélectionnées du deck et les mettre dans la main
            this.player.hand.cards = [];
            selectedCards.forEach(card => {
               const idx = this.player.deck.findIndex(c => c.id === card.id);
               if (idx !== -1) this.player.deck.splice(idx, 1);
               this.player.hand.cards.push(card);
            });
            // L'adversaire prend aussi 5 cartes au hasard dans son deck
            this.opponent.hand.cards = [];
            for (let i = 0; i < 5 && this.opponent.deck.length > 0; i++) {
               const idx = Math.floor(Math.random() * this.opponent.deck.length);
               this.opponent.hand.cards.push(this.opponent.deck.splice(idx, 1)[0]);
            }
            if (hadCorruptedData) {
               this.showStorageErrorMessage();
            }
            this.finishGameInitialization();
         });
      } else {
         console.log("🎮 Jeu chargé depuis localStorage");
         this.showTutorialMessage("Ton jeu précédent a été restauré! 🎮 Continue de jouer où tu t'étais arrêté.");
         this.finishGameInitialization();
      }
   }

   finishGameInitialization() {
      this.synchronizeComponentData();
      this.addQuitButton();
      this.addDropListeners(this.playerActive, this.opponentActive, this.handContainer);
      this.renderCards();
      this.renderActiveCards();
      this.displayResults();
      this.checkAttackSelectionAfterReload();
      this.schedulePostInitDiagnostic();
   }

   checkAttackSelectionAfterReload() {
      if (!this.battleSystem) return;
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
      }, 2000);
   }

   runGameDiagnostic() {
      return {
         hasData: this.player.hand.cards.length > 0,
         hasDisplay: this.handContainer.children.length > 0
      };
   }

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
         battleSystem: this.battleSystem
      };
      this.storageManager.saveGameState(gameData);
   }

   loadGameState() {
      const gameState = this.storageManager.loadGameState();
      if (!gameState) return false;

      try {
         this.restorePlayersState(gameState);
         return true;
      } catch (error) {
         console.error("Erreur lors de la restauration:", error);
         return false;
      }
   }

   restorePlayersState(gameState) {
      this.player.deck.length = 0;
      this.player.deck.push(...(Array.isArray(gameState.player.deck) ? gameState.player.deck : []));
      this.player.hand.cards.length = 0;

      if (Array.isArray(gameState.player.hand)) {
         this.player.hand.cards.push(...gameState.player.hand);
      }

      this.player.activeCard = gameState.player.activeCard;
      this.player.discardPile = Array.isArray(gameState.player.discardPile) ? gameState.player.discardPile : [];

      if (this.playerDeck) this.playerDeck.cards = this.player.deck;

      this.opponent.deck.length = 0;
      this.opponent.deck.push(...(Array.isArray(gameState.opponent.deck) ? gameState.opponent.deck : []));
      this.opponent.hand.cards.length = 0;

      if (Array.isArray(gameState.opponent.hand)) {
         this.opponent.hand.cards.push(...gameState.opponent.hand);
      }

      this.opponent.activeCard = gameState.opponent.activeCard;
      this.opponent.discardPile = Array.isArray(gameState.opponent.discardPile) ? gameState.opponent.discardPile : [];

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

   setupAutoSave() {
      this.storageManager.setupAutoSave?.();
   }

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

   quitGame() {
      this.storageManager.clearGameState();
      this.hideGameElements();
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

   addDropListeners(...elements) {
      this.dragAndDrop.initializeDropZones(...elements);
   }
}
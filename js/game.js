import { Player } from './player.js';
import { DragAndDropManager } from './ui/index.js';
import { LocalStorageManager } from './localStorage/index.js';
import { Hand, Deck, BattleResults, ActiveCardZone, Timer, CardModal, QuitModal } from './components/index.js';

export class Game {
   constructor(playerDeck, opponentDeck, maxHandSize = 5) {

      // Initialiser le gestionnaire de localStorage
      this.storageManager = new LocalStorageManager();

      // Solution d'urgence : nettoyer le localStorage si des problèmes sont détectés
      this.emergencyCleanup();

      this.player = new Player(playerDeck, maxHandSize);
      this.opponent = new Player(opponentDeck, maxHandSize);
      this.cardModal = new CardModal();
      this.quitModal = new QuitModal();

      // Éléments DOM
      this.playerActive = document.getElementById("player-active");
      this.opponentActive = document.getElementById("opponent-active");
      this.results = document.getElementById("results");
      this.deckContainer = document.getElementById("deck");
      this.handContainer = document.getElementById("hand");
      this.opponentDeckContainer = document.getElementById("opponent-deck");
      this.opponentHandContainer = document.getElementById("opponent-hand");
      this.drawTimerElement = document.getElementById("draw-timer");

      // Initialiser le gestionnaire de drag-and-drop
      this.dragAndDrop = new DragAndDropManager(this);
      // Nouvelles classes pour gérer les composants
      this.playerHand = new Hand(this.handContainer, true, this.cardModal, this.dragAndDrop);
      this.opponentHand = new Hand(this.opponentHandContainer, false, this.cardModal, this.dragAndDrop);
      this.playerDeck = new Deck(this.deckContainer, this.player.deck, this.dragAndDrop.createDragStartHandler());
      this.opponentDeck = new Deck(this.opponentDeckContainer, this.opponent.deck);
      this.battleResults = new BattleResults(this.results);
      this.playerActiveZone = new ActiveCardZone(this.playerActive, this.cardModal);
      this.opponentActiveZone = new ActiveCardZone(this.opponentActive, this.cardModal);

      console.log("🏗️ Composants de jeu initialisés:");
      console.log("  - Player hand:", this.playerHand, "Cards:", this.player.hand.cards.length);
      console.log("  - Opponent hand:", this.opponentHand, "Cards:", this.opponent.hand.cards.length);
      console.log("  - Player deck:", this.playerDeck, "Cards:", this.player.deck.length);
      console.log("  - Containers:", {
         hand: !!this.handContainer,
         opponentHand: !!this.opponentHandContainer,
         deck: !!this.deckContainer
      });

      // Initialiser le composant Timer
      const timerDisplay = document.getElementById("timer-display");
      this.timer = new Timer(timerDisplay, this);

      // Configurer les callbacks du timer
      this.timer.setOnExpired(() => {
         this.canDraw = true;
         this.saveGameState();
      });

      this.timer.setOnTick((timeLeft) => {
         this.timeLeft = timeLeft;
      });

      // Synchroniser les données
      this.playerHand.cards = this.player.hand.cards;
      this.opponentHand.cards = this.opponent.hand.cards; this.maxHandSize = maxHandSize;
      this.drawCooldown = 5 * 60; // 5 minutes en secondes
      this.timeLeft = 0;
      this.canDraw = true;  // Indique si on peut tirer une carte

      // Déterminer si la partie est sauvegardée via localStorage
      this.hasSavedGame = this.storageManager.checkSavedGameValidity();

      // Configurer la sauvegarde automatique
      this.setupAutoSave();

      // Initialiser les zones de dépôt dès la création du jeu
      this.initializeDropZones();
   }

   emergencyCleanup() {
      // Déléguer au gestionnaire de localStorage
      this.storageManager.emergencyCleanup();
   }

   /**
    * Initialise les zones de dépôt pour le drag-and-drop
    */
   initializeDropZones() {
      console.log("🎯 Initialisation des zones de dépôt...");

      // Vérifier que tous les éléments DOM existent
      const elements = [this.playerActive, this.opponentActive, this.handContainer];
      const missingElements = elements.filter(el => !el);

      if (missingElements.length > 0) {
         console.error("❌ Éléments DOM manquants pour les zones de dépôt:", {
            playerActive: !!this.playerActive,
            opponentActive: !!this.opponentActive,
            handContainer: !!this.handContainer
         });
         return;
      }

      // Initialiser les zones de dépôt
      this.dragAndDrop.initializeDropZones(
         this.playerActive,
         this.opponentActive,
         this.handContainer
      );

      console.log("✅ Zones de dépôt initialisées avec succès");
   }

   attemptDrawCard() {
      if (!this.canDraw) {
         alert("Attends que le timer expire pour tirer une nouvelle carte !");
         return null;
      }

      if (this.player.hand.cards.length >= this.maxHandSize) {
         alert("Ta main est pleine !");
         return null;
      }

      if (this.player.deck.length === 0) {
         alert("Ta pioche est vide !");
         return null;
      }

      // Autoriser le tirage
      this.canDraw = false;

      // Prendre la première carte du deck
      const cardFromDeck = this.player.deck.shift();

      // Si la main n'est pas vide, prendre la première carte de la main et la mettre à la fin de la pioche
      if (this.player.hand.cards.length > 0) {
         const firstHandCard = this.player.hand.cards.shift();
         this.player.deck.push(firstHandCard);
         console.log(`Carte "${firstHandCard.name}" déplacée de la main vers la pioche`);
      }      // Ajouter la carte tirée à la main
      this.player.hand.cards.push(cardFromDeck);
      console.log(`Carte "${cardFromDeck.name}" tirée de la pioche vers la main`);

      // Démarrer le timer via le composant
      this.timer.start(this.drawCooldown);

      // Sauvegarder l'état du jeu après cette action
      this.saveGameState();

      return cardFromDeck;
   }


   showCardModal(card) {
      this.cardModal.showCardModal(card);
   }
   renderPlayerCards() {
      console.log("🎨 renderPlayerCards() appelé");
      console.log("  - Player hand cards:", this.player.hand.cards.length);

      // Synchroniser les données
      this.playerHand.cards = this.player.hand.cards;
      this.playerDeck.setCards(this.player.deck);

      console.log("  - PlayerHand component cards après sync:", this.playerHand.cards.length);
      console.log("  - Container exists:", !!this.playerHand.container);

      // Rendre avec les nouvelles classes
      this.playerHand.render();
      this.playerDeck.render();

      console.log("  - Render terminé, children dans container:", this.handContainer.children.length);
   }
   renderOpponentCards() {
      console.log("🎨 renderOpponentCards() appelé");
      console.log("  - Opponent hand cards:", this.opponent.hand.cards.length);

      // Synchroniser les données
      this.opponentHand.cards = this.opponent.hand.cards;
      this.opponentDeck.setCards(this.opponent.deck);

      console.log("  - OpponentHand component cards après sync:", this.opponentHand.cards.length);

      // Rendre avec les nouvelles classes
      this.opponentHand.render();
      this.opponentDeck.render();

      console.log("  - Render terminé, children dans container:", this.opponentHandContainer.children.length);
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


   dragstart_handler(ev) {
      // Méthode dépréciée - utiliser this.dragAndDrop.handleDragStart à la place
      return this.dragAndDrop.handleDragStart(ev);
   }


   dragover_handler(ev) {
      // Méthode dépréciée - utiliser this.dragAndDrop.handleDragOver à la place
      return this.dragAndDrop.handleDragOver(ev);
   }


   drop_handler(ev) {
      // Méthode dépréciée - utiliser this.dragAndDrop.handleDrop à la place
      return this.dragAndDrop.handleDrop(ev);
   }


   displayResults() {
      const playerCard = this.player.activeCard;
      const opponentCard = this.opponent.activeCard;

      if (!playerCard || !opponentCard) {
         console.log("Une ou deux cartes actives sont manquantes.");
         this.battleResults.showVersusState();
         return;
      }

      this.battleResults.displayBattleResults(playerCard, opponentCard);
      this.battleResults.animateResult();
   }
   drawInitialCards(player, count = 5) {
      console.log(`🎯 drawInitialCards appelé pour ${player === this.player ? 'joueur' : 'adversaire'}`);
      console.log(`  - Deck avant tirage: ${player.deck.length} cartes`);
      console.log(`  - Main avant tirage: ${player.hand.cards.length} cartes`);

      for (let i = 0; i < count; i++) {
         const drawnCard = player.drawCard();
         if (drawnCard) {
            console.log(`  ✅ Carte ${i + 1} tirée: ${drawnCard.name}`);
         } else {
            console.log(`  ❌ Impossible de tirer la carte ${i + 1}`);
            break;
         }
      }

      console.log(`  - Deck après tirage: ${player.deck.length} cartes`);
      console.log(`  - Main après tirage: ${player.hand.cards.length} cartes`);
   }


   renderCards() {
      this.renderPlayerCards();
      this.renderOpponentCards();
   }


   addDropListeners(...elements) {
      // Méthode dépréciée - utiliser this.dragAndDrop.initializeDropZones à la place
      this.dragAndDrop.initializeDropZones(...elements);
   }


   startGame() {
      // Vérifier s'il y a eu un nettoyage automatique des données corrompues
      const hadCorruptedData = !this.hasSavedGame && this.storageManager.hadCorruptedData();

      // Supprimer le flag après vérification
      this.storageManager.clearCorruptedDataFlag();

      // Essayer de charger un jeu sauvegardé
      const gameLoaded = this.loadGameState(); if (!gameLoaded) {
         // Si aucun jeu sauvegardé, initialiser un nouveau jeu
         console.log("🎮 Initialisation d'un nouveau jeu - tirage des cartes initiales...");
         [this.player, this.opponent].forEach((player, index) => {
            console.log(`🎯 Tirage pour ${index === 0 ? 'joueur' : 'adversaire'}:`);
            this.drawInitialCards(player);
         });

         if (hadCorruptedData) {
            this.showStorageErrorMessage();
         } else {
            this.showTutorialMessage("Astuce: Quand tu tires une carte de ta pioche pour la mettre dans ta main, la première carte de ta main retourne au bas de la pioche! ♻️");
         }
      } else {
         // Afficher un message de bienvenue pour le jeu chargé
         console.log("🎮 Jeu chargé depuis localStorage");
         this.showTutorialMessage("Ton jeu précédent a été restauré! 🎮 Continue de jouer où tu t'étais arrêté.");
      }

      // Ajouter un bouton pour quitter le jeu
      this.addQuitButton();      // Dans tous les cas, configurer l'interface
      this.timer.start(this.drawCooldown, this.timeLeft);
      this.addDropListeners(this.playerActive, this.opponentActive, this.handContainer);
      this.renderCards();      // Rendu des cartes actives si elles existent
      if (this.player.activeCard) {
         this.playerActiveZone.setActiveCard(this.player.activeCard);
      }

      if (this.opponent.activeCard) {
         this.opponentActiveZone.setActiveCard(this.opponent.activeCard);
      }

      // Afficher les résultats si les deux joueurs ont une carte active
      if (this.player.activeCard && this.opponent.activeCard) {
         this.displayResults();
      } else {
         this.battleResults.showVersusState();
      }

      // Diagnostic après initialisation
      setTimeout(() => {
         const diagnostic = this.runGameDiagnostic();

         if (diagnostic.hasData && !diagnostic.hasDisplay) {
            console.error("🚨 PROBLÈME DÉTECTÉ: Cartes en mémoire mais pas affichées!");

            // Tentative de correction automatique
            this.showErrorMessage("Problème d'affichage détecté. Correction en cours...");

            setTimeout(() => {
               this.renderCards();
               this.verifyCardsDisplay();
            }, 2000);
         }
      }, 3000);
   }


   showTutorialMessage(message) {
      const tutorialElement = document.createElement("div");
      tutorialElement.className = "fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-600/90 text-white py-2 px-4 rounded-lg shadow-lg z-50 max-w-md text-center";
      tutorialElement.innerHTML = message;
      tutorialElement.style.transition = "all 0.5s ease";

      // Ajouter un bouton de fermeture
      const closeBtn = document.createElement("button");
      closeBtn.innerHTML = "×";
      closeBtn.className = "absolute top-1 right-2 text-white hover:text-red-300";
      closeBtn.onclick = () => {
         tutorialElement.style.opacity = "0";
         setTimeout(() => {
            if (tutorialElement.parentNode) {
               tutorialElement.parentNode.removeChild(tutorialElement);
            }
         }, 500);
      };

      tutorialElement.appendChild(closeBtn);

      // Faire disparaître automatiquement après 10 secondes
      setTimeout(() => {
         tutorialElement.style.opacity = "0";
         setTimeout(() => {
            if (tutorialElement.parentNode) {
               tutorialElement.parentNode.removeChild(tutorialElement);
            }
         }, 500);
      }, 10000);

      document.body.appendChild(tutorialElement);

      // Petite animation d'entrée
      tutorialElement.style.opacity = "0";
      tutorialElement.style.transform = "translate(-50%, -20px)";
      setTimeout(() => {
         tutorialElement.style.opacity = "1";
         tutorialElement.style.transform = "translate(-50%, 0)";
      }, 100);
   }


   showCardRecycleAnimation() {
      // Créer un élément pour l'animation de recyclage
      const animElement = document.createElement("div");
      animElement.className = "fixed z-50 bg-white/80 backdrop-blur-sm rounded-lg py-2 px-4 shadow-xl border border-green-500 text-green-700 font-bold";
      animElement.innerHTML = `♻️ Carte recyclée dans la pioche!`;
      animElement.style.top = "20%";
      animElement.style.left = "50%";
      animElement.style.transform = "translateX(-50%) scale(0)";
      animElement.style.transition = "all 0.5s ease-out";

      // Ajouter l'élément au body
      document.body.appendChild(animElement);

      // Déclencher l'animation
      setTimeout(() => {
         animElement.style.transform = "translateX(-50%) scale(1)";
      }, 50);

      // Supprimer l'élément après l'animation
      setTimeout(() => {
         animElement.style.opacity = "0";
         setTimeout(() => {
            document.body.removeChild(animElement);
         }, 500);
      }, 1500);
   }


   // Sauvegarde l'état du jeu dans le localStorage
   saveGameState() {
      const gameData = {
         player: this.player,
         opponent: this.opponent,
         canDraw: this.canDraw,
         timeLeft: this.timer.getTimeLeft(),
         timerState: this.timer.getState()
      };

      this.storageManager.saveGameState(gameData);
   }


   // Charge l'état du jeu depuis le localStorage
   loadGameState() {
      const gameState = this.storageManager.loadGameState();

      if (!gameState) {
         return false;
      }

      try {
         // Restaurer l'état du joueur
         this.player.deck = gameState.player.deck;
         this.player.hand.cards = gameState.player.hand;
         this.player.activeCard = gameState.player.activeCard;

         // Restaurer l'état de l'adversaire
         this.opponent.deck = gameState.opponent.deck;
         this.opponent.hand.cards = gameState.opponent.hand;
         this.opponent.activeCard = gameState.opponent.activeCard;         // Restaurer l'état du jeu
         this.canDraw = gameState.canDraw !== undefined ? gameState.canDraw : true;
         this.timeLeft = gameState.timeLeft || 0;

         // Restaurer l'état du timer
         if (gameState.timerState) {
            this.timer.setState(gameState.timerState);
         } else if (this.timeLeft > 0) {
            this.timer.start(this.drawCooldown, this.timeLeft);
         }

         return true;
      } catch (error) {
         console.error("Erreur lors de la restauration de l'état du jeu:", error);
         return false;
      }
   }


   // Réinitialise complètement le jeu
   resetGame() {
      // Supprimer les données sauvegardées via le gestionnaire
      this.storageManager.clearGameState();

      // Rafraîchir la page pour redémarrer un nouveau jeu
      window.location.reload();
   }


   // Ajoute un bouton pour quitter le jeu
   addQuitButton() {
      // Vérifier s'il y a déjà un bouton pour éviter les doublons
      if (document.getElementById('quit-button')) {
         return;
      }

      // Bouton de sortie du jeu
      const quitButton = document.createElement("button");
      quitButton.id = "quit-button";
      quitButton.innerHTML = "� Quitter le jeu";
      quitButton.className = "fixed bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 hover:scale-105";
      quitButton.onclick = () => {
         this.quitModal.show(
            () => this.quitGame(), // Callback de confirmation
            () => console.log("Annulation de la sortie") // Callback d'annulation (optionnel)
         );
      };

      document.body.appendChild(quitButton);
   }


   // Nettoie toutes les données du jeu
   clearAllGameData() {
      try {
         const removedCount = this.storageManager.clearAllGameData();

         console.log(`${removedCount} clés supprimées`);
         alert("Données nettoyées avec succès! La page va se recharger.");
         window.location.reload();
      } catch (error) {
         console.error("Erreur lors du nettoyage des données:", error);
         alert("Erreur lors du nettoyage. Essayez de vider manuellement le cache de votre navigateur.");
      }
   }


   // Configure la sauvegarde automatique périodique
   setupAutoSave() {
      // Sauvegarde automatique toutes les 30 secondes
      setInterval(() => {
         this.saveGameState();
      }, 30000);

      // Sauvegarde également quand l'utilisateur quitte la page
      window.addEventListener('beforeunload', () => {
         this.saveGameState();
      });
   }


   // Affiche un message d'aide pour les problèmes de localStorage
   showStorageErrorMessage() {
      const errorElement = document.createElement("div");
      errorElement.className = "fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600/90 text-white py-3 px-6 rounded-lg shadow-lg z-50 max-w-lg text-center border-2 border-red-400";
      errorElement.innerHTML = `
         <div class="flex items-center justify-center mb-2">
            <span class="text-2xl mr-2">⚠️</span>
            <strong>Problème détecté</strong>
         </div>
         <p class="mb-3">Des données corrompues ont été détectées et supprimées. Le jeu va redémarrer normalement.</p>
         <button onclick="this.parentElement.remove()" class="bg-white text-red-600 px-3 py-1 rounded font-bold hover:bg-gray-100 transition-colors">
            OK
         </button>
      `;

      // Ajouter au body
      document.body.appendChild(errorElement);

      // Auto-suppression après 10 secondes
      setTimeout(() => {
         if (errorElement.parentNode) {
            errorElement.remove();
         }
      }, 10000);
   }


   // Vérifier si les cartes sont bien affichées
   verifyCardsDisplay() {
      const handCards = this.handContainer.querySelectorAll('img');
      const deckCards = this.deckContainer.querySelectorAll('img');

      console.log(`Cartes dans la main affichées: ${handCards.length}`);
      console.log(`Cartes dans le deck affichées: ${deckCards.length}`);

      // Si aucune carte n'est affichée mais qu'il y en a dans les données
      if (handCards.length === 0 && this.player.hand.cards.length > 0) {
         console.warn("🚨 Cartes présentes dans les données mais pas affichées!");
         console.log("Données main:", this.player.hand.cards);

         // Forcer le re-rendu
         setTimeout(() => {
            console.log("🔄 Tentative de re-rendu forcé...");
            this.renderCards();
         }, 1000);

         return false;
      }

      return true;
   }


   // Diagnostic complet du jeu
   runGameDiagnostic() {
      console.log("=== DIAGNOSTIC COMPLET DU JEU ===");

      // 1. Diagnostic du localStorage
      const storageDiagnostic = this.storageManager.runDiagnostic();
      console.log("🗄️ Diagnostic localStorage:", storageDiagnostic);

      // 2. Vérifier les données du jeu
      console.log("📊 Données du jeu:");
      console.log("  - Joueur deck:", this.player?.deck?.length || 0, "cartes");
      console.log("  - Joueur main:", this.player?.hand?.cards?.length || 0, "cartes");
      console.log("  - Adversaire deck:", this.opponent?.deck?.length || 0, "cartes");
      console.log("  - Adversaire main:", this.opponent?.hand?.cards?.length || 0, "cartes");

      // 3. Vérifier les conteneurs DOM
      console.log("🎯 Conteneurs DOM:");
      console.log("  - handContainer:", this.handContainer ? "✅" : "❌");
      console.log("  - deckContainer:", this.deckContainer ? "✅" : "❌");
      console.log("  - opponentHandContainer:", this.opponentHandContainer ? "✅" : "❌");

      // 4. Vérifier les cartes affichées
      const handCards = this.handContainer?.querySelectorAll('img') || [];
      const deckCards = this.deckContainer?.querySelectorAll('img') || [];
      console.log("🖼️ Cartes affichées:");
      console.log("  - Main:", handCards.length, "cartes");
      console.log("  - Deck:", deckCards.length, "cartes");

      // 5. Vérifier les URLs d'images
      if (this.player?.hand?.cards?.length > 0) {
         console.log("🔗 Exemple d'URL d'image:", this.player.hand.cards[0].imageUrl);
      }      // 6. Informations du timer
      const timerInfo = this.getTimerInfo();
      console.log("⏰ État du timer:", timerInfo);

      // 7. Statistiques du localStorage
      const storageStats = this.storageManager.getStorageStats();
      console.log("📈 Statistiques localStorage:", storageStats);

      // 8. Test de rendu forcé
      console.log("🔄 Test de rendu forcé...");
      this.renderCards();

      return {
         hasData: (this.player?.hand?.cards?.length || 0) > 0,
         hasDisplay: handCards.length > 0,
         containersOk: !!(this.handContainer && this.deckContainer),
         storageStatus: storageDiagnostic.status,
         storageIssues: storageDiagnostic.issues.length
      };
   }


   // Affiche un message d'erreur générique
   showErrorMessage(message) {
      const errorElement = document.createElement("div");
      errorElement.className = "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-orange-600/95 text-white py-4 px-6 rounded-lg shadow-xl z-50 max-w-md text-center border-2 border-orange-400";
      errorElement.innerHTML = `
         <div class="flex items-center justify-center mb-2">
            <span class="text-2xl mr-2">⚠️</span>
            <strong>Attention</strong>
         </div>
         <p class="mb-3">${message}</p>
         <div class="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-white rounded-full" role="status" aria-label="loading">
         </div>
      `;

      document.body.appendChild(errorElement);

      // Auto-suppression après 5 secondes
      setTimeout(() => {
         if (errorElement.parentNode) {
            errorElement.remove();
         }
      }, 5000);
   }

   // Méthodes utilitaires pour le timer

   /**
    * Vérifie si le joueur peut tirer une carte
    * @returns {boolean} - True si le tirage est autorisé
    */
   canDrawCard() {
      return this.canDraw || this.timer.isExpired();
   }

   /**
    * Force l'expiration du timer (pour les tests ou débogage)
    */
   forceTimerExpiration() {
      this.timer.forceExpire();
      this.canDraw = true;
   }

   /**
    * Ajoute du temps bonus au timer
    * @param {number} seconds - Secondes à ajouter
    */
   addBonusTime(seconds) {
      this.timer.addTime(seconds);
   }

   /**
    * Retourne les informations du timer
    * @returns {Object} - État du timer
    */
   getTimerInfo() {
      return {
         timeLeft: this.timer.getTimeLeft(),
         isActive: this.timer.isActive(),
         isExpired: this.timer.isExpired(),
         canDraw: this.canDraw
      };
   }

   /**
    * Nettoie toutes les ressources du jeu
    */
   cleanup() {
      if (this.timer) {
         this.timer.destroy();
      }

      if (this.dragAndDrop) {
         this.dragAndDrop.cleanup();
      }

      if (this.quitModal) {
         this.quitModal.destroy();
      }

      console.log("Ressources du jeu nettoyées");
   }

   /**
    * Test des zones de dépôt pour diagnostiquer les problèmes de drag-and-drop
    */
   testDropZones() {
      console.clear();
      console.log("🧪 === TEST DES ZONES DE DÉPÔT ===");

      // 1. Vérifier les éléments DOM
      const elements = {
         playerActive: this.playerActive,
         opponentActive: this.opponentActive,
         handContainer: this.handContainer
      };

      console.log("📍 Éléments DOM:");
      Object.entries(elements).forEach(([name, element]) => {
         if (element) {
            console.log(`  ✅ ${name}:`, {
               id: element.id,
               className: element.className,
               rect: element.getBoundingClientRect(),
               hasDropEvents: element.hasAttribute('data-drop-zone')
            });
         } else {
            console.log(`  ❌ ${name}: élément manquant`);
         }
      });

      // 2. Vérifier le gestionnaire de drag-and-drop
      console.log("🎯 Gestionnaire drag-and-drop:");
      console.log("  Zones enregistrées:", this.dragAndDrop.dropTargets.size);
      console.log("  Zones détails:", Array.from(this.dragAndDrop.dropTargets).map(el => ({
         id: el.id,
         className: el.className
      })));

      // 3. Test visuel des zones de dépôt
      console.log("👁️ Test visuel des zones (surlignage pendant 3 secondes)...");

      this.dragAndDrop.dropTargets.forEach((zone, index) => {
         setTimeout(() => {
            zone.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
            zone.style.border = "3px solid red";
            zone.style.transform = "scale(1.05)";
            zone.style.transition = "all 0.3s ease";

            setTimeout(() => {
               zone.style.backgroundColor = "";
               zone.style.border = "";
               zone.style.transform = "";
            }, 3000);
         }, index * 500);
      });

      // 4. Réinitialiser les zones de dépôt
      setTimeout(() => {
         console.log("🔄 Réinitialisation des zones de dépôt...");
         this.initializeDropZones();
         console.log("✅ Test terminé - consultez la console pour les détails");
      }, 4000);

      alert("Test des zones de dépôt en cours... Consultez la console (F12) et observez les zones surlignées en rouge.");
   }

   // Quitte le jeu en nettoyant toutes les ressources
   quitGame() {
      console.log("🚪 Fermeture du jeu en cours...");

      try {
         // 1. Nettoyer toutes les données du localStorage
         this.storageManager.clearAllGameData();

         // 2. Nettoyer les ressources du jeu
         this.cleanup();

         // 3. Supprimer le bouton de sortie
         const quitButton = document.getElementById('quit-button');
         if (quitButton) {
            quitButton.remove();
         }

         // 4. Masquer complètement le jeu
         const gameArea = document.getElementById('game-area');
         if (gameArea) {
            gameArea.style.display = 'none';
         }

         // 5. Afficher un message de fin élégant
         const exitMessage = document.createElement("div");
         exitMessage.className = "fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 backdrop-blur-sm flex items-center justify-center z-50";
         exitMessage.innerHTML = `
            <div class="bg-white/90 backdrop-blur-md p-12 rounded-2xl shadow-2xl text-center max-w-lg transform transition-all duration-500">
               <div class="text-8xl mb-6 animate-bounce">👋</div>
               <h2 class="text-3xl font-bold text-gray-800 mb-4">Merci d'avoir joué!</h2>
               <p class="text-gray-600 mb-6 text-lg">
                  Votre session Pokémon TCG s'est terminée.
               </p>
               <div class="bg-green-100 border border-green-300 rounded-lg p-4 mb-6">
                  <p class="text-green-800 font-medium">✅ Toutes les données ont été nettoyées</p>
                  <p class="text-green-700 text-sm mt-1">Votre navigateur est maintenant propre</p>
               </div>
               <button onclick="window.location.reload()" 
                       class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 hover:scale-105">
                  🎮 Nouvelle partie
               </button>
            </div>
         `;

         document.body.appendChild(exitMessage);

         // 6. Animation d'entrée
         setTimeout(() => {
            exitMessage.style.opacity = "1";
         }, 100);

         console.log("✅ Jeu fermé proprement");

      } catch (error) {
         console.error("❌ Erreur lors de la fermeture du jeu:", error);

         // Afficher un message d'erreur élégant
         const errorMessage = document.createElement("div");
         errorMessage.className = "fixed inset-0 bg-red-900/80 backdrop-blur-sm flex items-center justify-center z-50";
         errorMessage.innerHTML = `
            <div class="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md">
               <div class="text-6xl mb-4">❌</div>
               <h2 class="text-2xl font-bold text-red-600 mb-2">Erreur</h2>
               <p class="text-gray-600 mb-4">Une erreur s'est produite lors de la fermeture.</p>
               <button onclick="window.location.reload()" 
                       class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">
                  Recharger la page
               </button>
            </div>
         `;
         document.body.appendChild(errorMessage);
      }
   }

}
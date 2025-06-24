import { Player } from './player.js';
import { CardModal, DragAndDropManager } from './ui/index.js';
import { LocalStorageManager } from './localStorage/index.js';
import { Hand, Deck, BattleResults, ActiveCardZone, Timer } from './components/index.js';

/**
 * Constantes pour éviter la répétition de valeurs littérales
 */
const GAME_CONSTANTS = {
   DEFAULT_MAX_HAND_SIZE: 5,
   DEFAULT_DRAW_COOLDOWN: 5 * 60, // 5 minutes en secondes
   AUTO_SAVE_INTERVAL: 30000, // 30 secondes
   DIAGNOSTIC_DELAY: 3000, // 3 secondes
   NOTIFICATION_DURATION: {
      TUTORIAL: 10000,
      ERROR: 5000,
      STORAGE_ERROR: 10000
   },
   BUTTON_COLORS: {
      RESET: 'red',
   },
   PLAYER_TYPES: {
      PLAYER: 'Joueur',
      OPPONENT: 'Adversaire'
   }
};

export class Game {
   constructor(playerDeck, opponentDeck, maxHandSize = GAME_CONSTANTS.DEFAULT_MAX_HAND_SIZE) {

      // Initialiser le gestionnaire de localStorage
      this.storageManager = new LocalStorageManager();

      // Solution d'urgence : nettoyer le localStorage si des problèmes sont détectés
      this.emergencyCleanup();

      this.player = new Player(playerDeck, maxHandSize);
      this.opponent = new Player(opponentDeck, maxHandSize);
      this.cardModal = new CardModal();

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
      this.battleResults = new BattleResults(this.results); this.playerActiveZone = new ActiveCardZone(this.playerActive, this.cardModal);
      this.opponentActiveZone = new ActiveCardZone(this.opponentActive, this.cardModal);

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
      this.drawCooldown = GAME_CONSTANTS.DEFAULT_DRAW_COOLDOWN;
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
      // Utiliser la validation factorée
      const validation = this.validateDOMElements({
         playerActive: this.playerActive,
         opponentActive: this.opponentActive,
         handContainer: this.handContainer
      });

      if (!validation.isValid) {
         console.error("❌ Éléments DOM manquants pour les zones de dépôt:", validation.missingElements);
         return;
      }

      // Initialiser les zones de dépôt
      this.dragAndDrop.initializeDropZones(
         this.playerActive,
         this.opponentActive,
         this.handContainer
      );
   }

   attemptDrawCard() {
      // Utiliser la validation factorée
      const validation = this.validatePlayerAction(this.player, 'draw');

      if (!validation.canPerform) {
         alert(validation.reason);
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
      }

      // Ajouter la carte tirée à la main
      this.player.hand.cards.push(cardFromDeck);

      // Démarrer le timer via le composant
      this.timer.start(this.drawCooldown);

      // Sauvegarder l'état du jeu après cette action
      this.saveGameState();

      return cardFromDeck;
   }


   showCardModal(card) {
      this.cardModal.showCardModal(card);
   }
   /**
  * Factorisation du rendu pour un joueur
  * @param {Object} player - L'objet joueur
  * @param {Object} handComponent - Composant de main (playerHand ou opponentHand)
  * @param {Object} deckComponent - Composant de deck (playerDeck ou opponentDeck)
  * @param {HTMLElement} handContainer - Conteneur DOM de la main
  * @param {string} playerType - Type de joueur pour les logs ("Joueur" ou "Adversaire")
  */
   renderPlayerCards(player = this.player, handComponent = this.playerHand, deckComponent = this.playerDeck, handContainer = this.handContainer, playerType = "Joueur") {
      // Synchroniser les données
      handComponent.cards = player.hand.cards;
      deckComponent.setCards(player.deck);

      // Rendre avec gestion d'erreurs
      this.renderComponentSafely(handComponent, `${playerType}Hand`);
      this.renderComponentSafely(deckComponent, `${playerType}Deck`);

      // Debug: vérifier si les cartes s'affichent
      if (handContainer && handContainer.children.length === 0 && player.hand.cards.length > 0) {
         console.warn(`⚠️ PROBLÈME: Cartes ${playerType.toLowerCase()} en mémoire mais conteneur vide!`);
      }
   }

   /**
    * Rend les cartes de l'adversaire en utilisant la méthode factorée
    */
   renderOpponentCards() {
      this.renderPlayerCards(
         this.opponent,
         this.opponentHand,
         this.opponentDeck,
         this.opponentHandContainer,
         "Adversaire"
      );
   }

   /**
    * Méthode factorée pour rendre un composant avec gestion d'erreurs
    * @param {Object} component - Le composant à rendre
    * @param {string} componentName - Nom du composant pour les logs
    */
   renderComponentSafely(component, componentName) {
      try {
         component.render();
      } catch (error) {
         console.error(`❌ Erreur dans ${componentName}.render():`, error);
      }
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
      return this.dragAndDrop.handleDragStart(ev);
   }


   dragover_handler(ev) {
      return this.dragAndDrop.handleDragOver(ev);
   }


   drop_handler(ev) {
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
   } drawInitialCards(player, count = 5) {
      for (let i = 0; i < count; i++) {
         const drawnCard = player.drawCard();
         if (!drawnCard) {
            console.warn(`❌ Impossible de tirer la carte ${i + 1}`);
            break;
         }
      }
   }


   renderCards() {
      this.renderPlayerCards();
      this.renderOpponentCards();
   }


   addDropListeners(...elements) {
      // Méthode dépréciée - utiliser this.dragAndDrop.initializeDropZones à la place
      this.dragAndDrop.initializeDropZones(...elements);
   }   /**
    * Méthode factorée pour initialiser un joueur au début du jeu
    * @param {Object} player - Le joueur à initialiser
    * @param {string} playerName - Nom du joueur pour les logs
    */
   initializePlayer(player, playerName = GAME_CONSTANTS.PLAYER_TYPES.PLAYER) {
      this.drawInitialCards(player);
   }

   /**
    * Méthode factorée pour restaurer l'état d'un joueur depuis le localStorage
    * @param {Object} player - Le joueur à restaurer
    * @param {Object} savedState - L'état sauvegardé du joueur
    * @param {string} playerName - Nom du joueur pour les logs
    */
   restorePlayerState(player, savedState, playerName = "Joueur") {
      if (!savedState) return false;

      try {
         player.deck = savedState.deck || [];
         player.hand.cards = savedState.hand || [];
         player.activeCard = savedState.activeCard || null;
         return true;
      } catch (error) {
         console.error(`Erreur lors de la restauration de l'état du ${playerName.toLowerCase()}:`, error);
         return false;
      }
   }

   /**
    * Méthode factorée pour configurer une zone active
    * @param {Object} activeZone - Zone active (playerActiveZone ou opponentActiveZone)
    * @param {Object} player - Joueur associé
    * @param {string} hpElementId - ID de l'élément d'affichage des HP
    */
   setupActiveZone(activeZone, player, hpElementId) {
      if (player.activeCard) {
         activeZone.setActiveCard(player.activeCard);
         const hpElement = document.getElementById(hpElementId);
         if (hpElement) {
            activeZone.updateHPDisplay(hpElement);
         }
      }
   } startGame() {
      // Vérifier s'il y a eu un nettoyage automatique des données corrompues
      const hadCorruptedData = !this.hasSavedGame && this.storageManager.hadCorruptedData();
      this.storageManager.clearCorruptedDataFlag();

      // Essayer de charger un jeu sauvegardé
      const gameLoaded = this.loadGameState();

      if (!gameLoaded) {
         // Si aucun jeu sauvegardé, initialiser un nouveau jeu
         this.initializePlayer(this.player, GAME_CONSTANTS.PLAYER_TYPES.PLAYER);
         this.initializePlayer(this.opponent, GAME_CONSTANTS.PLAYER_TYPES.OPPONENT);

         if (hadCorruptedData) {
            this.showStorageErrorMessage();
         } else {
            this.showTutorialMessage("Astuce: Quand tu tires une carte de ta pioche pour la mettre dans ta main, la première carte de ta main retourne au bas de la pioche! ♻️");
         }
      } else {
         // Afficher un message de bienvenue pour le jeu chargé
         this.showTutorialMessage("Ton jeu précédent a été restauré! 🎮 Continue de jouer où tu t'étais arrêté.");
      }

      // Ajouter un bouton de réinitialisation
      this.addResetButton();

      // Dans tous les cas, configurer l'interface
      this.timer.start(this.drawCooldown, this.timeLeft);
      this.addDropListeners(this.playerActive, this.opponentActive, this.handContainer);
      this.renderCards();

      // Configurer les zones actives
      this.setupActiveZone(this.playerActiveZone, this.player, "player-hp");
      this.setupActiveZone(this.opponentActiveZone, this.opponent, "opponent-hp");

      // Afficher les résultats appropriés
      this.updateBattleDisplay();

      // Diagnostic après initialisation
      this.schedulePostInitDiagnostic();
   }

   /**
    * Met à jour l'affichage de la bataille selon l'état des cartes actives
    */
   updateBattleDisplay() {
      if (this.player.activeCard && this.opponent.activeCard) {
         this.displayResults();
      } else {
         this.battleResults.showVersusState();
      }
   }   /**
    * Programme un diagnostic après l'initialisation
    */
   schedulePostInitDiagnostic() {
      setTimeout(() => {
         const diagnostic = this.runGameDiagnostic();

         if (diagnostic.hasData && !diagnostic.hasDisplay) {
            console.warn("⚠️ Problème d'affichage détecté - tentative de correction...");

            // Tentative de correction automatique silencieuse
            setTimeout(() => {
               this.renderCards();
               this.verifyCardsDisplay();
            }, 2000);
         }
      }, GAME_CONSTANTS.DIAGNOSTIC_DELAY);
   }
   /**
    * Méthode factorée pour créer des éléments de notification
    * @param {string} message - Message à afficher
    * @param {string} type - Type de notification ('tutorial', 'error', 'warning')
    * @param {number} duration - Durée d'affichage en millisecondes (0 pour permanent)
    * @param {Object} options - Options additionnelles
    * @returns {HTMLElement} - L'élément créé
    */
   createNotificationElement(message, type = 'tutorial', duration = 10000, options = {}) {
      const {
         position = 'top-center',
         showCloseButton = true,
         autoRemove = true
      } = options;

      // Styles par type
      const typeStyles = {
         tutorial: 'bg-blue-600/90 border-blue-400',
         error: 'bg-red-600/90 border-red-400',
         warning: 'bg-orange-600/95 border-orange-400',
         success: 'bg-green-600/90 border-green-400'
      };

      // Positions
      const positionClasses = {
         'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
         'top-left': 'top-4 left-4',
         'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
         'bottom-right': 'bottom-4 right-4'
      };

      const element = document.createElement("div");
      element.className = `fixed ${positionClasses[position]} text-white py-3 px-6 rounded-lg shadow-lg z-50 max-w-lg text-center border-2 ${typeStyles[type]}`;
      element.innerHTML = message;
      element.style.transition = "all 0.5s ease";

      // Ajouter bouton de fermeture si demandé
      if (showCloseButton) {
         const closeBtn = document.createElement("button");
         closeBtn.innerHTML = "×";
         closeBtn.className = "absolute top-1 right-2 text-white hover:text-red-300";
         closeBtn.onclick = () => this.removeNotification(element);
         element.appendChild(closeBtn);
      }

      document.body.appendChild(element);

      // Animation d'entrée
      this.animateNotificationIn(element);

      // Auto-suppression si demandée
      if (autoRemove && duration > 0) {
         setTimeout(() => this.removeNotification(element), duration);
      }

      return element;
   }

   /**
    * Animation d'entrée pour les notifications
    * @param {HTMLElement} element - L'élément à animer
    */
   animateNotificationIn(element) {
      element.style.opacity = "0";
      element.style.transform += " scale(0.8)";
      setTimeout(() => {
         element.style.opacity = "1";
         element.style.transform = element.style.transform.replace(' scale(0.8)', '');
      }, 50);
   }

   /**
    * Supprime une notification avec animation
    * @param {HTMLElement} element - L'élément à supprimer
    */
   removeNotification(element) {
      element.style.opacity = "0";
      element.style.transform += " scale(0.8)";
      setTimeout(() => {
         if (element.parentNode) {
            element.parentNode.removeChild(element);
         }
      }, 500);
   }

   /**
    * Affiche un message tutorial en utilisant la méthode factorée
    * @param {string} message - Message à afficher
    */
   showTutorialMessage(message) {
      this.createNotificationElement(message, 'tutorial', 10000, {
         position: 'top-center',
         showCloseButton: true
      });
   }

   /**
    * Affiche un message d'erreur en utilisant la méthode factorée
    * @param {string} message - Message à afficher
    */
   showErrorMessage(message) {
      this.createNotificationElement(message, 'error', 5000, {
         position: 'center',
         showCloseButton: false
      });
   }

   /**
    * Affiche un message d'aide pour les problèmes de localStorage
    */
   showStorageErrorMessage() {
      const message = `
         <div class="flex items-center justify-center mb-2">
            <span class="text-2xl mr-2">⚠️</span>
            <strong>Problème détecté</strong>
         </div>
         <p class="mb-3">Des données corrompues ont été détectées et supprimées. Le jeu va redémarrer normalement.</p>
         <button onclick="this.parentElement.remove()" class="bg-white text-red-600 px-3 py-1 rounded font-bold hover:bg-gray-100 transition-colors">
            OK
         </button>
      `;

      this.createNotificationElement(message, 'error', 10000, {
         position: 'top-center',
         showCloseButton: false
      });
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
         // Restaurer l'état des joueurs avec la méthode factorée
         const playerRestored = this.restorePlayerState(this.player, gameState.player, "Joueur");
         const opponentRestored = this.restorePlayerState(this.opponent, gameState.opponent, "Adversaire");

         if (!playerRestored || !opponentRestored) {
            console.warn("Erreur partielle lors de la restauration des joueurs");
         }

         // Restaurer l'état du jeu
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
   /**
    * Méthode factorée pour créer des boutons de contrôle
    * @param {string} id - ID du bouton
    * @param {string} text - Texte du bouton  
    * @param {string} bgColor - Couleur de fond (ex: 'red', 'blue')
    * @param {Function} onclick - Fonction à exécuter au clic
    * @param {string} size - Taille du bouton ('normal' ou 'small')
    * @returns {HTMLElement} - Le bouton créé
    */
   createControlButton(id, text, bgColor, onclick, size = 'normal') {
      const button = document.createElement("button");
      if (id) button.id = id;
      button.innerHTML = text;

      const sizeClasses = size === 'small'
         ? "py-1 px-3 text-sm"
         : "py-2 px-4";

      button.className = `bg-${bgColor}-600 hover:bg-${bgColor}-700 text-white font-bold ${sizeClasses} rounded-full shadow-lg transition-all duration-300`;
      button.onclick = onclick;

      return button;
   }   /**
    * Ajoute un bouton de réinitialisation dans l'interface
    */
   addResetButton() {
      // Vérifier s'il y a déjà un bouton de reset pour éviter les doublons
      if (document.getElementById('reset-button')) {
         return;
      }

      // Créer le bouton de recommencer
      const resetButton = this.createControlButton(
         "reset-button",
         "🔄 Recommencer",
         "red",
         () => {
            if (confirm("Êtes-vous sûr de vouloir recommencer une nouvelle partie? La partie en cours sera perdue.")) {
               this.resetGame();
            }
         },
         "normal"
      );

      // Positionner le bouton
      resetButton.className += " fixed bottom-4 right-4";

      document.body.appendChild(resetButton);
   }   // Configure la sauvegarde automatique périodique
   setupAutoSave() {
      // Sauvegarde automatique toutes les 30 secondes
      setInterval(() => {
         this.saveGameState();
      }, GAME_CONSTANTS.AUTO_SAVE_INTERVAL);

      // Sauvegarde également quand l'utilisateur quitte la page
      window.addEventListener('beforeunload', () => {
         this.saveGameState();
      });
   }
   // Vérifier si les cartes sont bien affichées
   verifyCardsDisplay() {
      const handCards = this.handContainer.querySelectorAll('img');
      const deckCards = this.deckContainer.querySelectorAll('img');

      // Si aucune carte n'est affichée mais qu'il y en a dans les données
      if (handCards.length === 0 && this.player.hand.cards.length > 0) {
         console.warn("🚨 Cartes présentes dans les données mais pas affichées!");
         console.log("Données main:", this.player.hand.cards);

         // Forcer le re-rendu
         setTimeout(() => {
            this.renderCards();
         }, 1000);

         return false;
      }

      return true;
   }   // Diagnostic complet du jeu (version simplifiée)
   runGameDiagnostic() {
      // Utiliser la méthode factorée pour collecter les statistiques
      const stats = this.collectGameStats();

      // Diagnostic silencieux du localStorage
      const storageDiagnostic = this.storageManager.runDiagnostic();

      return {
         hasData: stats.players.player.handSize > 0,
         hasDisplay: stats.dom.displayedCards.playerHand > 0,
         containersOk: stats.dom.containers.isValid,
         storageStatus: storageDiagnostic.status,
         storageIssues: storageDiagnostic.issues.length
      };
   }
   // Affiche un message d'erreur générique
   showErrorMessage(message) {
      const loadingHtml = `
         <div class="flex items-center justify-center mb-2">
            <span class="text-2xl mr-2">⚠️</span>
            <strong>Attention</strong>
         </div>
         <p class="mb-3">${message}</p>
         <div class="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-white rounded-full" role="status" aria-label="loading">
         </div>
      `;

      this.createNotificationElement(loadingHtml, 'warning', 5000, {
         position: 'center',
         showCloseButton: false
      });
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
   }   /**
    * Nettoie toutes les ressources du jeu
    */
   cleanup() {
      if (this.timer) {
         this.timer.destroy();
      }
      if (this.dragAndDrop) {
         this.dragAndDrop.cleanup();
      }
   }
   /**
    * Méthodes factorées pour les validations et vérifications
    */

   /**
    * Valide qu'un élément DOM existe
    * @param {HTMLElement|null} element - L'élément à valider
    * @param {string} name - Nom de l'élément pour les logs
    * @returns {boolean} - True si l'élément existe
    */
   validateDOMElement(element, name) {
      if (!element) {
         console.error(`❌ Élément DOM manquant: ${name}`);
         return false;
      }
      return true;
   }

   /**
    * Valide plusieurs éléments DOM à la fois
    * @param {Object} elements - Objet avec nom:element
    * @returns {Object} - Résultat de validation avec éléments manquants
    */
   validateDOMElements(elements) {
      const missingElements = [];
      const validElements = {};

      Object.entries(elements).forEach(([name, element]) => {
         if (this.validateDOMElement(element, name)) {
            validElements[name] = element;
         } else {
            missingElements.push(name);
         }
      });

      return {
         isValid: missingElements.length === 0,
         missingElements,
         validElements
      };
   }

   /**
    * Valide si un joueur peut effectuer une action
    * @param {Object} player - Le joueur à valider
    * @param {string} action - L'action à effectuer
    * @returns {Object} - Résultat de validation
    */
   validatePlayerAction(player, action) {
      const result = {
         canPerform: true,
         reason: null
      };

      switch (action) {
         case 'draw':
            if (!this.canDraw) {
               result.canPerform = false;
               result.reason = "Attends que le timer expire pour tirer une nouvelle carte !";
            } else if (player.hand.cards.length >= this.maxHandSize) {
               result.canPerform = false;
               result.reason = "Ta main est pleine !";
            } else if (player.deck.length === 0) {
               result.canPerform = false;
               result.reason = "Ta pioche est vide !";
            }
            break;
         default:
            console.warn(`Action de validation inconnue: ${action}`);
      }

      return result;
   }

   /**
    * Collecte les statistiques du jeu pour le diagnostic
    * @returns {Object} - Statistiques complètes
    */
   collectGameStats() {
      return {
         players: {
            player: {
               deckSize: this.player?.deck?.length || 0,
               handSize: this.player?.hand?.cards?.length || 0,
               hasActiveCard: !!this.player?.activeCard
            },
            opponent: {
               deckSize: this.opponent?.deck?.length || 0,
               handSize: this.opponent?.hand?.cards?.length || 0,
               hasActiveCard: !!this.opponent?.activeCard
            }
         },
         dom: {
            containers: this.validateDOMElements({
               handContainer: this.handContainer,
               deckContainer: this.deckContainer,
               opponentHandContainer: this.opponentHandContainer,
               opponentDeckContainer: this.opponentDeckContainer
            }),
            displayedCards: {
               playerHand: this.handContainer?.querySelectorAll('img').length || 0,
               playerDeck: this.deckContainer?.querySelectorAll('img').length || 0,
               opponentHand: this.opponentHandContainer?.querySelectorAll('img').length || 0
            }
         },
         timer: this.getTimerInfo(),
         storage: this.storageManager.getStorageStats()
      };
   }
}
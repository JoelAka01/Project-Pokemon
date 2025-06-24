/**
 * Module de gestion du drag-and-drop pour le jeu Pokémon TCG
 * 
 * Ce module centralise toute la logique de glisser-déposer :
 * - Déplacement des cartes de la pioche vers la main
 * - Déplacement des cartes de la main vers les zones actives
 * - Gestion des événements et des animations
 */
export class DragAndDropManager {
   constructor(game) {
      this.game = game;
      this.draggedData = null;
      this.dropTargets = new Set();

      // Lier les méthodes à l'instance pour éviter les problèmes de contexte
      this.handleDragStart = this.handleDragStart.bind(this);
      this.handleDragOver = this.handleDragOver.bind(this);
      this.handleDrop = this.handleDrop.bind(this);
   }   /**
    * Initialise les événements de drag-and-drop sur les éléments spécifiés
    * @param {...HTMLElement} elements - Les éléments qui peuvent recevoir des drops
    */
   initializeDropZones(...elements) {
      elements.forEach(el => {
         if (el && !this.dropTargets.has(el)) {
            el.addEventListener("dragover", this.handleDragOver);
            el.addEventListener("drop", this.handleDrop);
            this.dropTargets.add(el);

            // Ajouter un style visuel pour indiquer que c'est une zone de dépôt
            el.style.cursor = "pointer";
            el.setAttribute("data-drop-zone", "true");
         } else if (!el) {
            console.warn("⚠️ Élément null ou undefined passé à initializeDropZones");
         }
      });
   }

   /**
    * Retire les événements de drag-and-drop des éléments spécifiés
    * @param {...HTMLElement} elements - Les éléments dont on retire les événements
    */
   removeDropZones(...elements) {
      elements.forEach(el => {
         if (el && this.dropTargets.has(el)) {
            el.removeEventListener("dragover", this.handleDragOver);
            el.removeEventListener("drop", this.handleDrop);
            this.dropTargets.delete(el);
         }
      });
   }

   /**
    * Nettoie tous les événements de drag-and-drop
    */
   cleanup() {
      this.dropTargets.forEach(el => {
         el.removeEventListener("dragover", this.handleDragOver);
         el.removeEventListener("drop", this.handleDrop);
      });
      this.dropTargets.clear();
   }

   /**
    * Gestionnaire pour le début du drag (dragstart)
    * @param {DragEvent} ev - L'événement de drag
    * @param {string} dataType - Le type de données à transférer
    * @param {*} data - Les données à transférer
    */
   handleDragStart(ev, dataType = "text/plain", data = "deck-card") {
      ev.dataTransfer.setData(dataType, data);
      ev.dataTransfer.effectAllowed = "move";
      this.draggedData = { type: dataType, data };

      console.log("Drag started:", { dataType, data });
   }   /**
    * Gestionnaire pour le survol pendant le drag (dragover)
    * @param {DragEvent} ev - L'événement de dragover
    */
   handleDragOver(ev) {
      ev.preventDefault(); // nécessaire pour autoriser le drop
      ev.dataTransfer.dropEffect = "move";

      // Ajouter un feedback visuel
      const target = ev.currentTarget;
      if (target && !target.classList.contains("drag-over")) {
         target.classList.add("drag-over");
         target.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
         target.style.border = "2px dashed #3b82f6";
         target.style.transition = "all 0.2s ease";
      }

      // Nettoyer les autres zones de dépôt
      this.dropTargets.forEach(zone => {
         if (zone !== target && zone.classList.contains("drag-over")) {
            zone.classList.remove("drag-over");
            zone.style.backgroundColor = "";
            zone.style.border = "";
         }
      });
   }/**
    * Gestionnaire principal pour le drop
    * @param {DragEvent} ev - L'événement de drop
    */
   handleDrop(ev) {
      ev.preventDefault();
      const data = ev.dataTransfer.getData("text/plain");
      const targetId = ev.currentTarget.id;
      const targetClassName = ev.currentTarget.className;

      // Nettoyer le feedback visuel
      const target = ev.currentTarget;
      if (target) {
         target.classList.remove("drag-over");
         target.style.backgroundColor = "";
         target.style.border = "";
      } console.log("🎯 Drop event:", {
         data,
         targetId,
         target: target?.tagName
      });      // Vérifier que la cible est bien une zone de dépôt enregistrée
      if (!this.dropTargets.has(target)) {
         console.warn("⚠️ Tentative de drop sur une zone non enregistrée:", targetId);
         return;
      }

      if (data === "deck-card") {
         this.handleDeckCardDrop(targetId);
      } else if (data.startsWith("hand-card-")) {
         this.handleHandCardDrop(data, targetId);
      } else {
         console.warn("⚠️ Type de données non reconnu:", data);
      }

      // Nettoyer les données de drag
      this.draggedData = null;
   }

   /**
    * Gère le drop d'une carte de la pioche
    * @param {string} targetId - L'ID de l'élément cible
    */   handleDeckCardDrop(targetId) {
      if (targetId === "hand") {
         const card = this.game.attemptDrawCard();
         if (card) {
            // Animation de recyclage pour montrer le déplacement de la carte
            this.game.showCardRecycleAnimation();
            this.game.renderCards();
            this.game.saveGameState();
         }
      } else {
         // Ancien comportement pour les autres zones de dépôt
         const card = this.game.attemptDrawCard();
         if (card) {
            this.game.renderCards();
         }
      }
   }

   /**
    * Gère le drop d'une carte de la main
    * @param {string} data - Les données de la carte (format: "hand-card-{index}")
    * @param {string} targetId - L'ID de l'élément cible
    */   handleHandCardDrop(data, targetId) {
      const index = parseInt(data.split("-")[2]);

      if (!this.validateCardIndex(index)) {
         return;
      }

      const card = this.game.player.hand.cards[index];
      if (!card) {
         console.error("Carte non trouvée à l'index:", index);
         return;
      }

      switch (targetId) {
         case "player-active":
            this.handleDropToPlayerActive(index, card);
            break;
         case "opponent-active":
            this.handleDropToOpponentActive(index, card);
            break;
         default:
            console.warn("Zone de drop non reconnue:", targetId);
      }
   }

   /**
    * Valide l'index de la carte dans la main du joueur
    * @param {number} index - L'index à valider
    * @returns {boolean} - True si l'index est valide
    */
   validateCardIndex(index) {
      if (index < 0 || index >= this.game.player.hand.cards.length) {
         console.error("Index de carte invalide:", index);
         return false;
      }
      return true;
   }

   /**
    * Gère le drop d'une carte vers la zone active du joueur
    * @param {number} index - L'index de la carte dans la main
    * @param {Object} card - La carte à déplacer
    */   handleDropToPlayerActive(index, card) {
      if (!this.game.player.activeCard) {
         // Déplacer la carte de la main vers la zone active
         this.game.player.activeCard = this.game.player.hand.cards.splice(index, 1)[0];
         this.game.playerActiveZone.setActiveCard(this.game.player.activeCard);

         // L'adversaire joue automatiquement une carte si il n'en a pas
         this.autoPlayOpponentCard();

         this.game.renderCards();

         // Afficher les résultats si les deux joueurs ont une carte active
         if (this.game.opponent.activeCard) {
            this.game.displayResults();
         }

         this.game.saveGameState();
      } else {
         this.showAlert("Tu as déjà un Pokémon actif !");
      }
   }

   /**
    * Gère le drop d'une carte vers la zone active de l'adversaire
    * @param {number} index - L'index de la carte dans la main
    * @param {Object} card - La carte à déplacer
    */
   handleDropToOpponentActive(index, card) {
      if (!this.game.opponent.activeCard) {
         this.game.opponent.activeCard = this.game.player.hand.cards.splice(index, 1)[0];
         this.game.opponentActiveZone.setActiveCard(this.game.opponent.activeCard);
         this.game.renderCards();

         if (this.game.player.activeCard) {
            this.game.displayResults();
         }
      } else {
         this.showAlert("L'adversaire a déjà un Pokémon actif !");
      }
   }

   /**
    * Fait jouer automatiquement une carte à l'adversaire
    */
   autoPlayOpponentCard() {
      if (!this.game.opponent.activeCard && this.game.opponent.hand.cards.length > 0) {
         const randomIndex = Math.floor(Math.random() * this.game.opponent.hand.cards.length);
         this.game.opponent.activeCard = this.game.opponent.hand.cards.splice(randomIndex, 1)[0];
         this.game.opponentActiveZone.setActiveCard(this.game.opponent.activeCard);
         this.game.renderOpponentCards();
      }
   }

   /**
    * Affiche une alerte à l'utilisateur
    * @param {string} message - Le message à afficher
    */
   showAlert(message) {
      // Pour l'instant on utilise alert, mais on pourrait implémenter
      // un système de notification plus élégant
      alert(message);
   }

   /**
    * Crée un gestionnaire de dragstart pour un élément spécifique
    * @param {string} dataType - Le type de données
    * @param {*} data - Les données à transférer
    * @returns {Function} - Le gestionnaire d'événement
    */
   createDragStartHandler(dataType = "text/plain", data = "deck-card") {
      return (ev) => this.handleDragStart(ev, dataType, data);
   }

   /**
    * Retourne les informations sur l'élément actuellement draggé
    * @returns {Object|null} - Les informations de drag ou null
    */
   getDraggedData() {
      return this.draggedData;
   }

   /**
    * Vérifie si un élément est actuellement en cours de drag
    * @returns {boolean} - True si un drag est en cours
    */
   isDragging() {
      return this.draggedData !== null;
   }   /**
    * Configure un élément comme draggable
    * @param {HTMLElement} element - L'élément à rendre draggable
    * @param {string} dataValue - La valeur à transférer lors du drag
    */
   makeDraggable(element, dataValue) {
      if (!element) return;

      console.log(`🖱️ Configuration draggable pour élément avec data: ${dataValue}`);

      element.setAttribute("draggable", "true");

      // Créer un gestionnaire spécifique pour cet élément
      const dragStartHandler = (ev) => {
         ev.dataTransfer.setData("text/plain", dataValue);
         ev.dataTransfer.effectAllowed = "move";
         element.classList.add("dragging");
         this.draggedData = { type: "text/plain", data: dataValue };

         console.log(`🎮 Drag started pour:`, { dataValue, element: element.tagName });
      };

      const dragEndHandler = () => {
         element.classList.remove("dragging");
         console.log(`🎮 Drag ended pour:`, { dataValue });
      };

      // Nettoyer les anciens événements pour éviter les doublons
      element.removeEventListener("dragstart", element._dragStartHandler);
      element.removeEventListener("dragend", element._dragEndHandler);

      // Stocker les références pour pouvoir les supprimer plus tard
      element._dragStartHandler = dragStartHandler;
      element._dragEndHandler = dragEndHandler;

      // Ajouter les nouveaux événements
      element.addEventListener("dragstart", dragStartHandler);
      element.addEventListener("dragend", dragEndHandler);
   }
}

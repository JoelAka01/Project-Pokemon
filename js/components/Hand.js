export class Hand {
   constructor(container, isPlayer = true, cardModal = null, dragManager = null) {
      this.container = container;
      this.isPlayer = isPlayer;
      this.cardModal = cardModal;
      this.dragManager = dragManager;
      this.cards = [];
   }
   // Nettoie le conteneur
   clear() {
      if (!this.container) {
         console.error("❌ Container inexistant pour clear()");
         return;
      }

      while (this.container.firstChild) {
         this.container.removeChild(this.container.firstChild);
      }
   }


   // Ajoute une carte à la main
   addCard(card) {
      this.cards.push(card);
   }


   // Retire une carte de la main par index
   removeCard(index) {
      if (index >= 0 && index < this.cards.length) {
         return this.cards.splice(index, 1)[0];
      }
      return null;
   }


   // Retire la première carte de la main
   removeFirstCard() {
      return this.cards.shift();
   }

   // Rend les cartes du joueur (visible)
   renderPlayerHand() {
      if (!Array.isArray(this.cards)) {
         console.error("❌ Données de la main invalides");
         return;
      }

      this.clear();

      if (this.cards.length === 0) {
         return;
      }

      this.cards.forEach((cardObj, index) => {
         if (!cardObj || !cardObj.imageUrl || !cardObj.name) {
            console.warn(`⚠️ Carte ${index} invalide:`, cardObj);
            return;
         }         // Créer un wrapper pour la carte
         const cardWrapper = document.createElement("div");
         cardWrapper.className = "card-container relative overflow-visible";

         // Créer l'élément image de la carte
         const card = document.createElement("img");
         card.src = cardObj.imageUrl;
         card.alt = cardObj.name || "Carte Pokémon";
         card.id = `hand-card-${index}`;

         // Ajouter une classe spéciale pour la première carte qui sera recyclée
         card.className = index === 0
            ? "w-40 h-auto rounded-lg shadow cursor-pointer pokemon-card transition-all duration-300 first-card-to-recycle"
            : "w-40 h-auto rounded-lg shadow cursor-pointer pokemon-card transition-all duration-300";         // Gestion d'erreur de chargement d'image
         card.onerror = () => {
            console.error(`❌ Erreur de chargement de l'image: ${cardObj.imageUrl}`);
            card.src = "img/back-card.jpg";
            card.alt = "Erreur de chargement";
         };

         // Ajouter les événements
         if (this.cardModal) {
            card.addEventListener("click", () => this.cardModal.showCardModal(cardObj));
         }

         // Utiliser le DragAndDropManager si disponible
         if (this.dragManager) {
            this.dragManager.makeDraggable(card, `hand-card-${index}`);
         } else {
            // Fallback pour l'ancienne méthode
            card.setAttribute("draggable", "true");
            card.addEventListener("dragstart", (ev) => {
               ev.dataTransfer.setData("text/plain", `hand-card-${index}`);
               card.classList.add("dragging");
            });

            card.addEventListener("dragend", () => {
               card.classList.remove("dragging");
            });
         }         // Ajouter un badge pour les types de carte si disponibles
         if (cardObj.types && cardObj.types.length > 0) {
            const typeIndicator = document.createElement("span");
            const primaryType = cardObj.types[0];
            typeIndicator.className = `absolute top-1 right-1 w-6 h-6 rounded-full type-${primaryType} border-2 border-white shadow-lg flex items-center justify-center text-xs text-white font-bold z-10`;

            // Utiliser les icônes depuis CardModal si disponible
            if (this.cardModal && this.cardModal.getTypeIcon) {
               typeIndicator.innerHTML = this.cardModal.getTypeIcon(primaryType);
            } else {
               typeIndicator.textContent = primaryType.substring(0, 1).toUpperCase();
            }

            typeIndicator.style.animation = "pulse-light 2s infinite";
            cardWrapper.appendChild(typeIndicator); card.setAttribute("title", `Type: ${cardObj.types.join(", ")}`);
         }

         cardWrapper.appendChild(card);
         this.container.appendChild(cardWrapper);
      });
   }


   // Rend les cartes de l'adversaire (dos de carte)
   renderOpponentHand() {
      this.clear();

      const handSize = this.cards.length;

      for (let i = 0; i < handSize; i++) {
         // Créer un wrapper pour chaque carte
         const cardWrapper = document.createElement("div");
         cardWrapper.className = "card-container relative";

         // Créer l'élément image de la carte
         const card = document.createElement("img");
         card.src = "img/back-card.jpg";
         card.alt = "Dos de carte Pokémon";
         card.className = "w-40 h-auto rounded-lg shadow transition-all duration-300";
         card.id = `opponent-hand-card-${i}`;

         // Ajouter un badge numéroté
         const cardNumber = document.createElement("span");
         cardNumber.className = "absolute top-1 left-1 w-5 h-5 rounded-full bg-blue-700 border border-white shadow-sm flex items-center justify-center text-xs text-white font-bold";
         cardNumber.textContent = (i + 1).toString();

         cardWrapper.appendChild(card);
         cardWrapper.appendChild(cardNumber);
         this.container.appendChild(cardWrapper);
      }
   }


   // Rend la main selon le type (joueur ou adversaire)
   render() {
      if (this.isPlayer) {
         this.renderPlayerHand();
      } else {
         this.renderOpponentHand();
      }
   }


   // Obtient la longueur de la main
   get length() {
      return this.cards.length;
   }


   // Vérifie si la main est vide
   isEmpty() {
      return this.cards.length === 0;
   }


   // Vérifie si la main est pleine
   isFull(maxSize = 5) {
      return this.cards.length >= maxSize;
   }
}

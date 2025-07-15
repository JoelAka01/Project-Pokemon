export class Hand {
   constructor(container, isPlayer = true, cardModal = null, dragManager = null) {
      this.container = container;
      this.isPlayer = isPlayer;
      this.cardModal = cardModal;
      this.dragManager = dragManager;
      this.cards = [];
   }

   clear() {
      while (this.container.firstChild) {
         this.container.removeChild(this.container.firstChild);
      }
   }

   addCard(card) {
      this.cards.push(card);
   }

   removeCard(index) {
      if (index >= 0 && index < this.cards.length) {
         return this.cards.splice(index, 1)[0];
      }
      return null;
   }

   removeFirstCard() {
      return this.cards.shift();
   }


   renderPlayer() {
      console.log("👤 === RENDU MAIN JOUEUR ===");
      console.log(`🃏 Nombre de cartes: ${this.cards.length}`);
      console.log(`📦 Container:`, this.container);

      if (!Array.isArray(this.cards)) {
         console.error("❌ this.cards n'est pas un tableau");
         return;
      }

      this.clear();

      this.cards.forEach((cardObj, index) => {
         console.log(`🎴 Rendu carte ${index + 1}: ${cardObj.name}`);
         if (!cardObj || !cardObj.imageUrl || !cardObj.name) {
            console.warn(`⚠️ Carte ${index} invalide:`, cardObj);
            return;
         }

         const cardWrapper = this.createCardWrapper();
         const card = this.createPlayerCard(cardObj, index);

         this.setupCardEvents(card, cardObj, index);

         cardWrapper.appendChild(card);
         this.container.appendChild(cardWrapper);
      });

      console.log(`✅ Rendu joueur terminé: ${this.container.children.length} cartes affichées`);
   }


   renderOpponent() {
      console.log("🤖 === RENDU MAIN ADVERSAIRE ===");
      console.log(`🃏 Nombre de cartes: ${this.cards.length}`);
      console.log(`📦 Container:`, this.container);

      this.clear();

      for (let i = 0; i < this.cards.length; i++) {
         console.log(`🎴 Création carte adversaire ${i + 1}/${this.cards.length}`);
         const cardWrapper = this.createCardWrapper();
         const card = this.createOpponentCard(i);

         cardWrapper.appendChild(card);
         this.container.appendChild(cardWrapper);
      }

      console.log(`✅ Rendu adversaire terminé: ${this.container.children.length} cartes affichées`);
   }

   render() {
      if (this.isPlayer) {
         this.renderPlayer();
      } else {
         this.renderOpponent();
      }
   }


   createCardWrapper() {
      const wrapper = document.createElement("div");
      wrapper.className = "card-container relative";
      return wrapper;
   }

   createPlayerCard(cardObj, index) {
      const card = document.createElement("img");
      card.src = cardObj.imageUrl;
      card.alt = cardObj.name || "Carte Pokémon";
      card.id = `hand-card-${index}`;
      card.className = this.getCardClassName(index);

      card.onerror = () => {
         card.src = "img/back-card.jpg";
         card.alt = "Erreur de chargement";
      };

      return card;
   }

   createOpponentCard(index) {
      const card = document.createElement("img");
      card.src = "img/back-card.jpg";
      card.alt = "Dos de carte Pokémon";
      card.className = "w-40 h-auto rounded-lg shadow transition-all duration-300";
      card.id = `opponent-hand-card-${index}`;
      return card;
   }

   getCardClassName(index) {
      const baseClass = "w-40 h-auto rounded-lg shadow cursor-pointer pokemon-card transition-all duration-300";
      return index === 0 ? `${baseClass} first-card-to-recycle` : baseClass;
   }

   setupCardEvents(card, cardObj, index) {
      if (this.cardModal) {
         card.addEventListener("click", () => this.cardModal.showCardModal(cardObj));
      }

      if (this.dragManager) {
         this.dragManager.makeDraggable(card, `hand-card-${index}`);
      } else {
         this.setupDragEvents(card, index);
      }
   }

   setupDragEvents(card, index) {
      card.setAttribute("draggable", "true");
      card.addEventListener("dragstart", (ev) => {
         ev.dataTransfer.setData("text/plain", `hand-card-${index}`);
         card.classList.add("dragging");
      });

      card.addEventListener("dragend", () => {
         card.classList.remove("dragging");
      });
   }

   get length() {
      return this.cards.length;
   }

   isEmpty() {
      return this.cards.length === 0;
   }

   isFull(maxSize = 5) {
      return this.cards.length >= maxSize;
   }
}

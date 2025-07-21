export class Deck {
   constructor(container, cards = [], dragHandler = null, isPlayer = true) {
      this.container = container;
      this.cards = cards;
      this.dragHandler = dragHandler;
      this.isPlayer = isPlayer;
   }

   addCard(card) {
      this.cards.push(card);
   }

   drawCard() {
      return this.cards.shift();
   }

   removeCard(index) {
      if (index >= 0 && index < this.cards.length) {
         return this.cards.splice(index, 1)[0];
      }
      return null;
   }

   shuffle() {
      for (let i = this.cards.length - 1; i > 0; i--) {
         const j = Math.floor(Math.random() * (i + 1));
         [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
      }
   }

   clear() {
      this.container.innerHTML = '';
   }

   render() {
      console.log("🃏 === RENDU DECK ===");
      console.log(`📦 Nombre de cartes: ${this.cards.length}`);
      console.log(`📦 Container:`, this.container);

      if (!Array.isArray(this.cards)) {
         console.error("❌ this.cards n'est pas un tableau");
         return;
      }

      this.clear();

      // Afficher uniquement la carte du dessus (si présente)
      let cardsHtml = '';
      if (this.cards.length > 0) {
         const card = this.cards[0];
         const imgSrc = this.isPlayer ? card.imageUrl : 'img/back-card.jpg';
         const alt = this.isPlayer ? card.name : 'Pioche';
         // Appliquer la classe hover uniquement pour le joueur
         const hoverClass = this.isPlayer ? 'hover:scale-105' : '';
         cardsHtml = `
            <div class="relative">
               <img src="${imgSrc}"
                  alt="${alt}"
                  class="w-40 h-auto rounded-lg shadow-lg cursor-pointer transition-transform ${hoverClass} pokemon-card"
                  data-card-idx="0"
                  draggable="${this.isPlayer ? 'true' : 'false'}"
               >
            </div>
         `;
      }
      this.container.innerHTML = `
         <div class="relative flex flex-col items-center">${cardsHtml}</div>
         <p class="text-center text-white font-bold mt-2">${this.cards.length} carte${this.cards.length > 1 ? 's' : ''}</p>
      `;

      // Ajouter le gestionnaire de drag si fourni (sur la carte du dessus uniquement, et seulement pour le joueur)
      if (this.dragHandler && this.cards.length > 0 && this.isPlayer) {
         const topCardImg = this.container.querySelector('img[data-card-idx="0"]');
         if (topCardImg) {
            topCardImg.addEventListener('dragstart', this.dragHandler);
         }
      }
      console.log(`✅ Rendu deck terminé: ${this.container.children.length} éléments`);
   }

   get length() {
      return this.cards.length;
   }

   isEmpty() {
      return this.cards.length === 0;
   }

   getCards() {
      return [...this.cards];
   }

   setCards(newCards) {
      this.cards.length = 0;
      this.cards.push(...newCards);
      this.render();
   }

   addCards(cards) {
      this.cards.push(...cards);
      this.render();
   }

   empty() {
      this.cards.length = 0;
      this.render();
   }
}

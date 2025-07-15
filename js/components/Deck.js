export class Deck {
   constructor(container, cards = [], dragHandler = null) {
      this.container = container;
      this.cards = cards;
      this.dragHandler = dragHandler;
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

      this.container.innerHTML = `
         <div class="relative">
            <img src="img/back-card.jpg" 
               alt="Pioche" 
               class="w-40 h-auto rounded-lg shadow-lg cursor-pointer transition-transform hover:scale-105 pokemon-card"
               id="deck-card"
               draggable="true"
            >
         </div>
         <p class="text-center text-white font-bold mt-2">${this.cards.length} carte${this.cards.length > 1 ? 's' : ''}</p>
      `;

      // Ajouter le gestionnaire de drag si fourni
      if (this.dragHandler) {
         const deckCard = this.container.querySelector('#deck-card');
         if (deckCard) {
            deckCard.addEventListener('dragstart', this.dragHandler);
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

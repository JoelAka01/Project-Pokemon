export class Deck 
{
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
      this.cards = [...newCards];
   }

   addCards(cards) {
      this.cards.push(...cards);
   }

   empty() {
      this.cards = [];
   }
}

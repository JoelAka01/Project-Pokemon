import { Hand } from './hand.js';

export class Player {
   constructor(deckArray, maxHandSize) {
      this.deck = [...deckArray];
      this.hand = new Hand(maxHandSize);
      this.activeCard = null;
      this.discardPile = [];
   }

   drawCard() {
      if (this.hand.cards.length < this.hand.maxSize && this.deck.length > 0) {
         const card = this.deck.shift();
         this.hand.addCard(card);
         return card;
      }
      return null;
   }

   playCard(cardIndex) {
      if (cardIndex >= 0 && cardIndex < this.hand.cards.length) {
         const card = this.hand.cards.splice(cardIndex, 1)[0];
         // On peut faire d'autres traitements ici selon le type de carte
         return card;
      }
      return null;
   }

   discardCard(card) {
      this.discardPile.push(card);
   }
}
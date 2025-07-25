export class Player {
   constructor(deckArray, maxHandSize) {
      this.deck = [...deckArray];
      this.hand = {
         cards: [],
         maxSize: maxHandSize,

         addCard: function (card) {
            if (this.cards.length < this.maxSize) {
               this.cards.push(card);
               return true;
            } else {
               return false;
            }
         },
         removeOldestCard: function () {
            return this.cards.shift();
         }
      }; this.activeCard = null;
      this.discardPile = [];
   }

   drawCard() {
      if (this.hand.cards.length < this.hand.maxSize && this.deck.length > 0) {
         const card = this.deck.shift();
         const success = this.hand.addCard(card);

         if (success) {
            return card;
         } else {
            this.deck.unshift(card);
         }
      }
      return null;
   }

   playCard(cardIndex) {
      if (cardIndex >= 0 && cardIndex < this.hand.cards.length) {
         const card = this.hand.cards.splice(cardIndex, 1)[0];
         return card;
      }
      return null;
   }

   discardCard(card) {
      this.discardPile.push(card);
      return this.discardPile.length;
   }
}
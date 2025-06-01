export class Player {

   constructor(deckArray, maxHandSize) {
      this.deck = [...deckArray];
      this.hand = {
         cards: [],
         maxSize: maxHandSize
      };
      this.activeCard = null;
   }

   drawCard() {
      if (this.hand.cards.length < this.hand.maxSize && this.deck.length > 0) {
         const card = this.deck.shift();
         this.hand.cards.push(card);
         return card;
      }
      return null;
   }


}
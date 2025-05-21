export class Hand {
   
   constructor(maxSize) {
      this.cards = [];
      this.maxSize = maxSize;
   }

   addCard(card) {
      if (this.cards.length < this.maxSize) {
         this.cards.push(card);
      } else {
         console.log("Main pleine !");
      }
   }

   removeOldestCard() {
      return this.cards.shift();
   }
}
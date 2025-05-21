export class Deck {
   constructor(cards = []) {
      this.cards = cards;
   }

   shuffle() {
      for (let i = this.cards.length - 1; i > 0; i--) {
         const j = Math.floor(Math.random() * (i + 1));
         [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
      }
   }

   draw() {
      return this.cards.shift();
   }

   add(card) {
      this.cards.push(card);
   }

   size() {
      return this.cards.length;
   }
}

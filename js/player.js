export class Player {
   constructor(deckArray, maxHandSize) {
      this.deck = [...deckArray];      // Créer une Hand simple pour contenir les cartes (pas de rendu)
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
            // Remettre la carte dans le deck si la main est pleine
            this.deck.unshift(card);
         }
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
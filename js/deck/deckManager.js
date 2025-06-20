// Gestionnaire des decks et des manipulations de cartes
export class DeckManager {
   constructor(game) {
      this.game = game;
      this.player = game.player;
      this.opponent = game.opponent;
      this.maxHandSize = game.maxHandSize;
   }

   // Distribution des cartes initiales
   dealInitialHands() {
      // Distribuer 3 cartes à chaque joueur
      for (let i = 0; i < 3; i++) {
         if (this.player.deck.length > 0) {
            const card = this.player.deck.shift();
            this.player.hand.addCard(card);
         }

         if (this.opponent.deck.length > 0) {
            const card = this.opponent.deck.shift();
            this.opponent.hand.addCard(card);
         }
      }
   }

   // Distribution de plusieurs cartes à un joueur
   drawInitialCards(player, count = 5) {
      for (let i = 0; i < count; i++) {
         if (player.deck.length > 0) {
            const card = player.deck.shift();
            player.hand.addCard(card);
         }
      }
   }

   // Tentative de tirage d'une carte pour le joueur
   attemptDrawCard() {
      if (this.player.hand.cards.length >= this.maxHandSize) {
         return {
            success: false,
            message: "Ta main est pleine !"
         };
      }

      if (this.player.deck.length === 0) {
         return {
            success: false,
            message: "Ta pioche est vide !"
         };
      }

      // Tirer une carte
      const card = this.player.deck.shift();
      this.player.hand.addCard(card);

      return {
         success: true,
         message: `Tu as tiré ${card.name} !`,
         card: card
      };
   }

   // Jouer une carte depuis la main du joueur
   playCardFromHand(cardIndex) {
      // Vérifier que l'index est valide
      if (cardIndex < 0 || cardIndex >= this.player.hand.cards.length) {
         return {
            success: false,
            message: "Index de carte invalide !"
         };
      }

      // Si une carte est déjà active, ne pas permettre d'en jouer une autre
      if (this.player.activeCard !== null) {
         return {
            success: false,
            message: "Tu as déjà une carte active !"
         };
      }

      // Récupérer la carte et la retirer de la main
      const card = this.player.hand.cards.splice(cardIndex, 1)[0];
      this.player.activeCard = card;

      return {
         success: true,
         message: `Tu as joué ${card.name} !`,
         card: card
      };
   }

   // Simuler le jeu d'une carte par l'adversaire
   playOpponentCard(delay = 1000) {
      return new Promise((resolve) => {
         setTimeout(() => {
            if (!this.opponent.activeCard && this.opponent.hand.cards.length > 0) {
               const opponentCardIndex = Math.floor(Math.random() * this.opponent.hand.cards.length);
               this.opponent.activeCard = this.opponent.hand.cards.splice(opponentCardIndex, 1)[0];
               resolve({
                  success: true,
                  message: "L'adversaire a joué une carte !",
                  card: this.opponent.activeCard
               });
            } else {
               resolve({
                  success: false,
                  message: "L'adversaire ne peut pas jouer de carte !"
               });
            }
         }, delay);
      });
   }
}

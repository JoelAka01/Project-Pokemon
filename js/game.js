import { Player } from './player.js';

export class Game {

   constructor(playerDeck, opponentDeck, maxHandSize = 5) {

      this.player = new Player(playerDeck, maxHandSize);

      this.opponent = new Player(opponentDeck, maxHandSize);

      this.deckContainer = document.getElementById("deck");

      this.handContainer = document.getElementById("hand");

      this.opponentDeckContainer = document.getElementById("opponent-deck");

      this.opponentHandContainer = document.getElementById("opponent-hand");

      this.cardBackUrl = "https://images.pokemontcg.io/back.jpg";

      this.maxHandSize = maxHandSize;
   }



   renderDeck(container, deck, draggable = false, dragHandler = null) {

      container.innerHTML = "";

      if (deck.length > 0) {

         const cardBack = document.createElement("img");

         cardBack.src = this.cardBackUrl;

         cardBack.alt = "Dos de carte Pokémon";

         cardBack.className = "w-24 h-auto rounded-lg shadow" + (draggable ? " cursor-pointer" : "");
         
         if (draggable) {

            cardBack.id = "deck-card";

            cardBack.setAttribute("draggable", "true");

            cardBack.addEventListener("dragstart", dragHandler);
         }

         container.appendChild(cardBack);

         const label = document.createElement("p");

         label.textContent = `${deck.length} carte(s)`;

         label.className = "text-sm text-gray-600 mt-2 text-center";

         container.appendChild(label);
      } else {
         container.textContent = "Pioche vide";
      }
   }



   renderCards() {

      this.renderDeck(this.deckContainer, this.player.deck, true, (ev) => this.dragstart_handler(ev));

      this.handContainer.innerHTML = "";

      this.player.hand.cards.forEach((url, index) => {

         const card = document.createElement("img");

         card.src = url;

         card.alt = "Carte Pokémon";

         card.id = `hand-card-${index}`;

         card.className = "w-24 h-auto rounded-lg shadow cursor-pointer";
         
         this.handContainer.appendChild(card);
      });

      this.renderDeck(this.opponentDeckContainer, this.opponent.deck);

      this.opponentHandContainer.innerHTML = "";
      
      this.opponent.hand.cards.forEach(() => {
         const backCard = document.createElement("img");
         backCard.src = this.CARD_BACK_URL;
         backCard.alt = "Dos de carte";
         backCard.className = "w-20 h-auto rounded shadow";
         this.opponentHandContainer.appendChild(backCard);
      });
   }



   dragstart_handler(ev) {
      // L’élément draggué est le dos de la pioche
      ev.dataTransfer.setData("text/plain", "deck-card");
      ev.dataTransfer.effectAllowed = "move";
   }



   dragover_handler(ev) {
      ev.preventDefault();  // nécessaire pour autoriser le drop
      ev.dataTransfer.dropEffect = "move";
   }



   drop_handler(ev) {
      ev.preventDefault();
      const data = ev.dataTransfer.getData("text/plain");
      if (data === "deck-card") {
         if (this.player.hand.cards.length < this.maxHandSize && this.player.deck.length > 0) {
            this.player.drawCard();
            this.renderCards();
         } else {
            alert("Ta main est pleine ou ta pioche est vide !");
         }
      }
   }



   startGame() {

      document.getElementById("game-area").classList.remove("hidden");

      document.querySelector("button").style.display = "none";

      for (let i = 0; i < this.maxHandSize; i++) {
         this.player.drawCard();
      }

      this.renderCards();

      this.deckContainer.addEventListener("dragstart", (ev) => this.dragstart_handler(ev));

      this.handContainer.addEventListener("dragover", (ev) => this.dragover_handler(ev));

      this.handContainer.addEventListener("drop", (ev) => this.drop_handler(ev));
   }
}

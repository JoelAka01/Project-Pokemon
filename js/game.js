import { Player } from './player.js';

export class Game {

   constructor(playerDeck, opponentDeck, maxHandSize = 5) {
      this.player = new Player(playerDeck, maxHandSize);
      this.opponent = new Player(opponentDeck, maxHandSize);
      this.playerActive = document.getElementById("player-active");
      this.opponentActive = document.getElementById("opponent-active");
      this.results = document.getElementById("results");
      this.deckContainer = document.getElementById("deck");
      this.handContainer = document.getElementById("hand");
      this.opponentDeckContainer = document.getElementById("opponent-deck");
      this.opponentHandContainer = document.getElementById("opponent-hand");
      this.modal = document.getElementById("card-modal");
      this.closeModalBtn = document.getElementById("close-modal");
      this.maxHandSize = maxHandSize;
      this.setupModal();
   }


   setupModal() {
      this.closeModalBtn.addEventListener("click", () => {
         this.modal.classList.add("hidden");
      });

      // Fermer la modale en cliquant en dehors
      this.modal.addEventListener("click", (e) => {
         if (e.target === this.modal) {
            this.modal.classList.add("hidden");
         }
      });
   }


   formatCost(costs) {
      if (!costs || costs.length === 0) return "Aucun";

      // Compte le nombre de chaque type d'énergie
      const costCount = costs.reduce((acc, cost) => {
         acc[cost] = (acc[cost] || 0) + 1;
         return acc;
      }, {});

      // Formate le résultat
      return Object.entries(costCount)
         .map(([type, count]) => `${type} x${count}`)
         .join(", ");
   }

   showCardModal(card) {
      const modalTitle = document.getElementById("modal-title");
      const modalImg = document.getElementById("modal-img");
      const modalInfo = document.getElementById("modal-info");

      modalTitle.textContent = card.name;
      modalImg.src = card.imageUrl;

      let infoHTML = `
         <p class="text-lg"><span class="font-bold">HP:</span> ${card.hp}</p>
         <p class="text-lg"><span class="font-bold">Types:</span> ${card.types.join(", ")}</p>
      `;

      if (card.attacks && card.attacks.length > 0) {
         infoHTML += `<div class="mt-4">
            <p class="font-bold text-lg mb-2">Attaques:</p>
            ${card.attacks.map(attack => `
               <div class="mb-2">
                  <p class="font-semibold">${attack.name}</p>
                  <p>Dégâts: ${attack.damage}</p>
                  <p>Coût: ${this.formatCost(attack.cost)}</p>
               </div>
            `).join("")}
         </div>`;
      }

      if (card.weaknesses && card.weaknesses.length > 0) {
         infoHTML += `<div class="mt-4">
            <p class="font-bold text-lg mb-2">Faiblesses:</p>
            ${card.weaknesses.map(weakness => `
               <p>${weakness.type}: ${weakness.value}</p>
            `).join("")}
         </div>`;
      }

      modalInfo.innerHTML = infoHTML;
      this.modal.classList.remove("hidden");
   }






   renderDeck(container, deck, dragHandler = null) {
      container.innerHTML = "";
      const cardBack = document.createElement("img");
      cardBack.src = "../img/back-card.jpg"; // URL de l'image du dos de la carte
      cardBack.alt = "Dos de carte Pokémon";
      cardBack.className = "w-40 h-auto rounded-lg shadow cursor-pointer transition-transform duration-200 hover:scale-125 cursor-pointer";
      cardBack.id = "deck-card";
      cardBack.setAttribute("draggable", "true");
      cardBack.addEventListener("dragstart", dragHandler);

      container.appendChild(cardBack);
      const label = document.createElement("p");
      label.textContent = `${deck.length} carte(s)`;
      label.className = "text-sm text-gray-600 mt-2 text-center";
      container.appendChild(label);
   }



   renderCards() {
      this.renderDeck(this.deckContainer, this.player.deck, (ev) => this.dragstart_handler(ev));
      this.handContainer.innerHTML = "";
      this.player.hand.cards.forEach((cardObj, index) => {
         const card = document.createElement("img");
         card.src = cardObj.imageUrl;
         card.alt = "Carte Pokémon";
         card.id = `hand-card-${index}`;
         card.className = "w-40 h-auto rounded-lg shadow cursor-pointer transition-transform duration-200 hover:scale-125";
         card.addEventListener("click", () => this.showCardModal(cardObj));
         card.setAttribute("draggable", "true");
         card.addEventListener("dragstart", (ev) => {
            ev.dataTransfer.setData("text/plain", `hand-card-${index}`);
         });

         this.handContainer.appendChild(card);
      });

      this.renderDeck(this.opponentDeckContainer, this.opponent.deck);
      this.opponentHandContainer.innerHTML = "";
      this.opponent.hand.cards.forEach(() => {
         const backCard = document.createElement("img");
         backCard.src = this.cardBackUrl;
         backCard.alt = "Dos de carte";
         backCard.className = "w-40 h-auto rounded shadow";
         this.opponentHandContainer.appendChild(backCard);
      });
   }


   renderPlayerActive() {
      this.playerActive.innerHTML = "";

      const card = this.player.activeCard;


      if (!card) {
         const placeholder = document.createElement("p");
         placeholder.textContent = "Déposez une carte ici pour l'activer";
         placeholder.className = "text-center text-gray-500";
         this.playerActive.appendChild(placeholder);
         return;
      }
      const cardImg = document.createElement("img");
      cardImg.src = card.imageUrl;
      cardImg.alt = card.name;
      cardImg.className = "w-full h-auto rounded-lg shadow";
      cardImg.addEventListener("click", () => this.showCardModal(card));
      const info = document.createElement("div");
      this.playerActive.appendChild(cardImg);
      this.playerActive.appendChild(info);
   }


   renderOpponentActive() {
      this.opponentActive.innerHTML = "";
      const card = this.opponent.activeCard;

      if (!card) {
         const placeholder = document.createElement("p");
         placeholder.textContent = "Déposez une carte ici pour l'activer";
         placeholder.className = "text-center text-gray-500";
         this.opponentActive.appendChild(placeholder);
         return;
      }

      const cardImg = document.createElement("img");
      cardImg.src = card.imageUrl;
      cardImg.alt = card.name;
      cardImg.className = "w-full h-auto rounded-lg shadow";
      cardImg.addEventListener("click", () => this.showCardModal(card));
      const info = document.createElement("div");
      this.opponentActive.appendChild(cardImg);
      this.opponentActive.appendChild(info);
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
      const targetId = ev.currentTarget.id;

      if (data === "deck-card") {
         if (this.player.hand.cards.length < this.maxHandSize && this.player.deck.length > 0) {
            this.player.drawCard();
            this.renderCards();
         } else {
            alert("Ta main est pleine ou ta pioche est vide !");
         }

      } else if (data.startsWith("hand-card-")) {
         const index = parseInt(data.split("-")[2]);

         const card = this.player.hand.cards[index];
         if (!card) return;

         if (targetId === "player-active") {
            if (!this.player.activeCard) {
               this.player.activeCard = this.player.hand.cards.splice(index, 1)[0];
               this.renderCards();
               this.renderPlayerActive();
               this.displayResults();

            } else {
               alert("Tu as déjà un Pokémon actif !");
            }
         }

         else if (targetId === "opponent-active") {
            if (!this.opponent.activeCard) {
               this.opponent.activeCard = this.player.hand.cards.splice(index, 1)[0];
               this.renderCards();
               this.renderOpponentActive();
               this.displayResults();

            } else {
               alert("L'adversaire a déjà un Pokémon actif !");
            }
         }
      }
   }

   displayResults() {
      const playerCard = this.player.activeCard;
      const opponentCard = this.opponent.activeCard;

      if (!playerCard || !opponentCard) {
         console.log("Une ou deux cartes actives sont manquantes.");
         return;
      }

      console.log("Carte active du joueur :", playerCard);
      console.log("Carte active de l'adversaire :", opponentCard);


      this.results.innerHTML = "";
      const playerCardInfo = document.createElement("p");

      const playerCurrentHp = playerCard.hp - opponentCard.attacks[0].damage;
      const opponentCurrentHp = opponentCard.hp - playerCard.attacks[0].damage;

      
      playerCardInfo.textContent = 
      `Joueur: ${playerCard.name} a infligé ${playerCard.attacks[0].damage} points de dégâts.
      Adversaire: ${opponentCard.name} a ${opponentCurrentHp} points de vie restants.
      
      
      
      
      `;
      playerCardInfo.className = "text-lg font-bold mb-2";
      this.results.appendChild(playerCardInfo);

   }

   genrateFiveCards() {
      const cards = [];
      for (let i = 0; i < 5; i++) {
         const card = this.player.drawCard();
         if (card) {
            cards.push(card);
         }
      }
      return cards;
   }





   startGame() {


      this.genrateFiveCards();

      this.renderCards();



      this.deckContainer.addEventListener("dragstart", (ev) => this.dragstart_handler(ev));
      this.playerActive.addEventListener("dragstart", (ev) => this.dragstart_handler(ev));
      this.opponentActive.addEventListener("dragstart", (ev) => this.dragstart_handler(ev));

      this.handContainer.addEventListener("dragover", (ev) => this.dragover_handler(ev));
      this.playerActive.addEventListener("dragover", (ev) => this.dragover_handler(ev));
      this.opponentActive.addEventListener("dragover", (ev) => this.dragover_handler(ev));

      this.handContainer.addEventListener("drop", (ev) => this.drop_handler(ev));
      this.playerActive.addEventListener("drop", (ev) => this.drop_handler(ev));
      this.opponentActive.addEventListener("drop", (ev) => this.drop_handler(ev));

   }
}



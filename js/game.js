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


   renderPlayerCards() {
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
   }


   renderOpponentCards() {
      this.opponentHandContainer.innerHTML = "";
      // Utilise la longueur réelle de la main de l'adversaire au lieu de maxHandSize
      const opponentHandSize = this.opponent.hand.cards.length;

      for (let i = 0; i < opponentHandSize; i++) {
         const card = document.createElement("img");
         card.src = "../img/back-card.jpg"; // URL de l'image du dos de la carte
         card.alt = "Dos de carte Pokémon";
         card.className = "w-40 h-auto rounded-lg shadow";
         card.id = `opponent-hand-card-${i}`;
         this.opponentHandContainer.appendChild(card);
      }
   }


   renderActiveCard(container, card) {
      container.innerHTML = "";
      if (!card) {
         const placeholder = document.createElement("p");
         placeholder.textContent = "Déposez une carte ici pour l'activer";
         placeholder.className = "text-center text-gray-500";
         container.appendChild(placeholder);
         return;
      }
      const cardImg = document.createElement("img");
      cardImg.src = card.imageUrl;
      cardImg.alt = card.name;
      cardImg.className = "w-full h-auto rounded-lg shadow";
      cardImg.addEventListener("click", () => this.showCardModal(card));
      container.appendChild(cardImg);
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
      console.log("Drop event:", { data, targetId }); // Debug

      if (data === "deck-card") {
         if (this.player.hand.cards.length < this.maxHandSize && this.player.deck.length > 0) {
            this.player.drawCard();
            this.renderCards();
         } else {
            alert("Ta main est pleine ou ta pioche est vide !");
         }
      } else if (data.startsWith("hand-card-")) {
         const index = parseInt(data.split("-")[2]);
         console.log("Card index:", index); // Debug

         if (index < 0 || index >= this.player.hand.cards.length) {
            console.error("Index de carte invalide:", index);
            return;
         }

         const card = this.player.hand.cards[index];
         if (!card) {
            console.error("Carte non trouvée à l'index:", index);
            return;
         } if (targetId === "player-active") {
            if (!this.player.activeCard) {
               console.log("Déplacement de la carte vers la zone active"); // Debug
               this.player.activeCard = this.player.hand.cards.splice(index, 1)[0];
               this.renderActiveCard(this.playerActive, this.player.activeCard);
               // L'adversaire joue automatiquement une carte
               if (!this.opponent.activeCard && this.opponent.hand.cards.length > 0) {
                  // Choisit une carte aléatoire de la main de l'adversaire
                  const randomIndex = Math.floor(Math.random() * this.opponent.hand.cards.length);
                  this.opponent.activeCard = this.opponent.hand.cards.splice(randomIndex, 1)[0];
                  this.renderActiveCard(this.opponentActive, this.opponent.activeCard);
                  this.renderOpponentCards(); // Met à jour spécifiquement la main de l'adversaire
               }

               this.renderCards(); // Met à jour le reste de l'interface
               if (this.opponent.activeCard) {
                  this.displayResults();
               }
            } else {
               alert("Tu as déjà un Pokémon actif !");
            }
         } else if (targetId === "opponent-active") {
            if (!this.opponent.activeCard) {
               this.opponent.activeCard = this.player.hand.cards.splice(index, 1)[0];
               this.renderActiveCard(this.opponentActive, this.opponent.activeCard);
               this.renderCards();
               if (this.player.activeCard) {
                  this.displayResults();
               }
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

   drawInitialCards(player, count = 5) {
      for (let i = 0; i < count; i++) {
         player.drawCard();  // drawCard() ajoute déjà la carte dans la main
      }
   }



   renderCards() {
      this.renderPlayerCards();
      this.renderOpponentCards();
   }


   addDropListeners(...elements) {
      elements.forEach(el => {
         el.addEventListener("dragover", (ev) => this.dragover_handler(ev));
         el.addEventListener("drop", (ev) => this.drop_handler(ev));
      });
   }


   startGame() {
      [this.player, this.opponent].forEach(player => this.drawInitialCards(player));
      this.addDropListeners(this.playerActive, this.opponentActive, this.handContainer);
      this.renderCards();
   }

}
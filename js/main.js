// Données des cartes
const playerDeck = [
   "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_1.png",
   "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_2.png",
   "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_3.png",
   "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_4.png",
   "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_5.png"
];

const opponentDeck = [
   "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_1.png",
   "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_2.png",
   "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_3.png",
   "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_4.png",
   "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_5.png"
];

const adverseHandCards = [
   "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_1.png",
   "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_2.png",
   "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_3.png",
   "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_5.png"
];

const playerHandCards = [
   "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_1.png",
   "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_2.png",
   "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_3.png",
   "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_5.png"
];


const CARD_BACK_URL = "https://images.pokemontcg.io/back.jpg";

let deck = [...playerDeck];

let hand = [...playerHandCards];

let opponentDeckData = [...opponentDeck];

let opponentHand = [...adverseHandCards];

const MAX_HAND_CARDS = 4;

const deckContainer = document.getElementById("deck");

const handContainer = document.getElementById("hand");

const opponentDeckContainer = document.getElementById("opponent-deck");

const opponentHandContainer = document.getElementById("opponent-hand");


// afficher une pioche
function renderDeck(container, deckData, draggable = false, dragHandler = null) {

   container.innerHTML = "";

   if (deckData.length > 0) {

      const cardBack = document.createElement("img");

      cardBack.src = CARD_BACK_URL;

      cardBack.alt = "Dos de carte Pokémon";

      cardBack.className = "w-24 h-auto rounded-lg shadow" + (draggable ? " cursor-pointer" : "");

      if (draggable) {

         cardBack.id = "deck-card";

         cardBack.setAttribute("draggable", "true");

         cardBack.addEventListener("dragstart", dragHandler);
      }

      container.appendChild(cardBack);

      const label = document.createElement("p");

      label.textContent = `${deckData.length} carte(s)`;

      label.className = "text-sm text-gray-600 mt-2 text-center";

      container.appendChild(label);
   } else {
      container.textContent = "Pioche vide";
   }
}


// Affichage des cartes
function renderCards() {

   renderDeck(deckContainer, deck, true, dragstart_handler);

   // Main joueur (face visible)
   handContainer.innerHTML = "";

   hand.forEach((url, index) => {

      const card = document.createElement("img");

      card.src = url;

      card.alt = "Carte Pokémon";

      card.id = `hand-card-${index}`;

      card.className = "w-24 h-auto rounded-lg shadow";

      handContainer.appendChild(card);
   });

   renderDeck(opponentDeckContainer, opponentDeckData);

   // Main adverse (face cachée)
   opponentHandContainer.innerHTML = "";

   opponentHand.forEach(() => {

      const backCard = document.createElement("img");

      backCard.src = CARD_BACK_URL;

      backCard.alt = "Dos de carte";

      backCard.className = "w-20 h-auto rounded shadow";

      opponentHandContainer.appendChild(backCard);
   });
}



// Drag & Drop
function dragstart_handler(ev) {
   ev.dataTransfer.setData("application/my-app", ev.target.id);
   ev.dataTransfer.dropEffect = "move";
}

function dragover_handler(ev) {
   ev.preventDefault();
   ev.dataTransfer.dropEffect = "move";
}

function drop_handler(ev) {
   ev.preventDefault();
   const data = ev.dataTransfer.getData("application/my-app");

   if (data === "deck-card" && deck.length > 0) {
      if (hand.length >= MAX_HAND_CARDS) {
         const returned = hand.shift(); // Retirer la plus vieille carte
         deck.push(returned); // La remettre dans la pioche
      }

      const drawnCard = deck.shift();
      hand.push(drawnCard);
      renderCards();
   }
}

// Lancement du jeu
function startGame() {
   document.getElementById("game-area").classList.remove("hidden");
   document.querySelector("button").style.display = "none";
   renderCards();
}

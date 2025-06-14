import { Game } from './game.js';
import { Card } from './card.js';

async function initGame() {
   const types = ["fire", "water", "electric", "psychic", "grass"];
   const cardsPerType = 2;

   const playerDeck = await fetchMixedDeck(types, cardsPerType);
   const opponentDeck = await fetchMixedDeck(types, cardsPerType);

   const game = new Game(playerDeck, opponentDeck);
   game.startGame();
}

async function fetchMixedDeck(types, cardsPerType) {
   const allCards = [];

   for (const type of types) {
      const cards = await Card.fetchCards({ type, subtype: "Basic", pageSize: cardsPerType });
      allCards.push(...cards);
   }

   return shuffleArray(allCards);
}

function shuffleArray(array) {
   for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
   }
   return array;
}

initGame();

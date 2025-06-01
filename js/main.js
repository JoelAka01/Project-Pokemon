import { Game } from './game.js';
import { Card } from './card.js';

async function initGame() {


   const playerDeck = await Card.fetchCards("fire", 10);

   const opponentDeck = await Card.fetchCards("fire", 10);

   const game = new Game(playerDeck, opponentDeck);

   game.startGame();
}

initGame();
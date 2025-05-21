import { Game } from './game.js';

const playerDeck = [
  "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_1.png",
  "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_2.png",
  "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_3.png",
  "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_4.png",
  "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_5.png",
  "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_5.png"
];

const opponentDeck = [
  "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_1.png",
  "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_2.png",
  "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_3.png",
  "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_4.png",
  "https://assets.pokemon.com/assets/cms2/img/cards/web/SM1/SM1_EN_5.png"
];

const game = new Game(playerDeck, opponentDeck);
game.startGame();


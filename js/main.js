import { Game } from './game.js';
import { Card } from './card.js';

function toggleLoadingOverlay(show = true) {
   const loadingOverlay = document.getElementById('loading-overlay');
   if (loadingOverlay) {
      if (show) {
         loadingOverlay.classList.remove('hidden');
         loadingOverlay.classList.add('flex');
      } else {
         loadingOverlay.style.transition = 'opacity 0.5s ease';
         loadingOverlay.style.opacity = '0';
         setTimeout(() => {
            loadingOverlay.classList.add('hidden');
            loadingOverlay.classList.remove('flex');
            loadingOverlay.style.opacity = '1';
         }, 500);
      }
   }
}

async function initGame() {
   try {
      toggleLoadingOverlay(true);
      const allCards = await Card.fetchCards();
      const playerDeck = shuffleArray([...allCards]);
      const opponentDeck = shuffleArray([...allCards]);
      const game = new Game(playerDeck, opponentDeck);
      toggleLoadingOverlay(false);
      game.startGame();
   } catch (error) {
      console.error("Erreur lors de l'initialisation du jeu:", error);
      toggleLoadingOverlay(false);
      alert("Une erreur est survenue lors du chargement du jeu. Veuillez recharger la page.");
   }
}

function shuffleArray(array) {
   for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
   }
   return array;
}

initGame();
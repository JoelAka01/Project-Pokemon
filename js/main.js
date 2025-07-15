import { Game } from './game.js';
import { Card } from './card.js';

// Fonction pour afficher/masquer l'overlay de chargement
function toggleLoadingOverlay(show = true) {
   const loadingOverlay = document.getElementById('loading-overlay');
   if (loadingOverlay) {
      if (show) {
         loadingOverlay.classList.remove('hidden');
         loadingOverlay.classList.add('flex');
      } else {
         // Animation de disparition
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
   const types = ["fire", "water", "electric", "psychic", "grass"];
   const cardsPerType = 2; // Augmenté de 2 à 6 pour avoir assez de cartes (30 total)

   try {
      // Afficher l'overlay de chargement
      toggleLoadingOverlay(true);

      console.log("Chargement des decks...");
      const playerDeck = await fetchMixedDeck(types, cardsPerType);
      const opponentDeck = await fetchMixedDeck(types, cardsPerType);

      console.log(`✅ Decks créés - Joueur: ${playerDeck.length} cartes, Adversaire: ${opponentDeck.length} cartes`);
      console.log("Initialisation du jeu...");
      const game = new Game(playerDeck, opponentDeck);

      // Masquer l'overlay de chargement
      toggleLoadingOverlay(false);

      game.startGame();
      console.log("Jeu initialisé !");
   } catch (error) {
      console.error("Erreur lors de l'initialisation du jeu:", error);
      toggleLoadingOverlay(false); // Masquer l'overlay même en cas d'erreur
      alert("Une erreur est survenue lors du chargement du jeu. Veuillez recharger la page.");
   }
}

async function fetchMixedDeck(types, cardsPerType) {
   const allCards = [];
   const loadingText = document.querySelector('#loading-overlay p');
   const originalText = loadingText ? loadingText.textContent : '';


   if (loadingText) {
      loadingText.textContent = 'Chargement des cartes...';
   }

   for (let i = 0; i < types.length; i++) {
      const type = types[i];
      const cards = await Card.fetchCards({ type, subtype: "Basic", pageSize: cardsPerType });
      allCards.push(...cards);
      await new Promise(resolve => setTimeout(resolve, 300));
   }

   // Remettre le texte original
   if (loadingText && originalText) {
      loadingText.textContent = originalText;
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

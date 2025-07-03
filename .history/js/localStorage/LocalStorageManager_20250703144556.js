export class LocalStorageManager {
   constructor() {
      this.gameStateKey = 'pokemonTCG_gameState';
   }

   emergencyCleanup() {
      // Nettoyer les données corrompues
      try {
         const gameState = localStorage.getItem(this.gameStateKey);
         if (gameState) {
            JSON.parse(gameState); // Test si c'est du JSON valide
         }
      } catch (error) {
         console.warn("🔧 Données corrompues détectées, nettoyage");
         localStorage.removeItem(this.gameStateKey);
      }
   }

   saveGameState(gameData) {
      try {
         const gameState = {
            player: {
               deck: gameData.player.deck,
               hand: gameData.player.hand.cards,
               activeCard: gameData.player.activeCard,
               discardPile: gameData.player.discardPile
            },
            opponent: {
               deck: gameData.opponent.deck,
               hand: gameData.opponent.hand.cards,
               activeCard: gameData.opponent.activeCard,
               discardPile: gameData.opponent.discardPile
            },
            canDraw: gameData.canDraw,
            timeLeft: gameData.timeLeft,
            timestamp: Date.now()
         };

         localStorage.setItem(this.gameStateKey, JSON.stringify(gameState));
         console.log("✅ Jeu sauvegardé");
         return true;
      } catch (error) {
         console.error("❌ Erreur sauvegarde:", error);
         return false;
      }
   }

   loadGameState() {
      try {
         const savedState = localStorage.getItem(this.gameStateKey);
         if (!savedState) return null;

         const gameState = JSON.parse(savedState);

         // Vérification basique
         if (!gameState.player || !gameState.opponent) {
            this.clearGameState();
            return null;
         }

         console.log("✅ Jeu chargé");
         return gameState;
      } catch (error) {
         console.error("❌ Erreur chargement:", error);
         this.clearGameState();
         return null;
      }
   }

   checkSavedGameValidity() {
      const savedState = localStorage.getItem(this.gameStateKey);
      if (!savedState) return false;

      try {
         const gameState = JSON.parse(savedState);
         return !!(gameState.player && gameState.opponent);
      } catch (error) {
         this.clearGameState();
         return false;
      }
   }

   clearGameState() {
      localStorage.removeItem(this.gameStateKey);
      console.log("🗑️ Données supprimées");
   }

   clearAllGameData() {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
         const key = localStorage.key(i);
         if (key && key.includes('pokemonTCG')) {
            keys.push(key);
         }
      }
      keys.forEach(key => localStorage.removeItem(key));
      return keys.length;
   }

   // Méthodes pour compatibilité avec le code existant
   hadCorruptedData() { return false; }
   clearCorruptedDataFlag() { }
}

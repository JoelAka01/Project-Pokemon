// Script de diagnostic pour identifier les problèmes localStorage
export class GameDebugger {
   static diagnoseLocalStorage() {
      console.log("=== DIAGNOSTIC LOCALSTORAGE ===");

      // Test 1: Vérifier si localStorage est disponible
      try {
         const testKey = 'test_' + Date.now();
         localStorage.setItem(testKey, 'test');
         localStorage.removeItem(testKey);
         console.log("✅ localStorage disponible");
      } catch (error) {
         console.error("❌ localStorage non disponible:", error);
         return false;
      }

      // Test 2: Lister toutes les clés liées au jeu
      console.log("📋 Clés Pokemon TCG dans localStorage:");
      const pokemonKeys = [];

      for (let i = 0; i < localStorage.length; i++) {
         const key = localStorage.key(i);
         if (key && key.includes('pokemon')) {
            pokemonKeys.push(key);
            console.log(`   - ${key}: ${localStorage.getItem(key)?.substring(0, 100)}...`);
         }
      }

      if (pokemonKeys.length === 0) {
         console.log("   Aucune clé Pokemon trouvée");
      }

      // Test 3: Vérifier la clé principale du jeu
      const gameState = localStorage.getItem('pokemonTCG_gameState');
      if (gameState) {
         console.log("🎮 État du jeu trouvé:");
         try {
            const parsed = JSON.parse(gameState);
            console.log("   - Parsé avec succès");
            console.log("   - Joueur deck:", parsed.player?.deck?.length || 0, "cartes");
            console.log("   - Joueur main:", parsed.player?.hand?.length || 0, "cartes");
            console.log("   - Adversaire deck:", parsed.opponent?.deck?.length || 0, "cartes");
            console.log("   - Adversaire main:", parsed.opponent?.hand?.length || 0, "cartes");
            console.log("   - Timestamp:", parsed.timestamp ? new Date(parsed.timestamp).toLocaleString() : "non défini");
         } catch (error) {
            console.error("❌ Erreur de parsing:", error);
            console.log("📄 Contenu brut:", gameState);
         }
      } else {
         console.log("🚫 Aucun état de jeu sauvegardé");
      }

      // Test 4: Tester la sauvegarde
      console.log("💾 Test de sauvegarde:");
      try {
         const testGameState = {
            test: true,
            timestamp: Date.now(),
            player: { deck: [], hand: [] },
            opponent: { deck: [], hand: [] }
         };

         localStorage.setItem('pokemonTCG_test', JSON.stringify(testGameState));
         const retrieved = localStorage.getItem('pokemonTCG_test');
         const parsed = JSON.parse(retrieved);

         if (parsed.test === true) {
            console.log("✅ Test de sauvegarde réussi");
            localStorage.removeItem('pokemonTCG_test');
         } else {
            console.error("❌ Test de sauvegarde échoué");
         }
      } catch (error) {
         console.error("❌ Erreur lors du test de sauvegarde:", error);
      }

      // Test 5: Vérifier la taille du localStorage
      let totalSize = 0;
      for (let key in localStorage) {
         if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage[key].length;
         }
      }
      console.log(`📊 Taille totale localStorage: ${totalSize} caractères`);

      return true;
   }

   static clearAllPokemonData() {
      console.log("🧹 Nettoyage complet des données Pokemon...");

      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
         const key = localStorage.key(i);
         if (key && key.toLowerCase().includes('pokemon')) {
            keysToRemove.push(key);
         }
      }

      keysToRemove.forEach(key => {
         console.log(`   Suppression de: ${key}`);
         localStorage.removeItem(key);
      });

      console.log(`✅ ${keysToRemove.length} clés supprimées`);
   }

   static createDiagnosticButton() {
      const button = document.createElement('button');
      button.innerHTML = '🔍 Diagnostic';
      button.className = 'fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow-lg transition-all duration-300';
      button.onclick = () => {
         GameDebugger.diagnoseLocalStorage();
      };
      document.body.appendChild(button);
   }
}

// Auto-diagnostic au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
   GameDebugger.createDiagnosticButton();

   // Diagnostic automatique après 2 secondes
   setTimeout(() => {
      GameDebugger.diagnoseLocalStorage();
   }, 2000);
});

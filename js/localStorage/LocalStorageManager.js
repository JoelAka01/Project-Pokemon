/**
 * Module de gestion du localStorage pour le jeu Pokémon TCG
 * 
 * Ce module centralise toute la logique de persistance des données :
 * - Sauvegarde et chargement de l'état du jeu
 * - Validation et nettoyage des données corrompues
 * - Gestion des erreurs et récupération d'urgence
 * - Diagnostics et maintenance
 */
export class LocalStorageManager {
   constructor() {
      // Clés utilisées dans le localStorage
      this.keys = {
         gameState: 'pokemonTCG_gameState',
         emergency: 'pokemonTCG_emergency',
         dataCleanupFlag: 'pokemonTCG_dataCleanupFlag'
      };

      // Configuration
      this.maxSaveAge = 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes
      this.gameVersion = "1.0";
   }

   /**
    * Effectue un nettoyage d'urgence du localStorage
    * @returns {boolean} - True si un nettoyage d'urgence a été effectué
    */
   emergencyCleanup() {
      try {
         // Vérifier si le jeu a été marqué comme défaillant
         const emergencyFlag = localStorage.getItem(this.keys.emergency);

         if (emergencyFlag) {
            console.warn("🚨 MODE D'URGENCE ACTIVÉ - Nettoyage forcé du localStorage");

            // Supprimer toutes les données Pokemon
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
               const key = localStorage.key(i);
               if (key && key.includes('pokemon')) {
                  keysToRemove.push(key);
               }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key));

            console.log(`✅ ${keysToRemove.length} clés supprimées en mode d'urgence`);
            return true;
         }

         // Vérifier rapidement l'intégrité des données
         const gameState = localStorage.getItem(this.keys.gameState);
         if (gameState) {
            try {
               const parsed = JSON.parse(gameState);

               // Tests de base sur l'intégrité
               if (!parsed.player || !parsed.opponent ||
                  !Array.isArray(parsed.player.deck) ||
                  !Array.isArray(parsed.player.hand)) {

                  console.warn("🔧 Données corrompues détectées, nettoyage préventif");
                  localStorage.removeItem(this.keys.gameState);
                  localStorage.setItem(this.keys.dataCleanupFlag, 'true');
                  return true;
               }
            } catch (parseError) {
               console.warn("🔧 Erreur de parsing détectée, nettoyage préventif");
               localStorage.removeItem(this.keys.gameState);
               localStorage.setItem(this.keys.dataCleanupFlag, 'true');
               return true;
            }
         }

         return false;
      } catch (error) {
         console.error("Erreur lors du nettoyage d'urgence:", error);
         return false;
      }
   }

   /**
    * Sauvegarde l'état du jeu dans le localStorage
    * @param {Object} gameData - Les données du jeu à sauvegarder
    * @returns {boolean} - True si la sauvegarde a réussi
    */
   saveGameState(gameData) {
      try {
         // Vérifier que les données sont valides avant la sauvegarde
         if (!this.validateGameData(gameData)) {
            console.warn("Impossible de sauvegarder : données invalides");
            return false;
         }

         const gameState = {
            player: {
               deck: gameData.player.deck,
               hand: gameData.player.hand.cards,
               activeCard: gameData.player.activeCard
            },
            opponent: {
               deck: gameData.opponent.deck,
               hand: gameData.opponent.hand.cards,
               activeCard: gameData.opponent.activeCard
            },
            canDraw: gameData.canDraw,
            timeLeft: gameData.timeLeft,
            version: this.gameVersion,
            timestamp: Date.now()
         };

         localStorage.setItem(this.keys.gameState, JSON.stringify(gameState));
         console.log("État du jeu sauvegardé");
         return true;
      } catch (error) {
         console.error("Erreur lors de la sauvegarde de l'état du jeu:", error);
         // En cas d'erreur, supprimer la sauvegarde corrompue
         localStorage.removeItem(this.keys.gameState);
         return false;
      }
   }

   /**
    * Charge l'état du jeu depuis le localStorage
    * @returns {Object|null} - Les données du jeu ou null si aucune sauvegarde valide
    */
   loadGameState() {
      const savedState = localStorage.getItem(this.keys.gameState);

      if (!savedState) {
         console.log("Pas d'état sauvegardé, démarrage d'un nouveau jeu");
         return null;
      }

      try {
         const gameState = JSON.parse(savedState);

         // Vérifier que l'état sauvegardé contient les données nécessaires
         if (!this.validateSavedGameState(gameState)) {
            console.warn("État sauvegardé invalide ou incomplet, démarrage d'un nouveau jeu");
            localStorage.removeItem(this.keys.gameState);
            return null;
         }

         console.log("État du jeu chargé avec succès");
         return gameState;
      } catch (error) {
         console.error("Erreur lors du chargement de l'état du jeu:", error);
         localStorage.removeItem(this.keys.gameState);
         return null;
      }
   }

   /**
    * Vérifie si les données sauvegardées sont valides
    * @returns {boolean} - True si une sauvegarde valide existe
    */
   checkSavedGameValidity() {
      const savedState = localStorage.getItem(this.keys.gameState);

      if (!savedState) {
         return false;
      }

      try {
         const gameState = JSON.parse(savedState);

         // Vérifier la structure de base
         if (!gameState || !gameState.player || !gameState.opponent) {
            console.warn("Structure de sauvegarde invalide, suppression...");
            this.markDataAsCorrupted();
            localStorage.removeItem(this.keys.gameState);
            return false;
         }

         // Vérifier que les decks et mains sont des tableaux
         if (!Array.isArray(gameState.player.deck) || !Array.isArray(gameState.player.hand) ||
            !Array.isArray(gameState.opponent.deck) || !Array.isArray(gameState.opponent.hand)) {
            console.warn("Format des données de sauvegarde invalide, suppression...");
            this.markDataAsCorrupted();
            localStorage.removeItem(this.keys.gameState);
            return false;
         }

         // Vérifier l'âge de la sauvegarde (supprimer si > 7 jours)
         if (gameState.timestamp) {
            const age = Date.now() - gameState.timestamp;

            if (age > this.maxSaveAge) {
               console.warn("Sauvegarde trop ancienne, suppression...");
               this.markDataAsCorrupted();
               localStorage.removeItem(this.keys.gameState);
               return false;
            }
         }

         return true;
      } catch (error) {
         console.error("Erreur lors de la vérification de la sauvegarde:", error);
         this.markDataAsCorrupted();
         localStorage.removeItem(this.keys.gameState);
         return false;
      }
   }

   /**
    * Valide les données du jeu avant sauvegarde
    * @param {Object} gameData - Les données à valider
    * @returns {boolean} - True si les données sont valides
    */
   validateGameData(gameData) {
      if (!gameData.player || !gameData.opponent) {
         console.warn("Impossible de sauvegarder : joueurs non initialisés");
         return false;
      }

      if (!Array.isArray(gameData.player.deck) || !Array.isArray(gameData.opponent.deck)) {
         console.warn("Impossible de sauvegarder : decks invalides");
         return false;
      }

      if (!gameData.player.hand || !Array.isArray(gameData.player.hand.cards) ||
         !gameData.opponent.hand || !Array.isArray(gameData.opponent.hand.cards)) {
         console.warn("Impossible de sauvegarder : mains invalides");
         return false;
      }

      return true;
   }

   /**
    * Valide l'état du jeu chargé depuis le localStorage
    * @param {Object} gameState - L'état du jeu à valider
    * @returns {boolean} - True si l'état est valide
    */
   validateSavedGameState(gameState) {
      // Vérifier que l'état sauvegardé contient les données nécessaires
      if (!gameState || !gameState.player || !gameState.opponent) {
         return false;
      }

      // Vérifier que les decks et mains existent et sont des tableaux
      if (!Array.isArray(gameState.player.deck) || !Array.isArray(gameState.player.hand) ||
         !Array.isArray(gameState.opponent.deck) || !Array.isArray(gameState.opponent.hand)) {
         return false;
      }

      // Vérifier que les cartes ont les propriétés nécessaires
      const allCards = [
         ...gameState.player.deck,
         ...gameState.player.hand,
         ...gameState.opponent.deck,
         ...gameState.opponent.hand
      ];

      if (gameState.player.activeCard) allCards.push(gameState.player.activeCard);
      if (gameState.opponent.activeCard) allCards.push(gameState.opponent.activeCard);

      const isValidCard = (card) => {
         return card &&
            typeof card.id === 'string' &&
            typeof card.name === 'string' &&
            typeof card.imageUrl === 'string' &&
            Array.isArray(card.types);
      };

      if (allCards.some(card => card && !isValidCard(card))) {
         console.warn("Cartes sauvegardées invalides");
         return false;
      }

      return true;
   }

   /**
    * Marque les données comme corrompues pour un nettoyage ultérieur
    */
   markDataAsCorrupted() {
      localStorage.setItem(this.keys.dataCleanupFlag, 'true');
   }

   /**
    * Vérifie si des données corrompues ont été détectées
    * @returns {boolean} - True si des données corrompues ont été détectées
    */
   hadCorruptedData() {
      return localStorage.getItem(this.keys.dataCleanupFlag) === 'true';
   }

   /**
    * Nettoie le flag de données corrompues
    */
   clearCorruptedDataFlag() {
      localStorage.removeItem(this.keys.dataCleanupFlag);
   }

   /**
    * Supprime toutes les données du jeu
    * @returns {number} - Le nombre de clés supprimées
    */
   clearAllGameData() {
      try {
         // Supprimer toutes les clés liées au jeu
         const keysToRemove = [];
         for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('pokemonTCG')) {
               keysToRemove.push(key);
            }
         }

         keysToRemove.forEach(key => localStorage.removeItem(key));

         console.log("Toutes les données du jeu ont été supprimées");
         return keysToRemove.length;
      } catch (error) {
         console.error("Erreur lors du nettoyage des données:", error);
         throw error;
      }
   }

   /**
    * Supprime uniquement l'état du jeu sauvegardé
    */
   clearGameState() {
      localStorage.removeItem(this.keys.gameState);
      console.log("État du jeu supprimé");
   }

   /**
    * Active le mode d'urgence
    */
   setEmergencyMode() {
      localStorage.setItem(this.keys.emergency, 'true');
      console.warn("Mode d'urgence activé");
   }

   /**
    * Désactive le mode d'urgence
    */
   clearEmergencyMode() {
      localStorage.removeItem(this.keys.emergency);
      console.log("Mode d'urgence désactivé");
   }

   /**
    * Vérifie si le mode d'urgence est activé
    * @returns {boolean} - True si le mode d'urgence est activé
    */
   isEmergencyMode() {
      return localStorage.getItem(this.keys.emergency) === 'true';
   }

   /**
    * Obtient des statistiques sur le localStorage
    * @returns {Object} - Statistiques du localStorage
    */
   getStorageStats() {
      const stats = {
         totalKeys: localStorage.length,
         pokemonKeys: 0,
         gameStateExists: false,
         gameStateSize: 0,
         emergencyMode: this.isEmergencyMode(),
         hasCorruptedFlag: this.hadCorruptedData()
      };

      try {
         for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('pokemonTCG')) {
               stats.pokemonKeys++;

               if (key === this.keys.gameState) {
                  stats.gameStateExists = true;
                  const value = localStorage.getItem(key);
                  stats.gameStateSize = value ? value.length : 0;
               }
            }
         }
      } catch (error) {
         console.error("Erreur lors de la collecte des statistiques:", error);
      }

      return stats;
   }

   /**
    * Exporte toutes les données du jeu pour sauvegarde
    * @returns {Object} - Toutes les données du jeu
    */
   exportGameData() {
      const data = {};

      try {
         for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('pokemonTCG')) {
               data[key] = localStorage.getItem(key);
            }
         }
      } catch (error) {
         console.error("Erreur lors de l'export des données:", error);
      }

      return data;
   }

   /**
    * Importe des données du jeu depuis une sauvegarde
    * @param {Object} data - Les données à importer
    */
   importGameData(data) {
      try {
         Object.keys(data).forEach(key => {
            if (key.includes('pokemonTCG')) {
               localStorage.setItem(key, data[key]);
            }
         });
         console.log("Données importées avec succès");
      } catch (error) {
         console.error("Erreur lors de l'import des données:", error);
         throw error;
      }
   }

   /**
    * Effectue un diagnostic complet du localStorage
    * @returns {Object} - Rapport de diagnostic
    */
   runDiagnostic() {
      const diagnostic = {
         timestamp: new Date().toISOString(),
         status: 'OK',
         issues: [],
         stats: this.getStorageStats(),
         recommendations: []
      };

      try {
         // Vérifier l'état du jeu
         if (diagnostic.stats.gameStateExists) {
            const gameState = this.loadGameState();
            if (!gameState) {
               diagnostic.issues.push("État du jeu corrompu détecté");
               diagnostic.status = 'WARNING';
            }
         }

         // Vérifier le mode d'urgence
         if (diagnostic.stats.emergencyMode) {
            diagnostic.issues.push("Mode d'urgence activé");
            diagnostic.status = 'EMERGENCY';
            diagnostic.recommendations.push("Exécuter le nettoyage d'urgence");
         }

         // Vérifier le flag de données corrompues
         if (diagnostic.stats.hasCorruptedFlag) {
            diagnostic.issues.push("Flag de données corrompues détecté");
            diagnostic.status = 'WARNING';
            diagnostic.recommendations.push("Nettoyer le flag de données corrompues");
         }

         // Vérifier la taille des données
         if (diagnostic.stats.gameStateSize > 50000) { // 50KB
            diagnostic.issues.push("Taille de l'état du jeu importante");
            diagnostic.recommendations.push("Considérer une optimisation des données");
         }

      } catch (error) {
         diagnostic.status = 'ERROR';
         diagnostic.issues.push(`Erreur de diagnostic: ${error.message}`);
      }

      return diagnostic;
   }
}

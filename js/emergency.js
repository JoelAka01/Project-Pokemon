// Système d'alerte d'urgence pour les problèmes de localStorage
(function () {
   // Fonction pour créer un bouton d'urgence
   function createEmergencyButton() {
      const emergencyBtn = document.createElement('button');
      emergencyBtn.innerHTML = '🆘 Réparer le jeu';
      emergencyBtn.className = 'fixed top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full shadow-lg transition-all duration-300 z-50 animate-pulse';
      emergencyBtn.style.display = 'none';

      emergencyBtn.onclick = function () {
         if (confirm('Cela va nettoyer complètement les données du jeu et recharger la page. Continuer?')) {
            // Nettoyer complètement
            try {
               localStorage.clear();
               sessionStorage.clear();

               // Marquer pour nettoyage d'urgence
               localStorage.setItem('pokemonTCG_emergency', 'true');

               alert('Nettoyage effectué! La page va se recharger.');
               window.location.reload();
            } catch (error) {
               alert('Erreur lors du nettoyage. Essayez de vider manuellement le cache de votre navigateur (Ctrl+Shift+Delete).');
            }
         }
      };

      document.body.appendChild(emergencyBtn);
      return emergencyBtn;
   }

   // Fonction pour détecter les problèmes
   function detectProblems() {
      // Attendre que la page soit chargée
      setTimeout(() => {
         const handContainer = document.getElementById('hand');
         const deckContainer = document.getElementById('deck');

         if (!handContainer || !deckContainer) {
            console.warn('Conteneurs DOM non trouvés');
            return;
         }

         // Vérifier si les cartes sont affichées après le chargement
         setTimeout(() => {
            const handCards = handContainer.querySelectorAll('img').length;
            const deckCards = deckContainer.querySelectorAll('img').length;

            console.log(`Cartes détectées - Main: ${handCards}, Deck: ${deckCards}`);

            // Si aucune carte n'est affichée après 10 secondes, montrer le bouton d'urgence
            if (handCards === 0 && deckCards === 0) {
               console.error('🚨 PROBLÈME DÉTECTÉ: Aucune carte affichée');

               const emergencyBtn = document.querySelector('button[innerHTML*="Réparer"]') || createEmergencyButton();
               emergencyBtn.style.display = 'block';

               // Afficher un message d'alerte
               const alertDiv = document.createElement('div');
               alertDiv.className = 'fixed top-20 right-4 bg-red-600/90 text-white p-4 rounded-lg shadow-lg z-40 max-w-sm';
               alertDiv.innerHTML = `
                        <div class="flex items-center mb-2">
                            <span class="text-xl mr-2">⚠️</span>
                            <strong>Problème détecté</strong>
                        </div>
                        <p class="text-sm mb-3">Les cartes ne s'affichent pas correctement. Cliquez sur "Réparer le jeu" pour résoudre le problème.</p>
                        <button onclick="this.parentElement.remove()" class="bg-white text-red-600 px-2 py-1 rounded text-xs font-bold">
                            Fermer
                        </button>
                    `;

               document.body.appendChild(alertDiv);

               // Auto-suppression après 15 secondes
               setTimeout(() => {
                  if (alertDiv.parentNode) {
                     alertDiv.remove();
                  }
               }, 15000);
            }
         }, 10000); // Attendre 10 secondes après le chargement

      }, 2000); // Attendre 2 secondes pour que la page se charge
   }

   // Démarrer la détection quand le DOM est prêt
   if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', detectProblems);
   } else {
      detectProblems();
   }

   // Créer immédiatement le bouton (caché) pour les cas d'urgence
   createEmergencyButton();
})();

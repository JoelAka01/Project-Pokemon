export class BattleEndModal {
   static show(result, playerHP, maxPlayerHP, opponentHP, maxOpponentHP, onNewCards) {
      const existingModal = document.getElementById('battle-end-modal');
      if (existingModal) existingModal.remove();

      const modal = document.createElement('div');
      modal.id = 'battle-end-modal';
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

      // Déterminer le type de résultat et les styles correspondants
      let emoji, bgColor, textColor, title, message;

      switch (result) {
         case 'victory':
            emoji = '🎉';
            bgColor = 'bg-green-100';
            textColor = 'text-green-800';
            title = 'Victoire !';
            message = 'Félicitations, vous avez gagné ce combat !';
            break;
         case 'defeat':
            emoji = '💀';
            bgColor = 'bg-red-100';
            textColor = 'text-red-800';
            title = 'Défaite';
            message = 'Vous avez perdu ce combat...';
            break;
         case 'draw':
            emoji = '🤝';
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-800';
            title = 'Match nul';
            message = 'Le combat se termine par un match nul !';
            break;
         default:
            emoji = '⚔️';
            bgColor = 'bg-gray-100';
            textColor = 'text-gray-800';
            title = 'Combat terminé';
            message = 'Le combat est maintenant terminé.';
      }

      modal.innerHTML = `
         <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-2xl ${bgColor}">
            <div class="text-6xl mb-4">${emoji}</div>
            <h2 class="text-2xl font-bold mb-4 ${textColor}">${title}</h2>
            <p class="text-lg mb-6 ${textColor}">${message}</p>
            
            <div class="mb-6 p-4 bg-white bg-opacity-50 rounded-lg">
               <h3 class="font-semibold mb-3 ${textColor}">Résultat final :</h3>
               <div class="space-y-2">
                  <div class="flex justify-between items-center">
                     <span class="font-medium">Vous :</span>
                     <div class="flex items-center space-x-2">
                        <div class="w-24 bg-gray-200 rounded-full h-3">
                           <div class="bg-blue-500 h-3 rounded-full transition-all duration-300" 
                                style="width: ${Math.max(0, (playerHP / maxPlayerHP) * 100)}%"></div>
                        </div>
                        <span class="text-sm font-mono">${Math.max(0, playerHP)}/${maxPlayerHP} PV</span>
                     </div>
                  </div>
                  <div class="flex justify-between items-center">
                     <span class="font-medium">Adversaire :</span>
                     <div class="flex items-center space-x-2">
                        <div class="w-24 bg-gray-200 rounded-full h-3">
                           <div class="bg-red-500 h-3 rounded-full transition-all duration-300" 
                                style="width: ${Math.max(0, (opponentHP / maxOpponentHP) * 100)}%"></div>
                        </div>
                        <span class="text-sm font-mono">${Math.max(0, opponentHP)}/${maxOpponentHP} PV</span>
                     </div>
                  </div>
               </div>
            </div>

            <div class="flex space-x-3 justify-center">
               <button id="battle-end-new-cards" 
                       class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg">
                  🃏 Nouvelles cartes
               </button>
               <button id="battle-end-close" 
                       class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg">
                  ✖️ Fermer
               </button>
            </div>
         </div>
      `;

      document.body.appendChild(modal);

      // Gestion des événements
      const newCardsBtn = document.getElementById('battle-end-new-cards');
      const closeBtn = document.getElementById('battle-end-close');

      newCardsBtn.addEventListener('click', () => {
         modal.remove();
         if (onNewCards) onNewCards();
      });

      closeBtn.addEventListener('click', () => {
         modal.remove();
      });

      // Fermer en cliquant sur l'arrière-plan
      modal.addEventListener('click', (e) => {
         if (e.target === modal) {
            modal.remove();
         }
      });

      // Animation d'entrée
      modal.style.opacity = '0';
      setTimeout(() => {
         modal.style.transition = 'opacity 0.3s ease-in-out';
         modal.style.opacity = '1';
      }, 10);

      return modal;
   }

   static showWithCustomMessage(result, customMessage, playerHP, maxPlayerHP, opponentHP, maxOpponentHP, onNewCards) {
      // Supprimer toute modal existante
      const existingModal = document.getElementById('battle-end-modal');
      if (existingModal) existingModal.remove();

      const modal = document.createElement('div');
      modal.id = 'battle-end-modal';
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

      // Déterminer le type de résultat et les styles correspondants
      let emoji, bgColor, textColor, title;

      switch (result) {
         case 'victory':
            emoji = '🎉';
            bgColor = 'bg-green-100';
            textColor = 'text-green-800';
            title = 'Victoire !';
            break;
         case 'defeat':
            emoji = '💀';
            bgColor = 'bg-red-100';
            textColor = 'text-red-800';
            title = 'Défaite';
            break;
         case 'draw':
            emoji = '🤝';
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-800';
            title = 'Match nul';
            break;
         default:
            emoji = '⚔️';
            bgColor = 'bg-gray-100';
            textColor = 'text-gray-800';
            title = 'Combat terminé';
      }

      modal.innerHTML = `
         <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-2xl ${bgColor}">
            <div class="text-6xl mb-4">${emoji}</div>
            <h2 class="text-2xl font-bold mb-4 ${textColor}">${title}</h2>
            <p class="text-lg mb-6 ${textColor}">${customMessage}</p>
            
            <div class="mb-6 p-4 bg-white bg-opacity-50 rounded-lg">
               <h3 class="font-semibold mb-3 ${textColor}">Résultat final :</h3>
               <div class="space-y-2">
                  <div class="flex justify-between items-center">
                     <span class="font-medium">Vous :</span>
                     <div class="flex items-center space-x-2">
                        <div class="w-24 bg-gray-200 rounded-full h-3">
                           <div class="bg-blue-500 h-3 rounded-full transition-all duration-300" 
                                style="width: ${Math.max(0, (playerHP / maxPlayerHP) * 100)}%"></div>
                        </div>
                        <span class="text-sm font-mono">${Math.max(0, playerHP)}/${maxPlayerHP} PV</span>
                     </div>
                  </div>
                  <div class="flex justify-between items-center">
                     <span class="font-medium">Adversaire :</span>
                     <div class="flex items-center space-x-2">
                        <div class="w-24 bg-gray-200 rounded-full h-3">
                           <div class="bg-red-500 h-3 rounded-full transition-all duration-300" 
                                style="width: ${Math.max(0, (opponentHP / maxOpponentHP) * 100)}%"></div>
                        </div>
                        <span class="text-sm font-mono">${Math.max(0, opponentHP)}/${maxOpponentHP} PV</span>
                     </div>
                  </div>
               </div>
            </div>

            <div class="flex space-x-3 justify-center">
               <button id="battle-end-new-cards" 
                       class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg">
                  🃏 Nouvelles cartes
               </button>
               <button id="battle-end-close" 
                       class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg">
                  ✖️ Fermer
               </button>
            </div>
         </div>
      `;

      document.body.appendChild(modal);

      const newCardsBtn = document.getElementById('battle-end-new-cards');
      const closeBtn = document.getElementById('battle-end-close');

      newCardsBtn.addEventListener('click', () => {
         modal.remove();
         if (onNewCards) onNewCards();
      });

      closeBtn.addEventListener('click', () => {
         modal.remove();
      });

      modal.addEventListener('click', (e) => {
         if (e.target === modal) {
            modal.remove();
         }
      });

      modal.style.opacity = '0';
      setTimeout(() => {
         modal.style.transition = 'opacity 0.3s ease-in-out';
         modal.style.opacity = '1';
      }, 10);

      return modal;
   }

   static remove() {
      const modal = document.getElementById('battle-end-modal');
      if (modal) {
         modal.style.transition = 'opacity 0.3s ease-in-out';
         modal.style.opacity = '0';
         setTimeout(() => {
            if (modal.parentNode) modal.remove();
         }, 300);
      }
   }
}

import { NotificationModal } from './NotificationModal.js';

export class GameModal {
   static createChangeCardModal(playerHP, maxPlayerHP, opponentHP, maxOpponentHP) {
      const attackDisplay = document.getElementById('battle-attack-display');
      if (attackDisplay) attackDisplay.remove();

      const modal = document.createElement('div');
      modal.id = 'change-card-modal';
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

      modal.innerHTML = `
      <div class="bg-white rounded-xl p-6 max-w-3xl mx-4 shadow-xl">
         <h3 class="text-xl font-bold mb-6 text-gray-800">Continuer le combat ?</h3>
         <div class="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
            <p class="text-sm font-medium text-gray-600 mb-3">Points de vie :</p>
            <div class="space-y-2">
               <div class="flex justify-between items-center">
                  <span class="font-medium">Vous</span>
                  <span class="font-bold text-blue-600">${playerHP}/${maxPlayerHP}</span>
               </div>
               <div class="flex justify-between items-center">
                  <span class="font-medium">Adversaire</span>
                  <span class="font-bold text-red-600">${opponentHP}/${maxOpponentHP}</span>
               </div>
            </div>
         </div>
         <div class="flex gap-4">
            <button id="change-card-yes" class="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
               Changer de Pokémon
            </button>
            <button id="change-card-no" class="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium">
               Continuer le combat
            </button>
         </div>
      </div>
      `;

      return modal;
   }

   static showChangeCard(playerHP, maxPlayerHP, opponentHP, maxOpponentHP) {
      const modal = this.createChangeCardModal(playerHP, maxPlayerHP, opponentHP, maxOpponentHP);
      if (modal) {
         NotificationModal.centerModal(modal);
      }
      return modal;
   }
}

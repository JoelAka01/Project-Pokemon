import { NotificationModal } from './NotificationModal.js';

export class GameModal {
   static createChangeCardModal(playerHP, maxPlayerHP, opponentHP, maxOpponentHP) {
      const attackDisplay = document.getElementById('battle-attack-display');
      if (attackDisplay) attackDisplay.remove();

      const modal = document.createElement('div');
      modal.id = 'change-card-modal';
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

      modal.innerHTML = `
         <div class="bg-white rounded-lg p-6 max-w-3xl mx-4">
            <h3 class="text-lg font-bold mb-4">Continuer le combat ?</h3>
            <div class="mb-4 p-3 bg-gray-100 rounded">
               <p class="mb-2">PV actuels :</p>
               <p>Vous: ${playerHP}/${maxPlayerHP}</p>
               <p>Adversaire: ${opponentHP}/${maxOpponentHP}</p>
            </div>
            <div class="flex space-x-3">
               <button id="change-card-yes" class="flex-1 bg-blue-600 text-white p-3 rounded hover:bg-blue-700">
                  Changer de Pokémon
               </button>
               <button id="change-card-no" class="flex-1 bg-green-600 text-white p-3 rounded hover:bg-green-700">
                  Continuer
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

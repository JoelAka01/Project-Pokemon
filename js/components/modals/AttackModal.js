import { NotificationModal } from './NotificationModal.js';

export class AttackModal {



   static create(card, isPlayer = true) {
      if (!card || !card.attacks || card.attacks.length === 0) {
         console.warn("Cette carte n'a pas d'attaques disponibles");
         return null;
      }

      const modal = document.createElement('div');
      modal.id = 'attack-choice-modal';
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

      modal.innerHTML = `
         <div class="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 class="text-lg font-bold mb-4">Choisir une attaque</h3>
            <img src="${card.imageUrl}" alt="${card.name}" class="w-24 h-24 mx-auto mb-4 rounded">
            <div class="space-y-2">
               ${card.attacks.map((attack, index) => `
                  <button class="attack-option w-full p-3 border rounded hover:bg-gray-100"
                          data-attack-index="${index}">
                     <div class="flex justify-between">
                        <span>${attack.name}</span>
                        <span class="font-bold text-red-600">${attack.damage || '0'}</span>
                     </div>
                  </button>
               `).join('')}
            </div>
         </div>
      `;

      return modal;
   }

   static createDisplay({ attacker, defender, attack, damage, isPlayer, message, defenderHP, maxDefenderHP }) {
      const existingDisplay = document.getElementById('battle-attack-display');
      if (existingDisplay) existingDisplay.remove();

      const attackDisplay = document.createElement('div');
      attackDisplay.id = 'battle-attack-display';
      attackDisplay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

      const hpPercentage = Math.max(0, (defenderHP / maxDefenderHP) * 100);
      const bgColor = isPlayer ? 'bg-blue-600' : 'bg-red-600';

      attackDisplay.innerHTML = `
         <div class="bg-white rounded-xl p-8 w-[32rem] mx-4 text-center ${bgColor} text-white shadow-lg">
            <h3 class="text-2xl font-bold mb-6">
               ${isPlayer ? '⚔️ Votre Attaque !' : '🛡️ Attaque Adverse !'}
            </h3>
            <p class="mb-6 text-lg">${message}</p>
            
            <div class="flex justify-around items-center mb-6">
               <div class="text-center">
                  <div class="relative">
                     <img src="${attacker.imageUrl}" alt="${attacker.name}" class="w-20 h-20 rounded-lg mb-3 ring-2 ring-white ring-opacity-50">
                     ${isPlayer ? '<div class="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>' : ''}
                  </div>
                  <p class="text-base font-medium">${attacker.name}</p>
               </div>
               <div class="text-3xl font-bold animate-pulse">⚡</div>
               <div class="text-center">
                  <div class="relative">
                     <img src="${defender.imageUrl}" alt="${defender.name}" class="w-20 h-20 rounded-lg mb-3 ring-2 ring-white ring-opacity-50">
                     ${!isPlayer ? '<div class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white"></div>' : ''}
                  </div>
                  <p class="text-base font-medium">${defender.name}</p>
               </div>
            </div>
            
            ${attack ? `<div class="bg-black bg-opacity-20 rounded-lg p-3 mb-6">
               <p class="font-bold text-yellow-300 text-lg">${attack.name}</p>
            </div>` : ''}
            
            <p class="text-xl font-bold mb-6 text-yellow-300">💥 Dégâts: ${damage}</p>
            
            <div class="bg-black bg-opacity-40 rounded-lg p-5 backdrop-blur-sm">
               <p class="mb-4 font-medium text-lg">${defender.name}: ${defenderHP}/${maxDefenderHP} PV</p>
               <div class="w-full bg-gray-700 rounded-full h-5 overflow-hidden border border-gray-600">
                  <div class="h-full transition-all duration-700 ease-out ${hpPercentage > 60 ? 'bg-green-500' : hpPercentage > 30 ? 'bg-yellow-500' : 'bg-red-500'}" 
                     style="width: ${hpPercentage}%"></div>
               </div>
               ${defenderHP <= 0 ? '<p class="text-red-300 font-bold mt-4 text-xl animate-bounce">💀 KO !</p>' : ''}
            </div>
         </div>
      `;

      return attackDisplay;
   }

   static createOpponentAttackDisplay(attackName, damage) {
      const existingDisplay = document.getElementById('opponent-attack-display');
      if (existingDisplay) existingDisplay.remove();

      const attackDisplay = document.createElement('div');
      attackDisplay.id = 'opponent-attack-display';
      attackDisplay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

      attackDisplay.innerHTML = `
         <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 class="text-xl font-bold mb-4 text-red-600">Attaque de l'adversaire !</h2>
            <div class="text-center space-y-2">
               <div class="text-lg font-semibold">${attackName}</div>
               <div class="text-2xl font-bold text-red-500">${damage} dégâts</div>
            </div>
         </div>
      `;

      return attackDisplay;
   }


   static show(card, isPlayer = true) {
      const modal = this.create(card, isPlayer);
      if (modal) {
         NotificationModal.centerModal(modal);
      }
      return modal;
   }


   static showDisplay(params) {
      const modal = this.createDisplay(params);
      if (modal) {
         NotificationModal.centerModal(modal);

         // Auto-close après 2.5 secondes
         setTimeout(() => {
            if (modal && modal.parentNode) {
               modal.remove();
            }
         }, 2500);
      }
      return modal;
   }


   static showOpponentAttack(attackName, damage) {
      const modal = this.createOpponentAttackDisplay(attackName, damage);
      if (modal) {
         NotificationModal.centerModal(modal);

         // Auto-close après 2.5 secondes
         setTimeout(() => {
            if (modal && modal.parentNode) {
               modal.remove();
            }
         }, 2500);
      }
      return modal;
   }
}

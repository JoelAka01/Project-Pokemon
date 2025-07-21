import { NotificationModal } from './NotificationModal.js';

export class AttackModal {



   static create(card, isPlayer = true) {
      if (!card || !card.attacks || card.attacks.length === 0) {
         console.warn("Cette carte n'a pas d'attaques disponibles");
         return null;
      }

      const modal = document.createElement('div');
      modal.id = 'attack-choice-modal';
      modal.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(4px); animation: fadeIn .3s;
   `;

      modal.innerHTML = `
      <div style="
         background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
         border-radius: 22px; padding: 36px 28px 28px 28px; max-width: 400px; width: 96vw;
         box-shadow: 0 8px 32px #2563eb33, 0 2px 8px #0002;
         border: 2px solid #bae6fd; animation: popIn .4s cubic-bezier(.4,2,.6,1);
         display: flex; flex-direction: column; align-items: center;
      ">
         <h3 style="font-size:1.3rem; font-weight:900; margin: 0 0 18px 0; color:#1e40af; letter-spacing:1px; text-shadow:0 2px 8px #60a5fa55; text-align: center;">
            Choisir une attaque
         </h3>
         
         <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 20px;">
            <img src="${card.imageUrl}" alt="${card.name}" style="
               max-width: 200px; width: 100%; height: auto; border-radius: 12px; margin-bottom: 8px; 
               box-shadow: 0 2px 12px #2563eb22; display: block;
            ">
            <span style="font-weight: 700; color: #1e40af; font-size: 1.1rem; text-align: center;">${card.name}</span>
         </div>
         
         <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 320px;">
            ${card.attacks.map((attack, index) => `
               <button class="attack-option" data-attack-index="${index}"
                  style="
                     width: 100%; padding: 14px 18px; border: none; border-radius: 12px; font-size: 1.08rem; font-weight: 600;
                     background: linear-gradient(90deg, #38bdf8 0%, #2563eb 100%); color: white; 
                     box-shadow: 0 3px 15px #2563eb33;
                     display: flex; align-items: center; justify-content: space-between; 
                     transition: all 0.2s ease; cursor: pointer; letter-spacing: 0.5px;
                     border: 2px solid transparent;
                  "
                  onmouseenter="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px #2563eb44'; this.style.borderColor='#60a5fa';" 
                  onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 15px #2563eb33'; this.style.borderColor='transparent';"
               >
                  <span style="text-align: left; flex: 1;">${attack.name}</span>
                  <span style="font-weight: bold; color: #fbbf24; font-size: 1.15em; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
                     ${attack.damage ? `${attack.damage} ` : '0'}
                  </span>
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

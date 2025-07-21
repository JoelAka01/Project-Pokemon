import { NotificationModal } from './NotificationModal.js';

export class GameModal {
   static createChangeCardModal(playerHP, maxPlayerHP, opponentHP, maxOpponentHP) {
      const attackDisplay = document.getElementById('battle-attack-display');
      if (attackDisplay) attackDisplay.remove();

      const modal = document.createElement('div');
      modal.id = 'change-card-modal';
      modal.style.cssText = `
         position: fixed; inset: 0; z-index: 9999;
         background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center;
         backdrop-filter: blur(4px); animation: fadeIn .3s;
      `;

      modal.innerHTML = `
      <div style="
         background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
         border-radius: 22px; padding: 38px 32px 32px 32px; max-width: 420px; width: 96vw;
         box-shadow: 0 8px 32px #2563eb33, 0 2px 8px #0002;
         border: 2px solid #bae6fd; animation: popIn .4s cubic-bezier(.4,2,.6,1);
         text-align: center;
      ">
         <h3 style="font-size:1.5rem; font-weight:900; margin-bottom: 22px; color:#1e40af; letter-spacing:1px; text-shadow:0 2px 8px #60a5fa55;">Continuer le combat ?</h3>
         <div style="margin-bottom: 28px; padding: 18px; background:rgba(236,245,255,0.85); border-radius:14px; border:1.5px solid #bae6fd; box-shadow:0 2px 12px #3b82f633;">
            <p style="font-size:1rem; font-weight:500; color:#2563eb; margin-bottom:12px;">Points de vie :</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
               <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-weight:600; color:#0ea5e9;">Vous</span>
                  <span style="font-weight:700; color:#2563eb; font-size:1.1em;">${playerHP}/${maxPlayerHP}</span>
               </div>
               <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-weight:600; color:#dc2626;">Adversaire</span>
                  <span style="font-weight:700; color:#dc2626; font-size:1.1em;">${opponentHP}/${maxOpponentHP}</span>
               </div>
            </div>
         </div>
         <div style="display:flex; gap:18px; margin-top:10px;">
            <button id="change-card-yes" style="
               flex:1; background: linear-gradient(90deg,#38bdf8 0%,#2563eb 100%); color:white;
               padding:14px 0; border:none; border-radius:12px; font-size:1.1rem; font-weight:600;
               cursor:pointer; box-shadow:0 2px 12px #2563eb33; transition:0.2s; letter-spacing:1px;
            " onmouseenter="this.style.opacity='0.9'" onmouseleave="this.style.opacity='1'">
               Changer de Pokémon
            </button>
            <button id="change-card-no" style="
               flex:1; background: linear-gradient(90deg,#22c55e 0%,#16a34a 100%); color:white;
               padding:14px 0; border:none; border-radius:12px; font-size:1.1rem; font-weight:600;
               cursor:pointer; box-shadow:0 2px 12px #16a34a33; transition:0.2s; letter-spacing:1px;
            " onmouseenter="this.style.opacity='0.9'" onmouseleave="this.style.opacity='1'">
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

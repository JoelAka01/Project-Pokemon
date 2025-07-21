export class CardModal {
   constructor() {
      this.modal = null;
   }

   showCardModal(card) {
      this.hide();
      this.modal = document.createElement("div");
      this.modal.innerHTML = `
         <div style="
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center;
            z-index: 9999; backdrop-filter: blur(4px); animation: fadeIn .3s;
         ">
            <div style="
               background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
               border-radius: 22px; padding: 28px; 
               text-align: center;
               max-width: 410px; 
               width: 96vw; 
               max-height: 85vh; 
               box-shadow: 0 8px 32px #2563eb33, 0 2px 8px #0002;
               border: 2px solid #bae6fd; 
               animation: popIn .4s cubic-bezier(.4,2,.6,1);
               position: relative;
               display: flex;
               flex-direction: column;
               align-items: center;
            ">
               <button id="close-modal-btn" style="
                  position: absolute; top: 14px; right: 18px;
                  background: linear-gradient(90deg,#f87171 0%,#dc2626 100%); color: white; border: none; border-radius: 50%;
                  width: 34px; height: 34px; cursor: pointer; font-size: 22px; font-weight: bold; box-shadow:0 2px 8px #dc262655; transition:.2s;
               " onmouseenter="this.style.transform='scale(1.15)'" onmouseleave="this.style.transform='scale(1)'">×</button>

               <h2 style="margin: 0 0 18px 0; color: #1e40af; font-size:2rem; font-weight:900; letter-spacing:1px; text-shadow:0 2px 8px #60a5fa55; text-align: center;">${card.name}</h2>

               <img src="${card.imageUrl}" alt="${card.name}" style="
                  max-width: 200px; width: 100%; height: auto; border-radius: 12px; margin-bottom: 18px; box-shadow:0 2px 12px #2563eb22;
                  display: block;
               " onerror="this.style.display='none';">

               <div style="width: 100%; max-width: 350px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 16px; flex-wrap: wrap;">
                     <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-weight: bold; color: #0ea5e9;">HP:</span>
                        <span style="color: #222; font-weight: bold;">${card.hp || 'N/A'}</span>
                     </div>
                     ${card.types && card.types.length > 0 ? `<div style='display: flex; align-items: center; gap: 6px;'><strong style='color: #6366f1;'>Type:</strong> <span style='color: #222;'>${card.types.join(', ')}</span></div>` : ''}
                  </div>
                  ${this.getAttacksHTML(card.attacks)}
                  ${this.getWeaknessesHTML(card.weaknesses)}
               </div>
            </div>
         </div>
      `;

      document.body.appendChild(this.modal);

      const closeBtn = this.modal.querySelector('#close-modal-btn');
      closeBtn.onclick = () => this.hide();

      this.modal.onclick = (e) => {
         if (e.target === this.modal || (this.modal && this.modal.firstChild && e.target === this.modal.firstChild)) {
            this.hide();
         }
      };

      // Fermer avec Escape
      const handleEscape = (e) => {
         if (e.key === 'Escape') {
            this.hide();
            document.removeEventListener('keydown', handleEscape);
         }
      };
      document.addEventListener('keydown', handleEscape);
   }

   // Méthode pour compatibilité avec Hand.js (inutile ici, plus d'emoji)
   getTypeIcon(type) {
      return '';
   }

   getAttacksHTML(attacks) {
      if (!attacks || attacks.length === 0) return '';
      let html = `<div style="margin-top: 16px; text-align: left;">
         <strong style='color: #2563eb; display: block; margin-bottom: 8px;'>Attaques:</strong>`;
      
      attacks.forEach(attack => {
         html += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 6px 12px; background: rgba(37, 99, 235, 0.08); border-radius: 8px;">
            <span style='font-weight: bold; color: #222;'>${attack.name}</span>
            ${attack.damage && attack.damage !== "0" ? `<span style='color: #f59e42; font-weight: bold;'>${attack.damage} dégâts</span>` : '<span style="color: #666;">-</span>'}
         </div>`;
      });
      html += '</div>';
      return html;
   }

   getWeaknessesHTML(weaknesses) {
      if (!weaknesses || weaknesses.length === 0) return '';
      let html = `<div style="margin-top: 16px; text-align: left;">
         <strong style='color: #dc2626; display: block; margin-bottom: 8px;'>Faiblesses:</strong>
         <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; background: rgba(220, 38, 38, 0.08); border-radius: 8px;">`;
      
      const weaknessText = weaknesses.map(w => `${w.type} ${w.value}`).join(', ');
      html += `<span style='color: #991b1b; font-weight: 500;'>${weaknessText}</span>
         </div>
      </div>`;
      return html;
   }

   hide() {
      if (this.modal && this.modal.parentNode) {
         this.modal.parentNode.removeChild(this.modal);
         this.modal = null;
      }
   }
}
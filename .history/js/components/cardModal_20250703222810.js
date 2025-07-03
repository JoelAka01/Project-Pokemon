export class CardModal 
{
   constructor() {
      this.modal = null;
   }

   showCardModal(card) {

      this.hide();

      // Créer le modal directement
      this.modal = document.createElement("div");
      this.modal.innerHTML = `
         <div style="
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;
            z-index: 9999;
         ">
            <div style="
               background: white; padding: 20px; border-radius: 10px; text-align: center;
               max-width: 500px; max-height: 80vh; overflow-y: auto;
               position: relative;
            ">
               <button id="close-modal-btn" style="
                  position: absolute; top: 10px; right: 15px;
                  background: #dc2626; color: white; border: none; border-radius: 50%;
                  width: 30px; height: 30px; cursor: pointer; font-size: 18px;
               ">×</button>
               
               <h2 style="margin: 0 0 15px 0; color: #333;">${card.name}</h2>
               
               <img src="${card.imageUrl}" alt="${card.name}" style="
                  max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 15px;
               " onerror="this.style.display='none';">
               
               <div style="text-align: left;">
                  <p><strong>HP:</strong> ${card.hp || 'N/A'}</p>
                  ${card.types ? `<p><strong>Type:</strong> ${card.types.join(', ')}</p>` : ''}
                  ${this.getAttacksHTML(card.attacks)}
                  ${this.getWeaknessesHTML(card.weaknesses)}
               </div>
            </div>
         </div>
      `;

      // Ajouter au DOM
      document.body.appendChild(this.modal);

      // Événements de fermeture
      const closeBtn = this.modal.querySelector('#close-modal-btn');
      closeBtn.onclick = () => this.hide();

      // Fermer en cliquant sur l'arrière-plan
      this.modal.onclick = (e) => {
         if (e.target === this.modal || (this.modal.firstChild && e.target === this.modal.firstChild)) {
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

      console.log("🎴 Modal de carte affiché pour:", card.name);
   }

   // Méthode pour compatibilité avec Hand.js
   getTypeIcon(type) {
      const icons = {
         Fire: "🔥", Water: "💧", Grass: "🌿", Electric: "⚡",
         Psychic: "🔮", Fighting: "👊", Darkness: "🌑", Metal: "⚙️",
         Fairy: "✨", Dragon: "🐉", Colorless: "⭐"
      };
      return icons[type] || "❓";
   }

   getAttacksHTML(attacks) {
      if (!attacks || attacks.length === 0) return '';

      let html = '<div style="margin-top: 15px;"><strong>Attaques:</strong><ul>';
      attacks.forEach(attack => {
         html += `<li>${attack.name}${attack.damage ? ` - ${attack.damage} dégâts` : ''}</li>`;
      });
      html += '</ul></div>';
      return html;
   }

   getWeaknessesHTML(weaknesses) {
      if (!weaknesses || weaknesses.length === 0) return '';

      let html = '<div style="margin-top: 10px;"><strong>Faiblesses:</strong> ';
      html += weaknesses.map(w => `${w.type} ${w.value}`).join(', ');
      html += '</div>';
      return html;
   }

   hide() {
      if (this.modal && this.modal.parentNode) {
         this.modal.parentNode.removeChild(this.modal);
         this.modal = null;
      }
   }
}

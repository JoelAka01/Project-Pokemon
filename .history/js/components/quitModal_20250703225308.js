export class QuitModal {
   constructor() {
      this.modal = null;
   }

   show(onConfirm, onCancel = null) {
      this.hide(); // Nettoyer l'ancien modal s'il existe

      // Créer le modal
      this.modal = document.createElement("div");
      this.modal.innerHTML = `
         <div style="
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center;
            z-index: 9999;
         ">
            <div style="
               background: white; padding: 30px; border-radius: 10px; text-align: center;
               max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            ">
               <h2 style="margin: 0 0 20px 0; color: #dc2626;">🚪 Quitter le jeu</h2>
               <p style="margin-bottom: 20px; color: #666;">
                  Êtes-vous sûr de vouloir quitter ?<br>
                  <small>Toutes les données seront supprimées.</small>
               </p>
               <div style="display: flex; gap: 10px;">
                  <button id="cancel-quit" style="
                     flex: 1; padding: 10px; border: none; background: #ccc; 
                     border-radius: 5px; cursor: pointer;
                  ">Annuler</button>
                  <button id="confirm-quit" style="
                     flex: 1; padding: 10px; border: none; background: #dc2626; color: white;
                     border-radius: 5px; cursor: pointer;
                  ">Confirmer</button>
               </div>
            </div>
         </div>
      `;

      // Ajouter au DOM
      document.body.appendChild(this.modal);

      // Événements
      const cancelBtn = this.modal.querySelector('#cancel-quit');
      const confirmBtn = this.modal.querySelector('#confirm-quit');

      if (cancelBtn) {
         cancelBtn.onclick = () => {
            this.hide();
            if (onCancel) onCancel();
         };
      }

      if (confirmBtn) {
         confirmBtn.onclick = () => {
            this.hide();
            if (onConfirm) onConfirm();
         };
      }

      // Fermer avec Escape ou clic extérieur
      const handleEscape = (e) => {
         if (e.key === 'Escape') {
            this.hide();
            document.removeEventListener('keydown', handleEscape);
            if (onCancel) onCancel();
         }
      };
      document.addEventListener('keydown', handleEscape);

      this.modal.onclick = (e) => {
         if (e.target === this.modal || (this.modal && this.modal.firstChild && e.target === this.modal.firstChild)) {
            this.hide();
            if (onCancel) onCancel();
         }
      };
   }

   hide() {
      if (this.modal && this.modal.parentNode) {
         this.modal.parentNode.removeChild(this.modal);
         this.modal = null;
      }
   }

   destroy() {
      this.hide();
   }
}

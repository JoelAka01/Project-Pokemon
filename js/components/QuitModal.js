export class QuitModal {
   
   constructor() {
      this.modal = null;
      this.onConfirm = null;
      this.onCancel = null;
   }

   /**
    * Affiche la modal de confirmation pour quitter le jeu
    * @param {Function} onConfirm - Callback appelé lors de la confirmation
    * @param {Function} onCancel - Callback appelé lors de l'annulation (optionnel)
    */
   show(onConfirm, onCancel = null) {
      this.onConfirm = onConfirm;
      this.onCancel = onCancel;

      // Supprimer une éventuelle modal existante
      this.hide();

      // Créer la modal de confirmation
      this.modal = document.createElement("div");
      this.modal.id = "quit-confirmation-modal";
      this.modal.className = "fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50";

      this.modal.innerHTML = `
         <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-95 hover:scale-100">
            <!-- Header -->
            <div class="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-t-xl">
               <div class="flex items-center justify-center">
                  <div class="text-3xl mr-3">🚪</div>
                  <h2 class="text-xl font-bold">Quitter le jeu</h2>
               </div>
            </div>
            
            <!-- Body -->
            <div class="p-6 text-center">
               <div class="text-4xl mb-4">⚠️</div>
               <h3 class="text-lg font-semibold text-gray-800 mb-3">
                  Êtes-vous sûr de vouloir quitter ?
               </h3>
               <p class="text-gray-600 mb-2">
                  Cette action va supprimer :
               </p>
               <ul class="text-sm text-gray-500 mb-4 space-y-1">
                  <li>• Votre progression actuelle</li>
                  <li>• Toutes les données sauvegardées</li>
                  <li>• L'état de la partie en cours</li>
               </ul>
               <p class="text-red-600 font-medium text-sm">
                  Cette action est irréversible !
               </p>
            </div>
            
            <!-- Footer -->
            <div class="flex gap-3 p-4 bg-gray-50 rounded-b-xl">
               <button id="cancel-quit" 
                       class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-105">
                  🔙 Annuler
               </button>
               <button id="confirm-quit" 
                       class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-105">
                  ✅ Confirmer
               </button>
            </div>
         </div>
      `;

      // Animation d'entrée
      this.modal.style.opacity = "0";
      document.body.appendChild(this.modal);

      // Déclencher l'animation
      setTimeout(() => {
         this.modal.style.opacity = "1";
         this.modal.querySelector('.bg-white').style.transform = "scale(1)";
      }, 10);

      // Attacher les événements
      this.attachEvents();
   }

   /**
    * Attache les événements à la modal
    */
   attachEvents() {
      if (!this.modal) return;

      const cancelBtn = this.modal.querySelector('#cancel-quit');
      const confirmBtn = this.modal.querySelector('#confirm-quit');

      // Bouton Annuler
      cancelBtn.onclick = () => {
         this.handleCancel();
      };

      // Bouton Confirmer
      confirmBtn.onclick = () => {
         this.handleConfirm();
      };

      // Fermer avec Escape
      this.handleEscape = (e) => {
         if (e.key === 'Escape') {
            this.handleCancel();
         }
      };
      document.addEventListener('keydown', this.handleEscape);

      // Fermer en cliquant à l'extérieur
      this.modal.onclick = (e) => {
         if (e.target === this.modal) {
            this.handleCancel();
         }
      };
   }

   /**
    * Gère l'annulation
    */
   handleCancel() {
      this.hide();
      if (this.onCancel && typeof this.onCancel === 'function') {
         this.onCancel();
      }
   }

   /**
    * Gère la confirmation
    */
   handleConfirm() {
      this.hide();
      // Attendre que la modal se ferme avant d'exécuter la confirmation
      setTimeout(() => {
         if (this.onConfirm && typeof this.onConfirm === 'function') {
            this.onConfirm();
         }
      }, 300);
   }

   /**
    * Cache et supprime la modal avec animation
    */
   hide() {
      if (!this.modal) return;

      // Supprimer l'événement Escape
      if (this.handleEscape) {
         document.removeEventListener('keydown', this.handleEscape);
         this.handleEscape = null;
      }

      // Animation de sortie
      this.modal.style.opacity = "0";
      const whiteDiv = this.modal.querySelector('.bg-white');
      if (whiteDiv) {
         whiteDiv.style.transform = "scale(0.95)";
      }

      // Supprimer la modal après l'animation
      setTimeout(() => {
         if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
         }
         this.modal = null;
         this.onConfirm = null;
         this.onCancel = null;
      }, 300);
   }

   /**
    * Vérifie si la modal est actuellement affichée
    * @returns {boolean}
    */
   isVisible() {
      return this.modal !== null && document.body.contains(this.modal);
   }

   /**
    * Nettoie complètement le composant
    */
   destroy() {
      this.hide();
   }
}

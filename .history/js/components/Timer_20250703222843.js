export class Timer {
   constructor(timerElement, game) {
      this.timerElement = timerElement;
      this.game = game;

      // État du timer
      this.timeLeft = 0;
      this.timerId = null;
      this.isRunning = false;
      this.defaultDuration = 300; // 5 minutes en secondes

      // Callbacks
      this.onTimerExpired = null;
      this.onTimerTick = null;
   }

   /**
    * Démarre le timer avec une durée spécifiée
    * @param {number} duration - Durée en secondes (optionnel, utilise la durée par défaut)
    * @param {number} resumeTime - Temps restant pour reprendre un timer (optionnel)
    */
   start(duration = null, resumeTime = null) {
      // Arrêter le timer existant s'il y en a un
      this.stop();

      // Déterminer le temps de départ
      if (resumeTime !== null && resumeTime > 0) {
         this.timeLeft = resumeTime;
      } else if (duration !== null) {
         this.timeLeft = duration;
      } else {
         this.timeLeft = this.defaultDuration;
      }

      this.isRunning = true;

      // Afficher immédiatement le timer
      this.updateDisplay();

      // Démarrer le countdown
      this.timerId = setInterval(() => {
         this.tick();
      }, 1000);

      console.log(`Timer démarré avec ${this.timeLeft} secondes`);
   }

   /**
    * Arrête le timer
    */
   stop() {
      if (this.timerId) {
         clearInterval(this.timerId);
         this.timerId = null;
      }
      this.isRunning = false;
   }

   /**
    * Met en pause le timer
    */
   pause() {
      if (this.timerId) {
         clearInterval(this.timerId);
         this.timerId = null;
      }
      this.isRunning = false;
   }

   /**
    * Reprend le timer après une pause
    */
   resume() {
      if (!this.isRunning && this.timeLeft > 0) {
         this.start(null, this.timeLeft);
      }
   }

   /**
    * Remet le timer à zéro
    */
   reset() {
      this.stop();
      this.timeLeft = 0;
      this.updateDisplay();
   }

   /**
    * Gère un tick du timer (appelé chaque seconde)
    */
   tick() {
      this.timeLeft--;
      this.updateDisplay();

      // Callback pour chaque tick
      if (this.onTimerTick) {
         this.onTimerTick(this.timeLeft);
      }

      // Vérifier si le timer est expiré
      if (this.timeLeft <= 0) {
         this.handleExpiration();
      }
   }

   /**
    * Gère l'expiration du timer
    */
   handleExpiration() {
      this.stop();
      this.timeLeft = 0;
      this.updateDisplay();

      console.log("Timer expiré!");

      // Callback d'expiration
      if (this.onTimerExpired) {
         this.onTimerExpired();
      }

      // Afficher le message de timer expiré
      this.showExpirationMessage();
   }

   /**
    * Met à jour l'affichage du timer
    */
   updateDisplay() {
      if (!this.timerElement) {
         return;
      }

      if (this.timeLeft <= 0) {
         this.timerElement.textContent = "Tu peux tirer une carte !";
         this.timerElement.className = "text-green-600 font-bold animate-pulse";
      } else {
         const minutes = Math.floor(this.timeLeft / 60);
         const seconds = this.timeLeft % 60;
         const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

         this.timerElement.textContent = `Prochaine carte dans: ${timeString}`;

         // Changer la couleur selon le temps restant
         if (this.timeLeft <= 30) {
            this.timerElement.className = "text-red-600 font-bold animate-pulse";
         } else if (this.timeLeft <= 60) {
            this.timerElement.className = "text-orange-600 font-bold";
         } else {
            this.timerElement.className = "text-blue-600";
         }
      }
   }

   /**
    * Affiche un message d'expiration du timer
    */
   showExpirationMessage() {
      const message = document.createElement("div");
      message.className = "fixed top-1/4 left-1/2 transform -translate-x-1/2 bg-green-600/90 text-white py-3 px-6 rounded-lg shadow-lg z-50 text-center border-2 border-green-400";
      message.innerHTML = `
         <div class="flex items-center justify-center mb-2">
            <span class="text-2xl mr-2">⏰</span>
            <strong>Timer expiré!</strong>
         </div>
         <p>Tu peux maintenant tirer une nouvelle carte!</p>
      `;

      document.body.appendChild(message);

      // Animation d'entrée
      message.style.opacity = "0";
      message.style.transform = "translate(-50%, -20px) scale(0.8)";

      setTimeout(() => {
         message.style.transition = "all 0.3s ease-out";
         message.style.opacity = "1";
         message.style.transform = "translate(-50%, 0) scale(1)";
      }, 50);

      // Auto-suppression après 3 secondes
      setTimeout(() => {
         message.style.opacity = "0";
         message.style.transform = "translate(-50%, 20px) scale(0.8)";
         setTimeout(() => {
            if (message.parentNode) {
               message.parentNode.removeChild(message);
            }
         }, 300);
      }, 3000);
   }

   /**
    * Définit le callback appelé quand le timer expire
    * @param {Function} callback - La fonction à appeler
    */
   setOnExpired(callback) {
      this.onTimerExpired = callback;
   }

   /**
    * Définit le callback appelé à chaque tick
    * @param {Function} callback - La fonction à appeler avec le temps restant
    */
   setOnTick(callback) {
      this.onTimerTick = callback;
   }

   /**
    * Retourne le temps restant
    * @returns {number} - Temps restant en secondes
    */
   getTimeLeft() {
      return this.timeLeft;
   }

   /**
    * Vérifie si le timer est en cours d'exécution
    * @returns {boolean} - True si le timer est actif
    */
   isActive() {
      return this.isRunning;
   }

   /**
    * Vérifie si le timer est expiré
    * @returns {boolean} - True si le timer est expiré
    */
   isExpired() {
      return this.timeLeft <= 0 && !this.isRunning;
   }

   /**
    * Définit une nouvelle durée par défaut
    * @param {number} duration - Nouvelle durée en secondes
    */
   setDefaultDuration(duration) {
      this.defaultDuration = duration;
   }

   /**
    * Retourne la durée par défaut
    * @returns {number} - Durée par défaut en secondes
    */
   getDefaultDuration() {
      return this.defaultDuration;
   }

   /**
    * Ajoute du temps au timer
    * @param {number} seconds - Nombre de secondes à ajouter
    */
   addTime(seconds) {
      this.timeLeft += seconds;
      this.updateDisplay();
      console.log(`${seconds} secondes ajoutées au timer`);
   }

   /**
    * Retire du temps au timer
    * @param {number} seconds - Nombre de secondes à retirer
    */
   removeTime(seconds) {
      this.timeLeft = Math.max(0, this.timeLeft - seconds);
      this.updateDisplay();

      if (this.timeLeft <= 0) {
         this.handleExpiration();
      }

      console.log(`${seconds} secondes retirées du timer`);
   }

   /**
    * Force l'expiration du timer
    */
   forceExpire() {
      this.timeLeft = 0;
      this.handleExpiration();
   }

   /**
    * Retourne l'état complet du timer pour la sauvegarde
    * @returns {Object} - État du timer
    */
   getState() {
      return {
         timeLeft: this.timeLeft,
         isRunning: this.isRunning,
         defaultDuration: this.defaultDuration
      };
   }

   /**
    * Restaure l'état du timer depuis une sauvegarde
    * @param {Object} state - État du timer à restaurer
    */
   setState(state) {
      this.timeLeft = state.timeLeft || 0;
      this.defaultDuration = state.defaultDuration || 300;

      if (state.isRunning && this.timeLeft > 0) {
         this.start(null, this.timeLeft);
      } else {
         this.updateDisplay();
      }
   }

   /**
    * Nettoie le composant (arrête le timer et supprime les références)
    */
   destroy() {
      this.stop();
      this.onTimerExpired = null;
      this.onTimerTick = null;
      this.timerElement = null;
      this.game = null;
   }
}

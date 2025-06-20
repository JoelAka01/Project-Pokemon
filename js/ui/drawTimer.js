// Gestionnaire du timer pour le tirage des cartes
export class DrawTimer {
   constructor() {
      this.drawCooldown = 5 * 60; // 5 minutes en secondes
      this.timeLeft = 0;
      this.drawTimerElement = document.getElementById("draw-timer");
      this.canDraw = true;  // Indique si on peut tirer une carte
      this.drawTimerId = null;
   }

   updateTimerDisplay() {
      const minutes = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
      const seconds = (this.timeLeft % 60).toString().padStart(2, '0');
      this.drawTimerElement.textContent = `Prochain tirage dans : ${minutes}:${seconds}`;
   }

   startDrawTimer() {
      const timerDisplay = document.getElementById("timer-display");
      let remainingTime = 300; // secondes

      // Affiche le timer dès le début
      if (timerDisplay) {
         timerDisplay.textContent = `Prochaine carte dans: 5:00`;
      }

      // Nettoie un éventuel timer précédent
      if (this.drawTimerId) {
         clearInterval(this.drawTimerId);
      }

      this.drawTimerId = setInterval(() => {
         remainingTime--;

         if (timerDisplay) {
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            timerDisplay.textContent = `Prochaine carte dans: ${minutes}:${seconds.toString().padStart(2, '0')}`;
         }

         if (remainingTime <= 0) {
            clearInterval(this.drawTimerId);
            this.canDraw = true;
            if (timerDisplay) {
               timerDisplay.textContent = "Tu peux tirer une carte !";
            }
         }
      }, 1000);
   }

   canDrawCard() {
      return this.canDraw;
   }

   disableDrawing() {
      this.canDraw = false;
   }

   enableDrawing() {
      this.canDraw = true;
   }

   resetTimer() {
      if (this.drawTimerId) {
         clearInterval(this.drawTimerId);
      }
      this.canDraw = true;
   }
}

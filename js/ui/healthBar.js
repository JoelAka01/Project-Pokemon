/**
 * Classe pour gérer l'affichage et l'animation de la barre de vie des Pokémon
 */
export class HealthBar {
   /**
    * Met à jour la barre de vie d'une carte active
    * @param {HTMLElement} container - Le conteneur de la carte active
    * @param {Object} card - L'objet carte Pokémon
    * @param {boolean} animate - Activer l'animation de transition
    */
   static updateHealthBar(container, card) {
      if (!container || !card) return;

      const maxHp = parseInt(card.hp) || 0;
      const currentHp = card.currentHp !== undefined ? card.currentHp : maxHp;
      const percentage = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

      // Chercher la barre de vie existante
      const hpBarContainer = container.querySelector(".hp-bar-container");
      const hpBar = container.querySelector(".hp-bar");
      const hpText = container.querySelector(".hp-text");

      if (hpBar) {
         // Mettre à jour la largeur de la barre
         hpBar.style.width = `${percentage}%`;

         // Mettre à jour la classe de couleur
         hpBar.className = `hp-bar ${percentage > 70 ? 'high' : percentage > 30 ? 'medium' : 'low'}`;

         // Animation pour les dégâts
         if (percentage < 100) {
            hpBar.classList.add('animate-pulse');
            setTimeout(() => {
               hpBar.classList.remove('animate-pulse');
            }, 500);
         }
      }

      if (hpText) {
         // Mettre à jour le texte des HP
         hpText.textContent = `${currentHp}/${maxHp} HP`;
      }

      // Mettre à jour le texte HP sous la carte active
      const hpDisplay = container.id === "player-active" ?
         document.getElementById("player-hp") :
         document.getElementById("opponent-hp");

      if (hpDisplay) {
         hpDisplay.textContent = `${currentHp} / ${maxHp} HP`;

         // Ajouter une animation pour les changements de HP
         hpDisplay.classList.add('animate-pulse');
         setTimeout(() => {
            hpDisplay.classList.remove('animate-pulse');
         }, 500);

         // Changer la couleur en fonction du niveau de santé
         if (percentage > 70) {
            hpDisplay.className = "font-mono text-sm mt-2 bg-green-600/80 text-white px-3 py-1 rounded-full inline-block";
         } else if (percentage > 30) {
            hpDisplay.className = "font-mono text-sm mt-2 bg-yellow-600/80 text-white px-3 py-1 rounded-full inline-block";
         } else {
            hpDisplay.className = "font-mono text-sm mt-2 bg-red-600/80 text-white px-3 py-1 rounded-full inline-block";
         }
      }
   }
}

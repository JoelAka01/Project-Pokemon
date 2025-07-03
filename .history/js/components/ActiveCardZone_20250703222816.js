export class ActiveCardZone 
{
   constructor(container, cardModal = null, isPlayerZone = false) {
      this.container = container;
      this.cardModal = cardModal;
      this.activeCard = null;
      this.isPlayerZone = isPlayerZone;

      // Forcer le rendu initial du placeholder seulement pour la zone du joueur
      if (this.isPlayerZone) {
         setTimeout(() => {
            this.render();
         }, 100);
      }
   }

   clear() {
      this.container.innerHTML = '';
   }

   setActiveCard(card) {
      this.activeCard = card;
      this.render();
   }

   getActiveCard() {
      return this.activeCard;
   }

   removeActiveCard() {
      const card = this.activeCard;
      this.activeCard = null;
      this.render();
      return card;
   }

   hasActiveCard() {
      return this.activeCard !== null;
   }

   render() {
      this.clear();

      if (!this.activeCard) {
         // Afficher le placeholder seulement pour la zone du joueur
         if (this.isPlayerZone) {
            this.renderPlaceholder();
         }
         return;
      }

      this.renderActiveCard();
   }


   renderPlaceholder() {

      const placeholder = document.createElement("div");
      placeholder.style.cssText = `
         min-height: 200px;
         width: 150px;
         border: 2px dashed #10b981;
         border-radius: 8px;
         display: flex;
         flex-direction: column;
         align-items: center;
         justify-content: center;
         background: rgba(34, 197, 94, 0.1);
         box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
         backdrop-filter: blur(2px);
         transition: all 0.3s ease;
      `;
      placeholder.innerHTML = `
         <div style="font-size: 2rem; color: #10b981; margin-bottom: 8px;">⬇️</div>
         <p style="text-align: center; color: #fbbf24; font-weight: bold; font-size: 0.875rem;">Déposez votre carte ici</p>
      `;
      this.container.appendChild(placeholder);
      console.log("✅ Placeholder ajouté au container:", this.container);
   }

   renderActiveCard() {
      const card = this.activeCard;
      const wrapper = document.createElement("div");
      wrapper.className = "relative";

      // Image de la carte
      const cardImg = document.createElement("img");
      cardImg.src = card.imageUrl;
      cardImg.alt = card.name;
      cardImg.className = "w-full h-auto rounded-lg shadow-xl transition-all duration-300";

      if (this.cardModal) {
         cardImg.addEventListener("click", () => this.cardModal.showCardModal(card));
      }

      wrapper.appendChild(cardImg);
      this.container.appendChild(wrapper);
   }
}

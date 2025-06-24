export class ActiveCardZone {
   
   constructor(container, cardModal = null) {
      this.container = container;
      this.cardModal = cardModal;
      this.activeCard = null;
   }


   // Nettoie le conteneur
   clear() {
      while (this.container.firstChild) {
         this.container.removeChild(this.container.firstChild);
      }
   }


   // Définit la carte active
   setActiveCard(card) {
      this.activeCard = card;
      this.render();
   }


   // Obtient la carte active
   getActiveCard() {
      return this.activeCard;
   }


   // Retire la carte active
   removeActiveCard() {
      const card = this.activeCard;
      this.activeCard = null;
      this.render();
      return card;
   }


   // Vérifie s'il y a une carte active
   hasActiveCard() {
      return this.activeCard !== null;
   }

   
   // Rend la zone de carte active
   render() {
      this.clear();

      if (!this.activeCard) {
         this._renderPlaceholder();
         return;
      }

      this._renderActiveCard();
   }


   // Rend le placeholder quand aucune carte n'est active
   _renderPlaceholder() {
      const placeholderWrapper = document.createElement("div");
      placeholderWrapper.className = "flex flex-col items-center justify-center h-full w-full bg-gradient-to-r from-gray-700/20 to-gray-900/20 rounded-lg border-2 border-dashed border-yellow-500 animate-pulse";

      const placeholderIcon = document.createElement("div");
      placeholderIcon.className = "mb-2 text-4xl text-yellow-500";
      placeholderIcon.innerHTML = "⬇️";
      placeholderWrapper.appendChild(placeholderIcon);

      const placeholder = document.createElement("p");
      placeholder.textContent = "Déposez une carte ici";
      placeholder.className = "text-center text-yellow-400 font-bold";
      placeholderWrapper.appendChild(placeholder);

      this.container.appendChild(placeholderWrapper);
   }


   // Rend la carte active
   _renderActiveCard() {
      const card = this.activeCard;

      // Créer un wrapper pour la carte active avec un halo d'énergie
      const activeCardWrapper = document.createElement("div");
      activeCardWrapper.className = "relative";

      // Ajouter un effet de halo autour de la carte active
      const halo = document.createElement("div");
      const primaryType = card.types && card.types.length > 0 ? card.types[0] : "Colorless";

      if (this.cardModal && this.cardModal.getTypeGradient) {
         const typeGradient = this.cardModal.getTypeGradient(primaryType).replace("bg-gradient-to-r", "bg-gradient-to-r opacity-70");
         halo.className = `absolute -inset-2 ${typeGradient} rounded-lg blur-md`;
      } else {
         halo.className = "absolute -inset-2 bg-gradient-to-r from-blue-500 to-purple-500 opacity-70 rounded-lg blur-md";
      }

      activeCardWrapper.appendChild(halo);

      // Créer l'image de la carte
      const cardImg = document.createElement("img");
      cardImg.src = card.imageUrl;
      cardImg.alt = card.name;
      cardImg.className = "relative w-full h-auto rounded-lg shadow-xl pokemon-card transition-all duration-300";

      if (this.cardModal) {
         cardImg.addEventListener("click", () => this.cardModal.showCardModal(card));
      }

      // Ajouter un indicateur HP bien visible
      const hpIndicator = document.createElement("div");
      const hpValue = parseInt(card.hp) || 0;
      hpIndicator.className = "absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-600 to-red-800 text-white px-4 py-1 rounded-full border-2 border-white shadow-lg font-bold";
      hpIndicator.textContent = `${hpValue} HP`;

      // Ajouter une indication visuelle que c'est la carte active
      const activeIndicator = document.createElement("div");
      activeIndicator.className = "absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg";
      activeIndicator.innerHTML = "✓";

      // Ajouter un badge pour les types si disponibles
      if (card.types && card.types.length > 0) {
         const typeIndicator = document.createElement("div");
         typeIndicator.className = `absolute -top-2 -right-2 w-8 h-8 rounded-full type-${primaryType} border-2 border-white shadow-lg flex items-center justify-center text-xs text-white font-bold`;

         if (this.cardModal && this.cardModal.getTypeIcon) {
            typeIndicator.innerHTML = this.cardModal.getTypeIcon(primaryType);
         } else {
            typeIndicator.textContent = primaryType.substring(0, 1).toUpperCase();
         }

         typeIndicator.setAttribute("title", `Type: ${primaryType}`);
         activeCardWrapper.appendChild(typeIndicator);

         // Si plusieurs types, afficher un deuxième badge
         if (card.types.length > 1) {
            const secondTypeIndicator = document.createElement("div");
            const secondaryType = card.types[1];
            secondTypeIndicator.className = `absolute -top-2 -left-2 w-8 h-8 rounded-full type-${secondaryType} border-2 border-white shadow-lg flex items-center justify-center text-xs text-white font-bold`;

            if (this.cardModal && this.cardModal.getTypeIcon) {
               secondTypeIndicator.innerHTML = this.cardModal.getTypeIcon(secondaryType);
            } else {
               secondTypeIndicator.textContent = secondaryType.substring(0, 1).toUpperCase();
            }

            secondTypeIndicator.setAttribute("title", `Type secondaire: ${secondaryType}`);
            activeCardWrapper.appendChild(secondTypeIndicator);
         }
      }

      // Assembler les éléments
      activeCardWrapper.appendChild(cardImg);
      activeCardWrapper.appendChild(hpIndicator);
      activeCardWrapper.appendChild(activeIndicator);

      // Ajouter un nom de carte visible
      const nameTag = document.createElement("div");
      nameTag.className = "absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-800 text-white px-2 py-0.5 rounded text-xs font-bold truncate max-w-[90%] shadow-md";
      nameTag.textContent = card.name;
      activeCardWrapper.appendChild(nameTag);

      this.container.appendChild(activeCardWrapper);
   }


   // Met à jour l'affichage HP
   updateHPDisplay(hpDisplayElement) {
      if (this.activeCard && hpDisplayElement) {
         const hpValue = parseInt(this.activeCard.hp) || 0;
         hpDisplayElement.textContent = `${hpValue} / ${hpValue} HP`;
      }
   }


   // Animation pour l'ajout d'une carte
   animateCardPlacement() {
      this.container.style.transform = "scale(1.1)";
      this.container.style.transition = "transform 0.3s ease";

      setTimeout(() => {
         this.container.style.transform = "scale(1)";
      }, 300);
   }
}

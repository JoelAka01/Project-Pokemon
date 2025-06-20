// Gestionnaire du rendu des cartes, decks et zones de jeu
export class GameRenderer {
   constructor() {
      // Conserver les références aux éléments DOM importants
   }

   // Rendre un deck (joueur ou adversaire)
   renderDeck(container, deck, dragHandler = null) {
      // Nettoyer le conteneur de manière sécurisée
      while (container.firstChild) {
         container.removeChild(container.firstChild);
      }

      // Wrapper pour le deck pour un meilleur positionnement
      const deckWrapper = document.createElement("div");
      deckWrapper.className = "relative mb-8 mt-2"; // Ajout d'une marge en bas pour l'indicateur

      // Créer l'image du dos de la carte
      const cardBack = document.createElement("img");
      cardBack.src = "img/back-card.jpg"; // Chemin relatif
      cardBack.alt = "Dos de carte Pokémon";
      cardBack.className = "w-40 h-auto rounded-lg shadow-xl cursor-pointer transition-all duration-300 hover:scale-110 hover:-translate-y-2 pokemon-card";
      cardBack.id = "deck-card";
      cardBack.setAttribute("draggable", "true");

      // Ajouter le gestionnaire d'événements drag si fourni
      if (dragHandler) {
         cardBack.addEventListener("dragstart", dragHandler);
      }

      deckWrapper.appendChild(cardBack);

      // Ajouter un indicateur visuel du nombre de cartes plus visible
      const counter = document.createElement("div");
      counter.className = "mt-2 flex items-center justify-center";

      const cardIcon = document.createElement("div");
      cardIcon.className = "mr-1 text-xl";
      cardIcon.innerHTML = "🃏"; // Icône carte
      counter.appendChild(cardIcon);

      const label = document.createElement("p");
      label.textContent = `${deck.length} carte${deck.length > 1 ? 's' : ''}`;
      label.className = "text-white font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 rounded-full px-3 py-1 shadow-md";
      counter.appendChild(label);

      // Ajouter également un badge sur la carte pour une indication rapide
      const quickBadge = document.createElement("div");
      quickBadge.className = "absolute -top-3 -right-3 w-10 h-10 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center text-lg font-bold text-white";
      quickBadge.textContent = deck.length.toString();
      deckWrapper.appendChild(quickBadge);

      // Ajouter le wrapper et le compteur au conteneur
      container.appendChild(deckWrapper);
      container.appendChild(counter);
   }

   // Rendre les cartes de la main du joueur
   renderPlayerHand(handContainer, playerHand, showCardModal) {
      // Nettoyer le conteneur de la main de manière sécurisée
      while (handContainer.firstChild) {
         handContainer.removeChild(handContainer.firstChild);
      }

      // Rendre chaque carte dans la main du joueur
      playerHand.cards.forEach((cardObj, index) => {
         // Créer un wrapper pour la carte
         const cardWrapper = document.createElement("div");
         cardWrapper.className = "card-container relative";

         // Créer l'élément image de la carte
         const card = document.createElement("img");
         card.src = cardObj.imageUrl;
         card.alt = cardObj.name || "Carte Pokémon";
         card.id = `hand-card-${index}`;
         card.className = "w-40 h-auto rounded-lg shadow cursor-pointer pokemon-card transition-all duration-300";

         // Ajouter les événements
         card.addEventListener("click", () => showCardModal(cardObj));
         card.setAttribute("draggable", "true");
         card.addEventListener("dragstart", (ev) => {
            ev.dataTransfer.setData("text/plain", `hand-card-${index}`);
            // Ajouter une classe pour indiquer que la carte est en cours de glisser
            card.classList.add("dragging");
         });

         // Ajouter un événement pour retirer la classe quand le drag se termine
         card.addEventListener("dragend", () => {
            card.classList.remove("dragging");
         });

         // Ajouter un badge pour les types de carte si disponibles
         if (cardObj.types && cardObj.types.length > 0) {
            const typeIndicator = document.createElement("span");
            const primaryType = cardObj.types[0];
            typeIndicator.className = `absolute -top-2 -right-2 w-8 h-8 rounded-full type-${primaryType} border-2 border-white shadow-lg flex items-center justify-center text-xs text-white font-bold`;

            // Utiliser les icônes de type
            typeIndicator.innerHTML = this.getTypeIcon(primaryType);

            // Ajouter une animation au badge
            typeIndicator.style.animation = "pulse-light 2s infinite";
            cardWrapper.appendChild(typeIndicator);

            // Ajouter une info-bulle au survol avec tous les types
            card.setAttribute("title", `Type: ${cardObj.types.join(", ")}`);
         }

         cardWrapper.appendChild(card);
         handContainer.appendChild(cardWrapper);
      });
   }

   // Rendre la main de l'adversaire (cartes face cachée)
   renderOpponentHand(handContainer, opponentHand) {
      // Nettoyer le conteneur de manière sécurisée
      while (handContainer.firstChild) {
         handContainer.removeChild(handContainer.firstChild);
      }

      // Utilise la longueur réelle de la main de l'adversaire
      const handSize = opponentHand.cards.length;

      for (let i = 0; i < handSize; i++) {
         const cardWrapper = document.createElement("div");
         cardWrapper.className = "card-container relative";

         const cardBack = document.createElement("img");
         cardBack.src = "img/back-card.jpg";
         cardBack.alt = "Carte Pokémon (face cachée)";
         cardBack.className = "w-24 h-auto rounded-lg shadow-lg pokemon-card transition-all duration-300";

         cardWrapper.appendChild(cardBack);
         handContainer.appendChild(cardWrapper);
      }
   }

   // Rendre une carte active (dans la zone de combat)
   renderActiveCard(container, card) {
      // Nettoyer le conteneur
      while (container.firstChild) {
         container.removeChild(container.firstChild);
      }

      // Si pas de carte active, afficher un placeholder
      if (!card) {
         const placeholderWrapper = document.createElement("div");
         placeholderWrapper.className = "flex flex-col items-center justify-center text-center h-full w-full";

         const placeholderIcon = document.createElement("div");
         placeholderIcon.className = "mb-2 text-4xl text-yellow-500";
         placeholderIcon.innerHTML = "⬇️"; // Emoji flèche vers le bas
         placeholderWrapper.appendChild(placeholderIcon);

         // Ajouter le texte
         const placeholder = document.createElement("p");
         placeholder.textContent = "Déposez une carte ici";
         placeholder.className = "text-center text-yellow-400 font-bold";
         placeholderWrapper.appendChild(placeholder);

         container.appendChild(placeholderWrapper);
         return;
      }

      // Créer un wrapper pour la carte active avec un halo d'énergie
      const activeCardWrapper = document.createElement("div");
      activeCardWrapper.className = "relative";

      // Ajouter un effet de halo autour de la carte active
      const halo = document.createElement("div");
      const primaryType = card.types && card.types.length > 0 ? card.types[0] : "Colorless";
      const typeGradient = this.getTypeGradient(primaryType).replace("bg-gradient-to-r", "bg-gradient-to-r opacity-70");
      halo.className = `absolute -inset-2 ${typeGradient} rounded-lg blur-md`;
      activeCardWrapper.appendChild(halo);

      // Créer l'image de la carte
      const cardImg = document.createElement("img");
      cardImg.src = card.imageUrl;
      cardImg.alt = card.name;
      cardImg.className = "relative w-full h-auto rounded-lg shadow-xl pokemon-card transition-all duration-300";
      cardImg.addEventListener("click", () => this.showCardModal(card));

      // Ajouter un indicateur HP bien visible
      const hpIndicator = document.createElement("div");
      const hpValue = parseInt(card.hp) || 0;
      hpIndicator.className = "absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-600 to-red-800 text-white px-4 py-1 rounded-full border-2 border-white shadow-lg font-bold";
      hpIndicator.textContent = `${hpValue} HP`;

      // Ajouter une indication visuelle que c'est la carte active
      const activeIndicator = document.createElement("div");
      activeIndicator.className = "absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg";
      activeIndicator.innerHTML = "✓"; // Coche pour indiquer actif

      // Ajouter un badge pour les types si disponibles
      if (card.types && card.types.length > 0) {
         const typeIndicator = document.createElement("div");
         const primaryType = card.types[0];
         typeIndicator.className = `absolute -top-2 -right-2 w-8 h-8 rounded-full type-${primaryType} border-2 border-white shadow-lg flex items-center justify-center text-xs text-white font-bold`;
         typeIndicator.innerHTML = this.getTypeIcon(primaryType);

         // Tooltip pour le type
         typeIndicator.setAttribute("title", `Type: ${primaryType}`);
         activeCardWrapper.appendChild(typeIndicator);

         // Si plusieurs types, afficher un deuxième badge
         if (card.types.length > 1) {
            const secondTypeIndicator = document.createElement("div");
            const secondaryType = card.types[1];
            secondTypeIndicator.className = `absolute -top-2 -left-2 w-8 h-8 rounded-full type-${secondaryType} border-2 border-white shadow-lg flex items-center justify-center text-xs text-white font-bold`;
            secondTypeIndicator.innerHTML = this.getTypeIcon(secondaryType);
            secondTypeIndicator.setAttribute("title", `Type secondaire: ${secondaryType}`);
            activeCardWrapper.appendChild(secondTypeIndicator);
         }
      }

      // Ajouter le nom de la carte
      const nameTag = document.createElement("div");
      nameTag.className = "absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1 rounded-md text-sm font-bold truncate max-w-[90%] shadow-lg";
      nameTag.textContent = card.name;

      // Assembler tous les éléments
      activeCardWrapper.appendChild(cardImg);
      activeCardWrapper.appendChild(hpIndicator);
      activeCardWrapper.appendChild(activeIndicator);
      activeCardWrapper.appendChild(nameTag);
      container.appendChild(activeCardWrapper);

      // Mettre à jour l'affichage HP en bas de la zone de combat
      const hpDisplay = container.id === "player-active" ? document.getElementById("player-hp") : document.getElementById("opponent-hp");
      if (hpDisplay) {
         hpDisplay.textContent = `HP: ${hpValue}/${hpValue}`;
      }

      // Si c'est le joueur actif, afficher les boutons d'attaque
      if (container.id === "player-active" && card.attacks && card.attacks.length > 0) {
         this.renderAttackButtons(card);
      }
   }

   // Rendre les boutons d'attaque pour la carte active du joueur
   renderAttackButtons(card) {
      const attackButtonsContainer = document.getElementById("attack-buttons");
      attackButtonsContainer.innerHTML = "";

      if (!card.attacks || card.attacks.length === 0) return;

      card.attacks.forEach((attack, index) => {
         const button = document.createElement("button");
         button.textContent = attack.name;
         button.className = "px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full text-sm font-bold shadow-md hover:from-red-600 hover:to-orange-600 transition-colors";
         button.setAttribute("data-attack-index", index);

         // Ajouter un tooltip avec les dégâts
         if (attack.damage) {
            button.setAttribute("title", `Dégâts: ${attack.damage}`);
         }

         button.addEventListener("click", () => {
            // La logique de l'attaque sera gérée dans le Game principal
            const event = new CustomEvent("player-attack", {
               detail: { attackIndex: index }
            });
            document.dispatchEvent(event);
         });

         attackButtonsContainer.appendChild(button);
      });
   }

   // Obtenir une icône pour un type donné
   getTypeIcon(type) {
      const icons = {
         Fire: "🔥",
         Water: "💧",
         Grass: "🌿",
         Electric: "⚡",
         Psychic: "🔮",
         Fighting: "👊",
         Darkness: "🌑",
         Metal: "⚙️",
         Fairy: "✨",
         Dragon: "🐉",
         Colorless: "⭐"
      };

      return icons[type] || "❓";
   }

   // Obtenir un gradient de couleur pour un type donné
   getTypeGradient(type) {
      const gradients = {
         Fire: "bg-gradient-to-r from-red-500 to-yellow-500",
         Water: "bg-gradient-to-r from-blue-500 to-cyan-400",
         Grass: "bg-gradient-to-r from-green-500 to-lime-400",
         Electric: "bg-gradient-to-r from-yellow-400 to-amber-500",
         Psychic: "bg-gradient-to-r from-purple-500 to-pink-400",
         Fighting: "bg-gradient-to-r from-orange-500 to-red-700",
         Darkness: "bg-gradient-to-r from-gray-700 to-gray-900",
         Metal: "bg-gradient-to-r from-gray-400 to-slate-600",
         Fairy: "bg-gradient-to-r from-pink-400 to-purple-300",
         Dragon: "bg-gradient-to-r from-indigo-600 to-purple-700",
         Colorless: "bg-gradient-to-r from-slate-300 to-gray-400"
      };

      return gradients[type] || "bg-gradient-to-r from-blue-400 to-purple-500";
   }
}

export class Deck {
   constructor(container, cards = [], dragHandler = null) {
      this.container = container;
      this.cards = cards;
      this.dragHandler = dragHandler;
   }

   // Ajoute une carte au deck
   addCard(card) {
      this.cards.push(card);
   }

   // Retire la première carte du deck
   drawCard() {
      return this.cards.shift();
   }

   // Retire une carte spécifique du deck
   removeCard(index) {
      if (index >= 0 && index < this.cards.length) {
         return this.cards.splice(index, 1)[0];
      }
      return null;
   }

   // Mélange le deck
   shuffle() {
      for (let i = this.cards.length - 1; i > 0; i--) {
         const j = Math.floor(Math.random() * (i + 1));
         [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
      }
   }

   // Nettoie le conteneur
   clear() {
      while (this.container.firstChild) {
         this.container.removeChild(this.container.firstChild);
      }
   }

   // Rend le deck visuellement
   render() {
      this.clear();

      // Wrapper pour le deck pour un meilleur positionnement
      const deckWrapper = document.createElement("div");
      deckWrapper.className = "relative mb-8 mt-2";

      // Créer l'image du dos de la carte
      const cardBack = document.createElement("img");
      cardBack.src = "img/back-card.jpg";
      cardBack.alt = "Dos de carte Pokémon";
      cardBack.className = "w-40 h-auto rounded-lg shadow-xl cursor-pointer transition-all duration-300 hover:scale-110 hover:-translate-y-2 pokemon-card";
      cardBack.id = "deck-card";
      cardBack.setAttribute("draggable", "true");

      // Ajouter le gestionnaire d'événements drag si fourni
      if (this.dragHandler) {
         cardBack.addEventListener("dragstart", this.dragHandler);
      }

      deckWrapper.appendChild(cardBack);

      // Ajouter un indicateur visuel du nombre de cartes
      const counter = document.createElement("div");
      counter.className = "mt-2 flex items-center justify-center";

      const cardIcon = document.createElement("div");
      cardIcon.className = "mr-1 text-xl";
      cardIcon.innerHTML = "🃏";
      counter.appendChild(cardIcon);

      const label = document.createElement("p");
      label.textContent = `${this.cards.length} carte${this.cards.length > 1 ? 's' : ''}`;
      label.className = "text-white font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 rounded-full px-3 py-1 shadow-md";
      counter.appendChild(label);

      // Ajouter un badge sur la carte pour une indication rapide
      const quickBadge = document.createElement("div");
      quickBadge.className = "absolute -top-3 -right-3 w-10 h-10 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center text-lg font-bold text-white";
      quickBadge.textContent = this.cards.length.toString();
      deckWrapper.appendChild(quickBadge);

      // Ajouter le wrapper et le compteur au conteneur
      this.container.appendChild(deckWrapper);
      this.container.appendChild(counter);
   }

   // Obtient la longueur du deck
   get length() {
      return this.cards.length;
   }

   // Vérifie si le deck est vide
   isEmpty() {
      return this.cards.length === 0;
   }

   // Obtient les cartes du deck
   getCards() {
      return [...this.cards]; // Retourne une copie pour éviter les modifications directes
   }

   // Remplace toutes les cartes du deck
   setCards(newCards) {
      this.cards = [...newCards];
   }

   // Ajoute plusieurs cartes au deck
   addCards(cards) {
      this.cards.push(...cards);
   }

   // Vide le deck
   empty() {
      this.cards = [];
   }
}

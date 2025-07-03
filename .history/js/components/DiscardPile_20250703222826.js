export class DiscardPile 
{
   constructor(containerId, owner = 'player', cardModal = null) {
      this.container = document.getElementById(containerId);
      this.owner = owner;
      this.cards = [];
      this.cardModal = cardModal;
   }

   setCards(cards) {
      this.cards = cards;
      this.render();
   }

   addCard(card) {
      this.cards.push(card);
      this.render();
   }

   render() {
      if (!this.container) return;

      this.container.innerHTML = '';

      if (this.cards.length === 0) {
         this.container.innerHTML = this.emptyHTML();
         return;
      }

      const topCard = this.cards[this.cards.length - 1];
      const cardElement = this.createCard(topCard);

      cardElement.addEventListener('click', () => {
         this.show();
      });

      this.container.appendChild(cardElement);
   }

   emptyHTML() {
      return `
         <div class="w-20 h-28 border-2 border-dashed border-red-400/50 rounded-lg flex items-center justify-center bg-red-900/20 text-red-300 text-xs font-bold">
            Vide
         </div>
      `;
   }

   createCard(card) {
      const cardElement = document.createElement('div');
      cardElement.className = 'relative cursor-pointer transform hover:scale-105 transition-all duration-200';
      cardElement.style.zIndex = this.cards.length;

      const cardImg = this.createImage(card);
      cardElement.appendChild(cardImg);

      if (this.cards.length > 1) {
         const badge = this.createBadge();
         cardElement.appendChild(badge);
      }

      return cardElement;
   }

   createImage(card) {
      const cardImg = document.createElement('img');
      cardImg.src = this.getImageSrc(card);
      cardImg.alt = card.name || 'Carte Pokémon';
      cardImg.className = 'w-20 h-28 rounded-lg shadow-lg border border-red-500/50';
      cardImg.loading = 'lazy';
      return cardImg;
   }

   getImageSrc(card) {
      if (card.images && card.images.small) return card.images.small;
      if (card.imageUrl) return card.imageUrl;
      return 'img/back-card.jpg';
   }

   createBadge() {
      const badge = document.createElement('div');
      badge.className = 'absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white';
      badge.textContent = this.cards.length;
      return badge;
   }

   show() {
      if (this.cardModal && this.cards.length > 0) {
         const topCard = this.cards[this.cards.length - 1];
         this.cardModal.show(topCard);
      } else {
         this.showAll();
      }
   }

   showAll() {
      if (this.cards.length === 0) return;

      const modal = this.createModal();
      const content = this.createContent();

      content.appendChild(this.createHeader());
      content.appendChild(this.createContainer());
      modal.appendChild(content);

      this.setupEvents(modal);
      document.body.appendChild(modal);
   }

   createModal() {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-80 backdrop-blur-md flex items-center justify-center z-50';
      modal.style.display = 'flex';
      return modal;
   }

   createContent() {
      const content = document.createElement('div');
      content.className = 'bg-gradient-to-br from-red-100 to-red-200 p-6 rounded-xl max-w-6xl w-full mx-4 shadow-2xl border-4 border-red-500 max-h-[90vh] overflow-hidden flex flex-col';
      return content;
   }

   createHeader() {
      const header = document.createElement('div');
      header.className = 'flex justify-between items-center mb-4 bg-gradient-to-r from-red-600 to-red-700 p-3 rounded-lg shadow-lg';
      header.innerHTML = `
         <h2 class="text-2xl font-bold text-white drop-shadow-md">
            Pile de défausse ${this.owner === 'player' ? 'du joueur' : 'de l\'adversaire'} (${this.cards.length} cartes)
         </h2>
         <button class="close-discard-modal bg-white rounded-full p-2 text-gray-800 hover:text-red-600 hover:bg-gray-200 transition-all duration-200">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
         </button>
      `;
      return header;
   }

   createContainer() {
      const cardsContainer = document.createElement('div');
      cardsContainer.className = 'flex-1 overflow-y-auto';

      const cardsGrid = document.createElement('div');
      cardsGrid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-2';

      [...this.cards].reverse().forEach((card) => {
         const cardDiv = this.createModalCard(card);
         cardsGrid.appendChild(cardDiv);
      });

      cardsContainer.appendChild(cardsGrid);
      return cardsContainer;
   }

   createModalCard(card) {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'flex flex-col items-center p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer';

      const cardImg = document.createElement('img');
      cardImg.src = this.getImageSrc(card);
      cardImg.alt = card.name || 'Carte Pokémon';
      cardImg.className = 'w-full rounded-lg shadow-sm';
      cardImg.loading = 'lazy';

      const cardName = document.createElement('p');
      cardName.className = 'text-xs font-bold text-gray-800 mt-1 text-center truncate w-full';
      cardName.textContent = card.name;

      if (this.cardModal) {
         cardDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            this.cardModal.show(card);
         });
      }

      cardDiv.appendChild(cardImg);
      cardDiv.appendChild(cardName);
      return cardDiv;
   }

   setupEvents(modal) {
      const closeBtn = modal.querySelector('.close-discard-modal');
      closeBtn.addEventListener('click', () => {
         document.body.removeChild(modal);
      });

      modal.addEventListener('click', (e) => {
         if (e.target === modal) {
            document.body.removeChild(modal);
         }
      });
   }
}

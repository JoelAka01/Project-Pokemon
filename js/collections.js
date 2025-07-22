import { pokemons } from './pokemons.js';

class CollectionsManager {
    constructor() {
        this.allCards = [...pokemons];
        this.filteredCards = [...this.allCards];
        this.currentFilter = 'all';
        this.searchTerm = '';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.calculateStats();
        this.createTypeFilters();
        this.renderCards();
        this.hideLoading();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');

        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.applyFilters();
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.applyFilters();
            }
        });

        searchBtn.addEventListener('click', () => {
            this.applyFilters();
        });

        // Modal functionality
        const modal = document.getElementById('card-modal');
        const closeModal = document.getElementById('close-modal');

        closeModal.addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }

    calculateStats() {
        const totalCards = this.allCards.length;
        const types = [...new Set(this.allCards.flatMap(card => card.types))];
        const avgHp = Math.round(this.allCards.reduce((sum, card) => sum + card.hp, 0) / totalCards);
        const specialCards = this.allCards.filter(card => card.id.startsWith('2')).length;

        document.getElementById('total-cards').textContent = totalCards;
        document.getElementById('total-types').textContent = types.length;
        document.getElementById('avg-hp').textContent = avgHp;
        document.getElementById('special-cards').textContent = specialCards;
    }

    createTypeFilters() {
        const types = [...new Set(this.allCards.flatMap(card => card.types))];
        const filtersContainer = document.getElementById('type-filters');

        types.forEach(type => {
            const button = document.createElement('button');
            button.className = 'filter-btn bg-white bg-opacity-20 text-white px-4 py-2 rounded-full';
            button.textContent = this.getTypeDisplayName(type);
            button.dataset.type = type.toLowerCase();

            button.addEventListener('click', () => {
                this.setActiveFilter(button, type.toLowerCase());
            });

            filtersContainer.appendChild(button);
        });
    }

    setActiveFilter(clickedButton, filterType) {
        // Remove active class from all filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked button
        clickedButton.classList.add('active');

        this.currentFilter = filterType;
        this.applyFilters();
    }

    applyFilters() {
        this.filteredCards = this.allCards.filter(card => {
            const matchesType = this.currentFilter === 'all' || 
                               card.types.some(type => type.toLowerCase() === this.currentFilter);
            
            const matchesSearch = this.searchTerm === '' || 
                                card.name.toLowerCase().includes(this.searchTerm);

            return matchesType && matchesSearch;
        });

        this.renderCards();
    }

    renderCards() {
        const container = document.getElementById('cards-container');
        const noResults = document.getElementById('no-results');

        if (this.filteredCards.length === 0) {
            container.innerHTML = '';
            noResults.classList.remove('hidden');
            return;
        }

        noResults.classList.add('hidden');
        container.innerHTML = '';

        this.filteredCards.forEach(card => {
            const cardElement = this.createCardElement(card);
            container.appendChild(cardElement);
        });
    }

    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl';
        
        const isSpecialCard = card.id.startsWith('2');
        
        cardDiv.innerHTML = `
            <div class="relative">
                ${isSpecialCard ? '<div class="absolute top-2 left-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold z-10">SPÉCIAL</div>' : ''}
                <img src="${card.imageUrl}" alt="${card.name}" 
                     class="w-full h-auto rounded-lg shadow-lg"
                     onerror="this.src='img/back-card.jpg'">
            </div>
        `;

        cardDiv.addEventListener('click', () => {
            this.showCardModal(card);
        });

        return cardDiv;
    }

    showCardModal(card) {
        const modal = document.getElementById('card-modal');
        const title = document.getElementById('modal-title');
        const img = document.getElementById('modal-img');
        const hp = document.getElementById('modal-hp');
        const typeBadges = document.getElementById('pokemon-type-badges');
        const attacks = document.getElementById('modal-attacks');
        const weaknesses = document.getElementById('modal-weaknesses');
        const resistances = document.getElementById('modal-resistances');
        const info = document.getElementById('modal-info');
        const description = document.getElementById('modal-description');

        // Set basic info
        title.textContent = card.name;
        img.src = card.imageUrl;
        img.alt = card.name;
        hp.textContent = card.hp;

        // Set type badges
        typeBadges.innerHTML = card.types.map(type => `
            <span class="type-badge type-${type.toLowerCase()}">${this.getTypeDisplayName(type)}</span>
        `).join('');

        // Set description for special cards
        if (card.id.startsWith('2')) {
            description.textContent = 'Carte spéciale de pioche - Permet de piocher des cartes supplémentaires';
        } else {
            description.textContent = `${card.name} est un Pokémon de type ${card.types.join(' / ')}.`;
        }

        // Set additional info
        info.innerHTML = `
            <div class="bg-blue-100 p-2 rounded">
                <strong>ID:</strong> ${card.id}
            </div>
            <div class="bg-green-100 p-2 rounded">
                <strong>Type(s):</strong> ${card.types.join(', ')}
            </div>
        `;

        // Set attacks
        attacks.innerHTML = card.attacks.map(attack => `
            <div class="bg-white bg-opacity-80 p-3 rounded-lg border border-red-200">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold text-red-800">${attack.name}</h4>
                    <span class="bg-red-600 text-white px-2 py-1 rounded text-sm">${attack.damage || '0'} dégâts</span>
                </div>
                <div class="text-sm text-gray-600">
                    <strong>Coût:</strong> ${attack.cost.join(', ')}
                </div>
            </div>
        `).join('');

        // Set weaknesses
        if (card.weaknesses && card.weaknesses.length > 0) {
            weaknesses.innerHTML = card.weaknesses.map(weakness => `
                <span class="type-badge type-${weakness.type.toLowerCase()}">${this.getTypeDisplayName(weakness.type)} ${weakness.value}</span>
            `).join('');
        } else {
            weaknesses.innerHTML = '<span class="text-gray-600 text-sm">Aucune</span>';
        }

        // Set resistances (if any)
        if (card.resistances && card.resistances.length > 0) {
            resistances.innerHTML = card.resistances.map(resistance => `
                <span class="type-badge type-${resistance.type.toLowerCase()}">${this.getTypeDisplayName(resistance.type)} ${resistance.value}</span>
            `).join('');
        } else {
            resistances.innerHTML = '<span class="text-gray-600 text-sm">Aucune</span>';
        }

        modal.classList.remove('hidden');
    }

    getTypeDisplayName(type) {
        const typeNames = {
            'fire': 'Feu',
            'water': 'Eau',
            'grass': 'Plante',
            'electric': 'Électrik',
            'psychic': 'Psy',
            'fighting': 'Combat',
            'metal': 'Métal',
            'ghost': 'Spectre',
            'dragon': 'Dragon',
            'colorless': 'Normal'
        };
        return typeNames[type.toLowerCase()] || type;
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 300);
        }, 1000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CollectionsManager();
});

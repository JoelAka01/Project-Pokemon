// Ce fichier contient toutes les fonctions d'interface utilisateur
// Il est importé et utilisé par main.js

import { animateHPChange, enhanceAttackResult } from './ui-enhancements.js';

// Fonction pour afficher une carte dans la zone active
export function displayActiveCard(card, zoneId) {
  const zone = document.getElementById(zoneId);
  if (!zone) return;
  
  zone.innerHTML = '';
  
  if (!card) return;
  
  const cardImg = document.createElement('img');
  cardImg.src = card.imageUrl;
  cardImg.alt = card.name;
  cardImg.className = 'w-full h-auto pokemon-card card-img';
  cardImg.dataset.cardId = card.id;
  
  zone.appendChild(cardImg);
  
  // Mettre à jour l'affichage des points de vie
  updateHPDisplay(card, zoneId === 'player-active' ? 'player-hp' : 'opponent-hp');
}

// Fonction pour mettre à jour l'affichage des points de vie
export function updateHPDisplay(card, elementId) {
  const hpElement = document.getElementById(elementId);
  if (!hpElement || !card) return;
  
  const oldHP = parseInt(hpElement.textContent.split('/')[0]) || card.hp;
  const newHP = card.currentHP || card.hp;
  
  hpElement.textContent = `${newHP}/${card.hp} HP`;
  
  // Animer le changement de HP
  animateHPChange(hpElement, newHP, oldHP);
}

// Fonction pour afficher les boutons d'attaque
export function displayAttackButtons(card) {
  const attackButtonsContainer = document.getElementById('attack-buttons');
  if (!attackButtonsContainer || !card || !card.attacks) return;
  
  attackButtonsContainer.innerHTML = '';
  
  card.attacks.forEach(attack => {
    const button = document.createElement('button');
    button.textContent = attack.name;
    button.className = 'bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm shadow-md attack-button';
    button.dataset.attackName = attack.name;
    
    attackButtonsContainer.appendChild(button);
  });
}

// Fonction pour afficher le résultat d'une attaque
export function displayAttackResult(result) {
  if (!result) return;
  
  // Utiliser la fonction améliorée pour l'affichage des résultats
  enhanceAttackResult(result);
}

// Fonction pour afficher les cartes dans la main
export function displayHand(cards, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  cards.forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.className = 'card-container relative';
    
    const cardImg = document.createElement('img');
    cardImg.src = containerId === 'opponent-hand' ? 'img/back-card.jpg' : card.imageUrl;
    cardImg.alt = containerId === 'opponent-hand' ? 'Carte cachée' : card.name;
    cardImg.className = 'w-24 sm:w-28 md:w-32 h-auto pokemon-card card-img';
    cardImg.dataset.cardId = card.id;
    
    // Ajouter des interactions uniquement pour les cartes du joueur
    if (containerId === 'hand') {
      cardImg.classList.add('cursor-pointer', 'hover:shadow-lg');
      
      // Afficher un indicateur pour les cartes que le joueur peut jouer
      if (card.energy && card.energy <= getPlayerEnergy()) {
        const indicator = document.createElement('div');
        indicator.className = 'absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs text-white z-10';
        indicator.textContent = '✓';
        cardElement.appendChild(indicator);
      }
    }
    
    cardElement.appendChild(cardImg);
    container.appendChild(cardElement);
  });
}

// Fonction fictive pour l'énergie du joueur (à implémenter selon votre logique de jeu)
function getPlayerEnergy() {
  // À remplacer par votre implémentation
  return 3;
}

// Fonction pour afficher la pioche
export function displayDeck(cardCount, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  if (cardCount <= 0) {
    const emptyDeck = document.createElement('div');
    emptyDeck.className = 'text-center text-sm text-gray-600 italic';
    emptyDeck.textContent = 'Pioche vide';
    container.appendChild(emptyDeck);
    return;
  }
  
  // Afficher la pile de cartes
  for (let i = 0; i < Math.min(cardCount, 3); i++) {
    const cardImg = document.createElement('img');
    cardImg.src = 'img/back-card.jpg';
    cardImg.alt = 'Carte de la pioche';
    cardImg.className = 'w-24 h-auto pokemon-card';
    cardImg.style.marginTop = i === 0 ? '0' : '-80px';
    container.appendChild(cardImg);
  }
  
  // Afficher le nombre de cartes restantes
  const countElement = document.createElement('div');
  countElement.className = 'text-center text-sm font-bold mt-2';
  countElement.textContent = `${cardCount} cartes`;
  container.appendChild(countElement);
}

// Fonction pour afficher le timer
export function updateTimer(seconds) {
  const timerDisplay = document.getElementById('timer-display');
  if (!timerDisplay) return;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  timerDisplay.textContent = `Temps restant: ${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  
  // Ajouter une classe d'urgence quand le temps est presque écoulé
  if (seconds < 30) {
    timerDisplay.classList.add('bg-red-100', 'text-red-600', 'font-bold');
  } else {
    timerDisplay.classList.remove('bg-red-100', 'text-red-600', 'font-bold');
  }
}

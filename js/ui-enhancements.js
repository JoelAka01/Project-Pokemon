// Script pour améliorer l'interface utilisateur du jeu Pokémon
// Ce script étend les fonctionnalités de ui.js

// Fonction pour animer les changements de points de vie
function animateHPChange(element, newValue, oldValue) {
  if (!element) return;
  
  // Créer une animation visuelle
  element.classList.add('hp-change');
  
  // Si c'est une perte de HP, montrer en rouge
  if (newValue < oldValue) {
    element.classList.add('hp-decrease');
  } else if (newValue > oldValue) {
    element.classList.add('hp-increase');
  }
  
  // Retirer les classes après l'animation
  setTimeout(() => {
    element.classList.remove('hp-change', 'hp-decrease', 'hp-increase');
  }, 1000);
}

// Fonction pour améliorer les résultats d'attaque
function enhanceAttackResult(resultText) {
  const resultElement = document.getElementById('results');
  if (!resultElement) return;
  
  // Vider l'élément résultat
  resultElement.innerHTML = '';
  
  // Créer un élément pour l'animation
  const resultMessage = document.createElement('div');
  resultMessage.className = 'attack-result';
  resultMessage.textContent = resultText;
  
  // Ajouter une classe selon le résultat
  if (resultText.includes('Coup critique')) {
    resultMessage.classList.add('critical-hit');
  } else if (resultText.includes('super efficace')) {
    resultMessage.classList.add('super-effective');
  } else if (resultText.includes('pas très efficace')) {
    resultMessage.classList.add('not-effective');
  }
  
  resultElement.appendChild(resultMessage);
  
  // Ajouter une animation d'entrée
  resultMessage.classList.add('animate-in');
  
  // Retirer l'animation après un délai
  setTimeout(() => {
    resultMessage.classList.remove('animate-in');
  }, 2000);
}

// Adapter l'interface pour les appareils mobiles
function handleResponsiveLayout() {
  const gameArea = document.getElementById('game-area');
  const isMobile = window.innerWidth < 768;
  
  if (isMobile) {
    // Ajustements pour les appareils mobiles
    document.querySelectorAll('.card-img').forEach(card => {
      card.style.maxWidth = '90px';
    });
    
    // Ajuster les marges pour économiser de l'espace
    document.querySelectorAll('h2, h3').forEach(heading => {
      heading.classList.add('text-sm');
      heading.classList.remove('mb-2');
      heading.classList.add('mb-1');
    });
  } else {
    // Réinitialiser pour les grands écrans
    document.querySelectorAll('.card-img').forEach(card => {
      card.style.maxWidth = '';
    });
    
    document.querySelectorAll('h2, h3').forEach(heading => {
      heading.classList.remove('text-sm');
      heading.classList.add('mb-2');
      heading.classList.remove('mb-1');
    });
  }
}

// Exécuter la fonction de responsive layout au chargement et au resize
window.addEventListener('DOMContentLoaded', handleResponsiveLayout);
window.addEventListener('resize', handleResponsiveLayout);

// Exposer les fonctions pour être utilisées par d'autres modules
export { animateHPChange, enhanceAttackResult, handleResponsiveLayout };

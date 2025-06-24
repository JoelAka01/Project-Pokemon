import { Player } from './player.js';
import { CardModal } from './ui/cardModal.js';

export class Game {
   constructor(playerDeck, opponentDeck, maxHandSize = 5) {
      this.player = new Player(playerDeck, maxHandSize);
      this.opponent = new Player(opponentDeck, maxHandSize);
      this.cardModal = new CardModal();

      this.playerActive = document.getElementById("player-active");
      this.opponentActive = document.getElementById("opponent-active");
      this.results = document.getElementById("results");
      this.deckContainer = document.getElementById("deck");
      this.handContainer = document.getElementById("hand");
      this.opponentDeckContainer = document.getElementById("opponent-deck");
      this.opponentHandContainer = document.getElementById("opponent-hand");
      this.drawTimerElement = document.getElementById("draw-timer"); this.maxHandSize = maxHandSize;
      this.drawCooldown = 5 * 60; // 5 minutes en secondes
      this.timeLeft = 0;
      this.canDraw = true;  // Indique si on peut tirer une carte      this.drawTimerId = null;

      // Déterminer si la partie est sauvegardée via localStorage
      this.hasSavedGame = localStorage.getItem('pokemonTCG_gameState') !== null;

      // Configurer la sauvegarde automatique
      this.setupAutoSave();
   }

   updateTimerDisplay() {
      const minutes = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
      const seconds = (this.timeLeft % 60).toString().padStart(2, '0');
      this.drawTimerElement.textContent = `Prochain tirage dans : ${minutes}:${seconds}`;
   }

   attemptDrawCard() {
      if (!this.canDraw) {
         alert("Attends que le timer expire pour tirer une nouvelle carte !");
         return null;
      }

      if (this.player.hand.cards.length >= this.maxHandSize) {
         alert("Ta main est pleine !");
         return null;
      }

      if (this.player.deck.length === 0) {
         alert("Ta pioche est vide !");
         return null;
      }

      // Autoriser le tirage
      this.canDraw = false;

      // Prendre la première carte du deck
      const cardFromDeck = this.player.deck.shift();

      // Si la main n'est pas vide, prendre la première carte de la main et la mettre à la fin de la pioche
      if (this.player.hand.cards.length > 0) {
         const firstHandCard = this.player.hand.cards.shift();
         this.player.deck.push(firstHandCard);
         console.log(`Carte "${firstHandCard.name}" déplacée de la main vers la pioche`);
      }      // Ajouter la carte tirée à la main
      this.player.hand.cards.push(cardFromDeck);
      console.log(`Carte "${cardFromDeck.name}" tirée de la pioche vers la main`);

      // Démarrer le timer de 5 minutes (300000 ms)
      this.startDrawTimer();

      // Sauvegarder l'état du jeu après cette action
      this.saveGameState();

      return cardFromDeck;
   } 
   
   startDrawTimer() {
      const timerDisplay = document.getElementById("timer-display");
      let remainingTime = this.timeLeft > 0 ? this.timeLeft : 300; // utiliser le temps sauvegardé ou 5 minutes par défaut

      // Affiche le timer dès le début
      if (timerDisplay) {
         const minutes = Math.floor(remainingTime / 60);
         const seconds = remainingTime % 60;
         timerDisplay.textContent = `Prochaine carte dans: ${minutes}:${seconds.toString().padStart(2, '0')}`;
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
         } if (remainingTime <= 0) {
            clearInterval(this.drawTimerId);
            this.canDraw = true;
            if (timerDisplay) {
               timerDisplay.textContent = "Tu peux tirer une carte !";
            }
            // Sauvegarder l'état quand le timer expire
            this.saveGameState();
         }

         // Mettre à jour le temps restant pour pouvoir le sauvegarder
         this.timeLeft = remainingTime;
      }, 1000);
   }

   showCardModal(card) {
      this.cardModal.showCardModal(card);
   }

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
      cardBack.src = "img/back-card.jpg"; // Correction du chemin relatif
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

   renderPlayerCards() {
      // Rendre le deck
      this.renderDeck(this.deckContainer, this.player.deck, (ev) => this.dragstart_handler(ev));

      // Nettoyer le conteneur de la main de manière sécurisée
      while (this.handContainer.firstChild) {
         this.handContainer.removeChild(this.handContainer.firstChild);
      }      // Rendre chaque carte dans la main du joueur
      this.player.hand.cards.forEach((cardObj, index) => {
         // Créer un wrapper pour la carte
         const cardWrapper = document.createElement("div");
         cardWrapper.className = "card-container relative";

         // Créer l'élément image de la carte
         const card = document.createElement("img");
         card.src = cardObj.imageUrl;
         card.alt = cardObj.name || "Carte Pokémon";
         card.id = `hand-card-${index}`;

         // Ajouter une classe spéciale pour la première carte qui sera recyclée
         card.className = index === 0
            ? "w-40 h-auto rounded-lg shadow cursor-pointer pokemon-card transition-all duration-300 first-card-to-recycle"
            : "w-40 h-auto rounded-lg shadow cursor-pointer pokemon-card transition-all duration-300";

         // Ajouter les événements
         card.addEventListener("click", () => this.showCardModal(cardObj));
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

            // Utiliser nos nouvelles icônes (depuis CardModal)
            typeIndicator.innerHTML = this.cardModal.getTypeIcon(primaryType);

            // Ajouter une animation au badge
            typeIndicator.style.animation = "pulse-light 2s infinite";
            cardWrapper.appendChild(typeIndicator);

            // Ajouter une info-bulle au survol avec tous les types
            card.setAttribute("title", `Type: ${cardObj.types.join(", ")}`);
         }

         // Ajouter la carte au wrapper et le wrapper au conteneur
         cardWrapper.appendChild(card);
         this.handContainer.appendChild(cardWrapper);
      });
   }

   renderOpponentCards() {
      // Rendre le deck de l'adversaire
      this.renderDeck(this.opponentDeckContainer, this.opponent.deck);

      // Nettoyer le conteneur de la main de l'adversaire de manière sécurisée
      while (this.opponentHandContainer.firstChild) {
         this.opponentHandContainer.removeChild(this.opponentHandContainer.firstChild);
      }

      // Utilise la longueur réelle de la main de l'adversaire
      const opponentHandSize = this.opponent.hand.cards.length;

      for (let i = 0; i < opponentHandSize; i++) {
         // Créer un wrapper pour chaque carte
         const cardWrapper = document.createElement("div");
         cardWrapper.className = "card-container relative";

         // Créer l'élément image de la carte
         const card = document.createElement("img");
         card.src = "img/back-card.jpg"; // Correction du chemin relatif
         card.alt = "Dos de carte Pokémon";
         card.className = "w-40 h-auto rounded-lg shadow  transition-all duration-300";
         card.id = `opponent-hand-card-${i}`;

         // Ajouter un effet de brillance ou un badge numéroté
         const cardNumber = document.createElement("span");
         cardNumber.className = "absolute top-1 left-1 w-5 h-5 rounded-full bg-blue-700 border border-white shadow-sm flex items-center justify-center text-xs text-white font-bold";
         cardNumber.textContent = (i + 1).toString();

         // Ajouter la carte et le badge au wrapper
         cardWrapper.appendChild(card);
         cardWrapper.appendChild(cardNumber);

         // Ajouter le wrapper au conteneur
         this.opponentHandContainer.appendChild(cardWrapper);
      }
   }

   renderActiveCard(container, card) {
      // Nettoyer le conteneur de manière sécurisée
      while (container.firstChild) {
         container.removeChild(container.firstChild);
      }

      if (!card) {
         // Créer un placeholder attractif
         const placeholderWrapper = document.createElement("div");
         placeholderWrapper.className = "flex flex-col items-center justify-center h-full w-full bg-gradient-to-r from-gray-700/20 to-gray-900/20 rounded-lg border-2 border-dashed border-yellow-500 animate-pulse";

         // Ajouter une icône
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
      const typeGradient = this.cardModal.getTypeGradient(primaryType).replace("bg-gradient-to-r", "bg-gradient-to-r opacity-70");
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
         typeIndicator.className = `absolute -top-2 -right-2 w-8 h-8 rounded-full type-${primaryType} border-2 border-white shadow-lg flex items-center justify-center text-xs text-white font-bold`;
         typeIndicator.innerHTML = this.cardModal.getTypeIcon(primaryType);

         // Tooltip pour le type
         typeIndicator.setAttribute("title", `Type: ${primaryType}`);
         activeCardWrapper.appendChild(typeIndicator);

         // Si plusieurs types, afficher un deuxième badge
         if (card.types.length > 1) {
            const secondTypeIndicator = document.createElement("div");
            const secondaryType = card.types[1];
            secondTypeIndicator.className = `absolute -top-2 -left-2 w-8 h-8 rounded-full type-${secondaryType} border-2 border-white shadow-lg flex items-center justify-center text-xs text-white font-bold`;
            secondTypeIndicator.innerHTML = this.cardModal.getTypeIcon(secondaryType);
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

      container.appendChild(activeCardWrapper);

      // Mettre à jour le texte HP sous la carte active
      const hpDisplay = container.id === "player-active" ?
         document.getElementById("player-hp") :
         document.getElementById("opponent-hp");

      if (hpDisplay) {
         hpDisplay.textContent = `${hpValue} / ${hpValue} HP`;
      }
   }

   dragstart_handler(ev) {
      // L'élément draggué est le dos de la pioche
      ev.dataTransfer.setData("text/plain", "deck-card");
      ev.dataTransfer.effectAllowed = "move";
   }

   dragover_handler(ev) {
      ev.preventDefault();  // nécessaire pour autoriser le drop
      ev.dataTransfer.dropEffect = "move";
   } 
   
   drop_handler(ev) {
      ev.preventDefault();
      const data = ev.dataTransfer.getData("text/plain");
      const targetId = ev.currentTarget.id;
      console.log("Drop event:", { data, targetId }); // Debug

      if (data === "deck-card") {
         // Vérifier si on dépose sur la main du joueur
         if (targetId === "hand") {
            const card = this.attemptDrawCard();
            if (card) {               // Animation de recyclage pour montrer le déplacement de la carte
               this.showCardRecycleAnimation();
               this.renderCards();
               this.saveGameState();
            }
         } else {
            // Ancien comportement pour les autres zones de dépôt
            const card = this.attemptDrawCard();
            if (card) {
               this.renderCards();
            }
         }
      } else if (data.startsWith("hand-card-")) {
         const index = parseInt(data.split("-")[2]);
         console.log("Card index:", index); // Debug

         if (index < 0 || index >= this.player.hand.cards.length) {
            console.error("Index de carte invalide:", index);
            return;
         }

         const card = this.player.hand.cards[index];
         if (!card) {
            console.error("Carte non trouvée à l'index:", index);
            return;
         }

         if (targetId === "player-active") {
            if (!this.player.activeCard) {
               console.log("Déplacement de la carte vers la zone active"); // Debug
               this.player.activeCard = this.player.hand.cards.splice(index, 1)[0];
               this.renderActiveCard(this.playerActive, this.player.activeCard);

               // L'adversaire joue automatiquement une carte
               if (!this.opponent.activeCard && this.opponent.hand.cards.length > 0) {
                  const randomIndex = Math.floor(Math.random() * this.opponent.hand.cards.length);
                  this.opponent.activeCard = this.opponent.hand.cards.splice(randomIndex, 1)[0];
                  this.renderActiveCard(this.opponentActive, this.opponent.activeCard);
                  this.renderOpponentCards();
               } this.renderCards();
               if (this.opponent.activeCard) {
                  this.displayResults();
               }
               this.saveGameState();
            } else {
               alert("Tu as déjà un Pokémon actif !");
            }
         } else if (targetId === "opponent-active") {
            if (!this.opponent.activeCard) {
               this.opponent.activeCard = this.player.hand.cards.splice(index, 1)[0];
               this.renderActiveCard(this.opponentActive, this.opponent.activeCard);
               this.renderCards();
               if (this.player.activeCard) {
                  this.displayResults();
               }
            } else {
               alert("L'adversaire a déjà un Pokémon actif !");
            }
         }
      }
   }

   displayResults() {
      const playerCard = this.player.activeCard;
      const opponentCard = this.opponent.activeCard;

      if (!playerCard || !opponentCard) {
         console.log("Une ou deux cartes actives sont manquantes.");
         return;
      }

      // Nettoyer le conteneur des résultats
      while (this.results.firstChild) {
         this.results.removeChild(this.results.firstChild);
      }

      // Créer un conteneur de résultats
      const resultsContainer = document.createElement("div");
      resultsContainer.className = "p-3 rounded-lg bg-white/30 backdrop-blur-sm shadow-lg";

      // Calculer les dégâts et les points de vie restants
      const playerAttack = playerCard.attacks && playerCard.attacks.length > 0 ? playerCard.attacks[0] : { name: "Attaque", damage: "10" };
      const opponentAttack = opponentCard.attacks && opponentCard.attacks.length > 0 ? opponentCard.attacks[0] : { name: "Attaque", damage: "10" };

      const playerDamage = parseInt(playerAttack.damage) || 0;
      const opponentDamage = parseInt(opponentAttack.damage) || 0;

      const playerCurrentHp = Math.max(0, parseInt(playerCard.hp) - opponentDamage);
      const opponentCurrentHp = Math.max(0, parseInt(opponentCard.hp) - playerDamage);

      // Créer les éléments visuels pour le résumé des dégâts du joueur
      const playerResult = document.createElement("div");
      playerResult.className = "mb-3 border-b pb-2";

      const playerTitle = document.createElement("h4");
      playerTitle.className = "font-bold text-green-800";
      playerTitle.textContent = "Ton attaque";
      playerResult.appendChild(playerTitle);

      const playerAttackInfo = document.createElement("div");
      playerAttackInfo.className = "flex items-center justify-between";

      const attackName = document.createElement("span");
      attackName.className = "text-blue-700 font-medium";
      attackName.textContent = `${playerAttack.name || "Attaque"}`;

      const damageInfo = document.createElement("span");
      damageInfo.className = "bg-red-600 text-white px-2 py-1 rounded text-xs";
      damageInfo.textContent = `${playerDamage} dégâts`;

      playerAttackInfo.appendChild(attackName);
      playerAttackInfo.appendChild(damageInfo);
      playerResult.appendChild(playerAttackInfo);

      const opponentHpInfo = document.createElement("div");
      opponentHpInfo.className = "mt-1";
      opponentHpInfo.innerHTML = `<span class="font-medium">${opponentCard.name}</span> a <span class="font-bold ${opponentCurrentHp <= 20 ? 'text-red-600' : ''}">${opponentCurrentHp}/${opponentCard.hp} HP</span> restants`;
      playerResult.appendChild(opponentHpInfo);

      // Ajouter au conteneur des résultats
      resultsContainer.appendChild(playerResult);

      // Créer les éléments visuels pour le résumé des dégâts de l'adversaire
      const opponentResult = document.createElement("div");

      const opponentTitle = document.createElement("h4");
      opponentTitle.className = "font-bold text-blue-800";
      opponentTitle.textContent = "Attaque adverse";
      opponentResult.appendChild(opponentTitle);

      const opponentAttackInfo = document.createElement("div");
      opponentAttackInfo.className = "flex items-center justify-between";

      const oppAttackName = document.createElement("span");
      oppAttackName.className = "text-blue-700 font-medium";
      oppAttackName.textContent = `${opponentAttack.name || "Attaque"}`;

      const oppDamageInfo = document.createElement("span");
      oppDamageInfo.className = "bg-red-600 text-white px-2 py-1 rounded text-xs";
      oppDamageInfo.textContent = `${opponentDamage} dégâts`;

      opponentAttackInfo.appendChild(oppAttackName);
      opponentAttackInfo.appendChild(oppDamageInfo);
      opponentResult.appendChild(opponentAttackInfo);

      const playerHpInfo = document.createElement("div");
      playerHpInfo.className = "mt-1";
      playerHpInfo.innerHTML = `<span class="font-medium">${playerCard.name}</span> a <span class="font-bold ${playerCurrentHp <= 20 ? 'text-red-600' : ''}">${playerCurrentHp}/${playerCard.hp} HP</span> restants`;
      opponentResult.appendChild(playerHpInfo);

      // Ajouter au conteneur des résultats
      resultsContainer.appendChild(opponentResult);

      // Ajouter un message de victoire/défaite si nécessaire
      if (playerCurrentHp <= 0 || opponentCurrentHp <= 0) {
         const battleResult = document.createElement("div");
         battleResult.className = "mt-3 pt-2 border-t text-center";

         if (opponentCurrentHp <= 0 && playerCurrentHp > 0) {
            battleResult.innerHTML = `<span class="font-bold text-green-600 text-lg">🎉 Tu as gagné ! 🎉</span>`;
         } else if (playerCurrentHp <= 0 && opponentCurrentHp > 0) {
            battleResult.innerHTML = `<span class="font-bold text-red-600 text-lg">❌ Tu as perdu ! ❌</span>`;
         } else if (playerCurrentHp <= 0 && opponentCurrentHp <= 0) {
            battleResult.innerHTML = `<span class="font-bold text-purple-600 text-lg">🤝 Match nul ! 🤝</span>`;
         }

         resultsContainer.appendChild(battleResult);
      }

      // Ajouter le conteneur au DOM
      this.results.appendChild(resultsContainer);
   }

   drawInitialCards(player, count = 5) {
      for (let i = 0; i < count; i++) {
         player.drawCard();  // drawCard() ajoute déjà la carte dans la main
      }
   }

   renderCards() {
      this.renderPlayerCards();
      this.renderOpponentCards();
   }

   addDropListeners(...elements) {
      elements.forEach(el => {
         el.addEventListener("dragover", (ev) => this.dragover_handler(ev));
         el.addEventListener("drop", (ev) => this.drop_handler(ev));
      });
   } 
   
   
   startGame() {      // Essayer de charger un jeu sauvegardé
      const gameLoaded = this.loadGameState();

      if (!gameLoaded) {
         // Si aucun jeu sauvegardé, initialiser un nouveau jeu
         [this.player, this.opponent].forEach(player => this.drawInitialCards(player));
         this.showTutorialMessage("Astuce: Quand tu tires une carte de ta pioche pour la mettre dans ta main, la première carte de ta main retourne au bas de la pioche! ♻️");
      } else {
         // Afficher un message de bienvenue pour le jeu chargé
         this.showTutorialMessage("Ton jeu précédent a été restauré! 🎮 Continue de jouer où tu t'étais arrêté.");
      }

      // Ajouter un bouton de réinitialisation
      this.addResetButton();

      // Dans tous les cas, configurer l'interface
      this.startDrawTimer();
      this.addDropListeners(this.playerActive, this.opponentActive, this.handContainer);
      this.renderCards();

      // Rendu des cartes actives si elles existent
      if (this.player.activeCard) {
         this.renderActiveCard(this.playerActive, this.player.activeCard);
      }

      if (this.opponent.activeCard) {
         this.renderActiveCard(this.opponentActive, this.opponent.activeCard);
      }

      // Afficher les résultats si les deux joueurs ont une carte active
      if (this.player.activeCard && this.opponent.activeCard) {
         this.displayResults();
      }
   }

   showTutorialMessage(message) {
      const tutorialElement = document.createElement("div");
      tutorialElement.className = "fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-600/90 text-white py-2 px-4 rounded-lg shadow-lg z-50 max-w-md text-center";
      tutorialElement.innerHTML = message;
      tutorialElement.style.transition = "all 0.5s ease";

      // Ajouter un bouton de fermeture
      const closeBtn = document.createElement("button");
      closeBtn.innerHTML = "×";
      closeBtn.className = "absolute top-1 right-2 text-white hover:text-red-300";
      closeBtn.onclick = () => {
         tutorialElement.style.opacity = "0";
         setTimeout(() => {
            if (tutorialElement.parentNode) {
               tutorialElement.parentNode.removeChild(tutorialElement);
            }
         }, 500);
      };

      tutorialElement.appendChild(closeBtn);

      // Faire disparaître automatiquement après 10 secondes
      setTimeout(() => {
         tutorialElement.style.opacity = "0";
         setTimeout(() => {
            if (tutorialElement.parentNode) {
               tutorialElement.parentNode.removeChild(tutorialElement);
            }
         }, 500);
      }, 10000);

      document.body.appendChild(tutorialElement);

      // Petite animation d'entrée
      tutorialElement.style.opacity = "0";
      tutorialElement.style.transform = "translate(-50%, -20px)";
      setTimeout(() => {
         tutorialElement.style.opacity = "1";
         tutorialElement.style.transform = "translate(-50%, 0)";
      }, 100);
   }

   showCardRecycleAnimation() {
      // Créer un élément pour l'animation de recyclage
      const animElement = document.createElement("div");
      animElement.className = "fixed z-50 bg-white/80 backdrop-blur-sm rounded-lg py-2 px-4 shadow-xl border border-green-500 text-green-700 font-bold";
      animElement.innerHTML = `♻️ Carte recyclée dans la pioche!`;
      animElement.style.top = "20%";
      animElement.style.left = "50%";
      animElement.style.transform = "translateX(-50%) scale(0)";
      animElement.style.transition = "all 0.5s ease-out";

      // Ajouter l'élément au body
      document.body.appendChild(animElement);

      // Déclencher l'animation
      setTimeout(() => {
         animElement.style.transform = "translateX(-50%) scale(1)";
      }, 50);

      // Supprimer l'élément après l'animation
      setTimeout(() => {
         animElement.style.opacity = "0";
         setTimeout(() => {
            document.body.removeChild(animElement);
         }, 500);
      }, 1500);
   }

   // Sauvegarde l'état du jeu dans le localStorage
   saveGameState() {
      const gameState = {
         player: {
            deck: this.player.deck,
            hand: this.player.hand.cards,
            activeCard: this.player.activeCard
         },
         opponent: {
            deck: this.opponent.deck,
            hand: this.opponent.hand.cards,
            activeCard: this.opponent.activeCard
         },
         canDraw: this.canDraw,
         timeLeft: this.timeLeft
      };

      localStorage.setItem('pokemonTCG_gameState', JSON.stringify(gameState));
      console.log("État du jeu sauvegardé");
   }

   // Charge l'état du jeu depuis le localStorage
   loadGameState() {
      const savedState = localStorage.getItem('pokemonTCG_gameState');

      if (!savedState) {
         console.log("Pas d'état sauvegardé, démarrage d'un nouveau jeu");
         return false;
      }

      try {
         const gameState = JSON.parse(savedState);

         // Restaurer l'état du joueur
         this.player.deck = gameState.player.deck;
         this.player.hand.cards = gameState.player.hand;
         this.player.activeCard = gameState.player.activeCard;

         // Restaurer l'état de l'adversaire
         this.opponent.deck = gameState.opponent.deck;
         this.opponent.hand.cards = gameState.opponent.hand;
         this.opponent.activeCard = gameState.opponent.activeCard;

         // Restaurer l'état du jeu
         this.canDraw = gameState.canDraw;
         this.timeLeft = gameState.timeLeft || 0;

         console.log("État du jeu chargé avec succès");
         return true;
      } catch (error) {
         console.error("Erreur lors du chargement de l'état du jeu:", error);
         localStorage.removeItem('pokemonTCG_gameState');
         return false;
      }
   }

   // Réinitialise complètement le jeu
   resetGame() {
      // Supprimer les données sauvegardées
      localStorage.removeItem('pokemonTCG_gameState');

      // Rafraîchir la page pour redémarrer un nouveau jeu
      window.location.reload();
   }

   // Ajoute un bouton de réinitialisation dans l'interface
   addResetButton() {
      const resetButton = document.createElement("button");
      resetButton.innerHTML = "🔄 Nouveau jeu";
      resetButton.className = "fixed bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full shadow-lg transition-all duration-300";
      resetButton.onclick = () => {
         if (confirm("Êtes-vous sûr de vouloir recommencer une nouvelle partie? La partie en cours sera perdue.")) {
            this.resetGame();
         }
      };

      document.body.appendChild(resetButton);
   }

   // Configure la sauvegarde automatique périodique
   setupAutoSave() {
      // Sauvegarde automatique toutes les 30 secondes
      setInterval(() => {
         this.saveGameState();
      }, 30000);

      // Sauvegarde également quand l'utilisateur quitte la page
      window.addEventListener('beforeunload', () => {
         this.saveGameState();
      });
   }
}
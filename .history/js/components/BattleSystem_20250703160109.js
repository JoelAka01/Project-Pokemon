export class BattleSystem {
   constructor(game) {
      this.game = game;
      this.isInBattle = false;
      this.battlePhase = null;
      this.selectedPlayerAttack = null;
      this.selectedOpponentAttack = null;
      this.playerHP = null;
      this.opponentHP = null;
      this.maxPlayerHP = null;
      this.maxOpponentHP = null;
      this.opponentAttacksFirst = false;
      this.attackSelectionStarted = false;
   }

   centerModal(modal) {
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
   }

   showAttackChoiceModal(card, isPlayer = true) {
      if (!card || !card.attacks || card.attacks.length === 0) {
         console.warn("Cette carte n'a pas d'attaques disponibles");
         return;
      }

      this.attackSelectionStarted = true;
      this.battlePhase = 'selecting-attacks';

      if (this.game.save) this.game.save();

      const modal = document.createElement('div');
      modal.id = 'attack-choice-modal';
      this.centerModal(modal);

      modal.innerHTML = `
         <div class="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 class="text-lg font-bold mb-4">Choisir une attaque</h3>
            <img src="${card.imageUrl}" alt="${card.name}" class="w-24 h-24 mx-auto mb-4 rounded">
            <div class="space-y-2">
               ${card.attacks.map((attack, index) => `
                  <button class="attack-option w-full p-3 border rounded hover:bg-gray-100"
                          data-attack-index="${index}">
                     <div class="flex justify-between">
                        <span>${attack.name}</span>
                        <span class="font-bold text-red-600">${attack.damage || '0'}</span>
                     </div>
                  </button>
               `).join('')}
            </div>
         </div>
      `;

      document.body.appendChild(modal);

      modal.querySelectorAll('.attack-option').forEach(button => {
         button.onclick = () => {
            const attackIndex = parseInt(button.dataset.attackIndex);
            const selectedAttack = card.attacks[attackIndex];

            if (isPlayer) {
               this.selectedPlayerAttack = selectedAttack;
               modal.remove();

               const attackSelectionNotification = document.getElementById('player-attack-selection-notification');
               if (attackSelectionNotification) attackSelectionNotification.remove();

               if (this.game.save) this.game.save();

               if (this.selectedOpponentAttack) {
                  setTimeout(() => {
                     this.startBattle();
                  }, 1000);
               } else if (this.game.opponent.activeCard) {
                  this.selectOpponentAttack();
               }
            } else {
               this.selectedOpponentAttack = selectedAttack;
               modal.remove();

               if (this.game.save) this.game.save();
            }
         };
      });

      modal.onclick = (e) => {
         if (e.target === modal) modal.remove();
      };
   }

   selectOpponentAttack() {
      const opponentCard = this.game.opponent.activeCard;
      if (!opponentCard || !opponentCard.attacks || opponentCard.attacks.length === 0) {
         console.warn("❌ L'adversaire n'a pas de carte active ou d'attaques disponibles");
         return;
      }

      const randomIndex = Math.floor(Math.random() * opponentCard.attacks.length);
      this.selectedOpponentAttack = opponentCard.attacks[randomIndex];

      if (this.game.save) this.game.save();

      if (this.selectedPlayerAttack && this.selectedOpponentAttack) {
         setTimeout(() => {
            this.startBattle();
         }, 1000);
      }
   }

   async startBattle() {
      if (this.isInBattle) return;

      const playerCard = this.game.player.activeCard;
      const opponentCard = this.game.opponent.activeCard;

      if (!playerCard || !opponentCard) {
         console.warn("❌ Impossible de lancer le combat - cartes manquantes");
         return;
      }

      if (this.playerHP === null || this.opponentHP === null) {
         const resetPlayerHP = this.playerHP === null;
         const resetOpponentHP = this.opponentHP === null;
         this.initializeBattleHP(playerCard, opponentCard, resetPlayerHP, resetOpponentHP);
      }

      this.isInBattle = true;

      if (this.game.save) this.game.save();

      try {
         if (this.opponentAttacksFirst) {
            this.battlePhase = 'opponent-attack';
            await this.showOpponentAttack(opponentCard, playerCard);
            await this.delay(3000);

            this.battlePhase = 'player-attack';
            await this.showPlayerAttack(playerCard, opponentCard);

            this.opponentAttacksFirst = false;
         } else {
            this.battlePhase = 'player-attack';
            await this.showPlayerAttack(playerCard, opponentCard);
            await this.delay(3000);

            this.battlePhase = 'opponent-attack';
            await this.showOpponentAttack(opponentCard, playerCard);
         }

         this.battlePhase = 'finished';
         await this.delay(1000);

         if (this.game.save) this.game.save();

         // Vérifier les KO après chaque round de combat
         if (this.playerHP <= 0 || this.opponentHP <= 0) {
            await this.handleKOsAfterBattle();
         } else {
            this.showChangeCardModal();
         }

      } catch (error) {
         console.error("Erreur pendant le combat:", error);
      } finally {
         this.isInBattle = false;
      }
   }

   initializeBattleHP(playerCard, opponentCard, resetPlayerHP = false, resetOpponentHP = false) {
      const newMaxPlayerHP = parseInt(playerCard.hp) || 100;
      const newMaxOpponentHP = parseInt(opponentCard.hp) || 100;

      if (this.playerHP === null || resetPlayerHP) {
         this.maxPlayerHP = newMaxPlayerHP;
         this.playerHP = this.maxPlayerHP;
      } else {
         this.maxPlayerHP = newMaxPlayerHP;
      }

      if (this.opponentHP === null || resetOpponentHP) {
         this.maxOpponentHP = newMaxOpponentHP;
         this.opponentHP = this.maxOpponentHP;
      } else {
         this.maxOpponentHP = newMaxOpponentHP;
      }

      if (this.game.save) this.game.save();
   }

   async showPlayerAttack(playerCard, opponentCard) {
      const playerAttack = this.selectedPlayerAttack || (playerCard.attacks && playerCard.attacks[0]);
      const damage = this.calculateDamageFromAttack(playerAttack);

      this.opponentHP = Math.max(0, this.opponentHP - damage);

      if (this.game.save) this.game.save();

      this.showAttackDisplay({
         attacker: playerCard,
         defender: opponentCard,
         attack: playerAttack,
         damage: damage,
         isPlayer: true,
         message: `${playerCard.name} utilise ${playerAttack.name} sur ${opponentCard.name} !`,
         defenderHP: this.opponentHP,
         maxDefenderHP: this.maxOpponentHP
      });

      await this.delay(2000);
   }

   async showOpponentAttack(opponentCard, playerCard) {
      const opponentAttack = this.selectedOpponentAttack || (opponentCard.attacks && opponentCard.attacks[0]);
      const damage = this.calculateDamageFromAttack(opponentAttack);

      this.playerHP = Math.max(0, this.playerHP - damage);

      if (this.game.save) this.game.save();

      this.showAttackDisplay({
         attacker: opponentCard,
         defender: playerCard,
         attack: opponentAttack,
         damage: damage,
         isPlayer: false,
         message: `${opponentCard.name} utilise ${opponentAttack.name} sur ${playerCard.name} !`,
         defenderHP: this.playerHP,
         maxDefenderHP: this.maxPlayerHP
      });

      await this.delay(2000);
   }

   showAttackDisplay({ attacker, defender, attack, damage, isPlayer, message, defenderHP, maxDefenderHP }) {
      const existingDisplay = document.getElementById('battle-attack-display');
      if (existingDisplay) existingDisplay.remove();

      const attackDisplay = document.createElement('div');
      attackDisplay.id = 'battle-attack-display';
      this.centerModal(attackDisplay);

      const hpPercentage = Math.max(0, (defenderHP / maxDefenderHP) * 100);
      const bgColor = isPlayer ? 'bg-blue-600' : 'bg-red-600';

      attackDisplay.innerHTML = `
         <div class="bg-white rounded-lg p-6 max-w-md mx-4 text-center ${bgColor} text-white">
            <h3 class="text-xl font-bold mb-4">
               ${isPlayer ? '⚔️ Votre Attaque !' : '🛡️ Attaque Adverse !'}
            </h3>
            <p class="mb-4">${message}</p>
            
            <div class="flex justify-around items-center mb-4">
               <div>
                  <img src="${attacker.imageUrl}" alt="${attacker.name}" class="w-16 h-16 rounded mb-2">
                  <p class="text-sm">${attacker.name}</p>
               </div>
               <div class="text-2xl">VS</div>
               <div>
                  <img src="${defender.imageUrl}" alt="${defender.name}" class="w-16 h-16 rounded mb-2">
                  <p class="text-sm">${defender.name}</p>
               </div>
            </div>
            
            ${attack ? `<p class="mb-4"><strong>${attack.name}</strong></p>` : ''}
            
            <p class="text-lg font-bold mb-4">💥 Dégâts: ${damage}</p>
            
            <div class="bg-black bg-opacity-30 rounded p-3">
               <p class="mb-2">${defender.name}: ${defenderHP}/${maxDefenderHP} PV</p>
               <div class="w-full bg-gray-600 rounded h-3 overflow-hidden">
                  <div class="h-full transition-all duration-500 ${hpPercentage > 60 ? 'bg-green-500' : hpPercentage > 30 ? 'bg-yellow-500' : 'bg-red-500'}" 
                       style="width: ${hpPercentage}%"></div>
               </div>
               ${defenderHP <= 0 ? '<p class="text-red-300 font-bold mt-2">💀 KO !</p>' : ''}
            </div>
         </div>
      `;

      document.body.appendChild(attackDisplay);
   }

   showChangeCardModal() {
      const attackDisplay = document.getElementById('battle-attack-display');
      if (attackDisplay) attackDisplay.remove();

      const modal = document.createElement('div');
      modal.id = 'change-card-modal';
      this.centerModal(modal);

      modal.innerHTML = `
         <div class="bg-white rounded-lg p-6 max-w-3xl mx-4">
            <h3 class="text-lg font-bold mb-4">Continuer le combat ?</h3>
            <div class="mb-4 p-3 bg-gray-100 rounded">
               <p class="mb-2">PV actuels :</p>
               <p>Vous: ${this.playerHP}/${this.maxPlayerHP}</p>
               <p>Adversaire: ${this.opponentHP}/${this.maxOpponentHP}</p>
            </div>
            <div class="flex space-x-3">
               <button id="change-card-yes" class="flex-1 bg-blue-600 text-white p-3 rounded hover:bg-blue-700">
                  Changer de Pokémon
               </button>
               <button id="change-card-no" class="flex-1 bg-green-600 text-white p-3 rounded hover:bg-green-700">
                  Continuer
               </button>
            </div>
         </div>
      `;

      document.body.appendChild(modal);

      document.getElementById('change-card-yes').onclick = () => {
         this.handleChangeCard(true);
         modal.remove();
      };

      document.getElementById('change-card-no').onclick = () => {
         this.handleChangeCard(false);
         modal.remove();
      };

      modal.onclick = (e) => {
         if (e.target === modal) {
            this.handleChangeCard(false);
            modal.remove();
         }
      };
   }

   showBattleEndModal() {
      const attackDisplay = document.getElementById('battle-attack-display');
      if (attackDisplay) attackDisplay.remove();

      const winner = this.playerHP > 0 ? 'Vous avez gagné' : 'Vous avez perdu';
      const winnerEmoji = this.playerHP > 0 ? '🎉' : '💀';

      const modal = document.createElement('div');
      modal.id = 'battle-end-modal';
      this.centerModal(modal);

      modal.innerHTML = `
         <div class="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
            <h3 class="text-lg font-bold mb-4">${winnerEmoji} ${winner} !</h3>
            <div class="mb-4 p-3 bg-gray-100 rounded">
               <p class="mb-2">Résultat final :</p>
               <p>Vous: ${this.playerHP}/${this.maxPlayerHP} PV</p>
               <p>Adversaire: ${this.opponentHP}/${this.maxOpponentHP} PV</p>
            </div>
            <button id="battle-end-new-cards" class="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">
               🃏 Nouvelles cartes
            </button>
         </div>
      `;

      document.body.appendChild(modal);

      document.getElementById('battle-end-new-cards').onclick = () => {
         this.handleBattleEnd();
         modal.remove();
      };

      modal.onclick = (e) => {
         if (e.target === modal) {
            this.handleBattleEnd();
            modal.remove();
         }
      };
   }

   handleBattleEnd() {
      try {
         console.log("🔄 handleBattleEnd: Redirecting to handleKOsAfterBattle");
         this.handleKOsAfterBattle();
      } catch (error) {
         console.error("Erreur dans handleBattleEnd:", error);
         this.isInBattle = false;
         this.resetBattleHP();
         this.resetSelectedAttacks();
      }
   }

   async handleKOsAfterBattle() {
      // Fermer tous les modals ouverts
      const attackDisplay = document.getElementById('battle-attack-display');
      if (attackDisplay) attackDisplay.remove();

      let playerWasKO = false;
      let opponentWasKO = false;

      // Gérer le KO du joueur
      if (this.playerHP <= 0 && this.game.player.activeCard) {
         console.log("💀 Votre Pokémon est KO !");
         const koCard = this.game.player.activeCard;
         console.log("🃏 Carte KO du joueur:", koCard.name);
         this.game.player.discardCard(koCard);
         this.game.player.activeCard = null;
         this.game.playerActiveZone.setActiveCard(null);
         playerWasKO = true;
         console.log("📚 Défausse joueur après KO:", this.game.player.discardPile.length, "cartes");

         if (this.game.checkDeckOut && this.game.checkDeckOut()) {
            return;
         }
      }

      // Gérer le KO de l'adversaire
      if (this.opponentHP <= 0 && this.game.opponent.activeCard) {
         console.log("💀 Le Pokémon adverse est KO !");
         const koCard = this.game.opponent.activeCard;
         console.log("🃏 Carte KO de l'adversaire:", koCard.name);
         this.game.opponent.discardCard(koCard);
         this.game.opponent.activeCard = null;
         this.game.opponentActiveZone.setActiveCard(null);
         opponentWasKO = true;
         console.log("📚 Défausse adversaire après KO:", this.game.opponent.discardPile.length, "cartes");

         if (this.game.checkDeckOut && this.game.checkDeckOut()) {
            return;
         }
      }

      // Réinitialiser les HP après KO
      this.resetHPAfterKO(playerWasKO, opponentWasKO);
      this.resetSelectedAttacks();

      // Rafraîchir l'UI pour voir les changements dans les défausses
      this.refreshUI();

      // Forcer le rendu des défausses
      console.log("🔄 Forcer le rendu des défausses après KO...");
      if (this.game.renderDiscardPiles) {
         this.game.renderDiscardPiles();
      }

      if (this.game.save) this.game.save();

      // Gérer le remplacement des cartes
      if (playerWasKO && opponentWasKO) {
         // Les deux sont KO - montrer le modal de remplacement
         this.showBothKOModal();
      } else if (playerWasKO) {
         // Seul le joueur est KO - permettre le remplacement
         this.showPlayerKOModal();
      } else if (opponentWasKO) {
         // Seul l'adversaire est KO - remplacement automatique avec délai
         console.log("🤖 Adversaire KO - placement automatique avec délai");
         await this.handleOpponentKOWithDelay();
      }
   }

   async handleOpponentKOWithDelay() {
      console.log("⏳ Délai avant placement automatique de l'adversaire...");
      
      // Attendre 2 secondes avant le placement
      await this.delay(2000);
      
      if (this.game.opponent.hand.cards.length > 0) {
         console.log("🤖 Placement d'une nouvelle carte adverse...");
         
         // Placement direct de la carte
         const randomIndex = Math.floor(Math.random() * this.game.opponent.hand.cards.length);
         const selectedCard = this.game.opponent.hand.cards.splice(randomIndex, 1)[0];
         this.game.opponent.activeCard = selectedCard;
         this.game.opponentActiveZone.setActiveCard(selectedCard);
         
         console.log("✅ Nouvelle carte adverse placée:", selectedCard.name);
         
         // Notification
         this.showOpponentCardPlacedNotification(selectedCard.name);
         
         // Rafraîchir l'UI
         this.game.renderOpponentCards();
         this.refreshUI();
         
         if (this.game.save) this.game.save();
         
         // Attendre 1 seconde supplémentaire puis lancer l'attaque
         console.log("⏳ Attente avant l'attaque de l'adversaire...");
         await this.delay(1000);
         
         console.log("🚀 Lancement automatique de l'attaque adverse...");
         await this.performOpponentAttack();
         
      } else {
         console.log("❌ Aucune carte disponible pour l'adversaire");
         this.showOpponentNoCardsNotification();
      }
   }

   async performOpponentAttack() {
      console.log("🤖 Exécution de l'attaque automatique de l'adversaire...");
      
      const opponentCard = this.game.opponent.activeCard;
      if (!opponentCard || !opponentCard.attacks || opponentCard.attacks.length === 0) {
         console.log("❌ Pas d'attaque disponible pour l'adversaire");
         return;
      }
      
      // Sélectionner une attaque aléatoire
      const randomAttackIndex = Math.floor(Math.random() * opponentCard.attacks.length);
      const selectedAttack = opponentCard.attacks[randomAttackIndex];
      
      console.log("🎯 Attaque sélectionnée:", selectedAttack.name);
      
      // Calculer les dégâts
      const damage = this.calculateDamage(selectedAttack.name, selectedAttack.damage);
      
      // Afficher l'attaque
      this.showOpponentAttackDisplay(selectedAttack.name, damage);
      
      // Attendre avant d'appliquer les dégâts
      await this.delay(2000);
      
      // Appliquer les dégâts au joueur
      this.playerHP = Math.max(0, this.playerHP - damage);
      
      console.log(`💥 L'adversaire attaque avec ${selectedAttack.name} pour ${damage} dégâts`);
      console.log(`❤️ HP du joueur: ${this.playerHP}`);
      
      // Rafraîchir l'UI
      this.refreshUI();
      
      // Sauvegarder
      if (this.game.save) this.game.save();
      
      // Attendre avant de gérer les KO potentiels
      await this.delay(1000);
      
      // Gérer les KO après cette attaque
      if (this.playerHP <= 0) {
         console.log("💀 Le joueur est KO suite à l'attaque automatique !");
         await this.handleKOsAfterBattle();
      }
   }

   showOpponentAttackDisplay(attackName, damage) {
      // Supprimer les anciens displays
      const existingDisplay = document.getElementById('opponent-attack-display');
      if (existingDisplay) existingDisplay.remove();
      
      const attackDisplay = document.createElement('div');
      attackDisplay.id = 'opponent-attack-display';
      attackDisplay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      
      attackDisplay.innerHTML = `
         <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 class="text-xl font-bold mb-4 text-center text-red-600">Attaque de l'adversaire !</h2>
            <div class="text-center space-y-2">
               <div class="text-lg font-semibold">${attackName}</div>
               <div class="text-2xl font-bold text-red-500">${damage} dégâts</div>
            </div>
         </div>
      `;
      
      document.body.appendChild(attackDisplay);
      
      // Supprimer automatiquement après 3 secondes
      setTimeout(() => {
         if (attackDisplay.parentNode) attackDisplay.remove();
      }, 3000);
   }

   resetHPAfterKO(playerWasKO, opponentWasKO) {
      if (playerWasKO && opponentWasKO) {
         this.resetBattleHP();
      } else if (playerWasKO) {
         this.resetPlayerHP();
      } else if (opponentWasKO) {
         this.resetOpponentHP();
      }
   }

   showBothKOModal() {
      const modal = document.createElement('div');
      modal.id = 'both-ko-modal';
      this.centerModal(modal);

      modal.innerHTML = `
         <div class="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
            <h3 class="text-lg font-bold mb-4">💀 Double KO !</h3>
            <p class="mb-4">Les deux Pokémon sont KO ! Placez de nouvelles cartes pour continuer.</p>
            <div class="mb-4 p-3 bg-gray-100 rounded">
               <p class="text-sm text-gray-600">L'adversaire va placer automatiquement une nouvelle carte.</p>
            </div>
            <button id="both-ko-continue" class="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">
               Continuer
            </button>
         </div>
      `;

      document.body.appendChild(modal);

      document.getElementById('both-ko-continue').onclick = async () => {
         modal.remove();
         this.isInBattle = false;

         // L'adversaire place automatiquement une carte
         if (this.game.opponent.hand.cards.length > 0) {
            await this.handleOpponentKO();
         }
      };
   }

   showPlayerKOModal() {
      const modal = document.createElement('div');
      modal.id = 'player-ko-modal';
      this.centerModal(modal);

      modal.innerHTML = `
         <div class="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
            <h3 class="text-lg font-bold mb-4">💀 Votre Pokémon est KO !</h3>
            <p class="mb-4">Votre Pokémon est envoyé dans la défausse. Placez une nouvelle carte de votre main pour continuer.</p>
            <div class="mb-4 p-3 bg-gray-100 rounded">
               <p class="text-sm text-gray-600">Glissez une carte de votre main vers la zone active.</p>
            </div>
            <button id="player-ko-continue" class="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">
               Continuer
            </button>
         </div>
      `;

      document.body.appendChild(modal);

      document.getElementById('player-ko-continue').onclick = () => {
         modal.remove();
         this.isInBattle = false;

         // Afficher une notification pour guider le joueur
         this.showPlayerReplacementNotification();
      };
   }

   showPlayerReplacementNotification() {
      const existingNotification = document.getElementById('player-replacement-notification');
      if (existingNotification) existingNotification.remove();

      const notification = document.createElement('div');
      notification.id = 'player-replacement-notification';
      notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';

      notification.innerHTML = `
         <div class="flex items-center space-x-2">
            <span>🃏</span>
            <span>Glissez une carte de votre main vers la zone active pour continuer !</span>
         </div>
      `;

      document.body.appendChild(notification);

      // Supprimer la notification après 10 secondes
      setTimeout(() => {
         if (notification.parentNode) notification.remove();
      }, 10000);
   }

   async handleOpponentKO() {
      console.log("🔄 Gestion du KO adverse - Cartes en main:", this.game.opponent.hand.cards.length);

      if (this.game.opponent.hand.cards.length > 0) {
         this.showOpponentReplacementNotification();

         await this.delay(1500);

         try {
            console.log("🃏 Tentative de placement automatique de carte adverse...");
            if (this.game.dragAndDrop && this.game.dragAndDrop.autoPlayOpponentCard) {
               console.log("✅ Méthode autoPlayOpponentCard trouvée, exécution...");
               this.game.dragAndDrop.autoPlayOpponentCard();

               console.log("🎯 Carte adverse placée:", this.game.opponent.activeCard ? this.game.opponent.activeCard.name : "AUCUNE");

               // Si le placement automatique a échoué, forcer le placement
               if (!this.game.opponent.activeCard && this.game.opponent.hand.cards.length > 0) {
                  console.log("⚠️ Placement automatique échoué, tentative de force...");
                  this.forceOpponentCardPlacement();
               }

               const notification = document.getElementById('opponent-replacement-notification');
               if (notification) notification.remove();

               this.opponentAttacksFirst = true;
               this.resetSelectedAttacks();

               if (this.game.save) this.game.save();

               await this.delay(500);

               if (this.game.opponent.activeCard && this.game.opponent.activeCard.attacks) {
                  const randomIndex = Math.floor(Math.random() * this.game.opponent.activeCard.attacks.length);
                  this.selectedOpponentAttack = this.game.opponent.activeCard.attacks[randomIndex];

                  if (this.game.save) this.game.save();

                  if (this.game.checkDeckOut && this.game.checkDeckOut()) {
                     return;
                  }

                  if (this.game.player.activeCard && this.game.player.activeCard.attacks) {
                     if (!this.selectedPlayerAttack) {
                        this.selectedPlayerAttack = this.game.player.activeCard.attacks[0];
                        if (this.game.save) this.game.save();
                     }

                     setTimeout(() => {
                        this.startBattle();
                     }, 1000);
                  } else {
                     this.showPlayerAttackSelectionNotification();
                  }
               } else {
                  console.error("❌ L'adversaire n'a pas de carte active ou d'attaques après placement");
               }

            } else {
               console.error("❌ Impossible d'accéder à la méthode autoPlayOpponentCard");
               // Essayer la méthode de force
               this.forceOpponentCardPlacement();
               const notification = document.getElementById('opponent-replacement-notification');
               if (notification) notification.remove();
            }
         } catch (error) {
            console.error("❌ Erreur lors du placement de carte adverse:", error);
            const notification = document.getElementById('opponent-replacement-notification');
            if (notification) notification.remove();
         }

      } else {
         this.showOpponentNoCardsNotification();
      }
   }

   showOpponentReplacementNotification() {
      const existingNotification = document.getElementById('opponent-replacement-notification');
      if (existingNotification) existingNotification.remove();

      const notification = document.createElement('div');
      notification.id = 'opponent-replacement-notification';
      notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';

      notification.innerHTML = `
         <div class="flex items-center space-x-2">
            <span class="animate-spin">🔄</span>
            <span>L'adversaire place une nouvelle carte de son banc...</span>
         </div>
      `;

      document.body.appendChild(notification);
   }

   showOpponentNoCardsNotification() {
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';

      notification.innerHTML = `
         <div class="flex items-center space-x-2">
            <span>❌</span>
            <span>L'adversaire n'a plus de cartes dans son banc!</span>
         </div>
      `;

      document.body.appendChild(notification);

      setTimeout(() => {
         if (notification.parentNode) notification.remove();
      }, 4000);
   }

   showPlayerAttackSelectionNotification() {
      const existingNotification = document.getElementById('player-attack-selection-notification');
      if (existingNotification) existingNotification.remove();

      const notification = document.createElement('div');
      notification.id = 'player-attack-selection-notification';
      notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';

      notification.innerHTML = `
         <div class="flex items-center space-x-2">
            <span>⚔️</span>
            <span>Placez une carte pour combattre ! L'adversaire attaquera en premier.</span>
         </div>
      `;

      document.body.appendChild(notification);

      setTimeout(() => {
         if (notification.parentNode) notification.remove();
      }, 6000);
   }

   async handleChangeCard(shouldChange) {
      if (shouldChange) {
         if (this.game.player.activeCard) {
            this.game.player.hand.cards.push(this.game.player.activeCard);
            this.game.player.activeCard = null;
            this.game.playerActiveZone.setActiveCard(null);
         }

         if (this.game.opponent.activeCard && this.opponentHP <= 0) {
            this.game.opponent.hand.cards.push(this.game.opponent.activeCard);
            this.game.opponent.activeCard = null;
            this.game.opponentActiveZone.setActiveCard(null);

            await this.handleOpponentKO();
         }

         this.game.render();
         this.game.display();

         this.game.playerActiveZone.render();
         this.game.opponentActiveZone.render();

         this.game.addDropListeners(this.game.playerActive, this.game.opponentActive, this.game.handContainer);

         this.resetBattleHP();
         this.resetSelectedAttacks();

      } else {
         setTimeout(() => {
            this.startBattle();
         }, 1000);
      }

      this.game.save && this.game.save();
   }

   resetBattleHP() {
      this.playerHP = null;
      this.opponentHP = null;
      this.maxPlayerHP = null;
      this.maxOpponentHP = null;
   }

   resetPlayerHP() {
      this.playerHP = null;
      this.maxPlayerHP = null;
   }

   resetOpponentHP() {
      this.opponentHP = null;
      this.maxOpponentHP = null;
   }

   resetSelectedAttacks() {
      this.selectedPlayerAttack = null;
      this.selectedOpponentAttack = null;
   }

   calculateDamageFromAttack(attack) {
      if (!attack) return 20;

      if (attack.damage) {
         const damageMatch = attack.damage.toString().match(/\d+/);
         if (damageMatch) {
            return parseInt(damageMatch[0]);
         }
      }

      if (attack.cost && Array.isArray(attack.cost)) {
         return attack.cost.length * 20;
      }

      const attackName = attack.name ? attack.name.toLowerCase() : '';
      if (attackName.includes('punch') || attackName.includes('tackle')) {
         return 25;
      } else if (attackName.includes('thunder') || attackName.includes('fire') || attackName.includes('blast')) {
         return 40;
      } else if (attackName.includes('mega') || attackName.includes('hyper')) {
         return 55;
      }

      return 30;
   }

   delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
   }

   cleanup() {
      ['battle-attack-display', 'change-card-modal', 'battle-end-modal', 'attack-choice-modal',
         'opponent-replacement-notification', 'player-attack-selection-notification',
         'both-ko-modal', 'player-ko-modal', 'player-replacement-notification']
         .forEach(id => {
            const element = document.getElementById(id);
            if (element) element.remove();
         });
   }

   refreshUI() {
      // Rafraîchir l'affichage principal du jeu
      if (this.game.renderCards) this.game.renderCards();
      if (this.game.display) this.game.display();

      // Rafraîchir les zones actives
      if (this.game.playerActiveZone && this.game.playerActiveZone.render) {
         this.game.playerActiveZone.render();
      }
      if (this.game.opponentActiveZone && this.game.opponentActiveZone.render) {
         this.game.opponentActiveZone.render();
      }

      // Rafraîchir spécifiquement les défausses
      if (this.game.playerDiscard && this.game.opponentDiscard) {
         console.log("🔄 Rafraîchissement des défausses...");
         this.game.playerDiscard.setCards(this.game.player.discardPile);
         this.game.opponentDiscard.setCards(this.game.opponent.discardPile);
         console.log("Player discard:", this.game.player.discardPile.length, "cartes");
         console.log("Opponent discard:", this.game.opponent.discardPile.length, "cartes");
      }

      // Rafraîchir les listeners de drag and drop
      if (this.game.addDropListeners && this.game.playerActive && this.game.opponentActive && this.game.handContainer) {
         this.game.addDropListeners(this.game.playerActive, this.game.opponentActive, this.game.handContainer);
      }
   }

   // Méthode de debug pour forcer le placement de carte adverse
   forceOpponentCardPlacement() {
      console.log("🚨 FORCE - Placement de carte adverse");
      console.log("🚨 Cartes en main adversaire:", this.game.opponent.hand.cards.length);
      console.log("🚨 Carte active adversaire avant:", this.game.opponent.activeCard);

      if (this.game.opponent.hand.cards.length > 0) {
         // Forcer la réinitialisation de la carte active
         this.game.opponent.activeCard = null;
         this.game.opponentActiveZone.setActiveCard(null);

         // Placer une carte
         const randomIndex = Math.floor(Math.random() * this.game.opponent.hand.cards.length);
         const selectedCard = this.game.opponent.hand.cards.splice(randomIndex, 1)[0];
         this.game.opponent.activeCard = selectedCard;
         this.game.opponentActiveZone.setActiveCard(selectedCard);

         console.log("🚨 Carte placée de force:", selectedCard.name);
         console.log("🚨 Carte active adversaire après:", this.game.opponent.activeCard);

         // Afficher la notification
         this.showOpponentCardPlacedNotification(selectedCard.name);

         // Refaire le rendu
         this.game.renderOpponentCards();
         this.refreshUI();

         return true;
      }

      console.log("🚨 Aucune carte disponible pour placement");
      return false;
   }

   showOpponentCardPlacedNotification(cardName) {
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';

      notification.innerHTML = `
         <div class="flex items-center space-x-2">
            <span>🃏</span>
            <span>L'adversaire a placé ${cardName} !</span>
         </div>
      `;

      document.body.appendChild(notification);

      setTimeout(() => {
         if (notification.parentNode) notification.remove();
      }, 3000);
   }

   showOpponentNoCardsNotification() {
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';

      notification.innerHTML = `
         <div class="flex items-center space-x-2">
            <span>❌</span>
            <span>L'adversaire n'a plus de cartes !</span>
         </div>
      `;

      document.body.appendChild(notification);

      setTimeout(() => {
         if (notification.parentNode) notification.remove();
      }, 3000);
   }
}

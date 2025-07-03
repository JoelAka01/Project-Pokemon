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

               // Vérifier si l'adversaire a déjà une attaque sélectionnée
               if (this.selectedOpponentAttack) {
                  console.log("🚀 Les deux attaques sont prêtes, lancement du combat");
                  console.log("🔥 L'adversaire attaque en premier:", this.opponentAttacksFirst);
                  setTimeout(() => {
                     this.startBattle();
                  }, 1000);
               } else if (this.game.opponent.activeCard) {
                  // Sélectionner automatiquement une attaque pour l'adversaire
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
         console.log("🔥 Ordre d'attaque - L'adversaire attaque en premier:", this.opponentAttacksFirst);
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
         let playerWasKO = false;
         let opponentWasKO = false;

         if (this.playerHP <= 0 && this.game.player.activeCard) {
            this.game.player.discardCard(this.game.player.activeCard);
            this.game.player.activeCard = null;
            this.game.playerActiveZone.setActiveCard(null);
            playerWasKO = true;

            if (this.game.checkDeckOut && this.game.checkDeckOut()) {
               return;
            }
         }

         if (this.opponentHP <= 0 && this.game.opponent.activeCard) {
            this.game.opponent.discardCard(this.game.opponent.activeCard);
            this.game.opponent.activeCard = null;
            this.game.opponentActiveZone.setActiveCard(null);
            opponentWasKO = true;

            if (this.game.checkDeckOut && this.game.checkDeckOut()) {
               return;
            }

            this.handleOpponentKO();
         }

         this.isInBattle = false;

         this.resetHPAfterKO(playerWasKO, opponentWasKO);
         this.resetSelectedAttacks();

         this.refreshUI();

         if (this.game.save) this.game.save();

         setTimeout(() => {
            if (this.game.checkDeckOut && this.game.checkDeckOut()) {
               return;
            }
         }, 500);

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

         // Afficher la notification de remplacement de l'adversaire
         this.showOpponentReplacementNotification();

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
         // Double KO - l'adversaire pose en premier, puis le joueur
         console.log("💀 Double KO - gestion séquentielle");
         await this.handleDoubleKO();
      } else if (playerWasKO) {
         // Seul le joueur est KO - afficher notification directe
         this.showPlayerReplacementNotification();
      } else if (opponentWasKO) {
         // Seul l'adversaire est KO - remplacement automatique avec délai
         console.log("🤖 Adversaire KO - placement automatique avec délai");
         await this.handleOpponentKOWithDelay();
      }
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

                  // L'adversaire attaque en premier après un KO
                  console.log("🚀 L'adversaire attaque en premier après KO");
                  setTimeout(() => {
                     this.performOpponentAttack();
                  }, 1000);
               } else {
                  console.error("❌ L'adversaire n'a pas de carte active ou d'attaques après placement");
               }

            } else {
               console.error("❌ Impossible d'accéder à la méthode autoPlayOpponentCard");
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

         this.refreshUI();

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

   resetHPAfterKO(playerWasKO, opponentWasKO) {
      if (playerWasKO && opponentWasKO) {
         this.resetBattleHP();
      } else if (playerWasKO) {
         this.resetPlayerHP();
      } else if (opponentWasKO) {
         this.resetOpponentHP();
      }
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
         'player-replacement-notification', 'opponent-attack-display', 'double-ko-notification']
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

   async handleOpponentKOWithDelay() {
      console.log("⏳ Délai avant placement automatique de l'adversaire...");

      if (this.game.opponent.hand.cards.length > 0) {
         // Attendre 4 secondes avant le placement
         await this.delay(4000);

         console.log("🤖 Placement d'une nouvelle carte adverse...");

         // Placement direct de la carte
         const randomIndex = Math.floor(Math.random() * this.game.opponent.hand.cards.length);
         const selectedCard = this.game.opponent.hand.cards.splice(randomIndex, 1)[0];
         this.game.opponent.activeCard = selectedCard;
         this.game.opponentActiveZone.setActiveCard(selectedCard);

         console.log("✅ Nouvelle carte adverse placée:", selectedCard.name);

         // Supprimer la notification de placement
         const replacementNotification = document.getElementById('opponent-replacement-notification');
         if (replacementNotification) replacementNotification.remove();

         // Notification de carte placée
         this.showOpponentCardPlacedNotification(selectedCard.name);

         // Rafraîchir l'UI
         if (this.game.renderOpponentCards) {
            this.game.renderOpponentCards();
         }
         this.refreshUI();

         if (this.game.save) this.game.save();

         // Attendre 1 seconde supplémentaire puis lancer l'attaque
         console.log("⏳ Attente avant l'attaque de l'adversaire...");
         await this.delay(1000);

         console.log("🚀 Lancement automatique de l'attaque adverse avec affichage...");
         
         // Vérifier si la carte a des attaques
         if (!selectedCard.attacks || selectedCard.attacks.length === 0) {
            console.log("❌ La carte adverse n'a pas d'attaques disponibles");
            return;
         }

         // Sélectionner une attaque aléatoire pour l'adversaire
         const randomAttackIndex = Math.floor(Math.random() * selectedCard.attacks.length);
         const selectedAttack = selectedCard.attacks[randomAttackIndex];
         this.selectedOpponentAttack = selectedAttack;

         console.log("🎯 Attaque adverse sélectionnée:", selectedAttack.name);

         // Calculer les dégâts
         const damage = this.calculateDamageFromAttack(selectedAttack);
         console.log("💥 Dégâts de l'attaque adverse:", damage);

         // Afficher l'attaque adverse avec showOpponentAttackDisplay
         this.showOpponentAttackDisplay(selectedAttack.name, damage);

         // Sauvegarder l'état
         if (this.game.save) this.game.save();

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

      // Vérifier si le joueur a une carte active
      if (!this.game.player.activeCard) {
         console.log("❌ Le joueur n'a pas de carte active");
         this.showPlayerAttackSelectionNotification();
         return;
      }

      // Sélectionner une attaque aléatoire pour l'adversaire
      const randomAttackIndex = Math.floor(Math.random() * opponentCard.attacks.length);
      const selectedAttack = opponentCard.attacks[randomAttackIndex];
      this.selectedOpponentAttack = selectedAttack;

      console.log("🎯 Attaque adverse sélectionnée:", selectedAttack.name);

      // Calculer et appliquer les dégâts de l'attaque adverse uniquement
      const damage = this.calculateDamageFromAttack(selectedAttack);
      console.log("💥 Dégâts de l'attaque adverse:", damage);

      // Afficher l'attaque adverse
      this.showOpponentAttackDisplay(selectedAttack.name, damage);

      // Appliquer les dégâts au joueur
      if (!this.playerHP) {
         this.playerHP = this.game.player.activeCard.hp;
         this.maxPlayerHP = this.game.player.activeCard.hp;
      }

      this.playerHP -= damage;
      console.log("❤️ HP joueur après attaque:", this.playerHP);

      // Attendre un peu pour l'affichage
      await this.delay(3000);

      // Vérifier si le joueur est KO
      if (this.playerHP <= 0) {
         console.log("💀 Le joueur est KO après l'attaque adverse");
         
         // Déplacer la carte du joueur vers la défausse
         if (this.game.player.activeCard) {
            this.game.player.discardPile.push(this.game.player.activeCard);
            this.game.player.activeCard = null;
            this.game.playerActiveZone.setActiveCard(null);
         }

         // Réinitialiser les HP et attaques
         this.resetBattleHP();
         this.resetSelectedAttacks();

         // Rafraîchir l'UI
         this.refreshUI();

         // Sauvegarder et afficher notification
         if (this.game.save) this.game.save();
         this.showPlayerReplacementNotification();
         
      } else {
         // Le joueur survit, c'est maintenant à son tour d'attaquer
         console.log("✅ Le joueur survit, c'est son tour d'attaquer");
         
         // Réinitialiser les attaques pour le prochain tour
         this.resetSelectedAttacks();
         
         // Afficher la modal de choix d'attaque pour le joueur
         if (this.game.player.activeCard && this.game.player.activeCard.attacks) {
            setTimeout(() => {
               this.showAttackChoiceModal(this.game.player.activeCard, true);
            }, 1000);
         }
      }

      // Sauvegarder l'état
      if (this.game.save) this.game.save();
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

   // Vérifier l'état de restauration après un refresh
   checkStateAfterRefresh() {
      console.log("🔄 Vérification de l'état après refresh...");

      const playerCard = this.game.player.activeCard;
      const opponentCard = this.game.opponent.activeCard;

      // Si on est dans un état de bataille et qu'on a des cartes actives
      if (this.battlePhase === 'selecting-attacks' && playerCard && opponentCard) {
         console.log("🎯 Restauration de la sélection d'attaque après refresh");

         // Si le joueur n'a pas encore sélectionné d'attaque, afficher la modal
         if (!this.selectedPlayerAttack && this.attackSelectionStarted) {
            setTimeout(() => {
               this.showAttackChoiceModal(playerCard, true);
            }, 500);
         }
      }

      // Si on est en cours de combat mais qu'il manque des sélections d'attaque
      else if (this.isInBattle && playerCard && opponentCard && !this.selectedPlayerAttack) {
         console.log("🎯 Restauration de la sélection d'attaque en cours de combat");

         setTimeout(() => {
            this.showAttackChoiceModal(playerCard, true);
         }, 500);
      }

      // Si on a les deux cartes mais pas d'attaques sélectionnées et qu'on n'est pas en bataille
      else if (playerCard && opponentCard && !this.selectedPlayerAttack && !this.selectedOpponentAttack && !this.isInBattle) {
         setTimeout(() => {
            this.showAttackChoiceModal(playerCard, true);
         }, 500);
      }
   }

   async handleDoubleKO() {
      console.log("💀💀 Gestion du double KO...");

      // Afficher une notification de double KO (non bloquante)
      this.showDoubleKONotification();

      // Attendre 2 secondes pour la notification
      await this.delay(2000);

      // L'adversaire place sa carte en premier
      if (this.game.opponent.hand.cards.length > 0) {
         console.log("🤖 L'adversaire place sa carte en premier (double KO)");
         
         // Placement automatique de la carte adverse
         const randomIndex = Math.floor(Math.random() * this.game.opponent.hand.cards.length);
         const opponentCard = this.game.opponent.hand.cards.splice(randomIndex, 1)[0];
         this.game.opponent.activeCard = opponentCard;
         this.game.opponentActiveZone.setActiveCard(opponentCard);

         console.log("✅ Carte adverse placée:", opponentCard.name);
         
         // Notification que l'adversaire a placé sa carte
         this.showOpponentCardPlacedNotification(opponentCard.name);

         // Rafraîchir l'UI
         this.refreshUI();

         // Attendre 1 seconde puis l'adversaire attaque
         await this.delay(1000);
         
         console.log("🚀 L'adversaire attaque en premier après double KO");
         await this.performOpponentAttack();
         
      } else {
         // L'adversaire n'a pas de carte, donc seulement le joueur doit placer
         console.log("❌ L'adversaire n'a pas de carte, seul le joueur doit placer");
         this.showPlayerReplacementNotification();
      }

      // Sauvegarder l'état
      if (this.game.save) this.game.save();
   }

   showDoubleKONotification() {
      const notification = document.createElement('div');
      notification.id = 'double-ko-notification';
      notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';

      notification.innerHTML = `
         <div class="flex items-center space-x-2">
            <span>💀💀</span>
            <span>Double KO ! L'adversaire place sa carte et attaque en premier...</span>
         </div>
      `;

      document.body.appendChild(notification);

      // Supprimer automatiquement après 3 secondes
      setTimeout(() => {
         if (notification.parentNode) notification.remove();
      }, 3000);
   }
}

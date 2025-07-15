// (Suppression de l'accolade fermante superflue)
import { AttackModal } from './modals/AttackModal.js';
import { GameModal } from './modals/GameModal.js';
import { NotificationModal } from './modals/NotificationModal.js';
import { BattleEndModal } from './modals/BattleEndModal.js';

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

      this.playerCardHP = {};
      this.opponentCardHP = {};
   }

   showAttackModal(card, isPlayer = true) {
      if (!card || !card.attacks || card.attacks.length === 0) {
         return;
      }

      this.attackSelectionStarted = true;
      this.battlePhase = 'selecting-attacks';

      if (this.game.save) this.game.save();

      const modal = AttackModal.show(card, isPlayer);

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

   }

   selectOpponentAttack() {
      const opponentCard = this.game.opponent.activeCard;
      if (!opponentCard || !opponentCard.attacks || opponentCard.attacks.length === 0) {
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
         return;
      }

      if (this.playerHP === null || this.opponentHP === null) {
         const resetPlayerHP = this.playerHP === null;
         const resetOpponentHP = this.opponentHP === null;
         this.initBattleHP(playerCard, opponentCard, resetPlayerHP, resetOpponentHP);
      }

      this.isInBattle = true;

      if (this.game.save) this.game.save();

      try {
         // Nouvelle séquence centralisée :
         // 1. Si opponentAttacksFirst, l'adversaire attaque d'abord
         // 2. Si le joueur est KO, il peut riposter UNIQUEMENT si opponentAttacksFirst était true
         // 3. Sinon, séquence normale

         if (this.opponentAttacksFirst) {
            this.battlePhase = 'opponent-attack';
            await this.opponentAttack();

            await this.delay(1000);

            // Si le joueur est KO, il peut riposter (riposte post-KO)
            if (this.playerHP <= 0) {
               // On autorise une seule riposte, puis on gère les KO
               await this.playerAutoAttack(true); // true = riposte post-KO
               await this.handleKOs();
               this.opponentAttacksFirst = false;
               return;
            }

            // Sinon, afficher la modal d'attaque du joueur pour qu'il choisisse son attaque
            if (this.game.player.activeCard && this.game.opponent.activeCard) {
               this.showAttackModal(this.game.player.activeCard, true);
            }

            this.opponentAttacksFirst = false;
            return;
         }

         // Séquence normale : joueur attaque puis adversaire
         this.battlePhase = 'player-attack';
         await this.playerAttack(playerCard, opponentCard);
         await this.delay(1000);

         this.battlePhase = 'opponent-attack';
         await this.opponentAttack();

         await this.delay(1000);


         // Après les deux attaques, on gère les KO (y compris double KO, remplacement, etc.)
         await this.handleKOs();

         this.battlePhase = 'finished';

         // S'assurer que la modal d'attaque est retirée avant d'afficher la modal "changer de Pokémon"
         const attackDisplay = document.getElementById('battle-attack-display');
         if (attackDisplay) attackDisplay.remove();

         // Afficher la modal "changer de Pokémon" uniquement si le joueur a encore des HP
         if (this.playerHP > 0) {
            this.showChangeModal();
            if (this.game.save) this.game.save();
         }
      } catch (error) {
      } finally {
         this.isInBattle = false;
      }
   }

   initBattleHP(playerCard, opponentCard, resetPlayerHP = false, resetOpponentHP = false) {
      const newMaxPlayerHP = parseInt(playerCard.hp) || 100;
      const newMaxOpponentHP = parseInt(opponentCard.hp) || 100;

      const playerId = playerCard.id || playerCard.name;
      const opponentId = opponentCard.id || opponentCard.name;

      if (this.playerHP === null || resetPlayerHP) {
         this.maxPlayerHP = newMaxPlayerHP;
         this.playerHP = this.playerCardHP[playerId] !== undefined ? this.playerCardHP[playerId] : this.maxPlayerHP;
      } else {
         this.maxPlayerHP = newMaxPlayerHP;
      }

      if (this.opponentHP === null || resetOpponentHP) {
         this.maxOpponentHP = newMaxOpponentHP;
         this.opponentHP = this.opponentCardHP[opponentId] !== undefined ? this.opponentCardHP[opponentId] : this.maxOpponentHP;
      } else {
         this.maxOpponentHP = newMaxOpponentHP;
      }

      if (this.game.save) this.game.save();
   }

   async playerAttack(playerCard, opponentCard) {
      const playerAttack = this.selectedPlayerAttack || (playerCard.attacks && playerCard.attacks[0]);
      const damage = this.calcDamage(playerAttack);

      this.opponentHP = Math.max(0, this.opponentHP - damage);
      const opponentId = opponentCard.id || opponentCard.name;
      this.opponentCardHP[opponentId] = this.opponentHP;

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

   async opponentAttack(opponentCard, playerCard) {
      const opponentAttack = this.selectedOpponentAttack || (opponentCard.attacks && opponentCard.attacks[0]);
      const damage = this.calcDamage(opponentAttack);

      // Initialiser playerHP à la valeur max AVANT d'appliquer les dégâts
      if (this.playerHP === null) {
         this.maxPlayerHP = parseInt(playerCard.hp) || 100;
         this.playerHP = this.maxPlayerHP;
      }
      this.playerHP = Math.max(0, this.playerHP - damage);
      const playerId = playerCard.id || playerCard.name;
      this.playerCardHP[playerId] = this.playerHP;

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
      return AttackModal.showDisplay({
         attacker, defender, attack, damage, isPlayer, message, defenderHP, maxDefenderHP
      });
   }

   showChangeModal() {
      const modal = GameModal.showChangeCard(this.playerHP, this.maxPlayerHP, this.opponentHP, this.maxOpponentHP);

      if (modal) {
         const yesBtn = modal.querySelector('#change-card-yes');
         const noBtn = modal.querySelector('#change-card-no');
         if (yesBtn) {
            yesBtn.onclick = () => {
               this.changeCard(true);
               modal.remove();
            };
         }
         if (noBtn) {
            noBtn.onclick = () => {
               this.changeCard(false);
               modal.remove();
            };
         }
         modal.onclick = (e) => {
            if (e.target === modal) {
               this.changeCard(false);
               modal.remove();
            }
         };
      }
   }

   showEndModal() {
      const attackDisplay = document.getElementById('battle-attack-display');
      if (attackDisplay) attackDisplay.remove();

      let result;
      if (this.playerHP <= 0 && this.opponentHP <= 0) {
         result = 'draw';
      } else if (this.playerHP > 0) {
         result = 'victory';
      } else {
         result = 'defeat';
      }

      BattleEndModal.show(
         result,
         this.playerHP || 0,
         this.maxPlayerHP || 100,
         this.opponentHP || 0,
         this.maxOpponentHP || 100,
         () => this.handleBattleEnd()
      );
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
         this.resetAttacks();

         this.refreshUI();

         if (this.game.save) this.game.save();

         setTimeout(() => {
            if (this.game.checkDeckOut && this.game.checkDeckOut()) {
               return;
            }
         }, 500);
      } catch (error) {
         this.isInBattle = false;
         this.resetBattleHP();
         this.resetAttacks();
      }
   }

   async handleKOs() {
      const attackDisplay = document.getElementById('battle-attack-display');
      if (attackDisplay) attackDisplay.remove();

      let playerWasKO = false;
      let opponentWasKO = false;

      // Gestion simple du double KO via une méthode dédiée
      if (this.playerHP <= 0 && this.opponentHP <= 0) {
         await this.handleDoubleKO();
         return;
      }

      // KO joueur seul
      if (this.playerHP <= 0 && this.game.player.activeCard) {
         const koCard = this.game.player.activeCard;
         this.game.player.discardCard(koCard);
         this.game.player.activeCard = null;
         this.game.playerActiveZone.setActiveCard(null);
         playerWasKO = true;
      }
      // KO adversaire seul
      if (this.opponentHP <= 0 && this.game.opponent.activeCard) {
         const koCard = this.game.opponent.activeCard;
         this.game.opponent.discardCard(koCard);
         this.game.opponent.activeCard = null;
         this.game.opponentActiveZone.setActiveCard(null);
         opponentWasKO = true;
      }

      // Vérifier victoire après KO simple
      const gameEnded = this.checkWin();
      if (gameEnded) {
         return;
      }
      if (this.game.checkDeckOut && this.game.checkDeckOut()) {
         return;
      }

      // Si KO adverse, tenter le remplacement
      if (opponentWasKO && this.game.opponent.hand.cards.length > 0) {
         this._opponentReplacing = true;
         this._opponentJustReplaced = true;
         NotificationModal.showOpponentReplacementNotification();
         await this.opponentKOWithDelay();
         this._opponentReplacing = false;
         this._opponentJustReplaced = false;
      } else if (opponentWasKO) {
         this._opponentReplacing = false;
         this._opponentJustReplaced = false;
      }

      this.resetHPAfterKO(playerWasKO, opponentWasKO);
      this.resetAttacks();
      this.refreshUI();
      if (this.game.renderDiscardPiles) {
         this.game.renderDiscardPiles();
      }
      if (this.game.save) this.game.save();

      if (playerWasKO) {
         this.showPlayerReplacementNotification();
      }

      const gameEnded2 = this.checkWin();
      if (gameEnded2) {
         return;
      }
   }

   checkWin() {
      const playerDiscardCount = this.game.player.discardPile.length;
      const opponentDiscardCount = this.game.opponent.discardPile.length;

      if (playerDiscardCount >= 5) {
         BattleEndModal.showWithCustomMessage("defeat", "Vous avez perdu ! Vous avez 5 cartes dans votre défausse.", 0, 100, 100, 100, () => {
            if (this.game.resetGame) {
               this.game.resetGame();
            } else {
               location.reload();
            }
         });
         return true;
      }

      if (opponentDiscardCount >= 5) {
         BattleEndModal.showWithCustomMessage("victory", "Félicitations ! L'adversaire a 5 cartes dans sa défausse.", 100, 100, 0, 100, () => {
            if (this.game.resetGame) {
               this.game.resetGame();
            } else {
               location.reload();
            }
         });
         return true;
      }

      return false;
   }

   async changeCard(shouldChange) {
      if (shouldChange) {
         if (this.game.player.activeCard) {
            const playerId = this.game.player.activeCard.id || this.game.player.activeCard.name;
            this.playerCardHP[playerId] = this.playerHP;

            this.game.player.hand.cards.push(this.game.player.activeCard);
            this.game.player.activeCard = null;
            this.game.playerActiveZone.setActiveCard(null);
         }

         this.resetPlayerHP();
         this.resetAttacks();
         this.refreshUI();
         this.game.addDropListeners(this.game.playerActive, this.game.opponentActive, this.game.handContainer);
      } else {
         setTimeout(() => {
            this.startBattle();
         }, 1000);
      }

      this.game.save && this.game.save();
   }

   resetHP() {
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

   resetAttacks() {
      this.selectedPlayerAttack = null;
      this.selectedOpponentAttack = null;
   }

   resetHPAfterKO(playerWasKO, opponentWasKO) {
      if (playerWasKO && opponentWasKO) {
         this.resetHP();
      } else if (playerWasKO) {
         this.resetPlayerHP();
      } else if (opponentWasKO) {
         this.resetOpponentHP();
      }
   }

   calcDamage(attack) {
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
      if (this.game.opponentHand && this.game.opponent) {
         this.game.opponentHand.cards = this.game.opponent.hand.cards;
      }
      if (this.game.renderCards) this.game.renderCards();
      if (this.game.renderOpponentCards) this.game.renderOpponentCards();
      if (this.game.display) this.game.display();

      if (this.game.playerActiveZone && this.game.playerActiveZone.render) {
         this.game.playerActiveZone.render();
      }
      if (this.game.opponentActiveZone && this.game.opponentActiveZone.render) {
         this.game.opponentActiveZone.render();
      }

      if (this.game.playerDiscard && this.game.opponentDiscard) {
         this.game.playerDiscard.setCards(this.game.player.discardPile);
         this.game.opponentDiscard.setCards(this.game.opponent.discardPile);
      }

      if (this.game.addDropListeners && this.game.playerActive && this.game.opponentActive && this.game.handContainer) {
         this.game.addDropListeners(this.game.playerActive, this.game.opponentActive, this.game.handContainer);
      }
   }

   async opponentKOWithDelay() {
      if (this.game.opponent.hand.cards.length === 0) return;

      // Remplacement immédiat de la carte adverse KO
      const randomIndex = Math.floor(Math.random() * this.game.opponent.hand.cards.length);
      const selectedCard = this.game.opponent.hand.cards.splice(randomIndex, 1)[0];
      this.game.opponent.activeCard = selectedCard;
      this.game.opponentActiveZone.setActiveCard(selectedCard);

      const replacementNotification = document.getElementById('opponent-replacement-notification');
      if (replacementNotification) replacementNotification.remove();

      if (this.game.renderOpponentCards) this.game.renderOpponentCards();
      this.refreshUI();
      if (this.game.save) this.game.save();

      await this.delay(1000);
      if (!selectedCard.attacks || selectedCard.attacks.length === 0) return;

      // L'adversaire attaque TOUJOURS en premier après remplacement
      const randomAttackIndex = Math.floor(Math.random() * selectedCard.attacks.length);
      const selectedAttack = selectedCard.attacks[randomAttackIndex];
      this.selectedOpponentAttack = selectedAttack;
      const damage = this.calcDamage(selectedAttack);

      if (this.playerHP === null && this.game.player.activeCard) {
         this.playerHP = parseInt(this.game.player.activeCard.hp) || 100;
         this.maxPlayerHP = this.playerHP;
      }
      this.playerHP = Math.max(0, this.playerHP - damage);

      this.showAttackDisplay({
         attacker: selectedCard,
         defender: this.game.player.activeCard,
         attack: selectedAttack,
         damage: damage,
         isPlayer: false,
         message: `${selectedCard.name} utilise ${selectedAttack.name} sur ${this.game.player.activeCard.name} !`,
         defenderHP: this.playerHP,
         maxDefenderHP: this.maxPlayerHP
      });

      await this.delay(3000);



      // Après l'attaque adverse, le joueur doit attaquer automatiquement s'il a une carte active
      if (this.game.player.activeCard) {
         this.selectedPlayerAttack = null;
         // Supprimer tout display/modal d'attaque du joueur avant d'attaquer automatiquement
         const attackDisplay = document.getElementById('battle-attack-display');
         if (attackDisplay) attackDisplay.remove();
         const attackModal = document.getElementById('attack-choice-modal');
         if (attackModal) attackModal.remove();
         // Toujours forcer l'attaque du joueur, même à 0 HP, tant qu'il a une carte active
         await this.playerAutoAttack(true); // true = riposte post-KO, donc attaque toujours

         // Après l'attaque auto du joueur, gérer tous les KO (y compris double KO)
         const playerKO = this.playerHP <= 0 && this.game.player.activeCard;
         const opponentKO = this.opponentHP <= 0 && this.game.opponent.activeCard;
         if (playerKO || opponentKO) {
            await this.handleKOs();
         }
      } else {
         await this.handleKOs();
      }

      if (this.game.save) this.game.save();
   }

   async opponentAttack() {
      const opponentCard = this.game.opponent.activeCard;
      if (!opponentCard || !opponentCard.attacks || opponentCard.attacks.length === 0) {
         return;
      }

      if (!this.game.player.activeCard) {
         NotificationModal.showPlayerAttackSelectionNotification();
         return;
      }


      const randomAttackIndex = Math.floor(Math.random() * opponentCard.attacks.length);
      const selectedAttack = opponentCard.attacks[randomAttackIndex];
      this.selectedOpponentAttack = selectedAttack;

      const damage = this.calcDamage(selectedAttack);

      // Initialiser les HP si nécessaire
      if (!this.playerHP) {
         this.playerHP = parseInt(this.game.player.activeCard.hp) || 100;
         this.maxPlayerHP = this.playerHP;
      }

      // Appliquer les dégâts AVANT d'afficher la modal
      this.playerHP = Math.max(0, this.playerHP - damage);

      this.showAttackDisplay({
         attacker: opponentCard,
         defender: this.game.player.activeCard,
         attack: selectedAttack,
         damage: damage,
         isPlayer: false,
         message: `${opponentCard.name} utilise ${selectedAttack.name} sur ${this.game.player.activeCard.name} !`,
         defenderHP: this.playerHP,
         maxDefenderHP: this.maxPlayerHP
      });

      await this.delay(3000);

      // Si le joueur est KO, il doit quand même finir d'attaquer
      if (this.playerHP <= 0) {
         // ✅ Vérifier si double KO
         if (this.opponentHP <= 0) {
            await this.handleDoubleKO();
            return;
         }

         // Sinon, KO joueur seul
         if (this.game.player.activeCard && this.game.opponent.activeCard && !this._playerAutoAttackInProgress) {
            await this.playerAutoAttack();
         }

         if (this.game.player.activeCard) {
            this.game.player.discardPile.push(this.game.player.activeCard);
            this.game.player.activeCard = null;
            this.game.playerActiveZone.setActiveCard(null);

            const gameEnded = this.checkWin();
            if (gameEnded) return;
         }

         this.resetBattleHP();
         this.resetAttacks();
         this.refreshUI();

         const gameEnded = this.checkWin();
         if (gameEnded) return;

         if (this.game.save) this.game.save();
         this.showPlayerReplacementNotification();
      }
      else {
         // Le joueur survit, c'est maintenant à son tour d'attaquer

         // Réinitialiser les attaques pour le prochain tour
         this.resetAttacks();

         // Ouvrir la modal d'attaque du joueur pour le tour suivant UNIQUEMENT si aucune attaque n'est sélectionnée
         // if (this.game.player.activeCard && this.game.opponent.activeCard && !this.selectedPlayerAttack) {
         //    setTimeout(() => {
         //       this.showAttackModal(this.game.player.activeCard, true);
         //    }, 500);
         // }
      }

      // Sauvegarder l'état
      if (this.game.save) this.game.save();
   }

   async playerAutoAttack() {
      if (this._playerAutoAttackInProgress) return;
      this._playerAutoAttackInProgress = true;

      // On ajoute un paramètre pour forcer la riposte post-KO
      let isRiposte = false;
      if (arguments.length > 0 && arguments[0] === true) isRiposte = true;

      // Si le joueur n'a pas de carte active, il ne doit pas attaquer
      if (!this.game.player.activeCard) {
         this._playerAutoAttackInProgress = false;
         return;
      }

      // Si le joueur a 0 HP, il doit attaquer si isRiposte est true (post-KO), sinon ne pas attaquer
      if (this.playerHP !== null && this.playerHP <= 0) {
         if (!isRiposte) {
            this._playerAutoAttackInProgress = false;
            return;
         }
         // Si isRiposte, on laisse passer pour attaquer même à 0 HP
      }

      const playerCard = this.game.player.activeCard;
      if (!playerCard || !playerCard.attacks || playerCard.attacks.length === 0) {
         this._playerAutoAttackInProgress = false;
         return;
      }

      // Vérifier si l'adversaire a une carte active
      if (!this.game.opponent.activeCard) {
         this._playerAutoAttackInProgress = false;
         return;
      }

      // Utiliser l'attaque déjà sélectionnée ou prendre la première
      let selectedAttack = this.selectedPlayerAttack;
      if (!selectedAttack) {
         selectedAttack = playerCard.attacks[0];
         this.selectedPlayerAttack = selectedAttack;
      }

      // Calculer et appliquer les dégâts
      const damage = this.calcDamage(selectedAttack);

      // Initialiser HP adversaire si nécessaire
      if (this.opponentHP === null && this.game.opponent.activeCard) {
         this.opponentHP = parseInt(this.game.opponent.activeCard.hp) || 100;
         this.maxOpponentHP = this.opponentHP;
      }

      // Appliquer les dégâts
      this.opponentHP = Math.max(0, this.opponentHP - damage);

      // Afficher l'attaque du joueur
      this.showAttackDisplay({
         attacker: playerCard,
         defender: this.game.opponent.activeCard,
         attack: selectedAttack,
         damage: damage,
         isPlayer: true,
         message: `${playerCard.name} utilise ${selectedAttack.name} sur ${this.game.opponent.activeCard.name} !`,
         defenderHP: this.opponentHP,
         maxDefenderHP: this.maxOpponentHP
      });

      // Sauvegarder l'état
      if (this.game.save) this.game.save();

      await this.delay(3000);

      // Nouveau bloc de vérification après attaque
      if (this.playerHP <= 0 && this.opponentHP <= 0) {
         await this.handleDoubleKO();
      } else if (this.opponentHP <= 0 || this.playerHP <= 0) {
         await this.handleKOs();
      } else {
         if (!isRiposte) {
            this.showChangeModal();
         }
      }

      this._playerAutoAttackInProgress = false;
   }

   checkStateAfterRefresh() {
      const playerCard = this.game.player.activeCard;
      const opponentCard = this.game.opponent.activeCard;

      // Ouvre la modal de choix d'attaque dès qu'une carte active est posée côté joueur,
      // mais ne lance pas l'attaque automatiquement.
      if (playerCard && opponentCard && !this.selectedPlayerAttack && !this.isInBattle) {
         setTimeout(() => {
            this.showAttackModal(playerCard, true);
         }, 500);
      }
   }

   async handleDoubleKO() {
      // Retirer les deux cartes actives (joueur et adversaire) et mettre à jour l'UI
      // Toujours retirer la carte du joueur si présente
      if (this.game.player.activeCard) {
         this.game.player.discardCard(this.game.player.activeCard);
         this.game.player.activeCard = null;
      }
      // Toujours retirer la carte adverse si présente
      if (this.game.opponent.activeCard) {
         this.game.opponent.discardCard(this.game.opponent.activeCard);
         this.game.opponent.activeCard = null;
      }
      // Si la carte adverse n'est plus dans activeCard mais reste dans la zone active, forcer le retrait visuel et logique
      if (this.game.opponentActiveZone && this.game.opponentActiveZone.activeCard) {
         // On retire la carte de la zone active adverse et on la met dans la défausse si ce n'est pas déjà fait
         const card = this.game.opponentActiveZone.activeCard;
         if (!this.game.opponent.discardPile.includes(card)) {
            this.game.opponent.discardCard(card);
         }
         this.game.opponentActiveZone.setActiveCard(null);
      }
      if (this.game.playerActiveZone && this.game.playerActiveZone.activeCard) {
         const card = this.game.playerActiveZone.activeCard;
         if (!this.game.player.discardPile.includes(card)) {
            this.game.player.discardCard(card);
         }
         this.game.playerActiveZone.setActiveCard(null);
      }
      if (this.game.renderDiscardPiles) this.game.renderDiscardPiles();
      NotificationModal.showDoubleKONotification();
      await this.delay(2000);
      this.resetHP();
      this.resetAttacks();
      this.refreshUI();
      if (this.game.save) this.game.save();
      const gameEndedDouble = this.checkWin();
      if (gameEndedDouble) return;
      this.showPlayerReplacementNotification();
   }

   showPlayerReplacementNotification() {
      const gameEnded = this.checkWin();
      if (gameEnded) {
         return;
      }

      if (!this.game.player.hand.cards || this.game.player.hand.cards.length === 0) {
         this.showPlayerNoCardsNotification();
         return;
      }

      NotificationModal.showChangeCardModal();
   }

   showPlayerNoCardsNotification() {
      const gameEnded = this.checkWin();
      if (gameEnded) {
         return;
      }

      NotificationModal.showPlayerNoCardsNotification();

      setTimeout(() => {
         const finalGameEnded = this.checkWin();
         if (!finalGameEnded) {
            BattleEndModal.showWithCustomMessage("defeat", "Vous avez perdu ! Vous n'avez plus de cartes en main.", 0, 100, 100, 100, () => {
               if (this.game.resetGame) {
                  this.game.resetGame();
               } else {
                  location.reload();
               }
            });
         }

         if (this.game.checkDeckOut && this.game.checkDeckOut()) {
            return;
         }
      }, 4000);
   }

   async handleOpponentKO() {
      if (this.game.opponent.hand.cards.length > 0) {
         NotificationModal.showOpponentReplacementNotification();
         await this.delay(3000);
         if (this.game.player.activeCard && !this._playerAutoAttackInProgress) {
            await this.playerAutoAttack();
         } else {
            await this.handleKOs();
         }
         const notification = document.getElementById('opponent-replacement-notification');
         if (notification) notification.remove();

         this.opponentAttacksFirst = true;
         this.resetAttacks();

         if (this.game.save) this.game.save();

         await this.delay(500);

         if (this.game.opponent.activeCard && this.game.opponent.activeCard.attacks) {
            const randomIndex = Math.floor(Math.random() * this.game.opponent.activeCard.attacks.length);
            this.selectedOpponentAttack = this.game.opponent.activeCard.attacks[randomIndex];

            if (this.game.save) this.game.save();

            if (this.game.checkDeckOut && this.game.checkDeckOut()) {
               return;
            }

            // Calculer les dégâts et appliquer au joueur
            const damage = this.calcDamage(this.selectedOpponentAttack);

            // Initialiser HP joueur si nécessaire
            if (!this.playerHP && this.game.player.activeCard) {
               this.playerHP = parseInt(this.game.player.activeCard.hp) || 100;
               this.maxPlayerHP = this.playerHP;
            }

            this.playerHP = Math.max(0, this.playerHP - damage);

            setTimeout(() => {
               this.showAttackDisplay({
                  attacker: this.game.opponent.activeCard,
                  defender: this.game.player.activeCard,
                  attack: this.selectedOpponentAttack,
                  damage: damage,
                  isPlayer: false,
                  message: `${this.game.opponent.activeCard.name} utilise ${this.selectedOpponentAttack.name} sur ${this.game.player.activeCard.name} !`,
                  defenderHP: this.playerHP,
                  maxDefenderHP: this.maxPlayerHP
               });

               setTimeout(() => {
                  if (this.game.player.activeCard && !this._playerAutoAttackInProgress) {
                     this.playerAutoAttack();
                  }
               }, 3000);
            }, 1000);
         }
      }
   }
}

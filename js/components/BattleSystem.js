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
      this.attackSelectionStarted = false;

      this.playerCardHP = {};
      this.opponentCardHP = {};

      // Flags pour contrôler le flux de combat
      this.isResolvingKO = false;
      this.isPostKOSequence = false;
      this.battleInProgress = false;
      this.opponentJustReplaced = false;
   }

   showAttackModal(card, isPlayer = true) {
      if (!card || !card.attacks || card.attacks.length === 0) {
         return;
      }

      // Si le Pokémon n'a qu'une seule attaque, l'utiliser automatiquement
      if (card.attacks.length === 1) {
         const selectedAttack = card.attacks[0];
         if (isPlayer) {
            this.selectedPlayerAttack = selectedAttack;
            // Ajouter un message dans le chat pour indiquer l'attaque automatique
            if (this.game.chatSystem) {
               this.game.chatSystem.addMessage('system', `${card.name} utilise automatiquement ${selectedAttack.name} !`);
            }
            if (this.game.save) this.game.save();

            // Démarrer le combat si l'adversaire a aussi une attaque sélectionnée
            if (this.selectedOpponentAttack && !this.battleInProgress) {
               setTimeout(() => {
                  this.startBattle();
               }, 1000);
            } else if (this.game.opponent.activeCard && !this.battleInProgress) {
               this.selectOpponentAttack();
            }
         } else {
            this.selectedOpponentAttack = selectedAttack;
            if (this.game.save) this.game.save();
         }
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

               if (this.selectedOpponentAttack && !this.battleInProgress) {
                  setTimeout(() => {
                     this.startBattle();
                  }, 1000);
               } else if (this.game.opponent.activeCard && !this.battleInProgress) {
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

      if (this.selectedPlayerAttack && this.selectedOpponentAttack && !this.battleInProgress) {
         setTimeout(() => {
            this.startBattle();
         }, 1000);
      }
   }

   /**
    * Lance la séquence de combat principal
    * Le joueur attaque toujours en premier sauf si spécifié autrement
    */
   async startBattle(attackOrder = "player") {
      if (this.battleInProgress || this.isResolvingKO) return;

      const playerCard = this.game.player.activeCard;
      const opponentCard = this.game.opponent.activeCard;

      if (!playerCard || !opponentCard) {
         return;
      }

      // Marquer le début du combat
      this.battleInProgress = true;
      this.isInBattle = true;

      // Initialiser les HP si nécessaire
      if (this.playerHP === null || this.opponentHP === null) {
         const resetPlayerHP = this.playerHP === null;
         const resetOpponentHP = this.opponentHP === null;
         this.initBattleHP(playerCard, opponentCard, resetPlayerHP, resetOpponentHP);
      }

      // Ajouter un message dans le chat pour annoncer le début du combat
      if (this.game.chatSystem) {
         this.game.chatSystem.addMessage('system', `⚔️ Le combat commence entre ${playerCard.name} et ${opponentCard.name} !`);
      }

      if (this.game.save) this.game.save();

      try {
         if (attackOrder === "player") {
            // Séquence normale : Joueur -> Adversaire
            await this.executePlayerAttack();

            // Vérifier KO après attaque du joueur
            const koResult = this.checkForKOs();
            if (koResult.hasKO) {
               await this.handleKOSequence(koResult);
               return;
            }

            await this.delay(1000);
            await this.executeOpponentAttack();

            // Vérifier KO après attaque adverse
            const koResult2 = this.checkForKOs();
            if (koResult2.hasKO) {
               await this.handleKOSequence(koResult2);
               return;
            }

         } else if (attackOrder === "opponent") {
            // Séquence spéciale : Adversaire -> Joueur (après remplacement adverse)
            await this.executeOpponentAttack();

            // Vérifier KO après attaque adverse
            const koResult = this.checkForKOs();
            if (koResult.hasKO) {
               await this.handleKOSequence(koResult);
               return;
            }

            await this.delay(1000);
            await this.executePlayerAttack();

            // Vérifier KO après attaque du joueur
            const koResult2 = this.checkForKOs();
            if (koResult2.hasKO) {
               await this.handleKOSequence(koResult2);
               return;
            }
         }

         // Si aucun KO, continuer normalement
         this.battlePhase = 'finished';
         this.cleanupBattleDisplay();

         // Proposer changement de Pokémon si la partie continue
         if (!this.checkWin()) {
            this.showChangeModal();
         }

      } catch (error) {
         console.error("Erreur durant le combat:", error);
      } finally {
         this.battleInProgress = false;
         this.isInBattle = false;
      }
   }

   /**
    * Vérifie les KO et retourne l'état
    */
   checkForKOs() {
      return {
         hasKO: this.playerHP <= 0 || this.opponentHP <= 0,
         playerKO: this.playerHP <= 0,
         opponentKO: this.opponentHP <= 0
      };
   }

   /**
    * Gère la séquence après un ou plusieurs KO
    */
   async handleKOSequence(koResult) {
      this.isResolvingKO = true;
      this.cleanupBattleDisplay();

      try {
         if (koResult.playerKO) {
            await this.handlePlayerKO();
         } else if (koResult.opponentKO) {
            await this.handleOpponentKO();
         }
      } finally {
         this.isResolvingKO = false;
         this.battleInProgress = false;
         this.isInBattle = false;
      }
   }

   /**
    * Gère le KO du joueur uniquement
    */
   async handlePlayerKO() {
      if (this.game.player.activeCard) {
         this.game.player.discardCard(this.game.player.activeCard);
         this.game.player.activeCard = null;
         this.game.playerActiveZone.setActiveCard(null);
      }

      this.resetPlayerHP();
      this.resetAttacks();
      this.refreshUI();

      if (this.game.save) this.game.save();

      // Vérifier fin de partie
      if (this.checkWin()) {
         return;
      }

      // Proposer remplacement au joueur
      this.showPlayerReplacementNotification();
   }

   /**
    * Gère le KO de l'adversaire uniquement
    */
   async handleOpponentKO() {
      if (this.game.opponent.activeCard) {
         this.game.opponent.discardCard(this.game.opponent.activeCard);
         this.game.opponent.activeCard = null;
         this.game.opponentActiveZone.setActiveCard(null);
      }

      this.resetOpponentHP();
      this.resetAttacks();
      this.refreshUI();

      if (this.game.save) this.game.save();

      // Vérifier fin de partie
      if (this.checkWin()) {
         return;
      }

      // Remplacement automatique de l'adversaire
      if (this.game.opponent.hand.cards.length > 0) {
         NotificationModal.showOpponentReplacementNotification();
         await this.replaceOpponentCard();

         // L'adversaire attaque en premier après remplacement
         if (this.game.opponent.activeCard && this.game.player.activeCard) {
            this.selectOpponentAttack();
            setTimeout(() => {
               this.startBattle("opponent");
            }, 1500);
         }
      } else {
         this.checkWin();
      }
   }

   /**
    * Remplace la carte adverse KO
    */
   async replaceOpponentCard() {
      if (this.game.opponent.hand.cards.length === 0) return;

      const randomIndex = Math.floor(Math.random() * this.game.opponent.hand.cards.length);
      const selectedCard = this.game.opponent.hand.cards.splice(randomIndex, 1)[0];

      this.game.opponent.activeCard = selectedCard;
      this.game.opponentActiveZone.setActiveCard(selectedCard);

      // Initialiser les HP de la nouvelle carte
      this.maxOpponentHP = parseInt(selectedCard.hp) || 100;
      this.opponentHP = this.maxOpponentHP;
      const opponentId = selectedCard.id || selectedCard.name;
      this.opponentCardHP[opponentId] = this.opponentHP;

      // Nettoyer la notification
      const replacementNotification = document.getElementById('opponent-replacement-notification');
      if (replacementNotification) replacementNotification.remove();

      this.refreshUI();
      if (this.game.save) this.game.save();

      await this.delay(1000);
   }

   /**
    * Exécute l'attaque du joueur
    */
   async executePlayerAttack() {
      const playerCard = this.game.player.activeCard;
      const opponentCard = this.game.opponent.activeCard;

      if (!playerCard || !opponentCard) return;

      this.battlePhase = 'player-attack';

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

      this.performAttack(playerCard, opponentCard, playerAttack, true);
      await this.delay(2500);
   }

   /**
    * Exécute l'attaque de l'adversaire
    */
   async executeOpponentAttack() {
      const opponentCard = this.game.opponent.activeCard;
      const playerCard = this.game.player.activeCard;

      if (!opponentCard || !playerCard) return;

      this.battlePhase = 'opponent-attack';

      // Sélectionner une attaque si pas encore fait
      if (!this.selectedOpponentAttack) {
         this.selectOpponentAttack();
      }

      const opponentAttack = this.selectedOpponentAttack;
      const damage = this.calcDamage(opponentAttack);

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

      this.performAttack(opponentCard, playerCard, opponentAttack, false);
      await this.delay(2500);
   }

   /**
    * Nettoie l'affichage de combat
    */
   cleanupBattleDisplay() {
      const attackDisplay = document.getElementById('battle-attack-display');
      if (attackDisplay) attackDisplay.remove();
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
         // Continuer avec la même carte
         if (!this.battleInProgress) {
            setTimeout(() => {
               this.startBattle();
            }, 1000);
         }
      }

      this.game.save && this.game.save();
   }



   showPlayerReplacementNotification() {
      if (this.checkWin()) {
         return;
      }

      if (!this.game.player.hand.cards || this.game.player.hand.cards.length === 0) {
         this.showPlayerNoCardsNotification();
         return;
      }

      NotificationModal.showChangeCardModal();
   }

   showPlayerNoCardsNotification() {
      if (this.checkWin()) {
         return;
      }

      NotificationModal.showPlayerNoCardsNotification();

      setTimeout(() => {
         if (!this.checkWin()) {
            BattleEndModal.showWithCustomMessage("defeat", "Vous avez perdu ! Vous n'avez plus de cartes en main.", 0, 100, 100, 100, () => {
               if (this.game.resetGame) {
                  this.game.resetGame();
               } else {
                  location.reload();
               }
            });
         }
      }, 4000);
   }

   checkStateAfterRefresh() {
      const playerCard = this.game.player.activeCard;
      const opponentCard = this.game.opponent.activeCard;

      // Ouvre la modal de choix d'attaque quand une carte active est posée
      if (playerCard && opponentCard && !this.selectedPlayerAttack && !this.battleInProgress) {
         setTimeout(() => {
            this.showAttackModal(playerCard, true);
         }, 500);
      }
   }

   // Méthodes utilitaires
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

   resetBattleHP() {
      this.resetHP();
   }

   resetAttacks() {
      this.selectedPlayerAttack = null;
      this.selectedOpponentAttack = null;
      this.isPostKOSequence = false;
      this.opponentJustReplaced = false;
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

   performAttack(attackerCard, defenderCard, attack, isPlayerAttacking) {
      if (!attackerCard || !defenderCard || !attack) {
         console.error("Erreur: données d'attaque manquantes", {
            attackerCard, defenderCard, attack, isPlayerAttacking
         });
         return;
      }

      // Ajouter un message dans le chat
      if (this.game.chatSystem) {
         this.game.chatSystem.addGameMessage('attack', {
            attacker: isPlayerAttacking ? 'Ton ' + attackerCard.name : 'L\'adversaire ' + attackerCard.name,
            attackName: attack.name,
            damage: attack.damage
         });
      }
   }
}
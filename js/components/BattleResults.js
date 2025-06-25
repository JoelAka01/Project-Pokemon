export class BattleResults {
   constructor(container) {
      this.container = container;
   }

   clear() {
      this.container.innerHTML = '';
   }

   showVersusState() {
      this.clear();
      this.container.innerHTML = '<span class="text-white font-bold text-lg">VS</span>';
   }

   displayBattleResults(playerCard, opponentCard) {
      if (!playerCard || !opponentCard) {
         console.log("Cartes manquantes pour le combat");
         return;
      }

      this.clear();

      const playerDamage = this.getCardDamage(playerCard);
      const opponentDamage = this.getCardDamage(opponentCard);

      const playerCurrentHp = Math.max(0, parseInt(playerCard.hp) - opponentDamage);
      const opponentCurrentHp = Math.max(0, parseInt(opponentCard.hp) - playerDamage);

      this.container.innerHTML = `
         <div class="p-3 rounded-lg bg-white/30 backdrop-blur-sm shadow-lg">
            <div class="mb-3 border-b pb-2">
               <h4 class="font-bold text-green-800">Ton attaque</h4>
               <div class="flex items-center justify-between">
                  <span class="text-blue-700 font-medium">${this.getCardAttackName(playerCard)}</span>
                  <span class="bg-red-600 text-white px-2 py-1 rounded text-xs">${playerDamage} dégâts</span>
               </div>
               <div class="mt-1">
                  <span class="font-medium">${opponentCard.name}</span> a 
                  <span class="font-bold ${opponentCurrentHp <= 20 ? 'text-red-600' : ''}">${opponentCurrentHp}/${opponentCard.hp} HP</span> restants
               </div>
            </div>
            
            <div class="mb-3">
               <h4 class="font-bold text-blue-800">Attaque adverse</h4>
               <div class="flex items-center justify-between">
                  <span class="text-blue-700 font-medium">${this.getCardAttackName(opponentCard)}</span>
                  <span class="bg-red-600 text-white px-2 py-1 rounded text-xs">${opponentDamage} dégâts</span>
               </div>
               <div class="mt-1">
                  <span class="font-medium">${playerCard.name}</span> a 
                  <span class="font-bold ${playerCurrentHp <= 20 ? 'text-red-600' : ''}">${playerCurrentHp}/${playerCard.hp} HP</span> restants
               </div>
            </div>
            
            ${this.getBattleOutcome(playerCurrentHp, opponentCurrentHp)}
         </div>
      `;
   }

   getCardDamage(card) {
      if (card.attacks && card.attacks.length > 0) {
         return parseInt(card.attacks[0].damage) || 10;
      }
      return 10;
   }

   getCardAttackName(card) {
      if (card.attacks && card.attacks.length > 0) {
         return card.attacks[0].name || "Attaque";
      }
      return "Attaque";
   }

   getBattleOutcome(playerHp, opponentHp) {
      if (playerHp <= 0 || opponentHp <= 0) {
         if (opponentHp <= 0 && playerHp > 0) {
            return '<div class="mt-3 pt-2 border-t text-center"><span class="font-bold text-green-600 text-lg">🎉 Tu as gagné ! 🎉</span></div>';
         } else if (playerHp <= 0 && opponentHp > 0) {
            return '<div class="mt-3 pt-2 border-t text-center"><span class="font-bold text-red-600 text-lg">❌ Tu as perdu ! ❌</span></div>';
         } else {
            return '<div class="mt-3 pt-2 border-t text-center"><span class="font-bold text-purple-600 text-lg">🤝 Match nul ! 🤝</span></div>';
         }
      }
      return '';
   }
}

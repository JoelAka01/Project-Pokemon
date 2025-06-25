export class BattleResults {
   constructor(container) {
      this.container = container;
   }

   // Nettoie le conteneur des résultats
   clear() {
      while (this.container.firstChild) {
         this.container.removeChild(this.container.firstChild);
      }
   }

   // Affiche l'état VS initial
   showVersusState() {
      this.clear();
      const vsElement = document.createElement("span");
      vsElement.className = "text-white font-bold text-lg";
      vsElement.textContent = "VS";
      this.container.appendChild(vsElement);
   }

   // Affiche les résultats du combat
   displayBattleResults(playerCard, opponentCard) {
      if (!playerCard || !opponentCard) {
         console.log("Une ou deux cartes actives sont manquantes.");
         return;
      }

      this.clear();

      // Créer un conteneur de résultats
      const resultsContainer = document.createElement("div");
      resultsContainer.className = "p-3 rounded-lg bg-white/30 backdrop-blur-sm shadow-lg";

      // Calculer les dégâts et les points de vie restants
      const playerAttack = playerCard.attacks && playerCard.attacks.length > 0
         ? playerCard.attacks[0]
         : { name: "Attaque", damage: "10" };
      const opponentAttack = opponentCard.attacks && opponentCard.attacks.length > 0
         ? opponentCard.attacks[0]
         : { name: "Attaque", damage: "10" };

      const playerDamage = parseInt(playerAttack.damage) || 0;
      const opponentDamage = parseInt(opponentAttack.damage) || 0;

      const playerCurrentHp = Math.max(0, parseInt(playerCard.hp) - opponentDamage);
      const opponentCurrentHp = Math.max(0, parseInt(opponentCard.hp) - playerDamage);

      // Créer les éléments visuels pour le résumé des dégâts du joueur
      const playerResult = this._createPlayerResult(playerAttack, playerDamage, opponentCard, opponentCurrentHp);
      resultsContainer.appendChild(playerResult);

      // Créer les éléments visuels pour le résumé des dégâts de l'adversaire
      const opponentResult = this._createOpponentResult(opponentAttack, opponentDamage, playerCard, playerCurrentHp);
      resultsContainer.appendChild(opponentResult);

      // Ajouter un message de victoire/défaite si nécessaire
      const battleOutcome = this._createBattleOutcome(playerCurrentHp, opponentCurrentHp);
      if (battleOutcome) {
         resultsContainer.appendChild(battleOutcome);
      }

      // Ajouter le conteneur au DOM
      this.container.appendChild(resultsContainer);
   }

   // Crée la section des résultats du joueur
   _createPlayerResult(playerAttack, playerDamage, opponentCard, opponentCurrentHp) {
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

      return playerResult;
   }

   // Crée la section des résultats de l'adversaire
   _createOpponentResult(opponentAttack, opponentDamage, playerCard, playerCurrentHp) {
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

      return opponentResult;
   }

   // Crée le message de victoire/défaite
   _createBattleOutcome(playerCurrentHp, opponentCurrentHp) {
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

         return battleResult;
      }

      return null;
   }

   // Méthode utilitaire pour créer des animations de résultats
   animateResult() {
      this.container.style.transform = "scale(1.05)";
      this.container.style.transition = "transform 0.3s ease";

      setTimeout(() => {
         this.container.style.transform = "scale(1)";
      }, 300);
   }

   // Met à jour les HP affichés sous les cartes actives
   updateHPDisplay(playerCard, opponentCard, playerHpElement, opponentHpElement) {
      if (playerCard && playerHpElement) {
         const playerHp = parseInt(playerCard.hp) || 0;
         playerHpElement.textContent = `${playerHp} / ${playerHp} HP`;
      }

      if (opponentCard && opponentHpElement) {
         const opponentHp = parseInt(opponentCard.hp) || 0;
         opponentHpElement.textContent = `${opponentHp} / ${opponentHp} HP`;
      }
   }
}

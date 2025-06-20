// Gestionnaire de combats Pokémon
import { Battle } from '../battle.js';

export class BattleManager {
   constructor(game, resultsElement) {
      this.game = game;
      this.resultsElement = resultsElement;
      this.battleInProgress = false;
   }

   // Lancer une attaque depuis la carte du joueur
   playerAttack(attackIndex) {
      const player = this.game.player;
      const opponent = this.game.opponent;

      if (!player.activeCard || !player.activeCard.attacks) {
         return {
            success: false,
            message: "Tu n'as pas de carte active ou d'attaques disponibles !"
         };
      }

      if (!opponent.activeCard) {
         return {
            success: false,
            message: "L'adversaire n'a pas de carte active !"
         };
      }

      const attack = player.activeCard.attacks[attackIndex];
      if (!attack) {
         return {
            success: false,
            message: "Cette attaque n'existe pas !"
         };
      }

      // Calcul des dégâts
      const damage = parseInt(attack.damage) || 0;

      // Créer l'objet Battle et gérer l'attaque
      const battle = new Battle(player.activeCard, opponent.activeCard);
      const result = battle.playerAttack(attackIndex);

      // Mettre à jour l'état des cartes après combat
      this.updateCardsAfterBattle(player, opponent, damage);

      // Afficher les résultats du combat
      this.renderBattleResults(player, opponent, attack, damage);

      return {
         success: true,
         message: `${player.activeCard.name} utilise ${attack.name} et inflige ${damage} dégâts !`,
         battleResult: result
      };
   }

   // Mettre à jour l'état des cartes après un combat
   updateCardsAfterBattle(player, opponent, damage) {
      // Si les cartes ont un HP, le mettre à jour
      if (opponent.activeCard.hp) {
         const currentHp = opponent.activeCard.currentHp || opponent.activeCard.hp;
         opponent.activeCard.currentHp = Math.max(0, currentHp - damage);

         // Gérer l'état KO
         if (opponent.activeCard.currentHp <= 0) {
            // Dans une version plus avancée, on pourrait gérer la défaite ici
            opponent.activeCard.isKO = true;
         }
      }
   }

   // Afficher les résultats du combat de manière visuelle
   renderBattleResults(player, opponent, attack, damage) {
      // Nettoyer le conteneur de résultats
      while (this.resultsElement.firstChild) {
         this.resultsElement.removeChild(this.resultsElement.firstChild);
      }

      // Créer un nouveau conteneur pour les résultats
      const resultsContainer = document.createElement("div");
      resultsContainer.className = "bg-gray-800 text-white p-4 rounded-lg shadow-lg animate-fade-in";

      // Titre du combat
      const title = document.createElement("h3");
      title.textContent = "Résultat du combat";
      title.className = "text-center text-xl font-bold mb-3 text-yellow-300";
      resultsContainer.appendChild(title);

      // Informations sur l'attaque
      const attackInfo = document.createElement("div");
      attackInfo.className = "flex items-center justify-center mb-4 p-2 bg-gray-700 rounded-lg";
      attackInfo.innerHTML = `
            <img src="${player.activeCard.imageUrl}" alt="${player.activeCard.name}" class="w-16 h-16 mr-2 rounded">
            <div class="flex flex-col">
                <span class="font-bold">${player.activeCard.name}</span>
                <span class="text-yellow-400">utilise ${attack.name} (${damage} dmg)</span>
            </div>
            <div class="mx-4">➡️</div>
            <img src="${opponent.activeCard.imageUrl}" alt="${opponent.activeCard.name}" class="w-16 h-16 mr-2 rounded">
            <div>
                <span class="font-bold">${opponent.activeCard.name}</span>
            </div>
        `;
      resultsContainer.appendChild(attackInfo);

      // Résultat de l'attaque pour le joueur
      const playerResult = document.createElement("div");
      playerResult.className = "flex justify-between items-center mb-2";

      const playerCardInfo = document.createElement("div");
      playerCardInfo.className = "flex items-center";
      playerCardInfo.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-2 font-bold">J</div>
            <span>${player.activeCard.name}</span>
        `;

      const playerHp = document.createElement("div");
      const playerCurrentHp = player.activeCard.currentHp || player.activeCard.hp;
      playerHp.className = "font-bold";
      playerHp.innerHTML = `HP: <span class="text-green-400">${playerCurrentHp}/${player.activeCard.hp}</span>`;

      playerResult.appendChild(playerCardInfo);
      playerResult.appendChild(playerHp);
      resultsContainer.appendChild(playerResult);

      // Résultat de l'attaque pour l'adversaire
      const opponentResult = document.createElement("div");
      opponentResult.className = "flex justify-between items-center";

      const opponentCardInfo = document.createElement("div");
      opponentCardInfo.className = "flex items-center";
      opponentCardInfo.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center mr-2 font-bold">A</div>
            <span>${opponent.activeCard.name}</span>
        `;

      const opponentHp = document.createElement("div");
      const opponentCurrentHp = opponent.activeCard.currentHp || opponent.activeCard.hp;
      opponentHp.className = "font-bold";
      opponentHp.innerHTML = `HP: <span class="${opponentCurrentHp <= 0 ? 'text-red-500' : 'text-green-400'}">${Math.max(0, opponentCurrentHp)}/${opponent.activeCard.hp}</span>`;

      opponentResult.appendChild(opponentCardInfo);
      opponentResult.appendChild(opponentHp);
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
      this.resultsElement.appendChild(resultsContainer);
   }
}

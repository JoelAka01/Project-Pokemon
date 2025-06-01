export class Battle {
   constructor(playerData, opponentData) {
      this.player = new Pokemon(playerData);
      this.opponent = new Pokemon(opponentData);
   }

   playerAttack(attackIndex) {
      const attack = this.player.attacks[attackIndex];
      if (!attack) return "Attaque inexistante";

      const damage = parseInt(attack.damage) || 0;
      this.opponent.receiveDamage(damage);

      if (this.opponent.isKnockedOut()) {
         return `${this.opponent.name} est K.O. ! Tu as gagné 🎉`;
      }

      return `${this.player.name} utilise ${attack.name} et inflige ${damage} dégâts.`;
   }
}

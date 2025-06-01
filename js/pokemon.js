export class Pokemon {
   constructor(card) {
      this.name = card.name;
      this.hp = parseInt(card.hp) || 0;
      this.maxHp = this.hp;
      this.attacks = card.attacks || [];
      this.image = card.images.small;
      this.types = card.types || [];
      this.weakness = card.weaknesses || [];
      this.resistance = card.resistances || [];
   }

   attack(attackIndex, target) {
      if (!this.attacks[attackIndex]) {
         throw new Error("Cette attaque n'existe pas");
      }

      const attack = this.attacks[attackIndex];
      let damage = attack.damage ? parseInt(attack.damage) : 0;

      // Application des faiblesses/résistances
      if (target.weakness && target.weakness.some(w => this.types.includes(w.type))) {
         damage *= 2;
      }
      if (target.resistance && target.resistance.some(r => this.types.includes(r.type))) {
         damage /= 2;
      }

      target.receiveDamage(damage);
      return {
         attackName: attack.name,
         damage: damage
      };
   }

   heal(amount) {
      this.hp = Math.min(this.maxHp, this.hp + amount);
   }

   receiveDamage(amount) {
      this.hp = Math.max(0, this.hp - amount);
   }

   isKnockedOut() {
      return this.hp <= 0;
   }

   getStatus() {
      return {
         name: this.name,
         hp: this.hp,
         maxHp: this.maxHp,
         types: this.types,
         hpPercentage: Math.floor((this.hp / this.maxHp) * 100)
      };
   }

   getAttacks() {
      return this.attacks.map(attack => ({
         name: attack.name,
         damage: attack.damage || 0,
         text: attack.text || ''
      }));
   }
}
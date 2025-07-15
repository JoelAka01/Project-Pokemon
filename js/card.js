import { pokemons } from "./pokemons.js";

export class Card {
   constructor(id, name, imageUrl, hp = 0, types = [], attacks = [], weaknesses = []) {
      this.id = id;
      this.name = name;
      this.imageUrl = imageUrl;
      this.hp = hp;
      this.types = types;
      this.attacks = attacks.map(attack => ({
         name: attack?.name || '',
         cost: attack?.cost || [],
         damage: attack?.damage || ''
      }));
      this.weaknesses = weaknesses.map(weakness => ({
         type: weakness?.type || '',
         value: weakness?.value || ''
      }));
   }

   static async fetchCards({ type = "Fire", pageSize = 10 } = {}) {

      const filtered = pokemons.filter(pokemon =>
         !type || (
            pokemon.types &&
            pokemon.types.some(t => t.toLowerCase() === type.toLowerCase())
         )
      );

      const sliced = filtered.slice(0, pageSize);

      return sliced.map(card =>
         new Card(
            card.id,
            card.name,
            card.imageUrl,
            card.hp,
            card.types,
            card.attacks,
            card.weaknesses
         )
      );
   }
}

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
      // Filtrer les Pokémon par type (insensible à la casse)
      const filtered = pokemons.filter(pokemon =>
         !type || (
            pokemon.types &&
            pokemon.types.some(t => t.toLowerCase() === type.toLowerCase())
         )
      );

      // Limiter le nombre de résultats (si pageSize précisé)
      const sliced = filtered.slice(0, pageSize);

      // Retourner des instances de Card
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

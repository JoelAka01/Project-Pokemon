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

   static async fetchCards({ type = "fire", subtype = "Basic", pageSize = 10 } = {}) {
      const API_KEY = '420c0510-611c-464f-bf5b-b39949f54466';

      const query = [`types:${type}`];
      if (subtype) query.push(`subtypes:${subtype}`);

      try {
         const response = await fetch(
            `https://api.pokemontcg.io/v2/cards?q=${query.join(" ")}&pageSize=${pageSize}`,
            { headers: { 'X-Api-Key': API_KEY } }
         );

         if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
         }

         const data = await response.json();

         return data.data.map(card => new Card(
            card.id,
            card.name,
            card.images.small,
            card.hp,
            card.types,
            card.attacks || [],
            card.weaknesses || []
         ));

      } catch (error) {
         console.error("Erreur lors de la récupération des cartes:", error);
         return [];
      }
   }


   // Méthode pour afficher les informations de la carte
   getInfo() {
      return {
         id: this.id,
         name: this.name,
         hp: this.hp,
         types: this.types,
         attacks: this.attacks,
         weaknesses: this.weaknesses
      };
   }
}
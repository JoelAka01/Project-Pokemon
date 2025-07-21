export const pokemons = [
   {
      id: "201",
      name: "Pokepioche1",
      imageUrl: "https://images.pokemontcg.io/base1/1_hires.png",
      hp: 30,
      types: ["Colorless"],
      attacks: [
         {
            name: "Pioche Rapide",
            cost: ["Colorless"],
            damage: "0"
         }
      ],
      weaknesses: [
         {
            type: "Fighting",
            value: "×2"
         }
      ]
   },
   {
      id: "202",
      name: "Pokepioche2",
      imageUrl: "https://images.pokemontcg.io/base1/2_hires.png",
      hp: 20,
      types: ["Colorless"],
      attacks: [
         {
            name: "Pioche Chanceuse",
            cost: ["Colorless"],
            damage: "0"
         }
      ],
      weaknesses: [
         {
            type: "Fighting",
            value: "×2"
         }
      ]
   },
   {
      id: "203",
      name: "Pokepioche3",
      imageUrl: "https://images.pokemontcg.io/base1/3_hires.png",
      hp: 10,
      types: ["Colorless"],
      attacks: [
         {
            name: "Pioche Surprise",
            cost: ["Colorless"],
            damage: "0"
         }
      ],
      weaknesses: [
         {
            type: "Fighting",
            value: "×2"
         }
      ]
   },
   {
      id: "001",
      name: "Bulbasaur",
      imageUrl: "https://images.pokemontcg.io/base1/44_hires.png",
      hp: 40,
      types: ["Grass"],
      attacks: [
         {
            name: "Leech Seed",
            cost: ["Grass", "Colorless"],
            damage: "20"
         }
      ],
      weaknesses: [
         {
            type: "Fire",
            value: "×2"
         }
      ]
   },
   {
      id: "004",
      name: "Charmander",
      imageUrl: "https://images.pokemontcg.io/base1/46_hires.png",
      hp: 50,
      types: ["Fire"],
      attacks: [
         {
            name: "Ember",
            cost: ["Fire", "Colorless"],
            damage: "30"
         }
      ],
      weaknesses: [
         {
            type: "Water",
            value: "×2"
         }
      ]
   },
   {
      id: "007",
      name: "Squirtle",
      imageUrl: "https://images.pokemontcg.io/base1/63_hires.png",
      hp: 40,
      types: ["Water"],
      attacks: [
         {
            name: "Bubble",
            cost: ["Water"],
            damage: "10"
         }
      ],
      weaknesses: [
         {
            type: "Electric",
            value: "×2"
         }
      ]
   },
   {
      id: "025",
      name: "Pikachu",
      imageUrl: "https://images.pokemontcg.io/base1/58_hires.png",
      hp: 40,
      types: ["Electric"],
      attacks: [
         {
            name: "Thunder Jolt",
            cost: ["Electric", "Colorless"],
            damage: "30"
         }
      ],
      weaknesses: [
         {
            type: "Fighting",
            value: "×2"
         }
      ]
   },
   {
      id: "063",
      name: "Abra",
      imageUrl: "https://images.pokemontcg.io/base1/43_hires.png",
      hp: 30,
      types: ["Psychic"],
      attacks: [
         {
            name: "Psyshock",
            cost: ["Psychic"],
            damage: "10"
         }
      ],
      weaknesses: [
         {
            type: "Psychic",
            value: "×2"
         }
      ]
   },
   {
      id: "066",
      name: "Machop",
      imageUrl: "https://images.pokemontcg.io/base1/52_hires.png",
      hp: 50,
      types: ["Fighting"],
      attacks: [
         {
            name: "Low Kick",
            cost: ["Fighting"],
            damage: "20"
         }
      ],
      weaknesses: [
         {
            type: "Psychic",
            value: "×2"
         }
      ]
   },
   {
      id: "081",
      name: "Magnemite",
      imageUrl: "https://images.pokemontcg.io/base1/62_hires.png",
      hp: 40,
      types: ["Metal"],
      attacks: [
         {
            name: "Thunder Wave",
            cost: ["Electric"],
            damage: "10"
         }
      ],
      weaknesses: [
         {
            type: "Fighting",
            value: "×2"
         }
      ]
   },
   {
      id: "092",
      name: "Gastly",
      imageUrl: "https://images.pokemontcg.io/base1/50_hires.png",
      hp: 30,
      types: ["Ghost"],
      attacks: [
         {
            name: "Lick",
            cost: ["Psychic"],
            damage: "10"
         }
      ],
      weaknesses: [
         {
            type: "Psychic",
            value: "×2"
         }
      ]
   },
   {
      id: "147",
      name: "Dratini",
      imageUrl: "https://images.pokemontcg.io/base1/26_hires.png",
      hp: 40,
      types: ["Dragon"],
      attacks: [
         {
            name: "Pound",
            cost: ["Colorless"],
            damage: "10"
         }
      ],
      weaknesses: [
         {
            type: "Colorless",
            value: "×2"
         }
      ]
   },
   {
      id: "133",
      name: "Eevee",
      imageUrl: "https://images.pokemontcg.io/base1/51_hires.png",
      hp: 50,
      types: ["Colorless"],
      attacks: [
         {
            name: "Tackle",
            cost: ["Colorless"],
            damage: "10"
         }
      ],
      weaknesses: [
         {
            type: "Fighting",
            value: "×2"
         }
      ]
   }
];

// Nouvelle fonction utilitaire pour récupérer les pokémons spéciaux de la pioche
export function getSpecialPiocheCards() {
   return pokemons.filter(p => p.id === "201" || p.id === "202" || p.id === "203");
}

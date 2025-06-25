export class CardModal {
   constructor() {
      this.modal = document.getElementById("card-modal");
      this.closeModalBtn = document.getElementById("close-modal");
      this.setupModal();
   }

   setupModal() {
      this.closeModalBtn.addEventListener("click", () => {
         this.modal.classList.add("hidden");
      });

      // Fermer la modale en cliquant en dehors
      this.modal.addEventListener("click", (e) => {
         if (e.target === this.modal) {
            this.modal.classList.add("hidden");
         }
      });
   }

   showCardModal(card) {
      // Récupération des références aux éléments HTML
      const modalTitle = document.getElementById("modal-title");
      const modalImg = document.getElementById("modal-img");
      const modalHp = document.getElementById("modal-hp");
      const typeBadges = document.getElementById("pokemon-type-badges");
      const modalDescription = document.getElementById("modal-description");
      const modalAttacks = document.getElementById("modal-attacks");
      const modalWeaknesses = document.getElementById("modal-weaknesses");
      const modalResistances = document.getElementById("modal-resistances");
      const modalInfo = document.getElementById("modal-info");
      const modalCardHalo = document.getElementById("modal-card-halo");
      const modalRarity = document.getElementById("modal-rarity");

      // Sections qui peuvent être masquées si pas de données
      const weaknessesSection = document.getElementById("modal-weaknesses-section");
      const resistancesSection = document.getElementById("modal-resistances-section");
      const attacksSection = document.getElementById("modal-attacks-section");

      // Nettoyer les conteneurs
      typeBadges.innerHTML = "";
      modalAttacks.innerHTML = "";
      modalWeaknesses.innerHTML = "";
      modalResistances.innerHTML = "";
      modalInfo.innerHTML = "";

      // Remplir les informations de base
      modalTitle.textContent = card.name;
      modalImg.src = card.imageUrl;
      modalHp.textContent = card.hp;

      // Couleur du halo selon le premier type de la carte
      if (card.types && card.types.length > 0) {
         const primaryType = card.types[0];
         const haloColor = this.getTypeGradient(primaryType);
         modalCardHalo.className = `absolute -inset-1 ${haloColor} rounded-lg blur opacity-40 group-hover:opacity-100 transition duration-500 group-hover:duration-200`;
      }

      // Afficher les badges de type
      if (card.types && card.types.length > 0) {
         card.types.forEach(type => {
            const badge = this.createTypeBadge(type);
            typeBadges.appendChild(badge);
         });
      }

      // Ajouter une description si disponible (optionnel)
      if (card.description) {
         modalDescription.textContent = card.description;
         modalDescription.classList.remove("hidden");
      } else {
         modalDescription.classList.add("hidden");
      }

      // Afficher la rareté (optionnel)
      if (card.rarity) {
         modalRarity.textContent = card.rarity;
         modalRarity.classList.remove("hidden");
      } else {
         modalRarity.textContent = "Standard";
      }

      // Afficher les attaques
      if (card.attacks && card.attacks.length > 0) {
         attacksSection.classList.remove("hidden");
         card.attacks.forEach(attack => {
            const attackElement = this.createAttackElement(attack);
            modalAttacks.appendChild(attackElement);
         });
      } else {
         attacksSection.classList.add("hidden");
      }

      // Afficher les faiblesses
      if (card.weaknesses && card.weaknesses.length > 0) {
         weaknessesSection.classList.remove("hidden");
         card.weaknesses.forEach(weakness => {
            const weaknessElement = this.createWeaknessElement(weakness);
            modalWeaknesses.appendChild(weaknessElement);
         });
      } else {
         weaknessesSection.classList.add("hidden");
      }

      // Afficher les résistances (si disponibles)
      if (card.resistances && card.resistances.length > 0) {
         resistancesSection.classList.remove("hidden");
         card.resistances.forEach(resistance => {
            const resistanceElement = this.createResistanceElement(resistance);
            modalResistances.appendChild(resistanceElement);
         });
      } else {
         resistancesSection.classList.add("hidden");
      }

      // Ajouter un effet de brillance sur l'image
      const shine = document.createElement("div");
      shine.className = "card-shine";
      modalImg.parentNode.appendChild(shine);

      // Afficher la modal
      this.modal.classList.remove("hidden");
   }

   // Méthode pour créer un badge de type
   createTypeBadge(type) {
      const badge = document.createElement("span");
      badge.className = `type-badge type-${type}`;

      // Ajouter une icône selon le type
      const icon = this.getTypeIcon(type);
      badge.innerHTML = `${icon} ${type}`;

      return badge;
   }

   // Méthode pour créer un élément d'attaque
   createAttackElement(attack) {
      const attackDiv = document.createElement("div");
      attackDiv.className = "attack-item bg-white/60 rounded-lg p-3 shadow-md border border-orange-200";

      // En-tête de l'attaque avec nom et coût
      const header = document.createElement("div");
      header.className = "flex items-center justify-between mb-2";

      const nameDiv = document.createElement("div");
      nameDiv.className = "font-bold text-lg text-orange-800";
      nameDiv.textContent = attack.name;

      const costDiv = document.createElement("div");
      costDiv.className = "flex items-center";

      // Générer les coûts d'énergie
      if (attack.cost && attack.cost.length > 0) {
         attack.cost.forEach(energyType => {
            const energyBadge = document.createElement("span");
            energyBadge.className = `attack-cost type-${energyType}`;
            energyBadge.textContent = energyType.charAt(0);
            costDiv.appendChild(energyBadge);
         });
      }

      header.appendChild(nameDiv);
      header.appendChild(costDiv);
      attackDiv.appendChild(header);

      // Afficher les dégâts
      if (attack.damage) {
         const damageDiv = document.createElement("div");
         damageDiv.className = "mt-1 text-red-600 font-bold text-lg";
         damageDiv.textContent = `Dégâts: ${attack.damage}`;
         attackDiv.appendChild(damageDiv);
      }

      // Afficher la description de l'attaque si disponible
      if (attack.text) {
         const descDiv = document.createElement("p");
         descDiv.className = "mt-1 text-sm italic text-gray-700";
         descDiv.textContent = attack.text;
         attackDiv.appendChild(descDiv);
      }

      return attackDiv;
   }

   // Méthode pour créer un élément de faiblesse
   createWeaknessElement(weakness) {
      const weaknessDiv = document.createElement("div");
      weaknessDiv.className = `type-badge type-${weakness.type}`;

      const icon = this.getTypeIcon(weakness.type);
      weaknessDiv.innerHTML = `${icon} ${weakness.type} ${weakness.value}`;

      return weaknessDiv;
   }

   // Méthode pour créer un élément de résistance
   createResistanceElement(resistance) {
      const resistanceDiv = document.createElement("div");
      resistanceDiv.className = `type-badge type-${resistance.type}`;

      const icon = this.getTypeIcon(resistance.type);
      resistanceDiv.innerHTML = `${icon} ${resistance.type} ${resistance.value}`;

      return resistanceDiv;
   }

   // Obtenir une icône pour un type donné
   getTypeIcon(type) {
      const icons = {
         Fire: "🔥",
         Water: "💧",
         Grass: "🌿",
         Electric: "⚡",
         Psychic: "🔮",
         Fighting: "👊",
         Darkness: "🌑",
         Metal: "⚙️",
         Fairy: "✨",
         Dragon: "🐉",
         Colorless: "⭐"
      };

      return icons[type] || "❓";
   }

   // Obtenir un gradient de couleur pour un type donné
   getTypeGradient(type) {
      const gradients = {
         Fire: "bg-gradient-to-r from-red-500 to-yellow-500",
         Water: "bg-gradient-to-r from-blue-500 to-cyan-400",
         Grass: "bg-gradient-to-r from-green-500 to-lime-400",
         Electric: "bg-gradient-to-r from-yellow-400 to-amber-500",
         Psychic: "bg-gradient-to-r from-purple-500 to-pink-400",
         Fighting: "bg-gradient-to-r from-orange-500 to-red-700",
         Darkness: "bg-gradient-to-r from-gray-700 to-gray-900",
         Metal: "bg-gradient-to-r from-gray-400 to-slate-600",
         Fairy: "bg-gradient-to-r from-pink-400 to-purple-300",
         Dragon: "bg-gradient-to-r from-indigo-600 to-purple-700",
         Colorless: "bg-gradient-to-r from-slate-300 to-gray-400"
      };

      return gradients[type] || "bg-gradient-to-r from-blue-400 to-purple-500";
   }

   // Méthode pour formater le coût d'énergie
   formatCost(costs) {
      if (!costs || costs.length === 0) return "Aucun";

      // Compte le nombre de chaque type d'énergie
      const costCount = costs.reduce((acc, cost) => {
         acc[cost] = (acc[cost] || 0) + 1;
         return acc;
      }, {});

      // Formate le résultat
      return Object.entries(costCount)
         .map(([type, count]) => `${type} x${count}`)
         .join(", ");
   }
}

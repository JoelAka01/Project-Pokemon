// Gestionnaire de l'interaction UI et du drag-and-drop
export class GameUI {
   constructor(game) {
      this.game = game;
      this.setupDragAndDrop();
      this.setupEventListeners();
   }

   setupDragAndDrop() {
      // Configuration du drag and drop pour la zone de combat du joueur
      this.game.playerActive.addEventListener("dragover", (e) => {
         e.preventDefault(); // Nécessaire pour permettre le drop
         this.game.playerActive.classList.add("border-green-200", "border-4");
         this.game.playerActive.classList.remove("border-dashed");
      });

      this.game.playerActive.addEventListener("dragleave", () => {
         this.game.playerActive.classList.remove("border-green-200", "border-4");
         this.game.playerActive.classList.add("border-dashed");
      });

      this.game.playerActive.addEventListener("drop", (e) => {
         e.preventDefault();

         // Enlever les styles de drag
         this.game.playerActive.classList.remove("border-green-200", "border-4");
         this.game.playerActive.classList.add("border-dashed");

         const cardId = e.dataTransfer.getData("text/plain");

         if (cardId.startsWith("hand-card-")) {
            const cardIndex = parseInt(cardId.replace("hand-card-", ""));
            this.game.playCardFromHand(cardIndex);
         } else if (cardId === "deck-card") {
            // Tirage direct si autorisation
            this.game.attemptDirectDraw();
         }
      });
   }

   setupEventListeners() {
      // Délégation d'événements pour les clics sur le deck
      document.getElementById("deck").addEventListener("click", (e) => {
         if (e.target.id === "deck-card") {
            this.game.attemptDrawCard();
         }
      });

      // Écouteur pour les attaques du joueur
      document.addEventListener("player-attack", (e) => {
         const attackIndex = e.detail.attackIndex;
         this.game.playerAttack(attackIndex);
      });
   }

   dragstart_handler(ev) {
      ev.dataTransfer.setData("text/plain", "deck-card");
      ev.target.classList.add("dragging");

      // Créer une image fantôme personnalisée pour le drag
      const ghostImg = ev.target.cloneNode(true);
      ghostImg.style.width = "100px";
      ghostImg.style.height = "auto";
      ghostImg.style.opacity = "0.7";
      document.body.appendChild(ghostImg);

      ev.dataTransfer.setDragImage(ghostImg, 50, 75);

      // Nettoyer l'élément après l'opération
      setTimeout(() => {
         document.body.removeChild(ghostImg);
      }, 0);
   }

   displayMessage(message, type = "info") {
      const resultsElement = this.game.results;

      if (!resultsElement) return;

      resultsElement.innerHTML = "";

      const messageDiv = document.createElement("div");
      messageDiv.textContent = message;

      // Styling selon le type de message
      switch (type) {
         case "success":
            messageDiv.className = "text-green-600 font-bold";
            break;
         case "error":
            messageDiv.className = "text-red-600 font-bold";
            break;
         case "warning":
            messageDiv.className = "text-yellow-600 font-bold";
            break;
         default:
            messageDiv.className = "text-white font-bold";
      }

      resultsElement.appendChild(messageDiv);

      // Ajouter une animation
      messageDiv.style.animation = "fadeIn 0.5s";

      // Auto-effacement après quelques secondes
      setTimeout(() => {
         messageDiv.style.animation = "fadeOut 0.5s";
         setTimeout(() => {
            if (resultsElement.contains(messageDiv)) {
               resultsElement.removeChild(messageDiv);
            }

            // Remettre le VS si rien d'autre n'est affiché
            if (resultsElement.children.length === 0) {
               const vsSpan = document.createElement("span");
               vsSpan.className = "text-white font-bold text-lg";
               vsSpan.textContent = "VS";
               resultsElement.appendChild(vsSpan);
            }
         }, 500);
      }, 3000);
   }
}

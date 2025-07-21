export class DeckSelectionModal {
   constructor(deck, onComplete) {
      this.deck = deck;
      this.onComplete = onComplete;
      this.overlay = null;
      this.availableCards = [...deck];
      this.handCards = [];
   }

   show() {
      // Overlay avec effet de blur et animation d'apparition
      this.overlay = document.createElement('div');
      this.overlay.id = 'deck-selection-overlay';
      this.overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(6px); animation: fadeIn 0.4s;`;

      // Modal principal
      const modal = document.createElement('div');
      modal.style.cssText = `
      background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
      border-radius: 24px; padding: 40px 32px 32px 32px; max-width: 1200px; width: 98vw;
      box-shadow: 0 12px 40px 0 rgba(30,64,175,0.18), 0 2px 8px 0 rgba(0,0,0,0.10);
      text-align: center; position: relative; animation: popIn 0.5s cubic-bezier(.4,2,.6,1);
    `;
      modal.innerHTML = `<h2 style="font-size:2.2rem; margin-bottom:1.5rem; color:#1e40af; letter-spacing:1px; font-weight:900; text-shadow:0 2px 8px #60a5fa55;">Sélectionne ta main de départ (5 cartes)</h2>`;

      // Blocs principaux avec effet glassmorphism
      const selectionZone = document.createElement('div');
      selectionZone.id = 'selection-zone';
      selectionZone.style.cssText = `
      min-height:170px; background:rgba(236,245,255,0.85); border-radius:16px; padding:18px; margin-bottom:28px;
      display:flex; flex-wrap:wrap; gap:14px; justify-content:center; align-items:center; box-shadow:0 2px 12px #3b82f633;
      border:2px solid #bae6fd; transition:box-shadow .2s;
    `;

      const handZone = document.createElement('div');
      handZone.id = 'hand-zone';
      handZone.style.cssText = `
      min-height:170px; background:rgba(224,242,254,0.95); border-radius:16px; padding:18px; margin-bottom:28px;
      display:flex; flex-wrap:wrap; gap:14px; justify-content:center; align-items:center; min-width:420px;
      box-shadow:0 2px 12px #22d3ee33; border:2px solid #7dd3fc; transition:box-shadow .2s;
    `;

      // Labels stylés
      const label1 = document.createElement('div');
      label1.innerHTML = '<b>Cartes disponibles</b>';
      label1.style.cssText = 'margin-bottom:10px; color:#1e293b; font-size:1.1rem; letter-spacing:.5px;';
      const label2 = document.createElement('div');
      label2.innerHTML = '<b>Ta main (max 5 cartes)</b>';
      label2.style.cssText = 'margin-bottom:10px; color:#1e293b; font-size:1.1rem; letter-spacing:.5px;';

      // Conteneur labels+zones
      const zonesContainer = document.createElement('div');
      zonesContainer.style.cssText = 'display:flex; gap:40px; justify-content:center; align-items:flex-start;';
      const leftCol = document.createElement('div');
      leftCol.appendChild(label1); leftCol.appendChild(selectionZone);
      const rightCol = document.createElement('div');
      rightCol.appendChild(label2); rightCol.appendChild(handZone);
      zonesContainer.appendChild(leftCol); zonesContainer.appendChild(rightCol);
      modal.appendChild(zonesContainer);

      // Bouton valider stylé
      const btn = document.createElement('button');
      btn.innerText = 'Valider ma main';
      btn.disabled = true;
      btn.style.cssText = `
      background: linear-gradient(90deg,#38bdf8 0%,#2563eb 100%); color:white; font-weight:bold;
      padding:14px 38px; border:none; border-radius:12px; font-size:1.3rem; cursor:pointer;
      opacity:0.7; transition:0.2s; margin-top:22px; box-shadow:0 2px 12px #2563eb33;
      letter-spacing:1px; text-shadow:0 1px 4px #0ea5e955;
    `;
      btn.onmouseenter = () => { if (!btn.disabled) btn.style.opacity = '1'; };
      btn.onmouseleave = () => { if (!btn.disabled) btn.style.opacity = '0.85'; };
      btn.onclick = () => {
         this.overlay.remove();
         this.onComplete([...this.handCards]);
      };
      modal.appendChild(btn);

      // Animation d'apparition
      this.overlay.animate([
         { opacity: 0 },
         { opacity: 1 }
      ], { duration: 350, fill: 'forwards' });

      this.overlay.appendChild(modal);
      document.body.appendChild(this.overlay);

      // --- Logique Drag & Drop ---
      const renderZones = () => {
         selectionZone.innerHTML = '';
         handZone.innerHTML = '';
         // Cartes disponibles
         this.availableCards.forEach((card, idx) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'select-card';
            cardDiv.style.cssText = 'cursor:grab; border:2px solid #ddd; border-radius:8px; background:white; box-shadow:0 2px 8px #0001; margin:2px;';
            cardDiv.draggable = true;
            cardDiv.innerHTML = `<img src="${card.imageUrl}" alt="${card.name}" style="width:90px; border-radius:8px;">`;
            cardDiv.ondragstart = e => {
               e.dataTransfer.setData('cardIdx', idx);
            };
            selectionZone.appendChild(cardDiv);
         });
         // Cartes main
         this.handCards.forEach((card, idx) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'hand-card';
            cardDiv.style.cssText = 'cursor:grab; border:2px solid #22c55e; border-radius:8px; background:white; box-shadow:0 2px 8px #0002; margin:2px;';
            cardDiv.draggable = true;
            cardDiv.innerHTML = `<img src="${card.imageUrl}" alt="${card.name}" style="width:90px; border-radius:8px;">`;
            cardDiv.ondragstart = e => {
               e.dataTransfer.setData('handIdx', idx);
            };
            handZone.appendChild(cardDiv);
         });
         btn.disabled = this.handCards.length !== 5;
         btn.style.opacity = btn.disabled ? '0.7' : '1';
      };

      // Drop sur la main
      handZone.ondragover = e => e.preventDefault();
      handZone.ondrop = e => {
         const cardIdx = e.dataTransfer.getData('cardIdx');
         if (cardIdx !== '') {
            const card = this.availableCards[cardIdx];
            if (this.handCards.length < 5) {
               this.handCards.push(card);
               this.availableCards.splice(cardIdx, 1);
            } else {
               // Si main pleine, la première retourne dans la sélection
               this.availableCards.push(this.handCards[0]);
               this.handCards = this.handCards.slice(1);
               this.handCards.push(card);
               this.availableCards.splice(cardIdx, 1);
            }
            renderZones();
         }
      };
      // Drop sur la zone de sélection (pour retirer une carte de la main)
      selectionZone.ondragover = e => e.preventDefault();
      selectionZone.ondrop = e => {
         const handIdx = e.dataTransfer.getData('handIdx');
         if (handIdx !== '') {
            const card = this.handCards[handIdx];
            this.availableCards.push(card);
            this.handCards.splice(handIdx, 1);
            renderZones();
         }
      };

      renderZones();
   }
}

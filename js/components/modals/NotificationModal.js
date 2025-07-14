export class NotificationModal {

    static centerModal(modal) {
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }


    static showChangeCardModal(game) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>🔄 Changement de Carte Active</h3>
                <p>Glissez une carte de votre main vers la zone active pour continuer !</p>
            </div>
        `;
        this.centerModal(modal);

        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 2000);
    }


    static showBattleEndModal(game) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>⚔️ Fin du Combat</h3>
                <p>Le combat est terminé. Préparez-vous pour le prochain round !</p>
            </div>
        `;
        this.centerModal(modal);

        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 3000);
    }

    static showPlayerNoCardsNotification(game) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>⚠️ Plus de Cartes</h3>
                <p>Vous n'avez plus de cartes en main pour remplacer votre carte KO.</p>
            </div>
        `;
        this.centerModal(modal);

        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 3000);
    }


    static showPlayerAttackSelectionNotification() {
        const existingNotification = document.getElementById('player-attack-selection-notification');
        if (existingNotification) existingNotification.remove();

        const notification = document.createElement('div');
        notification.id = 'player-attack-selection-notification';
        notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';

        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span>⚔️</span>
                <span>Placez une carte pour combattre ! L'adversaire attaquera en premier.</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) notification.remove();
        }, 6000);
    }


    static showOpponentReplacementNotification() {
        const existingNotification = document.getElementById('opponent-replacement-notification');
        if (existingNotification) existingNotification.remove();

        const notification = document.createElement('div');
        notification.id = 'opponent-replacement-notification';
        notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';

        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="animate-spin">🔄</span>
                <span>L'adversaire place une nouvelle carte de son banc...</span>
            </div>
        `;

        document.body.appendChild(notification);
    }


    static showDoubleKONotification() {
        const notification = document.createElement('div');
        notification.id = 'double-ko-notification';
        notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';

        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span>💀💀</span>
                <span>Double KO ! L'adversaire place sa carte et attaque en premier...</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) notification.remove();
        }, 3000);
    }
}

/**
 * ChatSystem.js - Gère le système de messagerie en jeu
 * Permet d'afficher les messages du système et d'échanger des messages entre joueurs
 */

export default class ChatSystem {
    constructor(battleSystem) {
        this.battleSystem = battleSystem;
        this.messageContainer = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.chatSendButton = document.getElementById('chat-send');
        this.chatModal = document.getElementById('chat-modal');
        this.chatButton = document.getElementById('chat-button');
        this.closeChatButton = document.getElementById('close-chat-modal');
        
        this.setupEventListeners();
        this.messageHistory = [];
        this.maxMessages = 50; // Limite le nombre de messages gardés en mémoire
        this.unreadMessages = 0;
    }

    /**
     * Initialise les écouteurs d'événements pour le chat
     */
    setupEventListeners() {
        // Événement pour envoyer un message avec le bouton
        this.chatSendButton.addEventListener('click', () => {
            this.sendPlayerMessage();
        });

        // Événement pour envoyer un message avec la touche Entrée
        this.chatInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.sendPlayerMessage();
            }
        });

        // Événement pour ouvrir la modale de chat
        this.chatButton.addEventListener('click', () => {
            this.openChatModal();
        });

        // Événement pour fermer la modale de chat
        this.closeChatButton.addEventListener('click', () => {
            this.closeChatModal();
        });

        // Fermeture de la modale avec la touche Echap
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !this.chatModal.classList.contains('hidden')) {
                this.closeChatModal();
            }
        });
    }

    /**
     * Ouvre la modale de chat
     */
    openChatModal() {
        this.chatModal.classList.remove('hidden');
        this.chatInput.focus();
        
        // Réinitialise le compteur de messages non lus
        this.unreadMessages = 0;
        this.updateUnreadIndicator();
        
        // Scroll vers le bas pour voir les derniers messages
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }

    /**
     * Ferme la modale de chat
     */
    closeChatModal() {
        this.chatModal.classList.add('hidden');
    }

    /**
     * Met à jour l'indicateur de messages non lus
     */
    updateUnreadIndicator() {
        // Supprime l'ancien indicateur s'il existe
        const existingIndicator = this.chatButton.querySelector('.new-message-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Enlève la classe de clignotement
        this.chatButton.classList.remove('blinking');
        
        // Si pas de messages non lus, on s'arrête là
        if (this.unreadMessages === 0) {
            return;
        }
        
        // Sinon on crée l'indicateur et on ajoute la classe de clignotement
        const indicator = document.createElement('span');
        indicator.classList.add('new-message-indicator');
        indicator.textContent = this.unreadMessages > 9 ? '9+' : this.unreadMessages;
        this.chatButton.appendChild(indicator);
        
        // Ajoute la classe de clignotement au bouton
        this.chatButton.classList.add('blinking');
    }

    /**
     * Envoie un message du joueur et le traite
     */
    sendPlayerMessage() {
        const message = this.chatInput.value.trim();
        if (message) {
            this.addMessage('player', message);
            this.chatInput.value = '';
            
            // Simulation de réponse de l'adversaire
            if (Math.random() < 0.3) { // 30% de chance d'avoir une réponse
                setTimeout(() => {
                    this.generateOpponentResponse(message);
                }, 1000 + Math.random() * 2000); // Délai aléatoire entre 1 et 3 secondes
            }
        }
    }

    /**
     * Génère une réponse de l'adversaire en fonction du message du joueur
     * @param {string} playerMessage - Le message envoyé par le joueur
     */
    generateOpponentResponse(playerMessage) {
        const lowerMessage = playerMessage.toLowerCase();
        let response;

        // Réponses en fonction du contenu du message
        if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut')) {
            response = 'Salut ! Prêt à perdre ce combat ?';
        } else if (lowerMessage.includes('chance') || lowerMessage.includes('bol')) {
            response = 'La chance n\'a rien à voir là-dedans !';
        } else if (lowerMessage.includes('gg') || lowerMessage.includes('bien joué')) {
            response = 'Merci, mais le combat n\'est pas encore terminé !';
        } else if (lowerMessage.includes('attaque') || lowerMessage.includes('puissant')) {
            response = 'Mon Pokémon est prêt à tout donner !';
        } else {
            // Réponses génériques
            const genericResponses = [
                'Concentre-toi sur le combat !',
                'Tu parles trop, mon Pokémon va t\'écraser !',
                'Intéressant... Mais regarde plutôt mon prochain coup !',
                'Hmm, je réfléchis à ma stratégie...',
                'C\'est un bon duel !',
                'Je ne me laisserai pas distraire par le chat !'
            ];
            response = genericResponses[Math.floor(Math.random() * genericResponses.length)];
        }

        this.addMessage('opponent', response);
    }

    /**
     * Ajoute un message système lié à une action de jeu
     * @param {string} action - Type d'action (attaque, pioche, etc.)
     * @param {object} data - Données associées à l'action
     */
    addGameMessage(action, data = {}) {
        let message = '';
        
        switch(action) {
            case 'draw':
                message = `${data.player === 'player' ? 'Tu as' : 'L\'adversaire a'} pioché une carte.`;
                break;
            case 'play':
                message = `${data.player === 'player' ? 'Tu as' : 'L\'adversaire a'} joué ${data.cardName}.`;
                break;
            case 'attack':
                message = `${data.attacker} attaque avec ${data.attackName} ! ${data.damage ? data.damage + ' dégâts !' : ''}`;
                break;
            case 'damage':
                message = `${data.target} a perdu ${data.amount} HP !`;
                break;
            case 'turn':
                message = `C'est au tour de ${data.player === 'player' ? 'toi' : 'l\'adversaire'} de jouer.`;
                break;
            default:
                message = data.message || 'Action de jeu effectuée.';
        }
        
        this.addMessage('system', message);
    }

    /**
     * Ajoute un message au chat
     * @param {string} type - Type de message ('system', 'player', 'opponent')
     * @param {string} text - Contenu du message
     */
    addMessage(type, text) {
        // Crée l'élément de message
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', type, 'mb-1');
        
        // Ajoute un préfixe selon le type de message
        let prefix = '';
        if (type === 'player') {
            prefix = '<span class="text-green-300 font-bold">Toi:</span> ';
        } else if (type === 'opponent') {
            prefix = '<span class="text-red-300 font-bold">Adversaire:</span> ';
        } else if (type === 'system') {
            messageElement.classList.add('italic', 'text-yellow-200');
        }
        
        messageElement.innerHTML = prefix + text;
        
        // Ajoute le message au conteneur
        this.messageContainer.appendChild(messageElement);
        
        // Ajoute le message à l'historique et limite la taille
        this.messageHistory.push({ type, text });
        if (this.messageHistory.length > this.maxMessages) {
            this.messageHistory.shift();
        }
        
        // Scroll automatique vers le bas
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;

        // Si la modale est fermée, on incrémente le compteur de messages non lus
        if (this.chatModal.classList.contains('hidden') && type !== 'player') {
            this.unreadMessages++;
            this.updateUnreadIndicator();
        }
    }

    /**
     * Efface tous les messages du chat
     */
    clearMessages() {
        this.messageContainer.innerHTML = '';
        this.messageHistory = [];
    }
}

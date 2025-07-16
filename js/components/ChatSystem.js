/**
 * ChatSystem.js - Gère le système de messagerie en jeu
 * Permet d'afficher les messages du système et d'échanger des messages entre joueurs
 */

export default class ChatSystem {
    constructor(battleSystem) {
        this.battleSystem = battleSystem;
        
        // Éléments DOM du chat standard
        this.messageContainer = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.chatSendButton = document.getElementById('chat-send');
        
        // Éléments DOM de la modale de chat
        this.chatButton = document.getElementById('chat-button');
        this.chatModal = document.getElementById('chat-modal');
        this.closeModalButton = document.getElementById('close-chat-modal');
        this.modalMessageContainer = document.getElementById('chat-modal-messages');
        this.modalChatInput = document.getElementById('chat-modal-input');
        this.modalSendButton = document.getElementById('chat-modal-send');
        this.unreadMessageCount = document.getElementById('unread-message-count');
        
        this.setupEventListeners();
        this.messageHistory = [];
        this.maxMessages = 50; // Limite le nombre de messages gardés en mémoire
        this.unreadMessages = 0;
        this.isModalOpen = false;
    }

    /**
     * Initialise les écouteurs d'événements pour le chat
     */
    setupEventListeners() {
        // Événements pour le chat standard
        this.chatSendButton?.addEventListener('click', () => {
            this.sendPlayerMessage(this.chatInput);
        });

        this.chatInput?.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.sendPlayerMessage(this.chatInput);
            }
        });

        // Événements pour la modale de chat
        this.chatButton?.addEventListener('click', () => {
            this.openChatModal();
        });

        this.closeModalButton?.addEventListener('click', () => {
            this.closeChatModal();
        });

        this.modalSendButton?.addEventListener('click', () => {
            this.sendPlayerMessage(this.modalChatInput);
        });

        this.modalChatInput?.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.sendPlayerMessage(this.modalChatInput);
            }
        });

        // Fermer la modale si on clique en dehors
        this.chatModal?.addEventListener('click', (event) => {
            if (event.target === this.chatModal) {
                this.closeChatModal();
            }
        });

        // Gestion des touches du clavier (échap pour fermer)
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isModalOpen) {
                this.closeChatModal();
            }
        });
    }

    /**
     * Ouvre la modale de chat
     */
    openChatModal() {
        if (this.chatModal) {
            this.chatModal.classList.remove('hidden');
            this.isModalOpen = true;
            this.resetUnreadCounter();
            
            // Mettre le focus sur le champ de saisie
            setTimeout(() => {
                this.modalChatInput?.focus();
            }, 100);
            
            // Scroll vers le bas pour voir les derniers messages
            this.scrollToBottom(this.modalMessageContainer);
        }
    }

    /**
     * Ferme la modale de chat
     */
    closeChatModal() {
        if (this.chatModal) {
            this.chatModal.classList.add('hidden');
            this.isModalOpen = false;
        }
    }

    /**
     * Réinitialise le compteur de messages non lus
     */
    resetUnreadCounter() {
        this.unreadMessages = 0;
        if (this.unreadMessageCount) {
            this.unreadMessageCount.classList.add('hidden');
        }
    }

    /**
     * Met à jour le compteur de messages non lus
     */
    updateUnreadCounter() {
        if (!this.isModalOpen) {
            this.unreadMessages++;
            
            if (this.unreadMessageCount) {
                this.unreadMessageCount.textContent = `${this.unreadMessages} ${this.unreadMessages > 1 ? 'nouveaux messages' : 'nouveau message'}`;
                this.unreadMessageCount.classList.remove('hidden');
            }
            
            // Animation du bouton de chat pour attirer l'attention
            if (this.chatButton) {
                this.chatButton.classList.add('animate-pulse');
                setTimeout(() => {
                    this.chatButton.classList.remove('animate-pulse');
                }, 1000);
            }
        }
    }

    /**
     * Fait défiler la zone de messages vers le bas
     * @param {HTMLElement} container - Le conteneur de messages à faire défiler
     */
    scrollToBottom(container) {
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    /**
     * Envoie un message du joueur et le traite
     * @param {HTMLInputElement} inputElement - L'élément input contenant le message
     */
    sendPlayerMessage(inputElement) {
        if (!inputElement) return;
        
        const message = inputElement.value.trim();
        if (message) {
            this.addMessage('player', message);
            inputElement.value = '';
            
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
        const messageData = { type, text, timestamp: new Date() };
        
        // Ajoute le message à l'historique et limite la taille
        this.messageHistory.push(messageData);
        if (this.messageHistory.length > this.maxMessages) {
            this.messageHistory.shift();
        }

        // Affiche le message dans les deux conteneurs (principal et modal)
        this.displayMessageInContainer(this.messageContainer, messageData);
        this.displayMessageInContainer(this.modalMessageContainer, messageData);
        
        // Met à jour le compteur de messages non lus
        this.updateUnreadCounter();
    }

    /**
     * Affiche un message dans un conteneur spécifique
     * @param {HTMLElement} container - Le conteneur où afficher le message
     * @param {Object} messageData - Les données du message
     */
    displayMessageInContainer(container, messageData) {
        if (!container) return;

        const { type, text, timestamp } = messageData;
        
        // Crée l'élément de message
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', type, 'mb-2', 'animate-fadeIn');
        
        // Ajoute un préfixe selon le type de message
        let prefix = '';
        if (type === 'player') {
            prefix = '<span class="text-green-300 font-bold">Toi:</span> ';
            messageElement.classList.add('text-right', 'pr-2');
        } else if (type === 'opponent') {
            prefix = '<span class="text-red-300 font-bold">Adversaire:</span> ';
            messageElement.classList.add('text-left', 'pl-2');
        } else if (type === 'system') {
            messageElement.classList.add('italic', 'text-yellow-200', 'text-center');
        }
        
        // Formate l'heure
        const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Construit le contenu du message
        messageElement.innerHTML = `
            ${prefix}${text}
            <div class="text-xs text-gray-400 mt-1">${timeString}</div>
        `;
        
        // Ajoute le message au conteneur
        container.appendChild(messageElement);
        
        // Scroll automatique vers le bas
        this.scrollToBottom(container);
    }

    /**
     * Efface tous les messages du chat
     */
    clearMessages() {
        if (this.messageContainer) {
            this.messageContainer.innerHTML = '';
        }
        if (this.modalMessageContainer) {
            this.modalMessageContainer.innerHTML = '';
        }
        this.messageHistory = [];
        this.resetUnreadCounter();
    }
}

class ChatManager {
    constructor({ chatContainerId, inputFieldId, sendButtonId, onUserInput = null }) {
        // DOM-Elemente und Konfigurationsparameter speichern
        this.chatContainer = document.getElementById(chatContainerId);
        this.inputField = document.getElementById(inputFieldId);
        this.sendButton = document.getElementById(sendButtonId);

        // Callback für Nutzer-Eingaben
        this.onUserInput = onUserInput;

        // Listener initialisieren
        this.initializeListeners();
    }

    // Methode für Chat-Ausgabe
    chatOutput(message) {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('d-flex', 'flex-row', 'justify-content-start');

        const avatar = document.createElement('img');
        avatar.src = 'chat/chat_img/bot.png';
        avatar.alt = 'avatar 1';
        avatar.style.width = '45px';
        avatar.style.height = '100%';

        const textContainer = document.createElement('div');
        const messageElement = document.createElement('p');
        messageElement.classList.add('small', 'p-2', 'ms-3', 'mb-1', 'rounded-3', 'bg-body-tertiary');
        messageElement.textContent = message;

        textContainer.appendChild(messageElement);
        messageContainer.appendChild(avatar);
        messageContainer.appendChild(textContainer);

        this.chatContainer.appendChild(messageContainer);
    }

    // Methode für Chat-Eingabe
    chatInput(message) {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('d-flex', 'flex-row', 'justify-content-end', 'mb-4', 'pt-1');

        const avatar = document.createElement('img');
        avatar.src = 'chat/chat_img/user.png';
        avatar.alt = 'avatar 1';
        avatar.style.width = '45px';
        avatar.style.height = '100%';

        const textContainer = document.createElement('div');
        const messageElement = document.createElement('p');
        messageElement.classList.add('small', 'p-2', 'me-3', 'mb-1', 'text-white', 'rounded-3', 'bg-primary');
        messageElement.textContent = message;

        textContainer.appendChild(messageElement);
        messageContainer.appendChild(textContainer);
        messageContainer.appendChild(avatar);

        this.chatContainer.appendChild(messageContainer);
    }

    // Eingabe verarbeiten
    processInput() {
        const input = this.inputField.value;

        if (input.trim()) {
            // Nutzer-Eingabe anzeigen
            this.chatInput(input);

            // Callback aufrufen, wenn definiert
            if (typeof this.onUserInput === 'function') {
                this.onUserInput(input);
            }

            // Eingabefeld leeren
            this.clearInput();
        }
    }

    // Eingabefeld leeren
    clearInput() {
        this.inputField.value = '';
    }

    // Listener für Benutzerinteraktionen
    initializeListeners() {
        this.inputField.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                this.processInput();
            }
        });

        this.sendButton.addEventListener('click', () => this.processInput());
    }
}

export default ChatManager;

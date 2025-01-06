class ChatManager {
    constructor({ chatContainerId, inputFieldId, sendButtonId, fileInputButtonId, onUserInput = null, onUpload = null }) {
        // DOM-Elemente und Konfigurationsparameter speichern
        this.chatContainer = document.getElementById(chatContainerId);
        this.inputField = document.getElementById(inputFieldId);
        this.sendButton = document.getElementById(sendButtonId);
        this.fileInputButton = document.getElementById(fileInputButtonId);

        // Callback für Nutzer-Eingaben
        this.onUserInput = onUserInput;
        this.onUpload = onUpload

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
    
        // Überprüfen, ob die Eingabe ein Bild oder Text ist
        if (typeof message === 'string') {
            // Wenn Text, Nachricht als Text anzeigen
            const messageElement = document.createElement('p');
            messageElement.classList.add('small', 'p-2', 'me-3', 'mb-1', 'text-white', 'rounded-3', 'bg-primary');
            messageElement.textContent = message;
            textContainer.appendChild(messageElement);
        } else if (message.type == 'image/png' ) {
            // Wenn Bild, Nachricht als Bild anzeigen
            const imageElement = document.createElement('img');
            imageElement.src = URL.createObjectURL(message); // Bildquelle (Base64 oder URL)
            imageElement.alt = 'Gesendetes Bild';
            imageElement.style.maxWidth = '200px'; // Maximale Breite für Bilder
            imageElement.style.borderRadius = '8px'; // Abgerundete Ecken
            textContainer.appendChild(imageElement);
        }
    
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

    // Upload verarbeiten
    processUpload() {
        const upload = this.fileInputButton.files[0];
        if (upload) {
            // Nutzer-Eingabe anzeigen
            this.chatInput(upload);

            // Callback aufrufen, wenn definiert
            if (typeof this.onUserInput === 'function') {
                this.onUpload(upload);
            }
        }
        
        // Upload leeren
        this.clearUpload();
    }

    //// Upload leeren
    clearUpload() {
        this.fileInputButton.value = null;
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
        this.fileInputButton.addEventListener('change', () => this.processUpload())
    }
}

export default ChatManager;

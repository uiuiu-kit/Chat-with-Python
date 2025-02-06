interface ChatManagerOptions {
    chatContainerId: string;
    inputFieldId: string;
    sendButtonId: string;
    fileInputButtonId: string;
    onInput?: (input: string) => void;
    onUpload?: (file: File) => void;
}

export class ChatManager {
    private chatContainer: HTMLElement | null;
    private inputField: HTMLInputElement | null;
    private sendButton: HTMLButtonElement | null;
    private fileInputButton: HTMLInputElement | null;
    private onInput: ((input: string) => void) | undefined;
    private onUpload: ((file: File) => void) | undefined;
    private executionCounter: number;
    
    constructor({ chatContainerId, inputFieldId, sendButtonId, fileInputButtonId, onInput, onUpload }: ChatManagerOptions) {
        this.chatContainer = document.getElementById(chatContainerId);
        this.inputField = document.getElementById(inputFieldId) as HTMLInputElement;
        this.sendButton = document.getElementById(sendButtonId) as HTMLButtonElement;
        this.fileInputButton = document.getElementById(fileInputButtonId) as HTMLInputElement;

        this.onInput = onInput;
        this.onUpload = onUpload;
        this.executionCounter = 1;

        this.initializeListeners();
    }

    // Methode für Chat-Ausgabe
    chatOutput(message: string, line_no: number): void {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('d-flex', 'flex-row', 'justify-content-start', 'align-items-center');

        const textContainer = document.createElement('div');
        textContainer.classList.add('d-flex', 'align-items-center'); // Zeileninhalt in einer Linie

        // Zeilennummer hinzufügen
        const lineNumberElement = document.createElement('span');
        lineNumberElement.classList.add('line-number', 'me-2'); // Abstand zur Nachricht
        lineNumberElement.style.fontSize = '0.75rem';
        lineNumberElement.style.color = '#6c757d'; // Grauer Farbton
        lineNumberElement.textContent = `#${line_no}`;

        // Nachricht hinzufügen
        const messageElement = document.createElement('p');
        messageElement.classList.add('small', 'p-2', 'ms-1', 'mb-1', 'rounded-3', 'bg-body-tertiary');
        messageElement.textContent = message;

        // Elemente in den Textcontainer einfügen
        textContainer.appendChild(lineNumberElement);
        textContainer.appendChild(messageElement);

        // Textcontainer in den Hauptcontainer einfügen
        messageContainer.appendChild(textContainer);

        // Hauptcontainer in den Chat einfügen
        this.chatContainer?.appendChild(messageContainer);
    }
    // Methode für Chat-Error-Ausgabe
    chatError(message: string, line_no: number): void {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('d-flex', 'flex-row', 'justify-content-start', 'align-items-center');

        const textContainer = document.createElement('div');
        textContainer.classList.add('d-flex', 'align-items-center'); // Zeileninhalt in einer Linie

        // Zeilennummer hinzufügen
        const lineNumberElement = document.createElement('span');
        lineNumberElement.classList.add('line-number', 'me-2'); // Abstand zur Nachricht
        lineNumberElement.style.fontSize = '0.75rem';
        lineNumberElement.style.color = '#6c757d'; // Grauer Farbton
        lineNumberElement.textContent = `#${line_no}`;

        // Nachricht hinzufügen
        const messageElement = document.createElement('p');
        messageElement.classList.add('small', 'p-2', 'ms-1', 'mb-1', 'rounded-3', 'bg-body-tertiary');
        messageElement.textContent = "ERROR: " + message;

        // Elemente in den Textcontainer einfügen
        textContainer.appendChild(lineNumberElement);
        textContainer.appendChild(messageElement);

        // Textcontainer in den Hauptcontainer einfügen
        messageContainer.appendChild(textContainer);

        // Hauptcontainer in den Chat einfügen
        this.chatContainer?.appendChild(messageContainer);
    }
    

    // Methode für Chat-Eingabe
    chatInput(message: string | File): void {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('d-flex', 'flex-row', 'justify-content-end', 'mb-4', 'pt-1');

        const textContainer = document.createElement('div');
    
        // Überprüfen, ob die Eingabe ein Bild oder Text ist
        if (typeof message === 'string') {
            // Wenn Text, Nachricht als Text anzeigen
            const messageElement = document.createElement('p');
            messageElement.classList.add('small', 'p-2', 'me-3', 'mb-1', 'text-white', 'rounded-3', 'bg-primary');
            messageElement.textContent = message;
            textContainer.appendChild(messageElement);
        } else if (message instanceof File && message.type === 'image/png') {
            // Wenn Bild, Nachricht als Bild anzeigen
            const imageElement = document.createElement('img');
            imageElement.src = URL.createObjectURL(message); // Bildquelle (Base64 oder URL)
            imageElement.alt = 'Gesendetes Bild';
            imageElement.style.maxWidth = '200px'; // Maximale Breite für Bilder
            imageElement.style.borderRadius = '8px'; // Abgerundete Ecken
            textContainer.appendChild(imageElement);
        }
    
        messageContainer.appendChild(textContainer);
    
        this.chatContainer?.appendChild(messageContainer);
    }

    newExecution(): void {
        // Erstelle den Haupt-Div-Container
        const dividerContainer = document.createElement('div');
        dividerContainer.classList.add('divider', 'd-flex', 'align-items-center', 'mb-4');

        // Erstelle das <p>-Element für die Text "Execution number"
        const dividerText = document.createElement('p');
        dividerText.classList.add('text-center', 'mx-3', 'mb-0');
        dividerText.style.color = '#a2aab7';
        dividerText.textContent = this.executionCounter + ' Execution';

        // Füge das <p>-Element in den Container ein
        dividerContainer.appendChild(dividerText);

        // Füge den Divider dem Chat-Container hinzu
        this.chatContainer?.appendChild(dividerContainer);
        this.executionCounter += 1;
    }

    // Eingabe verarbeiten
    processInput(): void {
        const input = this.inputField?.value;

        if (input && input.trim()) {
            // Nutzer-Eingabe anzeigen
            this.chatInput(input);

            // Callback aufrufen, wenn definiert
            if (this.onInput) {
                this.onInput(input);
            }

            // Eingabefeld leeren
            this.clearInput();
        }
    }

    // Upload verarbeiten
    processUpload(): void {
        if(this.fileInputButton?.files){
            const upload = this.fileInputButton.files[0];
            if (upload) {
                // Nutzer-Eingabe anzeigen
                this.chatInput(upload);
    
                // Callback aufrufen, wenn definiert
                if (this.onUpload) {
                    this.onUpload(upload);
                }
            }
            
            // Upload leeren
            this.clearUpload();
        }
        
    }

    // Upload leeren
    clearUpload(): void {
        if (this.fileInputButton) {
            this.fileInputButton.value = '';
        }
    }

    // Eingabefeld leeren
    clearInput(): void {
        if (this.inputField) {
            this.inputField.value = '';
        }
    }

    // Listener für Benutzerinteraktionen
    initializeListeners(): void {
        if (this.inputField) {
            this.inputField.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    this.processInput();
                }
            });
        }

        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.processInput());
        }

        if (this.fileInputButton) {
            this.fileInputButton.addEventListener('change', () => this.processUpload());
        }
    }
}

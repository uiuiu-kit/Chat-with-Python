interface ChatManagerOptions {
    chatContainerId: string;
    inputFieldId: string;
    sendButtonId: string;
    fileInputButtonId: string;
    onInput?: (input: string) => boolean;
    onUpload?: (file: File) => boolean;
}

export class ChatManager {
    private chatContainer: HTMLElement | null;
    private inputField: HTMLInputElement | null;
    private sendButton: HTMLButtonElement | null;
    private fileInputButton: HTMLInputElement | null;
    private onInput: ((input: string) => boolean) | undefined;
    private onUpload: ((file: File) => boolean) | undefined;
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
    chatOutput(message: string | File, line_no: number): void {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('d-flex', 'flex-row', 'justify-content-start', 'align-items-center');
    
        const textContainer = document.createElement('div');
        textContainer.classList.add('d-flex', 'align-items-center');
    
        // Zeilennummer hinzufügen
        const lineNumberElement = document.createElement('span');
        lineNumberElement.classList.add('line-number', 'me-2');
        lineNumberElement.style.fontSize = '0.75rem';
        lineNumberElement.style.color = '#6c757d';
        lineNumberElement.textContent = `#${line_no}`;
    
        textContainer.appendChild(lineNumberElement);
    
        if (typeof message === 'string') {
            // Textnachricht
            const messageElement = document.createElement('p');
            messageElement.classList.add('small', 'p-2', 'ms-1', 'mb-1', 'rounded-3', 'bg-body-tertiary');
            messageElement.innerHTML = `<pre style="display: inline;">${message}</pre>`;
            textContainer.appendChild(messageElement);
        } else if (message instanceof File && message.type.startsWith('image/')) {
            // Bildnachricht
            const imageElement = document.createElement('img');
            imageElement.src = URL.createObjectURL(message);
            imageElement.alt = 'Empfangenes Bild';
            imageElement.style.maxWidth = '300px';
            imageElement.style.borderRadius = '8px';
            textContainer.appendChild(imageElement);
        }
    
        messageContainer.appendChild(textContainer);
        this.chatContainer?.appendChild(messageContainer);
        this.scrollToBottom();
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
        messageElement.classList.add('small', 'p-2', 'ms-1', 'mb-1', 'rounded-3', 'bg-danger');
        messageElement.innerHTML = "ERROR: " + `<pre style="display: inline;">${message}</pre>`;

        // Elemente in den Textcontainer einfügen
        textContainer.appendChild(lineNumberElement);
        textContainer.appendChild(messageElement);

        // Textcontainer in den Hauptcontainer einfügen
        messageContainer.appendChild(textContainer);

        // Hauptcontainer in den Chat einfügen
        this.chatContainer?.appendChild(messageContainer);
        this.scrollToBottom()
    }
    

    // Methode für Chat-Eingabe
    chatInput(message: string | File, expected: boolean): void {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('d-flex', 'flex-row', 'justify-content-end', 'mb-4', 'pt-1');
    
        const textContainer = document.createElement('div');
    
        if (typeof message === 'string') {
            //  Text anzeigen
            const messageElement = document.createElement('p');
            messageElement.classList.add('small', 'p-2', 'me-3', 'mb-1', 'rounded-3');
            if(expected) {
                messageElement.classList.add('bg-primary', 'text-white');
            } else {
                messageElement.classList.add('bg-warning');
            }
            messageElement.textContent = message;
            textContainer.appendChild(messageElement);
        } else if (message instanceof File) {
            if (message.type.startsWith('image/')) {
                //  Bild anzeigen
                const imageElement = document.createElement('img');
                imageElement.src = URL.createObjectURL(message);
                imageElement.alt = 'Gesendetes Bild';
                imageElement.style.maxWidth = '300px';
                imageElement.style.borderRadius = '8px';
                textContainer.appendChild(imageElement);
            } else if (message.type === 'text/csv') {
                //  CSV anzeigen
                const reader = new FileReader();
                reader.onload = () => {
                    const csvText = reader.result as string;
                    const tableElement = this.createTableFromCSV(csvText);
                    textContainer.appendChild(tableElement);
                };
                reader.readAsText(message);
            }
        }
        messageContainer.appendChild(textContainer);
        this.chatContainer?.appendChild(messageContainer);
        // Vielleicht noch austauschen
        if(! expected) {

            const notificationContainer = document.createElement('div');
            notificationContainer.classList.add('d-flex', 'flex-row', 'justify-content-end');
            const notExpectedNotification = document.createElement('p');
            notExpectedNotification.classList.add('small', 'p-2', 'me-3', 'mb-1', 'rounded-3','bg-warning');
            notExpectedNotification.textContent = 'Message not computed';
            notificationContainer.appendChild(notExpectedNotification);
            this.chatContainer?.appendChild(notificationContainer);
        }
        this.scrollToBottom();
    }
    
    createTableFromCSV(csvText: string): HTMLDivElement {
        const tableContainer = document.createElement('div'); // Container für Tabelle & Metadaten
        tableContainer.classList.add('p-2', 'bg-light', 'border', 'rounded'); // Bootstrap-Styling
    
        const table = document.createElement('table');
        table.classList.add('table', 'table-bordered', 'table-sm');
    
        const rows = csvText.trim().split('\n').map(row => row.split(',')); // CSV in 2D-Array umwandeln
        const totalRows = rows.length;
        const totalCols = rows[0].length;
    
        // Anzeige der Anzahl der Zeilen & Spalten
        const infoText = document.createElement('p');
        infoText.textContent = `${totalRows} Zeilen, ${totalCols} Spalten`;
        infoText.classList.add('mb-2', 'fw-bold');
        tableContainer.appendChild(infoText);
    
        // Bestimmen, welche Zeilen angezeigt werden sollen
        let visibleRows: string[][] = [];
        if (totalRows > 20) {
            visibleRows = [...rows.slice(0, 5), ["...".repeat(totalCols)], ...rows.slice(-5)];
        } else {
            visibleRows = rows;
        }
    
        // Tabelle generieren
        visibleRows.forEach((rowText, rowIndex) => {
            const row = document.createElement('tr');
    
            rowText.forEach(cellText => {
                const cell = document.createElement('td'); // Erste Zeile = Header
                cell.textContent = cellText.trim();
                row.appendChild(cell);
            });
    
            table.appendChild(row);
        });
    
        tableContainer.appendChild(table);
        return tableContainer;
    }
    
    

    scrollToBottom() {
        if(this.chatContainer){
            const lastMessage = this.chatContainer.lastElementChild;
            if (lastMessage) {
                lastMessage.scrollIntoView({ behavior: "smooth" });
            }
        }
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

            // Callback aufrufen, wenn definiert
            if (this.onInput) {
                const expected = this.onInput(input);
                this.chatInput(input, expected)
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
    
                // Callback aufrufen, wenn definiert
                if (this.onUpload) {
                    const expected = this.onUpload(upload);
                    this.chatInput(upload, expected);
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

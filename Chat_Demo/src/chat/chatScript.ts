import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import { Tooltip } from 'bootstrap';
import { inputResponse } from '../main'

import downloadingImg from './chat_img/downloading.png';

interface ChatManagerOptions {
    chatContainerId: string;
    inputFieldId: string;
    sendButtonId: string;
    fileInputButtonId: string;
    onInput?: (input: string) => inputResponse;
    onUpload?: (file: File) => inputResponse;
}

export class ChatManager {
    private chatContainer: HTMLElement | null;
    private inputField: HTMLInputElement | null;
    private sendButton: HTMLButtonElement | null;
    private fileInputButton: HTMLInputElement | null;
    private onInput: ((input: string) => inputResponse) | undefined;
    private onUpload: ((file: File) => inputResponse) | undefined;
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

    // Method for chat output
    chatOutput(message: string | File, line_no: number): void {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('d-flex', 'flex-row', 'justify-content-start', 'align-items-center');
    
        const textContainer = document.createElement('div');
        textContainer.classList.add('d-flex', 'align-items-center');
    
        // Add line number
        const lineNumberElement = document.createElement('span');
        lineNumberElement.classList.add('line-number', 'me-2');
        lineNumberElement.style.fontSize = '0.75rem';
        lineNumberElement.style.color = '#6c757d';
        lineNumberElement.textContent = `#${line_no}`;
    
        textContainer.appendChild(lineNumberElement);
    
        if (typeof message === 'string') {
            // Text message
            const messageElement = document.createElement('p');
            messageElement.classList.add('small', 'p-2', 'ms-1', 'mb-1', 'rounded-3', 'bg-body-tertiary');
            messageElement.innerHTML = `<pre style="display: inline;">${message}</pre>`;
            textContainer.appendChild(messageElement);
        } else if (message instanceof File && message.type.startsWith('text/csv')) {

            const reader = new FileReader();
            reader.onload = () => {
                const csvText = reader.result as string;
                const tableElement = this.createTableFromCSV(csvText);

                // Create wrapper DIV
                const wrapper = document.createElement('div');
                wrapper.style.position = 'relative';
                wrapper.appendChild(tableElement);
                

                // Create download link
                const blob = new Blob([message], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = "table.csv";
                downloadLink.classList.add('btn');
                const image = document.createElement('img');
                image.src = downloadingImg;
                image.alt = 'Download Table';
                image.style.width = '30px';
                image.style.height = '30px';
                downloadLink.style.position = 'absolute';
                downloadLink.style.top = '0px';
                downloadLink.style.right = '-40px';
                downloadLink.appendChild(image);
                wrapper.appendChild(downloadLink);
                textContainer.appendChild(wrapper);
            };
            reader.readAsText(message);
        } else if (message instanceof File && message.type.startsWith('image/')) {
            // Image message
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
    
    // Method for chat error output
    chatError(message: string, line_no: number): void {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('d-flex', 'flex-row', 'justify-content-start', 'align-items-center');
        

        const textContainer = document.createElement('div');
        textContainer.classList.add('d-flex', 'align-items-center');

        // Add line number
        const lineNumberElement = document.createElement('span');
        lineNumberElement.classList.add('line-number', 'me-2');
        lineNumberElement.style.fontSize = '0.75rem';
        lineNumberElement.style.color = '#6c757d';
        lineNumberElement.textContent = `#${line_no}`;

        // Add message
        const messageElement = document.createElement('p');
        messageElement.classList.add('small', 'p-2', 'ms-1', 'mb-1', 'rounded-3', 'bg-danger-light');
        messageElement.innerHTML = "ERROR: " + `<pre style="display: inline;">${message}</pre>`;
        textContainer.appendChild(lineNumberElement);
        textContainer.appendChild(messageElement);
        messageContainer.appendChild(textContainer);
        this.chatContainer?.appendChild(messageContainer);
        this.scrollToBottom()
    }
    

    // Method for chat input
    chatInput(message: string | File, response: inputResponse): void {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('d-flex', 'flex-row', 'justify-content-end', 'mb-4', 'pt-1');
    
        const textContainer = document.createElement('div');
    
        if (typeof message === 'string') {
            // Show text
            const messageElement = document.createElement('p');
            messageElement.classList.add('small', 'p-2', 'me-3', 'mb-1', 'rounded-3', 'bg-primary', 'text-white');
            messageElement.textContent = message;
            textContainer.appendChild(messageElement);
        } else if (message instanceof File) {
            if (message.type.startsWith('image/')) {
                // Show image
                const imageElement = document.createElement('img');
                imageElement.src = URL.createObjectURL(message);
                imageElement.alt = 'Gesendetes Bild';
                imageElement.style.maxWidth = '300px';
                imageElement.style.borderRadius = '8px';
                textContainer.appendChild(imageElement);
            } else if (message.type === 'text/csv') {
                // Display CSV
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
        // Perhaps replace
        if (response != "expected") {
            const notificationContainer = document.createElement('div');
            notificationContainer.classList.add('d-flex', 'flex-row', 'justify-content-end');
            const notExpectedNotification = document.createElement('p');
            notExpectedNotification.classList.add('small', 'p-2', 'me-4', 'rounded-3','bg-warning', 'overlap-message');
            if(response == "notExpected") {
                notExpectedNotification.textContent = 'Message not deliverd';
                notExpectedNotification.setAttribute('data-bs-toggle', 'tooltip');
                notExpectedNotification.setAttribute('title', 'This message was sent before the Python program expected any input, so the input was not delivered and will have no effect on the execution of the Python code.');
                const tooltipTrigger = new Tooltip(notExpectedNotification, { placement: 'bottom' });
            } else if (response == "expectedFileNotText"){
                notExpectedNotification.textContent = 'Expected a File not a Text. Please provide a File.';
            } else if (response == "expectedTextNotFile"){
                notExpectedNotification.textContent = 'Expected a Text not a File. Please provide a Text.';
            }
            notificationContainer.appendChild(notExpectedNotification);
            this.chatContainer?.appendChild(notificationContainer);
        }
        this.scrollToBottom();
    }
    
    createTableFromCSV(csvText: string): HTMLDivElement {
        const tableContainer = document.createElement('div'); // Container for table & metadata
        tableContainer.classList.add('p-2', 'bg-light', 'border', 'rounded');
    
        const table = document.createElement('table');
        table.classList.add('table', 'table-bordered', 'table-sm', 'chat-table');
    
        const rows = csvText.trim().split('\n').map(row => row.split(',')); // Convert CSV to 2D array
        const totalRows = rows.length;
        const totalCols = rows[0].length;
    
        // Display the number of rows & columns
        const infoText = document.createElement('p');
        infoText.textContent = `${totalRows} Rows, ${totalCols} Columns`;
        infoText.classList.add('mb-2', 'fw-bold');
        tableContainer.appendChild(infoText);
    
        // Reduce the number of Rows if there are more than 20
        let visibleRows: string[][] = [];
        if (totalRows > 20) {
            visibleRows = [...rows.slice(0, 5), ["..."], ...rows.slice(-5)];
        } else {
            visibleRows = rows;
        }
    
        // Reduce the number of columns if there are more than 10
        let visibleRowsWithCols: string[][] = visibleRows.map(row => {
            if (row.length > 10) {
                return [...row.slice(0, 3), "...", ...row.slice(-3)];
            } else {
                return row;
            }
        });
    
        // Generate table
        visibleRowsWithCols.forEach((rowText, rowIndex) => {
            const row = document.createElement('tr');
    
            rowText.forEach(cellText => {
                let cell;
                if (rowIndex === 0) {
                    cell = document.createElement('th'); // First line = Header
                } else {
                    cell = document.createElement('td');
                }
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
        const dividerContainer = document.createElement('div');
        dividerContainer.classList.add('divider', 'd-flex', 'align-items-center', 'mb-4');
        const dividerText = document.createElement('p');
        dividerText.classList.add('text-center', 'mx-3', 'mb-0');
        dividerText.style.color = '#a2aab7';
        dividerText.textContent = this.executionCounter + ' Execution';
        dividerContainer.appendChild(dividerText);
        this.chatContainer?.appendChild(dividerContainer);
        this.executionCounter += 1;
    }

    processInput(): void {
        const input = this.inputField?.value;

        if (input && input.trim()) {            

            if (this.onInput) {
                const response = this.onInput(input);
                this.chatInput(input, response)
            }

            this.clearInput();
        }
    }

    processUpload(): void {
        if(this.fileInputButton?.files){
            const upload = this.fileInputButton.files[0];
            if (upload) {                

                if (this.onUpload) {
                    const response = this.onUpload(upload);
                    this.chatInput(upload, response);
                }
            }
            
            this.clearUpload();
        }
        
    }


    clearUpload(): void {
        if (this.fileInputButton) {
            this.fileInputButton.value = '';
        }
    }


    clearInput(): void {
        if (this.inputField) {
            this.inputField.value = '';
        }
    }


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

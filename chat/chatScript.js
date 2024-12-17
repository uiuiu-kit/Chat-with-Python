function chatOutput(message) {
    // Erstellen des Chat-Nachrichten-Containers
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('d-flex', 'flex-row', 'justify-content-start');

    // Erstellen des Avatars (bot.png)
    const avatar = document.createElement('img');
    avatar.src = 'chat/chat_img/bot.png';
    avatar.alt = 'avatar 1';
    avatar.style.width = '45px';
    avatar.style.height = '100%';

    // Erstellen des Text-Containers
    const textContainer = document.createElement('div');

    // Erstellen der Nachricht (p-Tag mit der Nachricht)
    const messageElement = document.createElement('p');
    messageElement.classList.add('small', 'p-2', 'ms-3', 'mb-1', 'rounded-3', 'bg-body-tertiary');
    messageElement.textContent = message;

    // Anhängen der Elemente
    textContainer.appendChild(messageElement);
    messageContainer.appendChild(avatar);
    messageContainer.appendChild(textContainer);

    // Die Nachricht dem Chat-Container hinzufügen
    document.getElementById('chat-container').appendChild(messageContainer);
}

function chatInput(message) {
    // Erstellen des Chat-Nachrichten-Containers
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('d-flex', 'flex-row', 'justify-content-end', 'mb-4', 'pt-1');

    // Erstellen des Avatars (user.png)
    const avatar = document.createElement('img');
    avatar.src = 'chat/chat_img/user.png';
    avatar.alt = 'avatar 1';
    avatar.style.width = '45px';
    avatar.style.height = '100%';

    // Erstellen des Text-Containers
    const textContainer = document.createElement('div');

    // Erstellen der Nachricht (p-Tag mit der Nachricht)
    const messageElement = document.createElement('p');
    messageElement.classList.add('small', 'p-2', 'me-3', 'mb-1', 'text-white', 'rounded-3', 'bg-primary');
    messageElement.textContent = message;

    // Anhängen der Elemente
    textContainer.appendChild(messageElement);
    messageContainer.appendChild(textContainer); // erst Text dann Avatar für die korrekte Reihnfolge
    messageContainer.appendChild(avatar);

    // Die Nachricht dem Chat-Container hinzufügen
    document.getElementById('chat-container').appendChild(messageContainer);
}

function clearInput() {
    document.getElementById('exampleFormControlInput1').value = '';
}

function processInput(){
    const input = document.getElementById('exampleFormControlInput1').value;

    chatInput(input);

    clearInput()
}

function onEnterPress(event) {
    if (event.key === 'Enter') {
        processInput()
    }
}

// Listener für das Eingabefeld
document.getElementById('exampleFormControlInput1').addEventListener('keydown', onEnterPress);
document.getElementById('sendMessage').addEventListener('click', processInput);
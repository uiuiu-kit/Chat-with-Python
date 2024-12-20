// main.js
import { WorkerManager } from "./webworker/worker-manager.js";
import ChatManager from './chat/chatScript.js';

// Initialisieren
const workerManager = new WorkerManager("./webworker/webworker.js");

console.log("Initialisiere Worker...");
await workerManager.initialize();

document.getElementById("python-run-button").addEventListener("click", async () => {

  console.log("Lade Python-Skript...");
  const response = await fetch("webworker/script.py");
  const pyScript = await response.text();

  console.log("Führe Python-Skript aus...");
  try {
    const result = await workerManager.runScript(pyScript, onInput);
    console.log("Ergebnis des Python-Skripts:", result);
  } catch (error) {
    console.error("Fehler beim Ausführen des Skripts:", error.message);
  }
});

function onInput(prompt) {
  chatManager.chatOutput(prompt)
}

async function handleUpload(upload) {
  console.log("Upload verarbeiten", upload.name)
  try {
    const arrayBuffer = await upload.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    workerManager.getInput(uint8Array)
  } catch (error) {
      console.error("Fehler beim Lesen des ArrayBuffers:", error);
  }
}

// Funktion, die aufgerufen wird, wenn der Nutzer etwas eingibt
function handleUserInput(input, ) {
  console.log("Nutzereingabe verarbeitet:", input);
  workerManager.getInput(input)
}

// ChatManager-Instanz erstellen
const chatManager = new ChatManager({
  chatContainerId: 'chat-container',
  inputFieldId: 'exampleFormControlInput1',
  sendButtonId: 'sendMessage',
  fileInputButtonId: 'fileInput',
  onUserInput: handleUserInput,
  onUpload: handleUpload
});
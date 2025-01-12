// main.js
import { WorkerManager } from "./webworker/worker-manager.js";
import ChatManager from './chat/chatScript.js';

// Initialisieren
const workerManager = new WorkerManager("./webworker/webworker.js");

console.log("Initialisiere Worker...");
await workerManager.initialize();

// Python example
document.getElementById("python-run-example-button").addEventListener("click", async () => {

  console.log("Lade Python-Skript...");
  const response = await fetch("webworker/example.py");
  const pyScript = await response.text();

  console.log("Führe Python-Skript aus...");
  try {
    const result = await workerManager.runScript(pyScript, Output);
    console.log("Ergebnis des Python-Skripts:", result);
  } catch (error) {
    console.error("Fehler beim Ausführen des Skripts:", error.message);
  }
});

// Python user Code
document.getElementById("python-run-button").addEventListener("click", async () => {

  console.log("Lade Python-Skript...");

  const pyScript = editor.getValue()

  console.log("Führe Python-Skript aus...");
  try {
    const result = await workerManager.runScript(pyScript, Output);
    console.log("Ergebnis des Python-Skripts:", result);
  } catch (error) {
    console.error("Fehler beim Ausführen des Skripts:", error.message);
  }
});

function Output(message, line_no) {
  chatManager.chatOutput(message, line_no)
}

async function handleUpload(upload) {
  workerManager.getUpload(upload)
}

// Funktion, die aufgerufen wird, wenn der Nutzer etwas eingibt
function handleUserInput(input, ) {;
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

require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.38.0/min/vs' } });

let editor;
require(['vs/editor/editor.main'], function() {
  editor = monaco.editor.create(document.getElementById('monacoEditor'), {
        value: "# Schreibe hier deinen Python-Code",
        language: 'python',
        theme: 'vs-dark',
        automaticLayout: true,
    });
});
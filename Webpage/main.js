// main.js
import { WorkerManager } from "./webworker/worker-manager.js";
import ChatManager from './chat/chatScript.js';

// ------------------ Button Managemend -----------------------------------

// Klick auf den sichtbaren Button löst das versteckte Datei-Upload-Input aus
document.getElementById('customUploadCodeButton').addEventListener('click', function() {
  document.getElementById('uploadCodeButton').click();
});

// Optional: Datei auswählen und den Dateinamen in der Konsole anzeigen
document.getElementById('uploadCodeButton').addEventListener('change', function() {
  const file = this.files[0];
  if (file) {
      console.log('Hochgeladene Datei:', file.name);
  }
});

document.getElementById('stopCodeButton').addEventListener('click', function() {
  newWorker()
});

function updateIcon() {
  const loadingSymbol = document.getElementById('loading-symbol');
  const readySymbol = document.getElementById('ready-symbol');
  const awaitSymbol = document.getElementById('await-symbol')

  loadingSymbol.style.display = 'none';
  awaitSymbol.style.display = 'none'
  readySymbol.style.display = 'none';

  if (workerManager.worker_status == 'loading') {
    loadingSymbol.style.display = 'block';
  } else if (workerManager.worker_status == 'await input') {
    awaitSymbol.style.display = 'block';
  } else {
    readySymbol.style.display = 'block';
  }
}

setInterval(updateIcon, 500);

// ------------------ Webworker Funktionalität ----------------------------

// Initialisieren
const workerManager = new WorkerManager("./webworker/webworker.js");

console.log("Initialisiere Worker...");
await workerManager.initialize();

async function newWorker() {
  workerManager.newWorker("./webworker/webworker.js")
  await workerManager.initialize()
}

// Python user Code
document.getElementById("pythonRunButton").addEventListener("click", async () => {

  console.log("Lade Python-Skript...");

  const pyScript = editor.getValue();

  chatManager.newExecution();

  console.log("Führe Python-Skript aus...");
  try {
    const result = await workerManager.runScript(pyScript, Output);
    console.log("Ergebnis des Python-Skripts:", result);
  } catch (error) {
    console.error("Fehler beim Ausführen des Skripts:", error.message);
  }
});

// --------------- Chat Funktionalität ----------------------

function Output(message, line_no) {
  chatManager.chatOutput(message, line_no);
}

async function handleUpload(upload) {
  workerManager.getUpload(upload);
}

// Funktion, die aufgerufen wird, wenn der Nutzer etwas eingibt
function handleUserInput(input, ) {;
  workerManager.getInput(input);
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

// ------------- Editor Funktionalität -------------------------

function downloadCodeAsFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Button für das Herunterladen des Codes
document.getElementById('downloadCodeButton').addEventListener('click', function() {
  const code = editor.getValue();
  downloadCodeAsFile('code.py', code);
});

function loadCodeIntoEditor(fileContent) {
  // Setzt den Inhalt des Editors auf den geladenen Code
  editor.setValue(fileContent);
}

document.getElementById('uploadCodeButton').addEventListener('change', function(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
      loadCodeIntoEditor(e.target.result);
  };

  reader.readAsText(file);
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
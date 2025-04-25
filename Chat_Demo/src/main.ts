// main.ts
import {PyodideClient} from "pyodide-worker-runner";
import {makeChannel} from "sync-message";
import * as Comlink from "comlink";

import * as monaco from 'monaco-editor';

import {ChatManager} from './chat/chatScript';

setInterval(updateIcon, 500);

// ---------------- Webworker Functionality -------------------------------

// Setup the channel to communicat between the main thread and the worker thread
let channel = makeChannel({ atomics: { bufferSize: 10 * 1024 * 1024 } }); // 10 MB
let pyodideWorker: Worker;
let taskClient: any;
let csvFiles: { name: string; content: string }[] = [];

type executionState = "init" | "idle" | "running" | "awaitingInput" | "awaitingUpload";

let curExecutionState: executionState = "init";
async function initWorker(){
  // Setup The PyodideClient with my own worker
  pyodideWorker = new Worker(new URL("./pyodide-worker.ts", import.meta.url), {
    type: "module",
  });
  taskClient = new PyodideClient(() => pyodideWorker, channel);

  await taskClient.call(
    taskClient.workerProxy.initPyodideRunner,
  );
  curExecutionState = "idle";
}

initWorker()


async function updateOutput(outputArr: Array<Object>) {
  for (const part of outputArr) {
    const type = part["type"]
    if (["stderr", "traceback", "syntax_error"].includes(type)) {
      const parsed = parseOuputMessage(part["text"])
      console.error(parsed.text);
      if(curExecutionState != "init") {
        chatManager.chatError(parsed.text, parsed.line_no);
      }
    } else if(type == "input_prompt"){
      const parsed = parseInputMessage(part["text"]);
      console.log(parsed);
      chatManager.chatOutput(parsed.text, parsed.line_no)
      if (parsed.input_type == "string") {
        curExecutionState = "awaitingInput"
      } else {
        curExecutionState = "awaitingUpload"
      }
    } else if(type == "input") {
      console.log(part["text"]);
    } else if(type == "img_output") {
      const parsed = parseOuputMessage(part["text"]);
      const base64String = parsed.text;
      const img_file = base64ToFile(base64String, "image.png");
      chatManager.chatOutput(img_file, parsed.line_no);
    } else if(type == "table_output") {
      computeTableOutput(part["text"])
    }
      else {
      const parsed = parseOuputMessage(part["text"]);
      console.log(parsed);
      chatManager.chatOutput(parsed.text, parsed.line_no);
    }
  }
}

function computeTableOutput(csvText: string) {
  console.log("Tabelle erhalten") 

  // Convert CSV string to File object
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `table-${timestamp}.csv`;
  const file = new File([csvText], fileName, { type: 'text/csv' });

  // Save file in csvFiles array
  csvFiles.push({ name: fileName, content: csvText });

  // Pass File object to chatManager for rendering and download link
  chatManager.chatOutput(file, 12);
}

function base64ToFile(base64: string, fileName: string): File {
  const byteCharacters = atob(base64); // Base64-Daten dekodieren
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "image/png" }); // Blob mit Typ PNG
  return new File([blob], fileName, { type: "image/png" }); // In File umwandeln
}

function parseOuputMessage(logMessage: string): { code_name: string; line_no: number; text: string } {
  const trimedMessage = logMessage.trim()
  const regex = /^\u2764\u1234(.+?):(\d+)\u1234\u2764\s+([\s\S]+)$/;
  const match = trimedMessage.match(regex);
  if (match) {
      const code_name = match[1]; // First capturing group
      const line_no = parseInt(match[2], 10); // Second capturing group, converted to number
      const text = match[3]; // Third capturing group
      return { code_name, line_no, text };
  }
  return {code_name: "Error", line_no: 42, text: logMessage};
}

function parseInputMessage(logMessage: string): { code_name: string; line_no: number; input_type: string; text: string } {
  const trimmedMessage = logMessage.trim();
  const regex = /^\u2764\u1234(.+?):(\d+)\u1234\u2764\s+\u3333(.+?)\u3333\s+(.+)$/;
  const match = trimmedMessage.match(regex);
  
  if (match) {
      const code_name = match[1]; // Erster Capturing-Group
      const line_no = parseInt(match[2], 10); // Zweiter Capturing-Group, in Zahl umwandeln
      const input_type = match[3]; // Dritter Capturing-Group
      const text = match[4]; // Vierter Capturing-Group
      
      return { code_name, line_no, input_type, text };
  }
  
  return { code_name: "Error", line_no: 42, input_type: "Unknown", text: logMessage };
}

async function handleInput(question: string, input_type: string) {
  // DO-NOTHING
  // ALL FUNCIONALITY IS IN UPDATE OUTPUT
}

async function handleMain() {
  let result = NaN;
  console.log('Main thread running');
  taskClient.writeMessage(result);
}

async function computeInput(input: string) {
  if (curExecutionState == "awaitingInput") {
    taskClient.writeMessage(input)
    curExecutionState = "running"
  } else {
    Output('Input nicht möglich. Bitte warten Sie, bis der Input aktiv ist.', 0);
  }
}

async function computeUpload(upload: File) {
  if (curExecutionState === "awaitingUpload") {
    const reader = new FileReader();

    reader.onload = async () => {
      if (upload.type.startsWith("image/")) {
        // Bild wird als Base64 gelesen
        const base64Image = (reader.result as string).split(",")[1]; // Entfernt "data:image/png;base64,"
        taskClient.writeMessage(base64Image);
      } else if (upload.type === "text/csv") {
        // CSV wird als Text gelesen und in Base64 umgewandelt
        const textData = reader.result as string;
        const base64CSV = btoa(textData); // Text in Base64 umwandeln
        taskClient.writeMessage(base64CSV);
      } else {
        Output("Dateityp nicht unterstützt.", 0);
        return;
      }

      curExecutionState = "running";
    };

    // Richtige Lesemethode je nach Dateityp wählen
    if (upload.type.startsWith("image/")) {
      reader.readAsDataURL(upload);
    } else if (upload.type === "text/csv") {
      reader.readAsText(upload);
    } else {
      Output("Dateityp nicht unterstützt.", 0);
    }
  } else {
    Output("Upload nicht möglich. Bitte warten Sie, bis der Upload aktiv ist.", 0);
  }
}


async function runCode(code: string) {
  if(curExecutionState != "idle") {
    await abortPyodide()
  }
  chatManager.newExecution();
  curExecutionState = "running";
    // pass code to webworker and run it
  await taskClient.call(
    taskClient.workerProxy.runCode,
    code,
    Comlink.proxy(updateOutput),
    Comlink.proxy(handleInput),
    Comlink.proxy(handleMain),
  );
  if (curExecutionState === "running") {
    curExecutionState = "idle";
  }
}

async function abortPyodide() {
  curExecutionState = "init"
  await taskClient.interrupt();
  await initWorker()
}

// ------------------ Button Management -----------------------------------

document.getElementById('pythonRunButton')!.addEventListener('click', function() {
  if (editor) {
    const code = editor?.getValue()
    runCode(code);
  }
})

// Click on the visible button triggers the hidden file upload input
document.getElementById('customUploadCodeButton')!.addEventListener('click', function() {
  (document.getElementById('uploadCodeButton') as HTMLInputElement).click();
});

// Optional: Select a file and display the filename in the console
document.getElementById('uploadCodeButton')!.addEventListener('change', function() {
  const file = (this as HTMLInputElement).files?.[0];
  if (file) {
      console.log('Uploaded file:', file.name);
  }
});

document.getElementById('stopCodeButton')!.addEventListener('click', function() {
  abortPyodide();
});

function updateIcon() {
  const loadingSymbol = document.getElementById('loading-symbol')!;
  const readySymbol = document.getElementById('ready-symbol')!;
  const awaitSymbol = document.getElementById('await-symbol')!;

  loadingSymbol.style.display = 'none';
  awaitSymbol.style.display = 'none';
  readySymbol.style.display = 'none';

  if (curExecutionState == 'awaitingInput' || curExecutionState == 'awaitingUpload') {
    awaitSymbol.style.display = 'block';
  } else if (curExecutionState == 'running' || curExecutionState == 'init') {
    loadingSymbol.style.display = 'block';
  } else {
    readySymbol.style.display = 'block';
  }
}

// --------------- Chat Functionality ----------------------

function Output(message: string, line_no: number) {
  chatManager.chatOutput(message, line_no);
}

function gotUpload(upload: File) {
  if(curExecutionState == "awaitingUpload") {
    computeUpload(upload);
    return true;
  }
  else return false;
}

// Function called when the user inputs something
function gotInput(input: string): boolean {
  if(curExecutionState == "awaitingInput"){
    computeInput(input);
    return true;
  }
  else return false;
}

// Create ChatManager instance
const chatManager = new ChatManager({
  chatContainerId: 'chat-container',
  inputFieldId: 'exampleFormControlInput1',
  sendButtonId: 'sendMessage',
  fileInputButtonId: 'fileInput',
  onInput: gotInput,
  onUpload: gotUpload,
});
// ------------- Editor Functionality -------------------------

// monacoEditor

let editor: monaco.editor.IStandaloneCodeEditor | null = null;

const editorElement = document.getElementById('monacoEditor');

if (editorElement) {
  editor = monaco.editor.create(editorElement, {
    value: "input('Hello, Monaco!')",
    language: "python",
    theme: "vs-dark",
  });
} else {
  console.error("Element mit ID 'monacoEditor' nicht gefunden.");
}

function downloadCodeAsFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Button for downloading the code
document.getElementById('downloadCodeButton')!.addEventListener('click', function() {
  if (editor) {
    const code = editor.getValue();
    downloadCodeAsFile('code.py', code);
  }
});

function loadCodeIntoEditor(fileContent: string) {
  // Set the editor content to the loaded code
  if (editor){
    editor.setValue(fileContent);
  }
}

document.getElementById('uploadCodeButton')!.addEventListener('change', function(event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  const reader = new FileReader();

  reader.onload = function(e) {
      loadCodeIntoEditor(e.target!.result as string);
  };

  if (file) {
    reader.readAsText(file);
  }
});
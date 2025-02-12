// main.ts
import {PyodideClient} from "pyodide-worker-runner";
import {makeChannel} from "sync-message";
import * as Comlink from "comlink";

import * as monaco from 'monaco-editor';

import {ChatManager} from './chat/chatScript';

setInterval(updateIcon, 500);

// ---------------- Webworker Functionality -------------------------------

// Setup the channel to communicat between the main thread and the worker thread
let channel = makeChannel();
let pyodideWorker: Worker;
let taskClient: any;

type executionState = "init" | "idle" | "running" | "awaitingInput" | "awaitingUpload";

let curExecutionState: executionState = "init";

// Setup The PyodideClient with my own worker
pyodideWorker = new Worker(new URL("./pyodide-worker.ts", import.meta.url), {
  type: "module",
});
taskClient = new PyodideClient(() => pyodideWorker, channel);

await taskClient.call(
  taskClient.workerProxy.initPyodideRunner,
);

curExecutionState = "idle";

async function updateOutput(outputArr: Array<Object>) {
  for (const part of outputArr) {
    const type = part["type"]
    const parsed = parseLogMessage(part["text"])
    if (["stderr", "traceback", "syntax_error"].includes(type)) {
      console.error(parsed.text);
      chatManager.chatError(parsed.text, parsed.line_no)
    } else {
      console.log(parsed.text);
      chatManager.chatOutput(parsed.text, parsed.line_no)
    }
  }
}

function parseLogMessage(logMessage: string): { code_name: string; line_no: number; text: string } {
  const trimedMessage = logMessage.trim()
  const regex = /^\[(.+?):(\d+)\]\s+(.+)$/;
  const match = trimedMessage.match(regex);
  if (match) {
      const code_name = match[1]; // First capturing group
      const line_no = parseInt(match[2], 10); // Second capturing group, converted to number
      const text = match[3]; // Third capturing group
      return { code_name, line_no, text };
  }
  return {code_name: "Error", line_no: 42, text: logMessage};
}

async function handleInput(question: string, type: string = "string") {
  if (type = "string") {
    curExecutionState = "awaitingInput"
  } else {
    curExecutionState = "awaitingUpload"
  }
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
    Output('Upload nicht möglich. Bitte warten Sie, bis der Upload aktiv ist.', 0);
  }
}

async function computeUpload(upload: File) {
  if (curExecutionState == "awaitingUpload") {
    const arrayBuffer = await upload.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    taskClient.writeMessage(uint8Array)
    curExecutionState = "running"
  } else {
    Output('Upload nicht möglich. Bitte warten Sie, bis der Upload aktiv ist.', 0);
  }
}

async function runCode(code: string) {
  curExecutionState = "running"
    // pass code to webworker and run it
  const resultPromise = 
  await taskClient.call(
    taskClient.workerProxy.runCode,
    code,
    Comlink.proxy(updateOutput),
    Comlink.proxy(handleInput),
    Comlink.proxy(handleMain),
  );
  curExecutionState = "idle"
}

async function abortPyodide() {
  await taskClient.interrupt();
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

  // Muss noch gefixt werden
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

async function gotUpload(upload: File) {
  computeUpload(upload)
}

// Function called when the user inputs something
async function gotInput(input: string) {
  computeInput(input)
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
    value: "print('Hello, Monaco!')",
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
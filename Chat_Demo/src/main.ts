// main.ts
import {PyodideClient} from "pyodide-worker-runner";
import {makeChannel} from "sync-message";
import * as Comlink from "comlink";

import {EditorView, basicSetup} from "codemirror";
import {python} from "@codemirror/lang-python";
import {ChatManager} from './chat/chatScript';

setInterval(updateIcon, 500);

// ---- Debugging ---- 
if ('serviceWorker' in navigator) {
  console.log('Service Workers are supported.');
  navigator.serviceWorker.getRegistrations().then(registrations => {
    if (registrations.length > 0) {
      console.log('Service Workers registered:', registrations);
    } else {
      console.log('No Service Workers registered.');
    }
  });
} else {
  console.log('Service Workers are NOT supported.');
}

if (typeof SharedArrayBuffer !== 'undefined') {
  console.log('SharedArrayBuffer is supported.');
} else {
  console.log('SharedArrayBuffer is NOT supported.');
}

if (typeof Atomics !== 'undefined' && typeof postMessage === 'function') {
  console.log('Atomics and postMessage are supported.');
} else {
  console.log('Atomics or postMessage are NOT supported.');
}


// ---------------- Webworker Functionality -------------------------------

// Setup the channel to communicat between the main thread and the worker thread
let channel = makeChannel({ atomics: { bufferSize: 100 * 1024 * 1024 } });
let pyodideWorker: Worker;
let taskClient: any;
let csvFiles: { name: string; content: string }[] = [];

type executionState = "init" | "idle" | "running" | "awaitingText" | "awaitingImg" | "awaitingCsv" | "aborted";
export type inputResponse = "expected" | "notExpected" | "expectedFileNotText" | "expectedTextNotFile";

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
  if (curExecutionState === "aborted"){
    return;
  }
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
      if (parsed.input_type == "img") {
        curExecutionState = "awaitingImg";
      } else if (parsed.input_type == "table") {
        curExecutionState = "awaitingCsv";
      } else {
        curExecutionState = "awaitingText";
      }
    } else if(type == "input") {
      console.log(part["text"]);
    } else if(type == "img_output") {
      const parsed = parseOuputMessage(part["text"]);
      const base64String = parsed.text;
      const img_file = base64ToFile(base64String, "image.png");
      chatManager.chatOutput(img_file, parsed.line_no);
    } else if(type == "table_output") {
      const parsed = parseOuputMessage(part["text"]);
      const csv_file = computeTableOutput(parsed.text);
      chatManager.chatOutput(csv_file, parsed.line_no);
    }
      else {
      const parsed = parseOuputMessage(part["text"]);
      console.log(parsed);
      chatManager.chatOutput(parsed.text, parsed.line_no);
    }
  }
}

function computeTableOutput(csvText: string) {
  // Convert CSV string to File object
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `table-${timestamp}.csv`;
  const file = new File([csvText], fileName, { type: 'text/csv' });

  // Save file in csvFiles array
  csvFiles.push({ name: fileName, content: csvText });

  // Pass File object to chatManager for rendering and download link
  return file;
}

function base64ToFile(base64: string, fileName: string): File {
  const byteCharacters = atob(base64); // decode Base64-data
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "image/png" }); // Blob with type PNG
  return new File([blob], fileName, { type: "image/png" }); // Convert to file
}

function parseOuputMessage(logMessage: string): { code_name: string; line_no: number; text: string } {
  const trimedMessage = logMessage.trim()
  const regex = /^\u2764\u1234(.+?):(\d+)\u1234\u2764(?:\s+([\s\S]+))?$/;
  const match = trimedMessage.match(regex);
  if (match) {
      const code_name = match[1]; // First capturing group
      const line_no = parseInt(match[2], 10); // Second capturing group, converted to number
      const text = match[3] ?? ""; // Third capturing group
      return { code_name, line_no, text };
  }
  return {code_name: "Error", line_no: 42, text: logMessage};
}

function parseInputMessage(logMessage: string): { code_name: string; line_no: number; input_type: string; text: string } {
  const trimmedMessage = logMessage.trim();
  const regex = /^\u2764\u1234(.+?):(\d+)\u1234\u2764\s+\u3333(.+?)\u3333(?:\s+([\s\S]+))?$/;
  const match = trimmedMessage.match(regex);
  
  if (match) {
      const code_name = match[1]; // First capturing group
      const line_no = parseInt(match[2], 10); // Second capturing group, converted to number
      const input_type = match[3]; // Third capturing group
      const text = match[4] ?? ""; // Fourth capturing group
      
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
  taskClient.writeMessage(input)
  curExecutionState = "running"
}

async function computeUpload(upload: File) {
  const reader = new FileReader();

  reader.onload = async () => {
    if (upload.type.startsWith("image/") && curExecutionState === "awaitingImg") {
      // Image is read as Base64
      const base64Image = (reader.result as string).split(",")[1];
      taskClient.writeMessage(base64Image);
      curExecutionState = "running";
    } else if (upload.type === "text/csv" && curExecutionState === "awaitingCsv") {
      // CSV is read as text and converted to Base64
      const textData = reader.result as string;
      const base64CSV = btoa(textData);
      taskClient.writeMessage(base64CSV);
      curExecutionState = "running";
    } else {
      return;
    }
  };
  if (curExecutionState === "awaitingImg" && upload.type.startsWith("image/")) {
    reader.readAsDataURL(upload);
  } else if (curExecutionState === "awaitingCsv" && upload.type === "text/csv") {
    reader.readAsText(upload);
  } else {
    Output("File does not match the expected type. Please provide a matching file.", 0);
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
  curExecutionState = "aborted"
  await taskClient.interrupt();
  await initWorker()
}

// ------------------ Button Management -----------------------------------

document.getElementById('pythonRunButton')!.addEventListener('click', function() {
  if (editor) {
    const code = editor.state.doc.toString();
    runCode(code);
  }
})

// Button for downloading the code
document.getElementById('downloadCodeButton')!.addEventListener('click', function() {
  if (editor) {
    const code = editor.state.doc.toString();
    downloadCodeAsFile('code.py', code);
  }
});

document.getElementById('downloadExamples')!.addEventListener('click', function() {
  const link = document.createElement('a');
  link.href = '/examples.zip';
  link.download = 'examples.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

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

  if (curExecutionState == 'awaitingText' || curExecutionState == 'awaitingImg' || curExecutionState == 'awaitingCsv') {
    awaitSymbol.style.display = 'block';
  } else if (curExecutionState == 'running' || curExecutionState == 'init' || curExecutionState == 'aborted') {
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
  if(curExecutionState == 'awaitingImg' || curExecutionState == 'awaitingCsv') {
    computeUpload(upload);
    return "expected";
  } else if(curExecutionState == 'awaitingText') {
    return "expectedTextNotFile";
  } else return "notExpected";
}

// Function called when the user inputs something
function gotInput(input: string): inputResponse {
  if(curExecutionState == 'awaitingText'){
    computeInput(input);
    return "expected";
  } else if (curExecutionState == 'awaitingImg' || curExecutionState == 'awaitingCsv') {
    return "expectedFileNotText";
  } else return "notExpected";
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

let editor: EditorView | null = null;

const editorElement = document.getElementById('codeMirrorEditor');

if (editorElement) {
  editor = new EditorView({
    doc: "input('Hello, CodeMirror!')",
    extensions: [basicSetup, python()],
    parent: editorElement,
  });
} else {
  console.error("Element with ID 'codeMirrorEditor' not found.");
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

function loadCodeIntoEditor(fileContent: string) {
  // Set the editor content to the loaded code
  if (editor){
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: fileContent }
    });
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

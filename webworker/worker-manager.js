// worker-manager.js

export class WorkerManager {
    constructor(workerPath) {
      this.worker = new Worker(workerPath);
      this.callbacks = {};
      this.worker.onmessage = (event) => this.handleMessage(event);
      this.nextId = 0;
      this.waitingInput = false;
    }
  
    handleMessage(event) {
      const { id, status, result, prompt } = event.data;
      if (this.callbacks[id]) {
        const { resolve, reject, onInput } = this.callbacks[id];
        if (status === "initialized") {
          console.log("Worker erfolgreich initialisiert!");
          if (this.callbacks[id]) {
            this.callbacks[id].resolve("initialized");
          }
        } else if (status === "success") {
          console.log("Python-Programm abgeschlossen:", result);
        } else if (status === "await_input") {
          this.waitingInput = true
          if (onInput) {
            onInput(prompt)
          }
        } else if (status === "error") {
          console.error("Fehler:", result);
        }
        if (status !== "await_input") {
          delete this.callbacks[id];
        }
      }
    }
  
    getInput(inputValue) {
      if (this.waitingInput) {
        this.sendMessage({type: "USER_INPUT", data: inputValue})
        this.waitingInput = false
      }
    }

    async initialize() {
      return this.sendMessage({ type: "INIT" });
    }
  
    async runScript(script, onInput) {
      return this.sendMessage({ type: "RUN", script }, onInput);
    }
  
    sendMessage(message, onInput = null) {
      const id = this.nextId++;
      return new Promise((resolve, reject) => {
        this.callbacks[id] = { resolve, reject, onInput };
        this.worker.postMessage({ ...message, id });
      });
    }
  }
  
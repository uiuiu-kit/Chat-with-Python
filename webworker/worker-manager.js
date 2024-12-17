// worker-manager.js

export class WorkerManager {
    constructor(workerPath) {
      this.worker = new Worker(workerPath);
      this.callbacks = {};
      this.worker.onmessage = (event) => this.handleMessage(event);
      this.nextId = 0;
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
          resolve(result);
        } else if (status === "await_input") {
          if (onInput) {
            onInput(prompt, (input) => {
              this.worker.postMessage({ type: "USER_INPUT", data: input, id });
            });
          }
        } else if (status === "error") {
          reject(new Error(result));
        }
        if (status !== "await_input") {
          delete this.callbacks[id];
        }
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
  
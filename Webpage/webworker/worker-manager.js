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
      const { id, status, message} = event.data;
      if (this.callbacks[id]) {
        const { resolve, reject, Output } = this.callbacks[id]; //output hinzufügen
        if (status === "initialized") {
          console.log("Worker erfolgreich initialisiert!");
          if (this.callbacks[id]) {
            this.callbacks[id].resolve("initialized");
          }
        } else if (status === "success") {
          console.log("Python-Programm abgeschlossen:", message);
        } else if (status === "error") {
          console.error("Fehler:", message);
        } else if (status === "unknown_message") {
          console.log("UM:", message)
        } else if (status === "question") {
          this.waitingInput = true;
        }
        if (["info", "question", "raw_output"].includes(status)) {
          if (Output) {
            Output(message)
          }
        }
        if (["error", "succes"].includes(status)) {
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

    getUpload(uploadedData) {
      if (this.waitingInput) {
        this.sendMessage({type: "USER_UPLOAD", data: uploadedData})
        this.waitingInput = false
      }
    }

    async initialize() {
      return this.sendMessage({ type: "INIT" });
    }
  
    async runScript(script, Output) {
      return this.sendMessage({ type: "RUN", script, id :1 }, Output);
    }
  
    sendMessage(message, Output = null) {
      const id = this.nextId++;
      return new Promise((resolve, reject) => {
        this.callbacks[id] = { resolve, reject, Output };
        this.worker.postMessage({ ...message, id });
      });
    }
  }
  
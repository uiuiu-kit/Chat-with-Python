// worker-manager.js

export class WorkerManager {
    constructor(workerPath) {
      this.worker_status = "loading"
      this.worker = new Worker(workerPath);
      this.callbacks = {};
      this.worker.onmessage = (event) => this.handleMessage(event);
      this.nextId = 0;
    }
    
    newWorker(workerPath) {
      this.worker_status = "loading"
      this.worker.terminate()
      this.worker = null;
      this.worker =  new Worker(workerPath)
      this.callbacks = {};
      this.worker.onmessage = (event) => this.handleMessage(event);
      this.nextId = 0;
      console.log("Neuer Worker")
    }

    handleMessage(event) {
      const { id, status, message, line_no} = event.data;
      if (this.callbacks[id]) {
        const { resolve, reject, Output } = this.callbacks[id]; //output hinzufügen
        if (status === "initialized") {
          console.log("Worker erfolgreich initialisiert!");
          this.worker_status = "ready"
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
          this.worker_status = "await input"
        }
        if (["info", "question", "raw_output"].includes(status)) {
          if (Output) {
            Output(message, line_no);
          }
        }
        if (["error", "success"].includes(status)) {
          this.worker_status = "ready";
          delete this.callbacks[id];
        }
      }
    }
  
    getInput(inputValue) {
      if (this.worker_status == "await input") {
        this.sendMessage({type: "USER_INPUT", data: inputValue})
        this.worker_status = "loading"
      }
    }

    getUpload(uploadedData) {
      if (this.worker_status == "await input") {
        this.sendMessage({type: "USER_UPLOAD", data: uploadedData})
        this.worker_status = "loading"
      }
    }

    async initialize() {
      return this.sendMessage({ type: "INIT" });
    }
  
    async runScript(script, Output) {
      this.worker_status = "loading"
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
  
// webworker.js

importScripts("https://cdn.jsdelivr.net/pyodide/v0.23.0/full/pyodide.js");

let pyodide;
let currentGenerator = null;

self.onmessage = async (event) => {
  const { type, script, id, data } = event.data;

  if (type === "INIT") {
    pyodide = await loadPyodide();
    await pyodide.loadPackage(["pillow"]);
    self.postMessage({ id, status: "initialized" });
  } else if (type === "RUN") {
    try {
      currentGenerator = pyodide.runPython(script);
      handleGenerator(currentGenerator, id);
    } catch (error) {
      self.postMessage({ id, status: "error", result: error.message });
    }
  } else if (type === "USER_INPUT") {
    if (currentGenerator) {
      handleGenerator(currentGenerator, id, data);
    }
  }
};

function handleGenerator(generator, id, input = null) {
  let result;
  try {
    // Generator mit optionalem Input fortsetzen
    result = input ? generator.next(input) : generator.next();
  } catch (error) {
    self.postMessage({ id, status: "error", message: error.message });
    return;
  }
  if (result.done) {
    // Generator abgeschlossen
    self.postMessage({ id, status: "success", message: result.value });
  } else {
    try {
      // Verarbeite den Zwischenwert, der vom Generator zurückgegeben wurde
      const message = JSON.parse(result.value);
      if (message.type === "question") {
        self.postMessage({ id, status: "await_input", prompt: message.content });
      } else if (message.type === "info") {
        self.postMessage({ id, status: "info", message: message.content });
        // Generator ohne Eingabe fortsetzen
        handleGenerator(generator, id);
      } else if (message.type === "error") {
        self.postMessage({ id, status: "error", message: message.content });
      } else {
        self.postMessage({ id, status: "unknown_message", message: message });
      }
    } catch (error) {
      // Wenn die Nachricht kein JSON ist, direkt weitergeben
      self.postMessage({ id, status: "unknown_output", message: result.value });
    }
  }
}

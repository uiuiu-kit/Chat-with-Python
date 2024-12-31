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
      // Redirect stdout
      pyodide.setStdout({ batched: (msg) => processPythonOutput(msg, id) });

      // Run Python script
      currentGenerator = pyodide.runPython(script);
      handleGenerator(currentGenerator, id);
    } catch (error) {
      self.postMessage({ id, status: "error", message: error.message });
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
    // Weiter mit optionalem Input
    result = input ? generator.next(input) : generator.next();
  } catch (error) {
    self.postMessage({ id, status: "error", message: error.message });
    return;
  }

  if (result.done) {
    self.postMessage({ id, status: "success", message: result.value });
  }
}

function processPythonOutput(text, id) {
  const trimmedText = text.trim();
  if (!trimmedText) return; // Ignoriere leere Ausgaben
  
  try {
    const message = JSON.parse(trimmedText);
    self.postMessage({ id, status: message.type, message: message.content });
  } catch (error) {
    // Fallback: Sende unformatierte Ausgaben
    self.postMessage({ id, status: "raw_output", message: trimmedText });
  }
}
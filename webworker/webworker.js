// webworker.js

importScripts("https://cdn.jsdelivr.net/pyodide/v0.23.0/full/pyodide.js");

let pyodide;
let currentGenerator = null;

self.onmessage = async (event) => {
  const { type, script, id, data } = event.data;

  if (type === "INIT") {
    pyodide = await loadPyodide();
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
    self.postMessage({ id, status: "error", result: error.message });
    return;
  }

  if (result.done) {
    // Generator abgeschlossen
    self.postMessage({ id, status: "success", result: result.value });
  } else {
    // Generator wartet auf Eingabe
    self.postMessage({ id, status: "await_input", prompt: result.value });
  }
}

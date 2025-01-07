// webworker.js

importScripts("https://cdn.jsdelivr.net/pyodide/v0.23.0/full/pyodide.js");

let pyodide;
let currentGenerator = null;

self.onmessage = async (event) => {
  const { type, script, id, data } = event.data;

  if (type === "INIT") {
    pyodide = await loadPyodide();
    await pyodide.loadPackage(["pillow", "micropip"]);
    const micropip = pyodide.pyimport("micropip");
    await micropip.install('jsConnector-1.0.0-py3-none-any.whl');
    self.postMessage({ id, status: "initialized" });
  } else if (type === "RUN") {
    try {
      // Redirect stdout
      pyodide.setStdout({ batched: (msg) => processPythonOutput(msg, id) });

      // Run Python script
      const result = await pyodide.runPythonAsync(script);
      self.postMessage({ id, status: "success", message: result });
    } catch (error) {
      self.postMessage({ id, status: "error", message: error.message });
    }
  } else if (type === "USER_INPUT") {
    const pythonBytes = pyodide.toPy(data);
    pyodide.globals.set("user_input", pythonBytes);
  }
};

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
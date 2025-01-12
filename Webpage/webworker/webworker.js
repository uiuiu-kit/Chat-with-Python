// webworker.js

importScripts("https://cdn.jsdelivr.net/pyodide/v0.23.0/full/pyodide.js");

let pyodide;

self.onmessage = async (event) => {
  const { type, script, id, data } = event.data;

  if (type === "INIT") {
    pyodide = await loadPyodide();
    await pyodide.loadPackage(["pillow", "micropip"]);
    const micropip = pyodide.pyimport("micropip");
    await micropip.install('jsConnector-1.1.2-py3-none-any.whl');
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
    pyodide.globals.set("user_input_data", pythonBytes);
    await pyodide.runPythonAsync("jsConnector.set_user_input(user_input_data)");
    const readback = pyodide.globals.get("user_input_data");
    console.log("set_user_input übergeben", readback)
  } else if (type === "USER_UPLOAD") {
    const processed_data = await processUpload(data)
    pyodide.globals.set("user_input_data", processed_data);
    await pyodide.runPythonAsync("jsConnector.set_user_input(user_input_data)");
    const readback = pyodide.globals.get("user_input_data");
    console.log(readback, "an pyodide übergeben")
  }
};

async function processUpload(data) {
  const arrayBuffer = await data.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const pythonBytes = pyodide.toPy(uint8Array);
  return pythonBytes
}

function processPythonOutput(text, id) {
  const trimmedText = text.trim();
  if (!trimmedText) return; // Ignoriere leere Ausgaben
  
  try {
    const message = JSON.parse(trimmedText);
    self.postMessage({ id, status: message.type, message: message.content, code_name: message.code_name, line_no: message.line_no });
  } catch (error) {
    // Fallback: Sende unformatierte Ausgaben
    self.postMessage({ id, status: "raw_output", message: trimmedText });
  }
}
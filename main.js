// main.js
import { WorkerManager } from "./webworker/worker-manager.js";

// Initialisieren
const workerManager = new WorkerManager("./webworker/webworker.js");

document.getElementById("myButton").addEventListener("click", async () => {
  console.log("Initialisiere Worker...");
  await workerManager.initialize();

  console.log("Lade Python-Skript...");
  const response = await fetch("webworker/script.py");
  const pyScript = await response.text();

  console.log("Führe Python-Skript aus...");
  try {
    const result = await workerManager.runScript(pyScript, (prompt, provideInput) => {
      console.log("Benutzereingabe erforderlich:", prompt);
      const inputValue = prompt("Geben Sie eine Eingabe ein:");
      provideInput(inputValue);
    });
    console.log("Ergebnis des Python-Skripts:", result);
  } catch (error) {
    console.error("Fehler beim Ausführen des Skripts:", error.message);
  }
});

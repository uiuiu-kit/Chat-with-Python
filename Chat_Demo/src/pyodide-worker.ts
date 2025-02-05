// pyodide-worker.ts
import {
  pyodideExpose,
  makeRunnerCallback,
  loadPyodideAndPackage,
  PyodideFatalErrorReloader,
  // @ts-ignore
} from "pyodide-worker-runner";

import { PyodideInterface } from "pyodide";
import * as Comlink from "comlink";

let runner: any;

const reloader = new PyodideFatalErrorReloader(async () => {
  const pyodide = await loadPyodideAndPackage({
    url: "/package.tar.gz", 
    format: "gztar",
  });
  return pyodide;
});

const initPyodideRunner = pyodideExpose(async function initPyodideRunner(
  extras: any,
) {
  const start = Date.now();
  await reloader.withPyodide(async (pyodide: PyodideInterface) => {
    runner = pyodide.pyimport("my_runner");
  });
  const end = Date.now();
  console.log(`pyodide loading time: ${end - start} ms`);
});

const runCode = pyodideExpose(async function runCode(
  extras: any,
  code: string,
  updateOutput: (text: Array<Object>) => void,
  handleInput: (prompt: string, type?: string) => Promise<void>,
  handleMain: (type: string, data: unknown) => Promise<void>,
) {
  const callback = makeRunnerCallback(extras, {
    output: (outputText: Array<Object>) => updateOutput(outputText),
    input(prompt: string) {
      handleInput(prompt);
    },
    other: (type: string, data: unknown) => {
      handleMain(type, data);
      return extras.readMessage();
    },
  });

  return await reloader.withPyodide(async (pyodide: PyodideInterface) => {
    runner = pyodide.pyimport("my_runner");
    runner.set_callback(callback);

    //load packages if needed
    await pyodide.loadPackagesFromImports(code);

    if (extras.interruptBuffer) {
      pyodide?.setInterruptBuffer(extras.interruptBuffer);
    }
    await runner.run_async(code);
  });
});


Comlink.expose({
  runCode,
  initPyodideRunner
});
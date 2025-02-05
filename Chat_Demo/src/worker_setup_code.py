from runner import PyodideRunner

defaultrunner = PyodideRunner()

def set_callback(callback):
    defaultrunner.set_callback(callback)
    return

async def run_async(code):
    defaultrunner.run(code)

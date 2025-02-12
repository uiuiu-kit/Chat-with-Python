from runner import PyodideRunner

class MyRunner(PyodideRunner):
    def __init__(self, *, callback=None, source_code="", filename="main.py"):
        super().__init__(callback=callback, source_code=source_code, filename=filename)
        self.overwrite_print()

    def pre_run(self, *args, **kwargs):
        x = super().pre_run(*args, **kwargs)
        return x
    
    def overwrite_print(self):
        import builtins
        original_print = builtins.print

        def my_print(*args, **kwargs):
            code_name, line_no = get_caller_info()
            formatted_args = [f"[{code_name}:{line_no}] {arg}" for arg in args]
            original_print(*formatted_args, **kwargs)

        def get_caller_info():
            import inspect
            frame = inspect.currentframe()
            try:
                frame = frame.f_back.f_back
                return frame.f_code.co_name, frame.f_lineno
            except:
                return None, -1
            
        builtins.print = my_print



defaultrunner = MyRunner()

def set_callback(callback):
    defaultrunner.set_callback(callback)
    return

async def run_async(code):
    await defaultrunner.run_async(code)

from runner import PyodideRunner

class MyRunner(PyodideRunner):
    def __init__(self, *, callback=None, source_code="", filename="main.py"):
        super().__init__(callback=callback, source_code=source_code, filename=filename)
        self.overwrite_print_and_input()

    def pre_run(self, *args, **kwargs):
        x = super().pre_run(*args, **kwargs)
        return x
    
    def overwrite_print_and_input(self):

        def get_caller_info():
            import inspect
            frame = inspect.currentframe()
            try:
                frame = frame.f_back.f_back
                return frame.f_code.co_name, frame.f_lineno
            except:
                return None, -1
        
        import builtins
        original_print = builtins.print
        original_input = builtins.input

        def my_print(*args, **kwargs):
            code_name, line_no = get_caller_info()
            formatted_args = [f"[{code_name}:{line_no}] {arg}" for arg in args]
            original_print(*formatted_args, **kwargs)
            
        def my_input(prompt=""):
            code_name, line_no = get_caller_info()
            formatted_prompt = f"[{code_name}:{line_no}] blob{prompt}"
            return original_input(formatted_prompt)
                     
        builtins.input = my_input   
        builtins.print = my_print



defaultrunner = MyRunner()

def set_callback(callback):
    defaultrunner.set_callback(callback)
    return

async def run_async(code):
    await defaultrunner.run_async(code)

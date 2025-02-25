from python_runner import PyodideRunner

class MyRunner(PyodideRunner):
    def __init__(self, *, callback=None, source_code="", filename="main.py"):
        super().__init__(callback=callback, source_code=source_code, filename=filename)
        self.input = self.overwrite_print_and_input()

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

        def my_print(*args, **kwargs):
            code_name, line_no = get_caller_info()
            # flush = true wenn kwargs == empty weiß noch nichts damit anzufangen
            #if (output == error):
            #    ouput.flush
            if not self.output_buffer.parts:
                prefix = f"\u2764\u1234{code_name}:{line_no}\u1234\u2764"
                args = (prefix,) + args
            original_print(*args, **kwargs) 
            
        def my_input(prompt=""):
            code_name, line_no = get_caller_info()
            prefix = ""
            if not self.output_buffer.parts:
                prefix = f"\u2764\u1234{code_name}:{line_no}\u1234\u2764"
            self.output("input_prompt", prefix + " " + prompt) 
            return self.readline(prompt=prompt)[:-1]
                     
        builtins.print = my_print
        return my_input



defaultrunner = MyRunner()

def set_callback(callback):
    defaultrunner.set_callback(callback)
    return

async def run_async(code):
    await defaultrunner.run_async(code)

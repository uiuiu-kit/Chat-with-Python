from python_runner import PyodideRunner
from PIL import Image
import pandas as pd
import base64
import io

class MyRunner(PyodideRunner):
    def __init__(self, *, callback=None, source_code="", filename="main.py"):
        super().__init__(callback=callback, source_code=source_code, filename=filename)
        self.overwrite_print_and_input()
        runner = self
        Image.Image.show = lambda img: self.my_show(img)
        self.input = self.my_input

    def pre_run(self, *args, **kwargs):
        x = super().pre_run(*args, **kwargs)
        return x
    
    def get_caller_info(self, lvl):
        import inspect
        frame = inspect.currentframe()
        try:
            for i in range(lvl):
               frame = frame.f_back
            return frame.f_code.co_name, frame.f_lineno
        except:
            return None, -1

    def my_show(self, img):
        code_name, line_no = self.get_caller_info(3)
        prefix = f"\u2764\u1234{code_name}:{line_no}\u1234\u2764"
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
        self.output("img_output", f"{prefix} {img_str}")
    

    def my_input(self, prompt="", input_type="string"):
        self.output_buffer.flush()
        code_name, line_no = self.get_caller_info(2)
        prefix = f"\u2764\u1234{code_name}:{line_no}\u1234\u2764 \u3333{input_type}\u3333"
        self.output("input_prompt", prefix + " " + prompt)
        if input_type == "img":
            base64Image = self.readline(prompt=prompt)[:-1]
            image_data = base64.b64decode(base64Image)
            return Image.open(io.BytesIO(image_data))
        elif input_type == "table":
            base64Table = self.readline(prompt=prompt)[:-1]
            table_data = base64.b64decode(base64Table)
            return pd.read_csv(io.StringIO(table_data.decode("utf-8")))
        else:
            return self.readline(prompt=prompt)[:-1]

    

    def overwrite_print_and_input(self):
        import builtins
        original_print = builtins.print

        def my_print(*args, **kwargs):
            code_name, line_no = self.get_caller_info(2)
            #if "file" in kwargs:
              #  raise TypeError(f"kwargs file is not allowed")
            if any(part["type"] == "error" for part in self.output_buffer.parts):
                self.output_buffer.flush()
            if not ("flush" in kwargs and kwargs["flush"] == False or "end" in kwargs):
                kwargs = {"flush": True, **kwargs}
            if not self.output_buffer.parts:
                prefix = f"\u2764\u1234{code_name}:{line_no}\u1234\u2764"
                args = (prefix,) + args
            original_print(*args, **kwargs)
                     
        builtins.print = my_print



defaultrunner = MyRunner()

def set_callback(callback):
    defaultrunner.set_callback(callback)
    return

async def run_async(code):
    await defaultrunner.run_async(code)

from python_runner import PyodideRunner
from PIL import Image
import pandas as pd
import base64
import io
import matplotlib.pyplot

class MyRunner(PyodideRunner):
    def __init__(self, *, callback=None, source_code="", filename="main.py"):
        super().__init__(callback=callback, source_code=source_code, filename=filename)
        self.overwrite_print()
        self.addChatFunctions()

    def pre_run(self, *args, **kwargs):
        x = super().pre_run(*args, **kwargs)
        self.override_matplotlib()
        Image.Image.show = lambda img: self.my_show(img)
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

    def addChatFunctions(self):
        __builtins__["input"] = lambda prompt = "": self.my_input(prompt, "string")
        __builtins__["inputImg"] = lambda prompt = "": self.my_input(prompt, "img")
        __builtins__["inputTable"] = lambda prompt = "": self.my_input(prompt, "table")

    def my_show(self, img):
        code_name, line_no = self.get_caller_info(3)
        prefix = f"\u2764\u1234{code_name}:{line_no}\u1234\u2764"
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
        self.output("img_output", f"{prefix} {img_str}")
    
    def override_matplotlib(self):
        """if matplotlib is imported, we have to patch the show function. the show function exports the plot as
        png and stores it to a base64 encoded buffer. This Buffer is then sent to the front end and rendered there
        """
        try:
            import matplotlib
            matplotlib.use("Agg")
            # workaround from https://github.com/pyodide/pyodide/issues/1518
            def show():
                code_name, line_no = self.get_caller_info(2)
                prefix = f"\u2764\u1234{code_name}:{line_no}\u1234\u2764"
                buffered = io.BytesIO()
                matplotlib.pyplot.savefig(buffered, format="png")
                buffered.seek(0)
                # encode to a base64 str
                img_str = base64.b64encode(buffered.read()).decode("utf-8")
                matplotlib.pyplot.clf()
                self.output("img_output", f"{prefix} {img_str}")
            matplotlib.pyplot.show = show
        except ModuleNotFoundError:
            pass

    

    def my_input(self, prompt="", input_type="string"):
        self.output_buffer.flush()
        code_name, line_no = self.get_caller_info(3)
        prefix = f"\u2764\u1234{code_name}:{line_no}\u1234\u2764 \u3333{input_type}\u3333"
        self.output("input_prompt", prefix + " " + prompt)
        if input_type == "img":
            base64Image = self.readline(prompt=prompt)[:-1]
            image_data = base64.b64decode(base64Image)
            return Image.open(io.BytesIO(image_data))
        elif input_type == "table":
            base64Table = self.readline(prompt=prompt)[:-1]
            table_data = base64.b64decode(base64Table)
            return pd.read_csv(io.StringIO(table_data.decode("utf-8")), header=None)
        else:
            return self.readline(prompt=prompt)[:-1]

    def send_table(self, table):
        tabel_csv = table.to_csv()
        self.output("table_output", tabel_csv)

    def overwrite_print(self):
        import builtins
        original_print = builtins.print

        def my_print(*args, **kwargs):
            code_name, line_no = self.get_caller_info(2)
            for arg in args:
                if isinstance(arg, pd.DataFrame):
                    self.send_table(arg)
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

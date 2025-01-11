from PIL import Image
from io import BytesIO
import json
import asyncio

# Globales Event und Input-Variable
user_input_event = asyncio.Event()
user_input = None


async def get_input(question):
    global user_input
    send_message("question", question)
    
    # Warte, bis das Event gesetzt wird
    await user_input_event.wait()

    # Sobald das Event gesetzt ist, verarbeite den Input
    processed_input = process_input(user_input)
    
    # Input zurücksetzen
    user_input = None
    user_input_event.clear()

    return processed_input

def process_input(data):
    if isinstance(data, str):
        return data
    elif isinstance(data, memoryview):
    
        byte_stream = BytesIO(data)
        image = Image.open(byte_stream)
        return image
    else:
        raise ValueError("Unsupported input type")

def output(text):
    send_message("info", text)

def send_message(message_type, content):
    message = {
        "type": message_type,
        "content": content
    }
    print(json.dumps(message))

# Funktion, um den User Input aus dem WebWorker zu setzen
def set_user_input(input_data):
    global user_input
    user_input = input_data
    user_input_event.set()
from PIL import Image
from io import BytesIO
import json
import asyncio
import js

user_input = None 

async def get_input(question):
    send_message("question", question)
    global user_input
    while True:
        if user_input:
            break
        await asyncio.sleep(0.1)
    processed_input = process_input(user_input)
    user_input = None
    return processed_input

def process_input(data):
    if isinstance(data, str):
        return data
    elif isinstance(data, bytes):
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

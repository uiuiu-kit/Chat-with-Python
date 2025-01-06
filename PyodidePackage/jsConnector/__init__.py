from PIL import Image
from io import BytesIO
import json

def get_input(question):
    send_message("question", question)  # Fragt nach Benutzerinput
    user_input = yield  # Erwartet Eingabe von JS
    user_input = process_input(user_input)
    return user_input

def process_input(data):
    if isinstance(data, str):
        return data
    else:
        byte_stream = BytesIO(data.to_py())
        image = Image.open(byte_stream)
        return image
    
def output(text):
    send_message("info", text)

def send_message(message_type, content):
    message = {
        "type": message_type,
        "content": content
    }
    print(json.dumps(message))  # Übergibt die Nachricht an JS
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
    """
    Sendet eine Nachricht im JSON-Format.
    :param message_type: Der Typ der Nachricht (z.B. 'question', 'info', 'error')
    :param content: Der Inhalt der Nachricht
    """
    message = {
        "type": message_type,
        "content": content
    }
    print(json.dumps(message))  # Übergibt die Nachricht an JS

# Befehlsliste
# output(text)
# get_input(question)

def img_demo():
    output("Start")  # Informiert über den Start
    img = yield from get_input("Lade ein Bild hoch")  # Wartet auf Benutzerinput
    output(f"Die Größe des Bildes ist {img.size}!")  # Bildinformationen
    output("Fertig!")  # Ende der Verarbeitung

def text_demo():
    output("Start")
    name = yield from get_input("Wie heißt du?")
    output(f"Hallo {name}")

def main():
    yield from text_demo()
    return "Fertig"

main()
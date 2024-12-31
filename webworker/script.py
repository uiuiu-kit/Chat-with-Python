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
        send_message("info", "Das ist ein Text.")
        # Text-spezifische Verarbeitung
        return data
    else:
        byte_stream = BytesIO(data.to_py())
        image = Image.open(byte_stream)
        return image

def main():
    send_message("info", "Start")  # Informiert über den Start
    img = yield from get_input("Lade ein Bild hoch")  # Wartet auf Benutzerinput
    send_message("info", f"Die Größe des Bildes ist {img.size}!")  # Bildinformationen
    send_message("info", "Fertig!")  # Ende der Verarbeitung
    return "Fertig!"


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

main()
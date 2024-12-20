from PIL import Image
from io import BytesIO

def get_input(question):
    user_input = yield question  # Signal an JS, dass Eingabe benötigt wird
    user_input = process_input(user_input)
    return user_input

def process_input(data):
    if isinstance(data, str):
        print("Das ist ein Text.")
        # Text-spezifische Verarbeitung
    elif isinstance(data, BytesIO):
        # Prüfen, ob es sich um ein Bild oder eine CSV handelt
        content = data.getvalue()
        if content.startswith(b'\x89PNG') or content.startswith(b'\xFF\xD8'):
            print("Das ist ein Bild.")
            byte_stream = BytesIO(data.to_py())
            image = Image.open(byte_stream)
            return image
        elif b',' in content or b'\n' in content:
            print("Das ist eine CSV-Datei.")
            # CSV-spezifische Verarbeitung
        else:
            print("Unbekannter BytesIO-Inhalt.")
    else:
        print("Unbekannter Typ.")
    

def main():
    print("Start")
    img = yield from get_input("Lade ein Bild hoch")  # Wartet auf Benutzerinput
    print(f"Die Größe des Bildes ist, {img.size}!")
    return "Fertig!"

main()
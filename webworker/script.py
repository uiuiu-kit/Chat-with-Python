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
    else:
        byte_stream = BytesIO(data.to_py())
        data = Image.open(byte_stream)
    return data
    

def main():
    print("Start")
    img = yield from get_input("Lade ein Bild hoch")  # Wartet auf Benutzerinput
    print(f"Die Größe des Bildes ist, {img.size}!")
    return "Fertig!"

main()
import base64
import io
from PIL import Image
import numpy as np

img_prefix = "\u3333img\u3333"

def input_img(promt=""):
    base64Image = input(img_prefix + promt)
    print("got img")
    # Base64-String dekodieren
    image_data = base64.b64decode(base64Image)
    # Bild aus Bytes erstellen
    return Image.open(io.BytesIO(image_data))


test_img = input_img("gib ein Bild")
# Bildinformationen ausgeben
print(test_img.size)  # (Breite, Höhe)

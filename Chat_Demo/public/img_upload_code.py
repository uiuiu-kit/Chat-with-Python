import base64
import io
from PIL import Image

img_prefix = "\u3333img\u3333"

def input_img(promt=""):
    base64Image = input(img_prefix + promt)
    print("got img")
    # Base64-String dekodieren
    image_data = base64.b64decode(base64Image)
    # Bild aus Bytes erstellen
    return Image.open(io.BytesIO(image_data))

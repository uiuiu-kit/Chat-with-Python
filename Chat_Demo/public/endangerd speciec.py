from PIL import Image, ImageDraw, ImageFont
import math
import pandas as pd

# Simulation von inputTable
def inputTable(prompt):
    print(prompt)
    data = {
        "animal": ["Tiger", "Panda", "Rhino"],
        "count_estimate": ["3900", "1864", "27500-29500"]
    }
    return pd.DataFrame(data)

# --- Hauptlogik ---
animal_count_table = inputTable("Submit the table with estimates of the endangered species")
animal_image_dict = {}

# Bilder abfragen
for _, row in animal_count_table.iterrows():
    name = row["animal"]
    animal_image_dict[name] = inputImg(f"Submit a picture of a {name}")

# Verarbeitung und Anzeige
for _, row in animal_count_table.iterrows():
    name = row["animal"]
    count_str = row["count_estimate"]

    # Zahlen extrahieren
    nums = []
    for part in count_str.replace(',', '').split('-'):
        try:
            nums.append(float(part))
        except:
            pass
    if not nums:
        continue

    avg = sum(nums) / len(nums)
    width = int(math.floor(math.sqrt(avg)))  # Quadratwurzel zur Pixelgröße
    width = max(1, width)  # Sicherheitscheck

    # Bild verarbeiten
    img = animal_image_dict[name]
    img = img.resize((width, width))
    img = img.resize((600, 600), resample=Image.NEAREST)

    # Beschriftung hinzufügen
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()

    title = name.title()
    if len(nums) > 1:
        text = f"Estimated between {int(nums[0])} and {int(nums[1])} remain"
    else:
        text = f"Estimated about {int(nums[0])} remain"

    draw.text((10, 10), title, font=font, fill=(0, 0, 0))
    draw.text((10, 40), text, font=font, fill=(0, 0, 0))

    # Bild anzeigen
    img.show()

from PIL import Image, ImageDraw, ImageFont
import math
import pandas as pd

animal_count_table = inputTable("Submit the table with estimates of the endangered species")
animal_image_dict = {}

for _, row in animal_count_table.iterrows():
    name = row["animal"]
    animal_image_dict[name] = inputImg(f"Submit a picture of a {name}")

for _, row in animal_count_table.iterrows():
    name = row["animal"]
    count_str = row["count_estimate"]

    nums = []
    for part in count_str.replace(',', '').split('-'):
        try:
            nums.append(float(part))
        except:
            pass
    if not nums:
        continue

    avg = sum(nums) / len(nums)
    width = int(math.floor(math.sqrt(avg)))
    width = max(1, width)


    img = animal_image_dict[name]
    img = img.resize((width, width))
    img = img.resize((800, 600), resample=Image.NEAREST)
 
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default(30)

    title = name.title()
    if len(nums) > 1:
        text = f"Estimated between {int(nums[0])} and {int(nums[1])} remain"
    else:
        text = f"Estimated about {int(nums[0])} remain"

    draw.text((10, 10), title, font=font, fill=(255, 255, 255))
    draw.text((10, 40), text, font=font, fill=(255, 255, 255))

    img.show()

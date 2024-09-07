import json
from PIL import Image

valid_colors = [
    "#ffc0c0",
    "#ffffc0",
    "#c0ffc0",
    "#c0ffff",
    "#c0c0ff",
    "#ffc0ff",
    "#ff0000",
    "#ffff00",
    "#00ff00",
    "#00ffff",
    "#0000ff",
    "#ff00ff",
    "#c00000",
    "#c0c000",
    "#00c000",
    "#00c0c0",
    "#0000c0",
    "#c000c0",
    "#ffffff",
    "#000000",
]

piet_path = "public/bin/piet"
programs_json = json.loads(open("public/programs.json", "r").read())
programs = programs_json["piet"]["programs"]

for program in programs:
    img = Image.open(f"{piet_path}/{program}")
    img = img.convert("RGB")
    valid = True
    invalid_colors = set()

    for y in range(img.height):
        for x in range(img.width):
            r, g, b = img.getpixel((x, y))
            h = f"#{r:02x}{g:02x}{b:02x}"
            if h not in valid_colors:
                valid = False
                invalid_colors.add(h)

    if not valid:
        print()
        print(program)
        print(invalid_colors)
        print()

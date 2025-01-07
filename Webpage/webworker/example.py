import jsConnector

# Befehlsliste
# output(text)
# get_input(question)

async def img_demo():
    jsConnector.output("Start")  # Informiert über den Start
    img = await jsConnector.get_input("Lade ein Bild hoch")  # Wartet auf Benutzerinput
    jsConnector.output(f"Die Größe des Bildes ist {img.size}!")  # Bildinformationen
    jsConnector.output("Fertig!")  # Ende der Verarbeitung

async def text_demo():
    jsConnector.output("Start")
    name = await jsConnector.get_input("Wie heißt du?")
    jsConnector.output(f"Hallo {name}")

async def main():
    await text_demo()
    return "Fertig"

main()
import jsConnector

# Befehlsliste
# output(text)
# get_input(question)

def img_demo():
    jsConnector.output("Start")  # Informiert über den Start
    img = yield from jsConnector.get_input("Lade ein Bild hoch")  # Wartet auf Benutzerinput
    jsConnector.output(f"Die Größe des Bildes ist {img.size}!")  # Bildinformationen
    jsConnector.output("Fertig!")  # Ende der Verarbeitung

def text_demo():
    jsConnector.output("Start")
    name = yield from jsConnector.get_input("Wie heißt du?")
    jsConnector.output(f"Hallo {name}")

def main():
    yield from text_demo()
    return "Fertig"

main()
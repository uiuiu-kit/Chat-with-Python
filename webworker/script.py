def get_input():
    user_input = yield "await_input"  # Signal an JS, dass Eingabe benötigt wird
    return user_input

def main():
    print("Start")
    name = yield from get_input()  # Wartet auf Benutzerinput
    print(f"Hallo, {name}!")
    return "Fertig!"

main()
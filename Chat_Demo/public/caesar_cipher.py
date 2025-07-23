# This is a short encoding and decoding programm for a caesar cipher

def caesar_encrypt(text, shift=3):
    result = ""
    for char in text:
        if char.isalpha():
            shift_base = ord('A') if char.isupper() else ord('a')
            result += chr((ord(char) - shift_base + shift) % 26 + shift_base)
        else:
            result += char
    return result


def caesar_decrypt(text, shift=3):
    return caesar_encrypt(text, -shift)

mode  = None

while mode == None:
    mode = input("Choose an mode. Available modes are: 'encode', 'decode'")
    if mode != 'encode' and mode != 'decode':
        mode = None
    else:
        print(f"starting {mode}-loop, all input from now on will be {mode}d with a caeser cipher")
while True:
    if mode == 'encode':
        text_input = input(caesar_encrypt(text_input))
    else:
        text_input = input(caesar_decrypt(text_input))
            


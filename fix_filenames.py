#!/usr/bin/env python3
import os
import unicodedata

def clean_name(name):
    # remove BOM (U+FEFF) e caracteres de controle finais
    name = name.replace('\ufeff', '')
    # normalize
    name = unicodedata.normalize('NFC', name)
    # strip control chars at end/begin
    return ''.join(ch for ch in name if ord(ch) >= 32 or ch in ['\n','\t'])

renames = []
for root, dirs, files in os.walk('.', topdown=True):
    # renomear diretórios primeiro
    for i, d in enumerate(list(dirs)):
        clean = clean_name(d)
        if clean != d:
            old = os.path.join(root, d)
            new = os.path.join(root, clean)
            try:
                os.rename(old, new)
                renames.append((old, new))
                # update dirs list so os.walk continues correctly
                dirs[i] = clean
            except Exception as e:
                print("Failed rename dir:", old, "->", new, ":", e)
    for f in files:
        clean = clean_name(f)
        if clean != f:
            old = os.path.join(root, f)
            new = os.path.join(root, clean)
            try:
                os.rename(old, new)
                renames.append((old, new))
            except Exception as e:
                print("Failed rename file:", old, "->", new, ":", e)

if renames:
    print("Renamed the following paths:")
    for a,b in renames:
        print(a, "->", b)
else:
    print("No filenames needed renaming.")

"""
Odchudzone fonty self-hosted (fontTools). Uruchamiaj tylko przy zmianie krojów lub zakresu znaków.

    pip install fonttools brotli
    python tools/fonts-build.py

Źródła (pełne fonty zmienne z repozytorium Google Fonts, licencja OFL):
  https://github.com/google/fonts/raw/main/ofl/sourceserif4/SourceSerif4%5Bopsz%2Cwght%5D.ttf
  https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf
Pobierz je do tools/fonts-src/ (folder jest w .gitignore).

Wynik (public/assets/fonts/):
  SourceSerif4-var.woff2  – zmienny, wght 400–600, opsz ustawione na 28 (nagłówki), ~37 KB
  Inter-400/500/600.woff2 – instancje statyczne, opsz 14, ~19 KB każda
Zestaw znaków: ASCII, Latin-1, Latin Extended-A (polskie znaki), cudzysłowy „” «», myślniki, wielokropek, €, strzałki.
Funkcje OpenType: kern, liga, calt, locl, ccmp, mark, mkmk, rlig, rvrn.
"""
import os
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools", "fonts-src")
OUT = os.path.join(ROOT, "public", "assets", "fonts")

UNICODES = (
    "U+0020-007E,U+00A0-00FF,U+0100-017F,U+02C6,U+02DA,U+02DC,"
    "U+2013-2014,U+2018-201E,U+2020-2022,U+2026,U+2030,U+2039-203A,U+2044,"
    "U+20AC,U+2122,U+2190-2193,U+2212,U+FFFD"
)
FEATURES = ["kern", "liga", "calt", "locl", "ccmp", "mark", "mkmk", "rlig", "rvrn"]


def build(src, out, axes):
    font = TTFont(src)
    font = instancer.instantiateVariableFont(font, axes, inplace=False, updateFontNames=False)
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = FEATURES
    options.name_IDs = ["*"]
    options.notdef_outline = True
    options.drop_tables += ["DSIG"]
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=subset.parse_unicodes(UNICODES))
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(out)
    print(f"{os.path.basename(out)}: {os.path.getsize(out)} B, glyphs: {len(font.getGlyphOrder())}")


def main():
    serif = os.path.join(SRC, "SourceSerif4[opsz,wght].ttf")
    inter = os.path.join(SRC, "Inter[opsz,wght].ttf")
    for path in (serif, inter):
        if not os.path.exists(path):
            sys.exit(f"Brak pliku źródłowego: {path} (patrz docstring)")
    os.makedirs(OUT, exist_ok=True)
    build(serif, os.path.join(OUT, "SourceSerif4-var.woff2"), {"opsz": 28, "wght": (400, 600)})
    for weight in (400, 500, 600):
        build(inter, os.path.join(OUT, f"Inter-{weight}.woff2"), {"opsz": 14, "wght": weight})


if __name__ == "__main__":
    main()

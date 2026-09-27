"""Fetch Gen 1 Pokémon names and sprites from PokeAPI into the site.

Run once (or whenever you want to change the pool):

    python3 scripts/fetch_pokemon.py

Writes:
  assets/data/pokemon.json   id, name, types — small, loaded by the DDIA progress HUD
  assets/data/pokedex.json   species, Pokédex entry, height, weight, base stats — loaded
                             only when someone opens the Pokédex
  assets/img/pokemon/<id>.png
so nothing on the site calls PokeAPI from a visitor's browser.
"""

import json
import pathlib
import time
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "assets" / "img" / "pokemon"
DATA_FILE = ROOT / "assets" / "data" / "pokemon.json"
DEX_FILE = ROOT / "assets" / "data" / "pokedex.json"
API = "https://pokeapi.co/api/v2"
FIRST, LAST = 1, 151
HEADERS = {"User-Agent": "sagunpradhan.com.np portfolio (one-off fetch)"}
# prefer the Kanto-era Pokédex entries, falling back to any English one
FLAVOR_VERSIONS = ["firered", "leafgreen", "yellow", "red", "blue"]
STAT_KEYS = {"hp": "hp", "attack": "atk", "defense": "def",
             "special-attack": "spa", "special-defense": "spd", "speed": "spe"}


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def english(entries: list, key: str) -> str:
    return next(e[key] for e in entries if e["language"]["name"] == "en")


def flavor_text(species: dict) -> str:
    en = [e for e in species["flavor_text_entries"] if e["language"]["name"] == "en"]
    for version in FLAVOR_VERSIONS:
        for e in en:
            if e["version"]["name"] == version:
                return " ".join(e["flavor_text"].split())  # strip \n and \f from the game text
    return " ".join(en[0]["flavor_text"].split()) if en else ""


def main() -> None:
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    pool = []
    dex = []

    for pid in range(FIRST, LAST + 1):
        mon = json.loads(get(f"{API}/pokemon/{pid}"))
        species = json.loads(get(f"{API}/pokemon-species/{pid}"))
        name = english(species["names"], "name")

        sprite_file = IMG_DIR / f"{pid}.png"
        if not sprite_file.exists():
            sprite_file.write_bytes(get(mon["sprites"]["front_default"]))

        pool.append({
            "id": pid,
            "name": name,
            "types": [t["type"]["name"] for t in mon["types"]],
        })
        dex.append({
            "id": pid,
            "genus": english(species["genera"], "genus"),
            "text": flavor_text(species),
            "height": mon["height"] / 10,   # decimetres → metres
            "weight": mon["weight"] / 10,   # hectograms → kilograms
            "stats": {STAT_KEYS[s["stat"]["name"]]: s["base_stat"] for s in mon["stats"]},
        })
        print(f"{pid:>3} {name}")
        time.sleep(0.1)  # be gentle with a free API

    DATA_FILE.write_text(json.dumps(pool, ensure_ascii=False, separators=(",", ":")) + "\n")
    DEX_FILE.write_text(json.dumps(dex, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"wrote {len(pool)} Pokémon to {DATA_FILE.relative_to(ROOT)} and {DEX_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

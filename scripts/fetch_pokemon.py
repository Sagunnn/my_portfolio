"""Fetch Gen 1 Pokémon names and sprites from PokeAPI into the site.

Run once (or whenever you want to change the pool):

    python3 scripts/fetch_pokemon.py

Writes assets/data/pokemon.json and assets/img/pokemon/<id>.png so the
DDIA progress bar never calls PokeAPI from a visitor's browser.
"""

import json
import pathlib
import time
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "assets" / "img" / "pokemon"
DATA_FILE = ROOT / "assets" / "data" / "pokemon.json"
API = "https://pokeapi.co/api/v2"
FIRST, LAST = 1, 151
HEADERS = {"User-Agent": "sagunpradhan.com.np portfolio (one-off fetch)"}


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def main() -> None:
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    pool = []

    for pid in range(FIRST, LAST + 1):
        mon = json.loads(get(f"{API}/pokemon/{pid}"))
        species = json.loads(get(f"{API}/pokemon-species/{pid}"))
        name = next(n["name"] for n in species["names"] if n["language"]["name"] == "en")

        sprite = mon["sprites"]["front_default"]
        (IMG_DIR / f"{pid}.png").write_bytes(get(sprite))

        pool.append({
            "id": pid,
            "name": name,
            "types": [t["type"]["name"] for t in mon["types"]],
        })
        print(f"{pid:>3} {name}")
        time.sleep(0.1)  # be gentle with a free API

    DATA_FILE.write_text(json.dumps(pool, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"wrote {len(pool)} Pokémon to {DATA_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

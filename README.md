# sagunpradhan.com.np

Sagun B. Pradhan's portfolio, built with [Eleventy](https://www.11ty.dev/) and deployed to
GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

```sh
npm install
npm start        # local preview at http://localhost:8080
npm run build    # writes the site to _site/
```

## Layout

| Path | What it is |
|---|---|
| `src/index.njk` | Home page |
| `src/writing/scamfilter/` | ScamFilter case study |
| `src/writing/ddia/` | Reading DDIA series page and one folder per chapter |
| `src/_includes/layouts/` | `base.njk` (head, nav, footer, scripts) and `article.njk` (case studies and notes) |
| `src/_data/ddia.json` | Book length, EXP bar (progress into the next chapter), next chapter's title |
| `assets/` | CSS, JS, fonts, images and Pokémon data, copied as-is |
| `scripts/fetch_pokemon.py` | One-off PokeAPI fetch for the Pokémon sprites and Pokédex data |

## Adding a DDIA chapter

1. Copy `src/writing/ddia/ch02/index.md` to `src/writing/ddia/ch03/index.md`.
2. Update the front matter: `chapter`, `chapterTitle`, `menuLabel`, `menuNote`, `cardText`,
   the header text, `facts` and Prof. Oak's `takeaways`.
3. Write the notes in Markdown. Wrap each part in
   `{% section "Eyebrow", "Heading", "id" %} … {% endsection %}`, and use
   `{% take %} … {% endtake %}` or `{% pushback %} … {% endpushback %}` for the callout boxes.
4. In `src/_data/ddia.json`, set `exp` back to `0` and `next` to the following chapter.

The progress level, chapter list, home page card, Pokédex menu, previous/next links and
sitemap all update from the chapter files. Asset URLs get a content hash, so there's no
`?v=` to bump by hand.

# Fatum Atlas

**Live site:** https://hxyan2020.github.io/PRD/fate-atlas/

A browsable website cataloguing fate-telling and divination methods from around the world.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
cd fate-atlas
python3 -m http.server 8080
```

Then visit http://localhost:8080

## Contents

- `index.html` — page structure + reading studio
- `styles.css` — layout and visual design
- `app.js` — search, filters, random draw
- `reading.js` — interactive multi-step reading flow
- `data/methods.js` — curated method catalog
- `data/processes.js` — process templates & reading generator
- `METHODS.md` — name list by continent

## How readings work

1. Choose a method (hero picker, catalog **Begin reading**, or Surprise me).
2. Follow that method’s pre-defined process (birth chart, lot casting, cards, dice, book, form, pendulum, day almanac, or omen watch).
3. Receive a generated reading styled after the tradition.
4. Optionally **Save to journal** — auto title + timestamp, stored in browser localStorage.

Readings are educational simulations, not authentic initiatory practice.

## Sources

See the Sources section on the site for ethnographic and historical references used to compile the catalog.

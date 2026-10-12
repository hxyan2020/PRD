# Nature species data (Catalogue of Life)

## Trees
- `col-tree-species.json` — raw accepted species from [Catalogue of Life](https://www.catalogueoflife.org/) via ChecklistBank dataset `3LR`, for woody/tree genera guided by Wikipedia “List of tree genera” / GlobalTreeSearch-style families.
- `tree-seeds-col.json` — filtered seed list merged into `generate-catalog.mjs`.
- Regenerate: `python3 scripts/fetch-tree-species.py` then `npm run data`.

## Flowers
- `col-flower-species.json` — raw accepted species for ornamental / wildflower genera.
- `flower-seeds-col.json` — filtered seed list merged into `generate-catalog.mjs`.
- Regenerate: `python3 scripts/fetch-flower-species.py` then `npm run data`.

## Animals & insects
- `col-animal-species.json` — raw accepted species for major vertebrate / arthropod genera.
- `animal-seeds-col.json` — filtered seed list merged into `generate-catalog.mjs`.
- Regenerate: `python3 scripts/fetch-animal-species.py` then `npm run data`.

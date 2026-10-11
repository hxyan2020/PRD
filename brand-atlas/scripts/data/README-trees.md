# Tree species data

- `col-tree-species.json` — raw accepted species from [Catalogue of Life](https://www.catalogueoflife.org/) via ChecklistBank dataset `3LR`, for woody/tree genera guided by Wikipedia “List of tree genera” / GlobalTreeSearch-style families.
- `tree-seeds-col.json` — filtered seed list merged into `generate-catalog.mjs` (per-genus caps for balance; shrub/herb-heavy genera dropped).

Regenerate with: `python3 scripts/fetch-tree-species.py` (see agent history) then rebuild seeds and `npm run data`.

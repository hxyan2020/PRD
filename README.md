# Trading Risk Ninja

Surveillance playbooks for **CFD brokers** (spot, margin, perps, futures) and **crypto exchanges** (tokens, perps, tokenised assets).

The handbook covers how each manipulative pattern typically appears on the tape, who is in the room, which monitors to run (with starting warn/breach parameters), how to escalate L0–L5, and what to change in product design so the same strike is harder next time.

Open the site from `docs/index.html` or serve the folder:

```bash
python3 -m http.server 8080 --directory docs
```

Then visit `http://localhost:8080`. Use the **EN / 中文** toggle in the header to switch the whole handbook — playbooks, measures, escalation, and chrome. The choice is stored in `localStorage`.

Public URL (GitHub Pages):

https://hxyan2020.github.io/PRD/

A GitHub Action publishes `docs/` to that Pages site and also copies it to the `gh-pages` branch at `/trading-risk-ninja/`. If the `.github.io` address still 404s, open **Settings → Pages** and set the source to **GitHub Actions**.

This is a compliance and risk handbook. It is not a guide for committing market abuse. Thresholds are starting priors — retune them on your own tape.

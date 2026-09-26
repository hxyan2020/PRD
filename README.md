# Trading Risk Ninja

Surveillance playbooks for **CFD brokers** (spot, margin, perps, futures) and **crypto exchanges** (tokens, perps, tokenised assets).

The handbook covers how each manipulative pattern typically appears on the tape, who is in the room, which monitors to run (with starting warn/breach parameters), how to escalate L0–L5, and what to change in product design so the same strike is harder next time.

Open the site from `docs/index.html` or serve the folder:

```bash
python3 -m http.server 8080 --directory docs
```

Then visit `http://localhost:8080`. Use the **EN / 中文** toggle in the header to switch the whole handbook — playbooks, measures, escalation, and chrome. The choice is stored in `localStorage`.

Permanent public URL (assign once in GitHub):

https://hxyan2020.github.io/PRD/trading-risk-ninja/

The handbook is already on the `gh-pages` branch. Pages is not enabled yet, so that address 404s until the repo owner does this:

1. Open https://github.com/hxyan2020/PRD/settings/pages
2. **Build and deployment → Source** = **Deploy from a branch**
3. **Branch** = `gh-pages` / `/ (root)` → **Save**

GitHub then assigns the `.github.io` link above. An Action keeps `docs/` published to `gh-pages/trading-risk-ninja/`.

This is a compliance and risk handbook. It is not a guide for committing market abuse. Thresholds are starting priors — retune them on your own tape.

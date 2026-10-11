# V Exchange Admin (MatchingManagement)

React + Ant Design replica of the **MatchingManagement** broker admin (V Exchange / bitx-prod reference UI).

## Public URL (GitHub Pages)

After deployment from `main`:

**https://hxyan2020.github.io/PRD/**

**V-Exchange 告警清单（中文，永久页）：** https://hxyan2020.github.io/PRD/alarm-list.html

Direct examples:

- Overview: https://hxyan2020.github.io/PRD/overview
- Contract List: https://hxyan2020.github.io/PRD/contract-list
- User Rate Configuration: https://hxyan2020.github.io/PRD/user-rate-config

Enable **GitHub Pages** in the repo settings once (Source: **GitHub Actions**) if the workflow has not run yet.

## Run locally

```bash
cd v-exchange-admin
npm install
npm run dev
```

## Build

```bash
npm run build          # local (base /)
npm run build:pages    # GitHub Pages (base /PRD/)
```

## Coverage

Implemented from screenshots: contract & price modules, full order management (active/trigger/stop + deal history), user management (asset, rates, info, risk, blacklist, margin), Redis key/value admin, plus menu stubs for financial / API / tools / risk modules.

Mock data lives in `src/mock/`.

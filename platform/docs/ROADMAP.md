# Platform Improvement Roadmap

**Document ID:** CRMP-RM-001 · Prioritised backlog after current prototype

| ID | What | Effort | People | Dependencies | Severity | Notes |
|---|---|---|---|---|---|---|
| RM-01 | Production Lark interactive cards (buttons → CRMP actions) | L | 2 FE + 1 BE | Lark app approval | Critical | Replaces demo messenger transport |
| RM-02 | Real Monitor 2.0 webhook + ticket write-back | L | 2 BE | Monitor API contract | Critical | Close loop on dismiss/close |
| RM-03 | LLM primary RCA with tool-calling + eval harness | XL | 1 ML + 2 BE | Prompt vault, spend caps | High | Keep challenger independent |
| RM-04 | Challenger model diversity (separate vendor/prompt) | M | 1 ML | RM-03 | High | Reduce correlated failure |
| RM-05 | SSO + SCIM user provisioning | M | 1 BE + Security | IdP | Critical | Retire shared demo passwords |
| RM-06 | Postgres + multi-instance deploy | M | 1 SRE + 1 BE | Infra | High | Leave SQLite |
| RM-07 | Mobile nav drawer + touch-first messenger | S | 1 FE | Design tokens | Medium | Web+mobile optimisation |
| RM-08 | Full admin i18n (UI strings EN/zh-Hant) | M | 1 FE + PM | Message catalog | Medium | Docs already bilingual |
| RM-09 | Intervention adapters (halt/leverage/block) with dry-run | L | 2 BE + Ops | Trading control bus | Critical | Checker mandatory |
| RM-10 | Evidence redaction & retention jobs | M | 1 BE + GRC | Legal policy | High | PII in excerpts |
| RM-11 | Shadow-mode dashboard (AI suggest only) | S | 1 FE + 1 BE | Spine metrics | Medium | Pre-write rollout |
| RM-12 | Automated UAT smoke in CI | S | 1 QA + 1 BE | Seed DB | Medium | Gate PRs |
| RM-13 | Multi-brand tenancy | XL | Arch + 2 BE | Org model | Medium | Later phase |
| RM-14 | Cost/latency SLO alerts on AI path | S | SRE | Observability | Medium | Pair with RM-03 |
| RM-15 | Richer market-intel source scoring | M | 1 DS + 1 BE | Vendor feeds | Medium | Cut noise |

**Effort key:** S = small vertical slice · M = multi-day module · L = cross-team module · XL = programme-sized

## Suggested sequencing
1. RM-05, RM-06, RM-02 (foundations)
2. RM-01, RM-07, RM-11 (operator UX)
3. RM-09 with kill-switch (write path)
4. RM-03 + RM-04 + RM-14 (model quality)
5. RM-08, RM-10, RM-12, RM-15 (harden & scale)
EOF


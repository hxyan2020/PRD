# Agent notes

## Cursor Cloud specific instructions

### V Exchange Risk Tool deploy

- **Production host is Vercel only:** https://vex-llm-proxy.vercel.app
- Deploy with `bash xauusd-source-monitor/scripts/deploy-vercel.sh` (from a logged-in Vercel CLI or `VERCEL_TOKEN`).
- **Do not** run `scripts/deploy-gh-pages.sh` or push the SPA to `gh-pages`. That script exits intentionally.
- App root: `xauusd-source-monitor/` (Vite SPA + `api/chat.ts` on the same Vercel project `vex-llm-proxy`).
- After code changes that should go live, commit/push the branch PR **and** run the Vercel deploy script.

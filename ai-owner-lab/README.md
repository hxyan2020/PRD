# OWNLAB — AI Product Owner Academy

A 30-day learning platform to become a **true AI product owner**: technical fluency, module/infra literacy, independent debugging, AI DevOps, and career-ready judgment — without becoming an AI engineer.

## Run locally

```bash
cd ai-owner-lab
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Scripts

- `npm run dev` — local academy
- `npm run build` — production build
- `npm run check:curriculum` — assert Days 1–30 exist once
- `npm run preview` — preview production build

## What’s inside

| Area | Content |
|------|---------|
| Week 1 | Foundations — AI products, LLMs, tokens, embeddings, prompting, model choice |
| Week 2 | Architecture — stack, RAG, retrieval, agents/skills/MCP, infra, evals, debug tree |
| Week 3 | AI DevOps — LLMOps, hallucinations, grounding, monitoring, incidents, safety, maintenance |
| Week 4 | Future & capstone — latest AI, career impact, use-case labs, build/buy, PRD, graduation |
| Glossary | Searchable PO vocabulary |
| Use cases | Support, internal RAG, claims, on-call agent, sales research, learning coach |
| Ops playbook | Incident patterns + maintenance calendar |
| Career | Skills portfolio + personal tech radar |
| Tracker | Mark days complete, ring + week progress, 30-day board |

Each day lesson includes a **From production** case (real products/incidents/patterns) plus an **interactive diagram** — click nodes to inspect details.

Progress and notes are stored in `localStorage` in your browser. Open **Tracker** in the nav (shows `n/30`) to toggle any day and see overall progress.

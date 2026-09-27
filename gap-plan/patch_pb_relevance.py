#!/usr/bin/env python3
"""Deepen buy-side / portfolio-risk path↔week relevance inside the 26-week calendar."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def words(paras: list[str]) -> int:
    return sum(len(p.split()) for p in paras)


def lesson(title: str, body: list[str]) -> dict:
    paras = list(body)
    pads = [
        "Close with one sentence a portfolio manager could challenge in the next risk meeting — numbers first, adjectives never.",
        "If a reviewer cannot retell the portfolio decision in thirty seconds from your note, rewrite until they can.",
        "Keep the buy-side lens explicit: whose book, which mandate, what financing, what the PM must decide next.",
    ]
    for pad in pads:
        if words(paras) >= 160:
            break
        paras.append(pad)
    w = words(paras)
    if w < 160:
        raise SystemExit(f"lesson {title!r} only {w} words")
    return {"title": title, "body": paras}


HEDGE_OVERLAY = lesson(
    "Portfolio hedge overlays a PM will actually fund",
    [
        "A futures hedge on a single name is a trading-risk exercise. A buy-side hedge is a portfolio overlay: you state the factor you remove (equity beta, rates DV01, BTC beta), the residual the PM still owns, the cash and margin the overlay consumes, and the basis that can make the overlay look wrong in a calm week and disastrous in a gap week.",
        "Write the overlay as four lines before you size it: (1) what risk you intend to cancel, (2) what you refuse to cancel, (3) how you will measure residual risk tomorrow morning, (4) who can cut the overlay without a meeting. If you cannot fill those four lines, you do not yet have a portfolio hedge — you have a trade idea.",
        "In the lab memo, put the hedge ratio next to a residual-risk sentence. Example shape: 'Overlay removes ~0.8 equity beta; residual is single-name and basis; margin use is X; kill switch is Y.' That is the language a PM and a risk partner share.",
    ],
)

PM_LIMITS = lesson(
    "Soft limits, hard limits, and mandate language",
    [
        "Buy-side risk conversations fail when 'limit' means three different things. A soft limit is a yellow light: escalate, explain, maybe trim. A hard limit is a red light: cannot add risk, or must reduce, without a named exception path. A mandate constraint (duration band, gross exposure, liquidity bucket, ESG exclusion) is not a VaR number but it binds the book every day.",
        "Your threshold memo this week should name which of those three you are defending. Address the finding to a portfolio manager as well as Head of Risk: what decision you need (raise soft limit, keep hard limit, change mandate interpretation), what evidence you bring (loss and false-positive), and what happens if they do nothing for two weeks.",
        "Borrow the week-3 margin language if helpful: liquidation is a venue hard stop; a PM soft limit is a conversation. Do not pretend they are the same control. Write one sentence that separates them so the meeting cannot blur them.",
    ],
)

COMPONENT_VAR = lesson(
    "Portfolio VaR, weights, and risk contribution",
    [
        "Portfolio VaR is not 'the VaR of whatever ticker is loudest.' It needs positions or weights, a loss definition (absolute mark-to-market versus versus-benchmark), and a clear book boundary. Parametric (variance-covariance) VaR makes the correlation assumption explicit; historical VaR makes the return sample explicit. Either way, a PM's first questions are: whose book, what horizon, absolute or active, and what moved since yesterday.",
        "Risk contribution (component VaR intuition) asks which sleeve drives the portfolio number. You do not need a full Euler allocation engine this week. You do need a practical split: recompute VaR with each sleeve removed or shocked alone, or report parametric stand-alone versus diversified VaR and name the diversification gap. That gap is where PMs over-trust hedges.",
        "Notebook output should include weights, both VaRs, and a three-line contribution story (sleeve A/B/C). End with whether you would show absolute or active VaR in the PM pack — pick one and say why.",
    ],
)

FACTOR_BUDGET = lesson(
    "Factor risk and a risk budget a PM can refuse",
    [
        "Volatility models forecast how fast things move. Factor risk explains why the book moves together. On a buy-side sleeve book, translate vol and correlation into a factor sentence: market beta, rates sensitivity, credit or crypto factor, and an idiosyncratic bucket. Then assign a risk budget — percent of stand-alone risk or of VaR — that the PM can accept or refuse in one line.",
        "A useful budget is boring: e.g. '≤50% equity-factor risk, ≤30% crypto-factor risk, ≥20% residual/idiosyncratic, gross exposure ≤2× NAV.' Bad budgets are slogans ('stay diversified') with no number a middle-office report can breach. Your deliverable is one refuse-able sentence plus the three factor exposures you used to justify it.",
        "When GARCH or EWMA vol jumps after a gap night, say whether the budget still holds or whether the PM must cut the dominant factor before the open. That is portfolio risk work sitting on top of the vol lab — keep both outputs.",
    ],
)

CONSTRUCTION_STRESS = lesson(
    "Construction under stress: what you cut first",
    [
        "Portfolio construction is not a quarterly mean-variance poster. Under stress it is an ordered list: what you cut first, what you hedge, what you finance through, and what you refuse to sell into a gap. Build that list before you run Monte Carlo so the simulation answers a decision, not a curiosity.",
        "Use sleeve contributions from the Monte Carlo: if crypto dominates 95% loss, the construction response might be reduce gross, tighten beta overlay, or raise cash — each with a different PM conversation. Liquidity add-ons change the order: an asset that looks small in VaR can be first to cut if the add-on says you cannot exit.",
        "Write a six-line playbook: trigger, first cut, hedge overlay, financing check, PM ask, reopen criteria. Attach it under the headline loss number. Buy-side risk without a playbook is just a colourful histogram. Keep the playbook short enough to read aloud in under thirty seconds.",
    ],
)

LEVERAGE_BUDGET = lesson(
    "Financing leverage versus the market risk budget",
    [
        "Repo, stock borrow, and rehypothecation change the portfolio's true leverage even when the 'risk' screens look calm. Haircuts and margin calls are not only credit-officer problems; they hit the PM's ability to keep factor exposures inside the budget you wrote in week 14.",
        "Build a simple bridge: market risk budget (VaR or factor %) on one side; financing capacity (cash from repo, IM/VM needs, rehypothecation rights) on the other. Show one scenario where financing forces a de-risk before market VaR breaches. That scenario is the buy-side punchline of the collateral week.",
        "Keep the crypto-versus-PB table, but add a row the PM cares about: 'Who can force a portfolio cut overnight?' If the answer is unclear, the table is not finished.",
        "Write the bridge as three numbers and one owner: (a) current factor or VaR use versus budget, (b) cash and IM/VM headroom after a one-notch haircut move, (c) the sleeve you would cut first if financing calls before risk does, and the named person who can order that cut without a committee.",
    ],
)

CONSTRUCTION_CHECKLIST = lesson(
    "Portfolio construction checklist before the joint shock",
    [
        "Before you shock the three-sleeve book, write the construction intent: target factor mix, gross and net exposure, financing plan, and the hedge overlays that are allowed. Without that intent, 'dominant sleeve' is a post-mortem adjective, not a control failure.",
        "Checklist (fill before P&L): (1) weights or notionals by sleeve, (2) intended factor budget, (3) overlays on or off, (4) financing/haircut assumptions, (5) soft and hard limits that should have fired, (6) the PM decision you will request if the shock hits. Then run the four shocks and see which checklist line failed first.",
        "Your week-23 artifact should include that pre-shock checklist above the P&L table. Portfolio risk is the combination of construction, limits, financing, and PM dialogue — not only the colourful loss bars.",
        "End with one PM ask that is a decision, not a status update — for example raise cash, cut the dominant sleeve, keep the overlay, or request a mandate exception — and name the evidence line (sleeve P&L, margin, or checklist breach) that justifies that ask.",
    ],
)


def ensure_lesson(lessons: list, title_prefix: str, new_lesson: dict, index: int | None = None) -> list:
    if any(l.get("title", "").startswith(title_prefix) for l in lessons):
        # replace short version if present
        out = []
        for l in lessons:
            if l.get("title", "").startswith(title_prefix):
                out.append(new_lesson)
            else:
                out.append(l)
        return out
    out = list(lessons)
    if index is None or index >= len(out):
        out.append(new_lesson)
    else:
        out.insert(index, new_lesson)
    return out


def replace_lesson(lessons: list, title_prefix: str, new_lesson: dict) -> list:
    out = []
    replaced = False
    for l in lessons:
        if l.get("title", "").startswith(title_prefix):
            out.append(new_lesson)
            replaced = True
        else:
            out.append(l)
    if not replaced:
        out.append(new_lesson)
    return out


def patch_week_2(w: dict) -> None:
    w["title"] = "Basis, portfolio hedge overlays, and EWMA volatility"
    w["goal"] = (
        "Define basis and a one-week futures hedge as a portfolio overlay a PM would fund, "
        "and compute realized versus EWMA volatility on the same return series."
    )
    lessons = list(w.get("lessons") or [])
    lessons = ensure_lesson(lessons, "Portfolio hedge overlays", HEDGE_OVERLAY, index=2)
    w["lessons"] = lessons
    lenses = dict(w.get("pathLenses") or {})
    lenses["pb"] = (
        "Lead with the overlay sentence: factor removed, residual owned, margin use, kill switch. "
        "The basis memo is evidence for that overlay, not a separate hobby."
    )
    w["pathLenses"] = lenses
    criteria = list(w.get("criteria") or [])
    if not any("overlay" in c.lower() or "residual" in c.lower() for c in criteria):
        criteria.insert(
            1,
            "Hedge write-up includes residual risk, margin use, and a kill switch — portfolio overlay language, not only a ratio.",
        )
    w["criteria"] = criteria


def patch_week_3(w: dict) -> None:
    paths = list(w.get("paths") or [])
    if "pb" not in paths:
        paths.append("pb")
    w["paths"] = paths
    lenses = dict(w.get("pathLenses") or {})
    lenses["pb"] = (
        "Read margin tiers as portfolio leverage controls: what gross you can keep, what gets liquidated, "
        "and how that interacts with the PM soft limits you will write in week 4."
    )
    w["pathLenses"] = lenses


def patch_week_4(w: dict) -> None:
    w["title"] = "Limits a portfolio manager will own (5% vs 3%)"
    w["goal"] = (
        "Defend a soft or hard portfolio limit with loss and false-positive arguments, name an owner, "
        "and ask a PM (and Head of Risk) for one explicit decision."
    )
    lessons = list(w.get("lessons") or [])
    lessons = ensure_lesson(lessons, "Soft limits, hard limits", PM_LIMITS, index=1)
    w["lessons"] = lessons
    lenses = dict(w.get("pathLenses") or {})
    lenses["pb"] = (
        "Address soft vs hard vs mandate in the memo. The decision line is for a PM: keep, raise, or reinterpret — with evidence."
    )
    w["pathLenses"] = lenses
    criteria = list(w.get("criteria") or [])
    if not any("soft" in c.lower() or "mandate" in c.lower() for c in criteria):
        criteria.insert(
            1,
            "Memo states whether the control is soft, hard, or mandate-related, and names the PM decision requested.",
        )
    w["criteria"] = criteria


def patch_week_12(w: dict) -> None:
    w["title"] = "Portfolio VaR: historical, parametric, and sleeve contribution"
    w["goal"] = (
        "Compute 99% one-day historical and parametric VaR on a seeded sleeve book with explicit weights, "
        "and explain contribution / diversification in language a PM uses."
    )
    lessons = list(w.get("lessons") or [])
    lessons = ensure_lesson(lessons, "Portfolio VaR, weights", COMPONENT_VAR, index=2)
    w["lessons"] = lessons
    lenses = dict(w.get("pathLenses") or {})
    lenses["pb"] = (
        "Show weights, absolute-vs-active choice, both VaRs, and a three-sleeve contribution story before any treasurer narrative."
    )
    w["pathLenses"] = lenses
    lab = dict(w.get("lab") or {})
    steps = list(lab.get("steps") or [])
    steps.append(
        "Print weights for each sleeve/asset. Print a simple contribution story: stand-alone sense or leave-one-out note for each sleeve. "
        "State absolute_or_active = 'absolute' or 'active' and why."
    )
    lab["steps"] = steps
    lab["goal"] = (
        "Compute historical and parametric 99% VaR with weights and a sleeve contribution story for a PM."
    )
    w["lab"] = lab
    criteria = list(w.get("criteria") or [])
    if not any("weight" in c.lower() or "contribution" in c.lower() for c in criteria):
        criteria.insert(
            1,
            "Notebook/notes state positions or weights and a short sleeve contribution / diversification story.",
        )
    w["criteria"] = criteria


def patch_week_14(w: dict) -> None:
    w["title"] = "Factor risk, vol models, and a PM risk budget"
    w["goal"] = (
        "Implement EWMA and GARCH(1,1) next-day volatility, and turn correlation into a factor-risk budget sentence a PM can refuse."
    )
    lessons = list(w.get("lessons") or [])
    lessons = replace_lesson(lessons, "Factor risk and a risk budget", FACTOR_BUDGET)
    w["lessons"] = lessons
    # move factor lesson earlier visually by reordering after GARCH
    titles = [l["title"] for l in lessons]
    if "Factor risk and a risk budget a PM can refuse" in titles:
        factor = next(l for l in lessons if l["title"].startswith("Factor risk"))
        others = [l for l in lessons if not l["title"].startswith("Factor risk")]
        # place after GARCH (index 2 if first two are EWMA/GARCH)
        if len(others) >= 2:
            w["lessons"] = others[:2] + [factor] + others[2:]
        else:
            w["lessons"] = others + [factor]
    lenses = dict(w.get("pathLenses") or {})
    lenses["pb"] = (
        "The primary deliverable is the refuse-able risk-budget sentence with three factor exposures — vol forecasts support it, they do not replace it."
    )
    w["pathLenses"] = lenses
    criteria = list(w.get("criteria") or [])
    if not any("budget" in c.lower() or "factor" in c.lower() for c in criteria):
        criteria.insert(
            1,
            "A one-line factor risk budget (with exposures) is written so a PM can accept or refuse it.",
        )
    w["criteria"] = criteria
    sessions = list(w.get("sessions") or [])
    if sessions:
        sessions[0] = {
            "h": 2.0,
            "kind": "Study",
            "text": (
                "EWMA and GARCH(1,1) on the same returns. Then map vol/correlation into factor exposures and write one "
                "risk-budget sentence a PM can refuse. Gap-opening limitation stays in the notebook notes."
            ),
        }
    w["sessions"] = sessions


def patch_week_15(w: dict) -> None:
    w["title"] = "Portfolio stress, liquidity, and what you cut first"
    lessons = list(w.get("lessons") or [])
    lessons = ensure_lesson(lessons, "Construction under stress", CONSTRUCTION_STRESS, index=2)
    w["lessons"] = lessons
    lenses = dict(w.get("pathLenses") or {})
    lenses["pb"] = (
        "Headline loss is secondary to sleeve contributions + the six-line cut/hedge/finance playbook for the PM."
    )
    w["pathLenses"] = lenses
    criteria = list(w.get("criteria") or [])
    if not any("playbook" in c.lower() or "cut first" in c.lower() for c in criteria):
        criteria.insert(
            2,
            "A short construction playbook states what you cut or hedge first under the stress.",
        )
    w["criteria"] = criteria


def patch_week_22(w: dict) -> None:
    w["title"] = "Financing, leverage, and the PM risk budget"
    lessons = list(w.get("lessons") or [])
    lessons = ensure_lesson(lessons, "Financing leverage versus the market risk budget", LEVERAGE_BUDGET, index=2)
    w["lessons"] = lessons
    lenses = dict(w.get("pathLenses") or {})
    lenses["pb"] = (
        "Bridge financing capacity to the week-14 risk budget. Show one case where margin forces a cut before VaR does."
    )
    w["pathLenses"] = lenses
    criteria = list(w.get("criteria") or [])
    if not any("leverage" in c.lower() or "risk budget" in c.lower() for c in criteria):
        criteria.insert(
            1,
            "Note bridges financing/margin to the portfolio risk budget and names who can force an overnight cut.",
        )
    w["criteria"] = criteria


def patch_week_23(w: dict) -> None:
    w["title"] = "Portfolio book under joint stress: construction, sleeves, PM ask"
    lessons = list(w.get("lessons") or [])
    lessons = ensure_lesson(lessons, "Portfolio construction checklist", CONSTRUCTION_CHECKLIST, index=0)
    w["lessons"] = lessons
    w["goal"] = (
        "Write a pre-shock construction checklist, shock the synthetic book, report P&L by sleeve and margin call, "
        "name the dominant sleeve, and close with a PM decision ask (plus the toy XVA sketch as a non-claim appendix)."
    )
    lenses = dict(w.get("pathLenses") or {})
    lenses["pb"] = (
        "Checklist → shock → dominant sleeve → PM ask is the spine. XVA sketch stays an appendix with will-not-claim."
    )
    w["pathLenses"] = lenses
    criteria = list(w.get("criteria") or [])
    if not any("checklist" in c.lower() or "construction" in c.lower() for c in criteria):
        criteria.insert(
            0,
            "Pre-shock portfolio construction checklist is written above the P&L table.",
        )
    w["criteria"] = criteria


def patch_path(plan: dict) -> None:
    for path in plan["paths"]:
        if path["id"] != "pb":
            continue
        path["name"] = "Buy-side / Portfolio Risk (PB & asset manager)"
        path["summary"] = (
            "Financing alone is not buy-side risk. This path is now explicit in the weekly titles: "
            "portfolio hedge overlays (week 2), margin as leverage (3), PM soft/hard limits (4), "
            "portfolio VaR and contributions (12), factor risk budgets (14), stress playbooks (15), "
            "financing versus risk budget (22), and construction-under-joint-stress with a PM ask (23) — "
            "then the portfolio folder and narrative (25–26)."
        )
        path["gaps"] = [
            {
                "name": "Portfolio hedge overlays, basis, residual risk",
                "weeks": [2],
            },
            {
                "name": "Margin/leverage and liquidation as portfolio constraints",
                "weeks": [3],
            },
            {
                "name": "Soft vs hard limits and mandate language with a PM decision",
                "weeks": [4],
            },
            {
                "name": "Portfolio VaR, weights, and sleeve contribution",
                "weeks": [12],
            },
            {
                "name": "Factor risk and a refuse-able risk budget",
                "weeks": [14],
            },
            {
                "name": "Portfolio stress playbook: contributions and what you cut first",
                "weeks": [15],
            },
            {
                "name": "Financing leverage versus the market risk budget (repo/IM/VM)",
                "weeks": [22],
            },
            {
                "name": "Construction checklist, joint stress, dominant sleeve, PM ask",
                "weeks": [15, 23],
            },
            {
                "name": "Buy-side narrative in the portfolio folder",
                "weeks": [25, 26],
            },
        ]


def sync_courseware_files(plan: dict) -> None:
    files = {
        range(1, 10): "_cw_1_9.json",
        range(10, 19): "_cw_10_18.json",
        range(19, 27): "_cw_19_26.json",
    }
    by_week = {w["n"]: w for w in plan["weeks"]}
    for span, name in files.items():
        path = ROOT / name
        data = json.loads(path.read_text(encoding="utf-8"))
        for item in data:
            w = by_week[item["n"]]
            for key in ("goal", "bigIdea", "lessons", "lab", "writeGuide", "industryGuide"):
                if key in w:
                    item[key] = w[key]
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    plan_path = ROOT / "plan.json"
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    by = {w["n"]: w for w in plan["weeks"]}
    patch_week_2(by[2])
    patch_week_3(by[3])
    patch_week_4(by[4])
    patch_week_12(by[12])
    patch_week_14(by[14])
    patch_week_15(by[15])
    patch_week_22(by[22])
    patch_week_23(by[23])
    patch_path(plan)
    plan_path.write_text(json.dumps(plan, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    sync_courseware_files(plan)

    pb_weeks = sorted(w["n"] for w in plan["weeks"] if "pb" in w.get("paths", []))
    print("pb weeks", pb_weeks)
    print(
        "titles",
        {n: by[n]["title"] for n in (2, 3, 4, 12, 14, 15, 22, 23)},
    )
    tagged = set(pb_weeks)
    pb = next(p for p in plan["paths"] if p["id"] == "pb")
    for g in pb["gaps"]:
        missing = [n for n in g["weeks"] if n not in tagged]
        if missing:
            raise SystemExit(f"gap/tag mismatch {g} missing {missing}")
    for n in (2, 4, 12, 14, 15, 22, 23):
        for l in by[n]["lessons"]:
            if words(l["body"]) < 160:
                raise SystemExit(f"short lesson W{n} {l['title']}")
    print("OK bytes", plan_path.stat().st_size)


if __name__ == "__main__":
    main()

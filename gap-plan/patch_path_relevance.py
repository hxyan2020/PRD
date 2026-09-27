#!/usr/bin/env python3
"""Rebalance path↔week relevance: FRTB / XVA / SIMM / PFE depth + cross-path fixes."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def words(paras: list[str]) -> int:
    return sum(len(p.split()) for p in paras)


def lesson(title: str, body: list[str]) -> dict:
    w = words(body)
    # Match merge_courseware.py threshold; pad tiny shortfalls explicitly in callers.
    if w < 160:
        body = list(body) + [
            "Write the takeaway in your own words before you close the notebook — one sentence that a reviewer could challenge."
        ]
        w = words(body)
    if w < 160:
        raise SystemExit(f"lesson {title!r} only {w} words")
    return {"title": title, "body": body}


FRTB_LESSON = lesson(
    "FRTB in plain English: SA, IMA, and why ES shows up",
    [
        "The Fundamental Review of the Trading Book (FRTB) is the Basel market-risk capital rewrite most banks still implement in phases. Two calculation tracks matter in interviews and in Murex-adjacent work. The standardised approach (SA) maps positions into risk-factor buckets, applies prescribed risk weights and correlations, and adds a residual risk add-on where products do not fit cleanly. You do not need to memorise every bucket this week; you do need the sentence: SA is a rulebook charge driven by classification and weights, not by your internal VaR engine.",
        "The internal models approach (IMA) lets a bank use approved internal expected shortfall models on modellable risk factors, with strict backtesting, P&L attribution (PLA), and a capital outcome that can jump when factors are deemed non-modellable (NMRF). That is why week-12 VaR and this week's ES/backtest lab are not academic toys for a Murex market-risk SME — they are the numerics behind the conversation when a desk asks why capital or limits moved after a methodology or market-data change.",
        "Keep three artefacts in one notebook note: (1) the risk measure and horizon you computed, (2) the exception count / traffic light, (3) one line on what would break an IMA-style story (stale curve, missing risk factor, PLA fail). You are not filing a regulatory return; you are proving you can sit between the engine output and the governance question.",
    ],
)

PFE_LESSON = lesson(
    "From Monte Carlo paths to PFE-style exposure",
    [
        "Potential Future Exposure (PFE) asks a different question from market-risk VaR on a trading book. VaR asks how much mark-to-market you might lose. PFE asks how large a counterparty exposure might become along simulated market paths — typically a high quantile (often 95% or 99%) of the positive exposure distribution at a future date, sometimes summarised across a profile as effective EPE for capital storytelling.",
        "You can build intuition without a full CCR engine. Simulate market factors, revalue the derivative or financed position on each path, take exposure as max(V, 0) after simple collateral rules if you have them, then read a quantile across paths at a chosen horizon. That number is PFE-like. Expected exposure (EE) is the mean of that positive exposure; EEPE aggregates EE over time with regulatory conventions you can name without implementing every Basel formula.",
        "For the Murex path, write beside your Monte Carlo market-loss number a second line: exposure quantile at horizon T and whether collateral would have cut it. For the buy-side and tokenised paths, state who the counterparty is (PB, venue, custodian, chain settlement agent) because PFE without a counterparty noun is theatre.",
    ],
)

XVA_LESSON = lesson(
    "XVA map: CVA, DVA, FVA — what you must not fake",
    [
        "XVA is the family of valuation adjustments that turn a risk-free derivative value into a counterparty- and funding-aware value. CVA (credit valuation adjustment) is the adjustment for expected loss from counterparty default, roughly exposure profile times default probability times loss-given-default, discounted. DVA is the symmetric own-credit piece. FVA covers funding costs and benefits when collateral and funding desks disagree with the risk-free discount curve.",
        "You will not build a production XVA engine in this plan. You will build a practitioner map: which sleeve creates exposure, whether a CSA / IM reduces it, which credit curve or proxy you would need, and which number is valuation versus limit versus capital. That map is what separates a Murex configurator from a market-and-credit risk SME when an FO user says 'the XVA number moved'.",
        "In this week's joint-shock book, add a five-line XVA appendix: (1) uncollateralised exposure proxy from the worst sleeve, (2) a flat hazard-rate assumption you label as toy, (3) a one-period CVA sketch = EE × PD × LGD, (4) what IM/VM would change, (5) the sentence you will not claim ('this is not a desk XVA'). Keep the arithmetic boring and the ownership clear.",
    ],
)

SIMM_LESSON = lesson(
    "SIMM and IM versus VM: collateral that behaves like a model",
    [
        "Variation margin (VM) tracks mark-to-market: when the trade moves against you, you post cash or eligible collateral to bring exposure back toward zero under the CSA. Initial margin (IM) is the extra buffer for the close-out window if your counterparty defaults — it is sized from risk sensitivities, not from today's MTM alone. Uncleared margin rules pushed the industry toward ISDA SIMM: a standardised sensitivity-based IM model with risk classes (interest rates, credit, equity, commodity, FX), buckets, and correlations.",
        "You do not need a licensed SIMM calculator here. You do need the control story a Murex or collateral practitioner uses: trade sensitivities in, SIMM/IM out, disputes when risk factors or product taxonomies disagree, and the operational path from valuation/risk engine to collateral call. Map this week's repo and haircut arithmetic to three labels: VM-like MTM call, IM-like buffer, haircut on collateral eligibility.",
        "Lab output should include a tiny sensitivity table (rate DV01, FX delta, equity delta — even if synthetic) and a toy IM score as a weighted sum of absolute sensitivities with made-up weights. Then write one paragraph on what would make that number wrong in production (missing risk class, wrong sign, nested portfolio netting). That paragraph is the Murex risk-tech deliverable for the week.",
    ],
)

FRTB_VAL_LESSON = lesson(
    "IMA evidence: PLA, NMRF, and what a validator asks first",
    [
        "Under FRTB IMA, it is not enough to print ES. Supervisors and model risk care about P&L attribution (PLA): whether hypothetical and risk-theoretical P&L line up with the risk factors in the model. They care about non-modellable risk factors (NMRF) that attract stressed capital add-ons when data are too sparse. They care about desk-level eligibility and about whether the backtesting programme matches the capital story.",
        "Your validation pack this week should therefore reserve a half-page for FRTB-aware questions even if your toy VaR is not an IMA candidate: Which P&L is used for exceptions? Which risk factors are missing from the engine mapping? What would a PLA fail look like in tickets (market data vs enrichment vs calc)? Who can freeze a limit when the traffic light turns amber?",
        "For Trading Risk and Murex paths, translate each pack section into an owner: desk risk, market risk methodology, risk technology, model validation. One sentence each. If you cannot name an owner, the pack is not ready for a signer.",
    ],
)


def patch_week_13(w: dict) -> None:
    w["title"] = "FRTB lenses: ES, SA/IMA, and backtesting"
    w["goal"] = (
        "Compute 97.5% expected shortfall and a Kupiec/traffic-light backtest on the week-12 series, "
        "and write an FRTB SA-versus-IMA map that ties those numbers to capital and desk evidence language."
    )
    w["bigIdea"] = (
        "Expected shortfall asks how bad the bad days are; FRTB decides whether capital listens to an internal ES model (IMA) "
        "or a standardised charge (SA). Backtests and P&L attribution decide whether the IMA story survives. "
        "This week you compute ES and exceptions, then write the FRTB map a Murex market-risk SME must be able to say aloud."
    )
    lessons = list(w.get("lessons") or [])
    # insert FRTB lesson after ES vs VaR
    if not any(l.get("title", "").startswith("FRTB in plain English") for l in lessons):
        lessons.insert(1, FRTB_LESSON)
    w["lessons"] = lessons
    w["sessions"] = [
        {
            "h": 2.0,
            "kind": "Study",
            "text": (
                "Hull Ch. 22 on expected shortfall. BIS MAR32 backtesting/PLA notes. Then write a one-page FRTB map: "
                "SA buckets/weights versus IMA ES on modellable factors, NMRF, PLA, and why 97.5% ES appears in capital talk "
                "while classic exception counting still uses 99% VaR. Critical values to remember at 95%: 3.84 (1 df), 5.99 (2 df). "
                "Basel zones over 250 days at 99%: 0–4 green, 5–9 amber, 10+ red."
            ),
        },
        {
            "h": 2.5,
            "kind": "Lab",
            "text": (
                "Using the week-12 series, compute 97.5% ES, 99% VaR exceptions, Kupiec LR, and traffic-light zone. "
                "Add a printed FRTB block: SA-vs-IMA three bullets and one PLA/NMRF risk to the engine mapping."
            ),
        },
        {
            "h": 1.0,
            "kind": "Write",
            "text": (
                "Twelve lines: why capital can use ES while backtests still count VaR exceptions, and which FRTB track "
                "(SA or IMA) your toy notebook is allowed to inform — be explicit about what you will not claim."
            ),
        },
        {
            "h": 0.5,
            "kind": "Industry",
            "text": (
                "Send the note to one market-risk, FRTB, or Murex risk practitioner. Ask what they backtest in production "
                "and whether PLA or NMRF is the sharper pain. Log the reply."
            ),
        },
    ]
    w["criteria"] = [
        "Notebook prints 97.5% expected shortfall, the exception count, the Kupiec statistic, and a traffic-light zone.",
        "A short FRTB SA-versus-IMA map is written beside the numbers, including one PLA or NMRF risk.",
        "The note was sent to one practitioner, and the production-backtest question is logged.",
    ]
    lab = dict(w.get("lab") or {})
    lab["goal"] = (
        "From the week-12 series, print 97.5% ES, 99% VaR exception count, Kupiec LR, traffic-light zone, "
        "and a three-bullet FRTB SA/IMA map."
    )
    lab["why"] = (
        "Murex and Trading Risk conversations after FRTB need both the severity/backtest numerics and the capital-track vocabulary."
    )
    steps = list(lab.get("steps") or [])
    steps.append(
        "Print an FRTB map block with keys sa_idea, ima_idea, pla_or_nmrf_risk (one sentence each). "
        "Save into week13_backtest.json under key frtb_map."
    )
    lab["steps"] = steps
    expected = list(lab.get("expected") or [])
    expected.append("FRTB SA/IMA/PLA-or-NMRF sentences print next to the ES/backtest numbers.")
    lab["expected"] = expected
    w["lab"] = lab
    lenses = dict(w.get("pathLenses") or {})
    lenses["murex"] = (
        "Lead with FRTB: SA vs IMA, then show ES + Kupiec/traffic light as the evidence pack a desk head asks for "
        "before trusting an IMA-style or vendor-engine story."
    )
    lenses["quant"] = (
        "Keep the numerics exact (ES, exceptions, LR, zone). Use FRTB language only where it clarifies capital versus backtest."
    )
    w["pathLenses"] = lenses


def patch_week_15(w: dict) -> None:
    w["title"] = "Monte Carlo stress, liquidity, and PFE-style exposure"
    w["goal"] = (
        "Run a 5,000-path Monte Carlo stress with a liquidity add-on, and report a PFE-style positive-exposure quantile "
        "beside the market-loss number for a named counterparty."
    )
    w["bigIdea"] = (
        "Monte Carlo stress builds a P&L cloud; PFE-style thinking builds an exposure cloud. "
        "Liquidity add-ons and collateral rules change which number a Head of Risk or CCR lead should see first. "
        "This week you compute both and refuse to mix them without labels."
    )
    lessons = list(w.get("lessons") or [])
    # expand short portfolio lesson if present
    for i, l in enumerate(lessons):
        if l.get("title", "").startswith("Portfolio-level stress") and words(l.get("body") or []) < 160:
            lessons[i] = lesson(
                "Portfolio-level stress versus single-name scare charts",
                [
                    "A single-name scare chart answers a newspaper question: what if ETH drops 30%. A portfolio-level stress answers a risk-committee question: after correlated moves, hedges, and financing, which sleeve pays. The second needs a book definition, a joint shock or factor path set, and a P&L bridge by sleeve — not a screenshot of one ticker.",
                    "When you run Monte Carlo paths, keep a sleeve tag on every revaluation. Print contribution to the 95% loss and to expected shortfall of losses. If one sleeve dominates, say so before you propose a hedge. If contributions flip when you change correlation, that is the finding — write it down before anyone debates the hedge ratio.",
                    "For buy-side and multi-asset paths, end with a PM sentence: dominant sleeve, proposed trim or hedge, and what you need confirmed (beta, borrow, venue depth). For Murex, add which risk factors in the engine must be alive for that sleeve contribution to be trustworthy, and which market-data feed would silently zero them.",
                ],
            )
    if not any("PFE-style" in l.get("title", "") for l in lessons):
        lessons.insert(2, PFE_LESSON)
    w["lessons"] = lessons
    sessions = list(w.get("sessions") or [])
    if sessions:
        sessions[0] = {
            "h": 2.0,
            "kind": "Study",
            "text": (
                "Hull Ch. 21 Monte Carlo for a European option (lognormal paths). Define a liquidity add-on you can compute "
                "(half-spread × size is enough). Then read a short CCR primer note you write yourself: exposure = max(V, 0), "
                "PFE ≈ high quantile of exposure across paths at horizon T, EE = mean exposure. Keep path count, seed, vols, "
                "and correlation in the notebook header."
            ),
        }
        if len(sessions) > 1:
            sessions[1] = {
                "h": 2.5,
                "kind": "Lab",
                "text": (
                    "Five thousand paths on a small book. Print 95% market loss, ES of losses, liquidity penalty, and a "
                    "PFE-style 95% positive-exposure quantile at one horizon. Name the counterparty in one noun."
                ),
            }
    w["sessions"] = sessions
    criteria = list(w.get("criteria") or [])
    if not any("PFE" in c for c in criteria):
        criteria.insert(
            1,
            "Notebook prints a PFE-style exposure quantile with a named counterparty, separate from the market-loss number.",
        )
    w["criteria"] = criteria
    lab = dict(w.get("lab") or {})
    steps = list(lab.get("steps") or [])
    steps.append(
        "Define exposure_t = max(value_t, 0) on each path at a chosen horizon (or at path end). "
        "Print pfe95 = quantile(exposure, 0.95) and counterparty_name. Do not add pfe95 into the market-loss total without a label."
    )
    lab["steps"] = steps
    lab["goal"] = (
        "Run Monte Carlo stress with a liquidity add-on and print a separate PFE-style exposure quantile."
    )
    lab["why"] = (
        "Market loss, liquidity friction, and counterparty exposure are different management questions — especially on Murex CCR/XVA stacks."
    )
    expected = list(lab.get("expected") or [])
    expected.append("PFE-style quantile and counterparty noun print beside market loss / ES / liquidity penalty.")
    lab["expected"] = expected
    w["lab"] = lab
    lenses = dict(w.get("pathLenses") or {})
    lenses["murex"] = (
        "Treat the Monte Carlo market loss and the PFE-style exposure quantile as two columns. "
        "State what a CSA/IM would change before anyone mentions XVA."
    )
    w["pathLenses"] = lenses


def patch_week_16(w: dict) -> None:
    w["title"] = "Model validation pack with FRTB-aware evidence"
    lessons = list(w.get("lessons") or [])
    if not any("IMA evidence" in l.get("title", "") for l in lessons):
        lessons.insert(1, FRTB_VAL_LESSON)
    w["lessons"] = lessons
    w["goal"] = (
        "Write an SR 11-7-style validation pack for the week-12 VaR that also answers FRTB-aware questions "
        "(PLA, missing factors/NMRF, owners) in four pages or fewer."
    )
    lenses = dict(w.get("pathLenses") or {})
    lenses["murex"] = (
        "Page 1 must work for a model-risk reviewer who has seen FRTB IMA packs: purpose, assumptions, challenger, "
        "PLA/NMRF risks, limits, and named owners across methodology and risk technology."
    )
    w["pathLenses"] = lenses
    sessions = list(w.get("sessions") or [])
    if sessions:
        sessions[0] = {
            "h": 2.0,
            "kind": "Study",
            "text": (
                "Read SR 11-7 lenses (purpose, conceptual soundness, outcomes analysis, ongoing monitoring). "
                "Add an FRTB-aware half-page: PLA, NMRF, desk evidence. Reuse week-13 ES/backtest outputs as exhibits."
            ),
        }
    w["sessions"] = sessions
    criteria = list(w.get("criteria") or [])
    if not any("FRTB" in c or "PLA" in c for c in criteria):
        criteria.insert(
            1,
            "Pack includes an FRTB-aware half-page covering PLA or NMRF risk and named owners.",
        )
    w["criteria"] = criteria


def patch_week_22(w: dict) -> None:
    w["title"] = "Collateral, SIMM/IM, repo, and rehypothecation"
    w["goal"] = (
        "Explain VM versus IM (and SIMM as a sensitivity-based IM), complete the financing/haircut arithmetic, "
        "and produce a toy sensitivity→IM worksheet beside the crypto-versus-PB comparison table."
    )
    w["bigIdea"] = (
        "Collateral is where market, counterparty, and funding risks meet. Variation margin tracks MTM; "
        "initial margin (often SIMM on uncleared portfolios) buffers the close-out window. "
        "Repo and rehypothecation change who holds the economics when the call arrives."
    )
    lessons = list(w.get("lessons") or [])
    if not any("SIMM" in l.get("title", "") for l in lessons):
        lessons.insert(1, SIMM_LESSON)
    w["lessons"] = lessons
    sessions = list(w.get("sessions") or [])
    if sessions:
        sessions[0] = {
            "h": 2.0,
            "kind": "Study",
            "text": (
                "Repo versus securities loan versus secured loan; haircuts; rehypothecation. Then SIMM/IM versus VM: "
                "sensitivities in, IM out, dispute paths. Build an eight-row crypto-venue versus PB table that includes "
                "an IM/VM row, not only liquidation language."
            ),
        }
        if len(sessions) > 1:
            sessions[1] = {
                "h": 2.5,
                "kind": "Lab",
                "text": (
                    "Finish the 1,000,000 bond repo arithmetic and the comparison table. Add a toy SIMM-like worksheet: "
                    "three sensitivities, weights, absolute weighted sum as IM score, plus one dispute sentence."
                ),
            }
    w["sessions"] = sessions
    criteria = list(w.get("criteria") or [])
    if not any("SIMM" in c or "IM" in c for c in criteria):
        criteria.insert(
            1,
            "Toy sensitivity→IM (SIMM-like) worksheet prints beside the financing table, with one dispute risk named.",
        )
    w["criteria"] = criteria
    lab = dict(w.get("lab") or {})
    steps = list(lab.get("steps") or [])
    steps.append(
        "Build sensitivities = {rate_dv01, fx_delta, equity_delta} with synthetic numbers. "
        "Choose weights, compute toy_im = sum(weight_i * abs(sens_i)). Print VM_vs_IM definitions in two lines. "
        "Print one dispute_risk sentence (taxonomy, sign, or missing class)."
    )
    lab["steps"] = steps
    lab["goal"] = (
        "Complete financing/haircut arithmetic and a toy SIMM-like IM worksheet with a dispute sentence."
    )
    lab["why"] = (
        "Murex and collateral stacks fail when IM/VM and financing language are muddled — make them separate outputs."
    )
    expected = list(lab.get("expected") or [])
    expected.append("Toy IM score, weights, and dispute sentence print clearly.")
    lab["expected"] = expected
    w["lab"] = lab
    lenses = dict(w.get("pathLenses") or {})
    lenses["murex"] = (
        "Centre the week on SIMM/IM versus VM and the sensitivity→call path. "
        "Repo arithmetic supports the funding story; do not let it hide the IM model risk."
    )
    w["pathLenses"] = lenses


def patch_week_23(w: dict) -> None:
    w["title"] = "One book, four shocks, XVA sketch, dominant sleeve"
    lessons = list(w.get("lessons") or [])
    for i, l in enumerate(lessons):
        if l.get("title", "").startswith("Talking to the portfolio manager") and words(l.get("body") or []) < 160:
            lessons[i] = lesson(
                "Talking to the portfolio manager under a joint stress",
                [
                    "A PM does not want your full Monte Carlo log. They want the dominant sleeve, the P&L and margin numbers, the hedge or trim you recommend, and what you need from them in the next hour. Practice a sixty-second version and a five-minute version. Cut jargon that does not change a decision.",
                    "Bring the financing and counterparty call as separate lines so the PM does not hear 'we lost X' when you mean 'we must post Y'. If the tokenised or multi-asset sleeve drives the loss, say what control should have fired first — threshold, margin tier, or hedge band — and whether that control is desk-owned or platform-owned.",
                    "Log the conversation as: decision asked, answer, plan change. That log becomes week-25 portfolio evidence. If you cannot get a live call, write the three questions and your best-guess answers, labelled as rehearsal, including one question about whether the PM accepts your toy CVA sketch as pedagogy only. Keep the tone factual; do not oversell certainty.",
                ],
            )
    if not any("XVA map" in l.get("title", "") for l in lessons):
        lessons.append(XVA_LESSON)
    w["lessons"] = lessons
    w["goal"] = (
        "Shock one synthetic cross-asset book with four moves, report P&L by sleeve and the margin call, "
        "name the dominant sleeve, and attach a five-line toy CVA/XVA sketch that you explicitly refuse to over-claim."
    )
    sessions = list(w.get("sessions") or [])
    if sessions:
        sessions[0] = {
            "h": 2.0,
            "kind": "Study",
            "text": (
                "Assemble the three-sleeve book and four shock channels. Add an XVA map: exposure proxy, flat PD/LGD toy, "
                "one-period CVA sketch, what IM/VM changes, and a will-not-claim line. Reuse Hull only if you need an options refresher."
            ),
        }
    w["sessions"] = sessions
    criteria = list(w.get("criteria") or [])
    if not any("CVA" in c or "XVA" in c for c in criteria):
        criteria.append(
            "Five-line toy CVA/XVA sketch is attached with explicit non-claims (not a desk XVA)."
        )
    w["criteria"] = criteria
    lab = dict(w.get("lab") or {})
    steps = list(lab.get("steps") or [])
    steps.append(
        "After sleeve P&L, print xva_sketch with keys ee_proxy, pd, lgd, cva_toy=(ee_proxy*pd*lgd), im_vm_effect, will_not_claim. "
        "Keep pd/lgd labelled as toy assumptions."
    )
    lab["steps"] = steps
    lab["goal"] = (
        "Joint-stress the book, name the dominant sleeve, and print a toy CVA sketch with non-claims."
    )
    expected = list(lab.get("expected") or [])
    expected.append("Toy CVA/XVA sketch prints with will_not_claim.")
    lab["expected"] = expected
    w["lab"] = lab
    lenses = dict(w.get("pathLenses") or {})
    lenses["murex"] = (
        "Dominant sleeve + toy CVA sketch + IM/VM effect is your Market & Credit Risk SME soundbite. "
        "Keep XVA labelled as pedagogy, not production."
    )
    w["pathLenses"] = lenses


def patch_week_12(w: dict) -> None:
    lenses = dict(w.get("pathLenses") or {})
    lenses["murex"] = (
        "Print both VaRs as numbers you would put next to an FRTB/IMA discussion: method, horizon, confidence, seed, "
        "and one mapping risk (curve, vol, or product taxonomy) that would invalidate the printout."
    )
    w["pathLenses"] = lenses


def patch_week_6(w: dict) -> None:
    paths = list(w.get("paths") or [])
    if "tpm" not in paths:
        paths.append("tpm")
    w["paths"] = paths
    lenses = dict(w.get("pathLenses") or {})
    lenses["tpm"] = (
        "Read the six metrics as adoption and cost-to-serve evidence for the commercial sentence you will write in week 24. "
        "Strike any vanity metric you would be embarrassed to show a buyer."
    )
    w["pathLenses"] = lenses


def patch_paths(plan: dict) -> None:
    for path in plan["paths"]:
        if path["id"] == "murex":
            path["summary"] = (
                "Your strongest existing technical domain. The plan deepens the SME identity with explicit FRTB SA/IMA "
                "and ES/backtest evidence (weeks 12–13, 16), PFE-style exposure beside Monte Carlo (week 15), "
                "SIMM/IM versus VM with financing (week 22), and a toy XVA/CVA sketch on the joint-stress book (week 23) — "
                "plus parameter governance and risk-tech production weeks — without inventing a second vendor certification track."
            )
            path["gaps"] = [
                {"name": "Market risk you compute: VaR, ES, stress", "weeks": [12, 13, 15]},
                {
                    "name": "FRTB SA/IMA, PLA/NMRF, and model-risk pack depth",
                    "weeks": [13, 16],
                },
                {
                    "name": "CCR stack: PFE-style exposure, SIMM/IM, XVA/CVA sketch, collateralised books",
                    "weeks": [15, 22, 23],
                },
                {
                    "name": "Risk technology production: events, SoR/market data, release and RCA",
                    "weeks": [9, 10, 11],
                },
                {
                    "name": "Parameter/config governance and maker-checker (Murex change culture)",
                    "weeks": [7, 8],
                },
                {
                    "name": "Narrative as Murex Market & Credit Risk SME",
                    "weeks": [25, 26],
                },
            ]
        if path["id"] == "tpm":
            path["gaps"] = [
                {"name": "User versus economic buyer", "weeks": [24]},
                {
                    "name": "Adoption and cost metrics (not vanity launches)",
                    "weeks": [6, 24],
                },
                {
                    "name": "Portfolio narrative that can mention a shipped commercial sentence",
                    "weeks": [26],
                },
            ]
        if path["id"] == "quant":
            # ensure week 13 FRTB-aware ES is reflected
            for g in path["gaps"]:
                if "VaR" in g["name"] or "expected shortfall" in g["name"].lower():
                    g["name"] = "VaR, expected shortfall, and FRTB-aware backtest evidence"
                    g["weeks"] = [12, 13]


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
    patch_week_6(by[6])
    patch_week_12(by[12])
    patch_week_13(by[13])
    patch_week_15(by[15])
    patch_week_16(by[16])
    patch_week_22(by[22])
    patch_week_23(by[23])
    patch_paths(plan)
    plan_path.write_text(json.dumps(plan, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    sync_courseware_files(plan)

    # validation
    murex_weeks = sorted({n for w in plan["weeks"] for n in [w["n"]] if "murex" in w.get("paths", [])})
    blob = json.dumps(plan)
    for term in ("FRTB", "SIMM", "PFE", "XVA", "CVA"):
        assert term in blob, term
    assert "tpm" in by[6]["paths"]
    print("patched weeks", sorted([6, 12, 13, 15, 16, 22, 23]))
    print("murex tagged weeks", murex_weeks)
    print(
        "titles",
        {n: by[n]["title"] for n in (13, 15, 16, 22, 23)},
    )
    print("bytes", plan_path.stat().st_size)


if __name__ == "__main__":
    main()

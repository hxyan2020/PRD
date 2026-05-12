#!/usr/bin/env python3
"""
Automation: Stress testing / what-if scenario engine (simplified)
PRD section: (iii) Stress testing

Action owners:
  - RO/PM: run scenarios (ad-hoc) or select catalog templates
  - DA: model assumptions (correlations, depeg paths, shock horizons)
  - SYS: executes scenario deterministically, persists StressResult
  - ENG: performance, data access, versioning

Data routed:
  - PositionSnapshot + ScenarioDef -> StressResult (per strategy/desk/company)

Manual validation:
  - Catalog / correlation matrix changes: RO + DA sign-off (workflow outside this script)
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Mapping, Sequence


@dataclass(frozen=True)
class ScenarioDef:
    scenario_id: str
    description: str
    spot_shocks: Mapping[str, float]  # asset -> multiplicative return, e.g. ETH: -0.30
    stable_depeg: Mapping[str, float] | None = None  # e.g. USDX: 0.92 means mark at 0.92 USD


@dataclass
class StressResult:
    scenario_id: str
    strategy_id: str
    pre_equity: float
    post_equity: float
    liquidation_proximity: float  # 0..1 illustrative
    margin_shortfall: float
    diagnostics: dict[str, Any]


def apply_spot_shock_to_equity(
    positions: Sequence[Mapping[str, Any]],
    marks: Mapping[str, float],
    shocks: Mapping[str, float],
) -> tuple[float, float, dict[str, Any]]:
    """
    SYS: naive mark-to-market shock — extend with collateral haircuts, perps margin, options greeks.
    """
    pre = sum(float(p["qty"]) * float(marks[str(p["asset"])]) for p in positions)
    post_marks = {k: v * (1.0 + shocks.get(k, 0.0)) for k, v in marks.items()}
    post = sum(float(p["qty"]) * float(post_marks[str(p["asset"])]) for p in positions)
    diag = {"pre_equity": pre, "post_equity": post, "shocked_marks": post_marks}
    return pre, post, diag


def stablecoin_depeg_adjustment(post_equity: float, depeg: Mapping[str, float] | None) -> float:
    """Illustrative: apply haircut to stable collateral notionally embedded in equity."""
    if not depeg:
        return post_equity
    haircut = 0.0
    for _, px in depeg.items():
        haircut += max(0.0, 1.0 - float(px)) * 0.25  # 25% of depeg loss as equity drag — DA-defined
    return post_equity * (1.0 - min(haircut, 0.5))


def run_scenario(
    scenario: ScenarioDef,
    *,
    strategy_id: str,
    positions: Sequence[Mapping[str, Any]],
    marks: Mapping[str, float],
    liq_buffer_pre: float = 0.35,
) -> StressResult:
    pre, post, diag = apply_spot_shock_to_equity(positions, marks, scenario.spot_shocks)
    post = stablecoin_depeg_adjustment(post, scenario.stable_depeg)
    liq_prox = max(0.0, min(1.0, 1.0 - (post / pre) * liq_buffer_pre)) if pre else 1.0
    shortfall = max(0.0, pre * 0.2 - post)  # illustrative maintenance margin gap
    return StressResult(
        scenario_id=scenario.scenario_id,
        strategy_id=strategy_id,
        pre_equity=pre,
        post_equity=post,
        liquidation_proximity=liq_prox,
        margin_shortfall=shortfall,
        diagnostics={**diag, "stable_depeg": scenario.stable_depeg or {}, "run_at": datetime.now(timezone.utc).isoformat()},
    )


def run_demo() -> None:
    scen = ScenarioDef(
        scenario_id="ETH_DOWN_30PCT_2H",
        description="ETH -30% instantaneous shock with stable depeg overlay",
        spot_shocks={"ETH": -0.30},
        stable_depeg={"USDX": 0.92},
    )
    positions = [{"asset": "ETH", "qty": 50.0}, {"asset": "BTC", "qty": 1.0}]
    marks = {"ETH": 3000.0, "BTC": 100000.0}
    res = run_scenario(scen, strategy_id="strat-alpha", positions=positions, marks=marks)
    print(json.dumps(res.__dict__, indent=2, default=str))


if __name__ == "__main__":
    run_demo()

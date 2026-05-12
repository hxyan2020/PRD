#!/usr/bin/env python3
"""
Automation: Real-time risk metrics evaluation + alert routing
PRD section: (i) Risk metrics monitoring

Action owners:
  - ENG: ingestion adapters (MarketTick, PositionSnapshot) — not implemented here
  - SYS: this module (metric computation stubs, rule engine, AlertEvent emission)
  - RO: configures thresholds (loaded from config service in production)
  - TR / RO: consume alerts via separate notification service

Data routed (outputs are JSON-serializable dicts for demo):
  - MarketTick / PositionSnapshot -> StrategyRiskState -> DeskRiskState -> CompanyRiskState
  - Comparison vs ThresholdRule -> AlertEvent[]

Manual validation:
  - None for rule evaluation; humans ACK in UI downstream.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Iterable, Mapping, Sequence


class AlertSeverity(str, Enum):
    WARN = "WARN"
    BREACH = "BREACH"


class MetricName(str, Enum):
    EQUITY = "equity"
    PNL = "pnl"
    MAX_DRAWDOWN = "max_drawdown"
    VAR = "var_95"
    WIN_RATE = "win_rate"
    HHI = "hhi_concentration"
    CORR_BENCH = "corr_btc"  # example benchmark


@dataclass(frozen=True)
class ThresholdRule:
    """Owned by RO in production; versioned and audited."""

    rule_id: str
    metric: MetricName
    warn_level: float
    breach_level: float
    comparator: str  # "gte" | "lte" — e.g. drawdown uses gte (more negative is worse)


@dataclass
class AlertEvent:
    rule_id: str
    severity: AlertSeverity
    observed: float
    threshold: float
    strategy_id: str
    inputs_hash: str
    ts_utc: str
    routed_to: tuple[str, ...] = ("TR", "RO_BACKEND")


def _hash_payload(payload: Mapping[str, Any]) -> str:
    canonical = json.dumps(payload, sort_keys=True, default=str).encode()
    return hashlib.sha256(canonical).hexdigest()[:16]


def compute_strategy_risk_state(
    positions: Sequence[Mapping[str, Any]],
    marks: Mapping[str, float],
    *,
    strategy_id: str,
) -> dict[str, Any]:
    """
    SYS: Derive strategy-level metrics. Replace with full VaR engine, correlation, etc.

    Data in:
      positions: list of {asset, qty, venue, ...}
      marks: asset -> price
    Data out:
      StrategyRiskState snapshot (subset for demo)
    """
    equity = 0.0
    for p in positions:
        px = marks.get(str(p["asset"]), 0.0)
        equity += float(p["qty"]) * px

    # Placeholders — DA defines production formulas
    state = {
        "strategy_id": strategy_id,
        "equity": equity,
        "pnl": 0.0,  # requires cost basis ledger
        "max_drawdown": -0.08,
        "var_95": equity * 0.03,
        "win_rate": 0.56,
        "hhi_concentration": 0.22,
        "corr_btc": 0.41,
    }
    state["_inputs_hash"] = _hash_payload({"positions": list(positions), "marks": marks})
    return state


def rollup_desk_company(
    strategy_states: Iterable[Mapping[str, Any]],
) -> tuple[dict[str, Any], dict[str, Any]]:
    """
    SYS: Deterministic aggregation for desk / company. Production: tree by org hierarchy.
    """
    strategies = list(strategy_states)
    desk = {
        "level": "desk",
        "equity": sum(float(s["equity"]) for s in strategies),
        "var_95": sum(float(s["var_95"]) for s in strategies),
        "max_drawdown": min(float(s["max_drawdown"]) for s in strategies),
    }
    company = {
        "level": "company",
        "equity": desk["equity"],
        "var_95": desk["var_95"],
        "max_drawdown": desk["max_drawdown"],
    }
    return desk, company


def evaluate_rules(
    strategy_state: Mapping[str, Any],
    rules: Sequence[ThresholdRule],
) -> list[AlertEvent]:
    """
    SYS: Evaluate WARN/BREACH; emit AlertEvent for routing layer.
    """
    alerts: list[AlertEvent] = []
    base_hash = str(strategy_state.get("_inputs_hash", ""))

    def cmp_fn(op: str, obs: float, level: float) -> bool:
        if op == "gte":
            return obs >= level
        if op == "lte":
            return obs <= level
        raise ValueError(f"Unsupported comparator {op}")

    for rule in rules:
        obs = float(strategy_state[rule.metric.value])
        sev: AlertSeverity | None = None
        thr: float | None = None
        if cmp_fn(rule.comparator, obs, rule.breach_level):
            sev = AlertSeverity.BREACH
            thr = rule.breach_level
        elif cmp_fn(rule.comparator, obs, rule.warn_level):
            sev = AlertSeverity.WARN
            thr = rule.warn_level

        if sev:
            payload = {"metric": rule.metric.value, "observed": obs, "threshold": thr, "h": base_hash}
            alerts.append(
                AlertEvent(
                    rule_id=rule.rule_id,
                    severity=sev,
                    observed=obs,
                    threshold=float(thr),
                    strategy_id=str(strategy_state["strategy_id"]),
                    inputs_hash=_hash_payload(payload),
                    ts_utc=datetime.now(timezone.utc).isoformat(),
                )
            )
    return alerts


def route_alerts(events: Sequence[AlertEvent]) -> list[dict[str, Any]]:
    """
    SYS -> notification bus: fan-out to TR + RO backend queue (+ optional ENG webhook).
    """
    return [
        {
            "channel": "TR_INAPP",
            "payload": e.__dict__,
        }
        for e in events
    ] + [
        {
            "channel": "RO_QUEUE",
            "payload": e.__dict__,
        }
        for e in events
    ]


@dataclass
class DemoConfig:
    rules: list[ThresholdRule] = field(
        default_factory=lambda: [
            ThresholdRule("r-dd", MetricName.MAX_DRAWDOWN, -0.07, -0.10, "lte"),
            ThresholdRule("r-var", MetricName.VAR, 1_000_000, 2_000_000, "gte"),
        ]
    )


def run_demo() -> None:
    marks = {"ETH": 3200.0, "BTC": 98000.0}
    positions = [{"asset": "ETH", "qty": 100.0, "venue": "X"}, {"asset": "BTC", "qty": 2.0, "venue": "X"}]
    st = compute_strategy_risk_state(positions, marks, strategy_id="strat-alpha")
    desk, co = rollup_desk_company([st])
    alerts = evaluate_rules(st, DemoConfig().rules)
    routes = route_alerts(alerts)
    print(json.dumps({"strategy": st, "desk": desk, "company": co, "routes": routes}, indent=2, default=str))


if __name__ == "__main__":
    run_demo()

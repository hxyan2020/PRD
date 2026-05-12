#!/usr/bin/env python3
"""
Automation: Scheduled risk report generation + CSV export + guardrail evaluation hook
PRD section: (v) Risk reporting & guardrails

Action owners:
  - SYS: cron by cutoff UTC, assembles RiskReport from snapshots
  - RO/PM: configure report templates & distribution lists
  - CP: retention / access policy
  - TR/RO: receive real-time guardrail alerts (delegates to risk_metrics_monitor.evaluate_rules)

Data routed:
  - StrategyRiskState / rollups / breaches / stress summaries -> RiskReport artifact + CSV path

Manual validation:
  - Material restatements investigated by DA + RO (workflow not shown)
"""

from __future__ import annotations

import csv
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Mapping, Sequence


@dataclass
class RiskReport:
    report_id: str
    as_of_utc: str
    sections: dict[str, Any]


def build_daily_report(
    *,
    strategy_snapshots: Sequence[Mapping[str, Any]],
    desk_snapshot: Mapping[str, Any],
    company_snapshot: Mapping[str, Any],
    open_alerts: Sequence[Mapping[str, Any]],
) -> RiskReport:
    """
    SYS: compose leadership pack — extend with charts, attribution summary, stress highlights.
    """
    rid = f"RR-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M')}"
    return RiskReport(
        report_id=rid,
        as_of_utc=datetime.now(timezone.utc).isoformat(),
        sections={
            "strategy_table": list(strategy_snapshots),
            "desk": dict(desk_snapshot),
            "company": dict(company_snapshot),
            "open_alerts": list(open_alerts),
        },
    )


def export_csv(report: RiskReport, out_path: Path) -> Path:
    """SYS: tabular export for PM/RO analysis."""
    rows = report.sections.get("strategy_table", [])
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        out_path.write_text("", encoding="utf-8")
        return out_path
    fieldnames = sorted({k for r in rows for k in r.keys()})
    with out_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in fieldnames})
    return out_path


def should_run_for_cutoff(now_utc: datetime, cutoff_hour_utc: int = 22, cutoff_minute: int = 0) -> bool:
    """Scheduler predicate — production uses job queue + TZ per fund."""
    return (now_utc.hour, now_utc.minute) == (cutoff_hour_utc, cutoff_minute)


def run_demo() -> None:
    snaps = [
        {"strategy_id": "s1", "equity": 1e7, "var_95": 2e5, "max_drawdown": -0.05},
        {"strategy_id": "s2", "equity": 5e6, "var_95": 9e4, "max_drawdown": -0.04},
    ]
    desk = {"equity": 1.5e7, "var_95": 2.9e5}
    company = {"equity": 1.5e7, "var_95": 2.9e5}
    alerts: list[dict[str, Any]] = []
    rep = build_daily_report(strategy_snapshots=snaps, desk_snapshot=desk, company_snapshot=company, open_alerts=alerts)
    csv_path = export_csv(rep, Path(__file__).resolve().parent / "_demo_daily_risk_report.csv")
    print(json.dumps({**rep.__dict__, "csv_path": str(csv_path)}, indent=2, default=str))


if __name__ == "__main__":
    run_demo()

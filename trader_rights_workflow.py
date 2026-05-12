#!/usr/bin/env python3
"""
Automation: Trader buying power / leverage request — eligibility packet + approval state
PRD section: (ii) Trader rights management

Action owners:
  - TR: submits LeverageRequest
  - SYS: enriches, computes eligibility, enforces segregation (TR cannot approve self)
  - RO: manual approve / reject
  - RO2 or PM: checker when Tier A+ materiality (maker–checker)
  - CP: policy defines materiality tiers (constants below are placeholders)
  - ENG: persists records, pushes limit changes to brokers

Data routed:
  - LeverageRequest -> EligibilityPacket -> ApprovalRecord -> (optional) limit update job

Manual validation:
  - RO decision required; second approval for Tier A+
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Mapping


class RequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    PENDING_CHECKER = "PENDING_CHECKER"


@dataclass
class LeverageRequest:
    request_id: str
    trader_id: str
    strategy_id: str
    requested_notional: float
    rationale: str


@dataclass
class EligibilityPacket:
    request_id: str
    pass_fail: bool
    reasons: list[str]
    metrics: dict[str, Any]
    generated_at_utc: str


@dataclass
class ApprovalRecord:
    request_id: str
    actor_role: str
    actor_id: str
    decision: str
    comment: str
    ts_utc: str


def build_eligibility_packet(
    req: LeverageRequest,
    strategy_performance: Mapping[str, Any],
    risk_snapshot: Mapping[str, Any],
    compliance_flags: Mapping[str, Any],
) -> EligibilityPacket:
    """
    SYS: Auto-calc against RO/CP-published criteria (illustrative thresholds).
    Data in:
      strategy_performance: e.g. sharpe_90d, max_dd, win_rate
      risk_snapshot: var_utilization, concentration flags
      compliance_flags: holds, surveillance outcomes
    """
    reasons: list[str] = []
    ok = True

    if float(strategy_performance.get("sharpe_90d", 0)) < 1.0:
        ok = False
        reasons.append("Sharpe 90d below floor")

    if float(strategy_performance.get("max_drawdown", 0)) < -0.12:
        ok = False
        reasons.append("Max drawdown beyond tolerance")

    if float(risk_snapshot.get("var_utilization_pct", 0)) > 0.85:
        ok = False
        reasons.append("VaR utilization too high")

    if compliance_flags.get("hard_hold"):
        ok = False
        reasons.append("Compliance hard hold present")

    return EligibilityPacket(
        request_id=req.request_id,
        pass_fail=ok,
        reasons=reasons,
        metrics={
            "strategy_performance": dict(strategy_performance),
            "risk_snapshot": dict(risk_snapshot),
            "compliance_flags": dict(compliance_flags),
        },
        generated_at_utc=datetime.now(timezone.utc).isoformat(),
    )


def is_tier_a_plus(requested_notional: float, tier_threshold: float = 5_000_000.0) -> bool:
    """CP/RO configure tier thresholds in production."""
    return requested_notional >= tier_threshold


def apply_maker_decision(
    req: LeverageRequest,
    packet: EligibilityPacket,
    ro_actor_id: str,
    approve: bool,
    comment: str,
) -> tuple[RequestStatus, list[ApprovalRecord]]:
    """
    RO maker step. SYS records ApprovalRecord; does not allow trader self-approval.
    """
    if ro_actor_id == req.trader_id:
        raise PermissionError("Segregation of duties: trader cannot approve own request")

    records: list[ApprovalRecord] = []
    if not approve:
        records.append(
            ApprovalRecord(
                request_id=req.request_id,
                actor_role="RO",
                actor_id=ro_actor_id,
                decision="REJECT",
                comment=comment,
                ts_utc=datetime.now(timezone.utc).isoformat(),
            )
        )
        return RequestStatus.REJECTED, records

    if is_tier_a_plus(req.requested_notional):
        records.append(
            ApprovalRecord(
                request_id=req.request_id,
                actor_role="RO",
                actor_id=ro_actor_id,
                decision="APPROVE_PENDING_CHECKER",
                comment=comment,
                ts_utc=datetime.now(timezone.utc).isoformat(),
            )
        )
        return RequestStatus.PENDING_CHECKER, records

    records.append(
        ApprovalRecord(
            request_id=req.request_id,
            actor_role="RO",
            actor_id=ro_actor_id,
            decision="APPROVE",
            comment=comment,
            ts_utc=datetime.now(timezone.utc).isoformat(),
        )
    )
    return RequestStatus.APPROVED, records


def apply_checker_decision(
    req: LeverageRequest,
    checker_id: str,
    maker_id: str,
    approve: bool,
    comment: str,
) -> tuple[RequestStatus, ApprovalRecord]:
    if checker_id == maker_id:
        raise ValueError("Checker must differ from maker (four-eyes)")
    rec = ApprovalRecord(
        request_id=req.request_id,
        actor_role="RO2_OR_PM",
        actor_id=checker_id,
        decision="APPROVE" if approve else "REJECT",
        comment=comment,
        ts_utc=datetime.now(timezone.utc).isoformat(),
    )
    return (RequestStatus.APPROVED if approve else RequestStatus.REJECTED, rec)


def enqueue_limit_update_job(request_id: str, new_limit: float) -> dict[str, Any]:
    """ENG: pushes to broker/OMS adapters — stub payload only."""
    return {"job": "LIMIT_UPDATE", "request_id": request_id, "new_limit": new_limit, "queued_at": datetime.now(timezone.utc).isoformat()}


def run_demo() -> None:
    req = LeverageRequest("LR-1", "trader-42", "strat-alpha", 6_000_000.0, "Scale basis trade")
    packet = build_eligibility_packet(
        req,
        strategy_performance={"sharpe_90d": 1.4, "max_drawdown": -0.06, "win_rate": 0.55},
        risk_snapshot={"var_utilization_pct": 0.62},
        compliance_flags={"hard_hold": False},
    )
    status, recs = apply_maker_decision(req, packet, ro_actor_id="ro-7", approve=True, comment="Within risk appetite")
    print(json.dumps({"packet": packet.__dict__, "status": status.value, "records": [r.__dict__ for r in recs]}, indent=2, default=str))
    if status == RequestStatus.PENDING_CHECKER:
        st2, r2 = apply_checker_decision(req, checker_id="pm-1", maker_id="ro-7", approve=True, comment="Checker OK")
        print(json.dumps({"final_status": st2.value, "checker": r2.__dict__, "limit_job": enqueue_limit_update_job(req.request_id, req.requested_notional)}, indent=2))


if __name__ == "__main__":
    run_demo()

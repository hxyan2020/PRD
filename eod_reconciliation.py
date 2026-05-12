#!/usr/bin/env python3
"""
Automation: EOD reconciliation — match internal confirms vs broker EOD, flag exceptions
PRD section: (vi) Automated reconciliation

Action owners:
  - ENG/SYS: pull APIs, normalize, match engine
  - CO: investigate mismatches, re-pull, broker tickets, approve batch
  - CO2/RO: checker on material notional delta (maker–checker)
  - TS: settlement after SettlementReady event
  - CP: retention / evidence

Data routed:
  - InternalTradeConfirm[], BrokerEODLine[] -> ReconLine[] -> (on approve) SettlementReady

Manual validation:
  - All approvals human (CO maker, optional CO2/RO checker); TS executes wires manually
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date, datetime, timezone
from enum import Enum
from typing import Any, Mapping, Sequence


class MatchStatus(str, Enum):
    MATCHED = "MATCHED"
    QUANTITY_MISMATCH = "QUANTITY_MISMATCH"
    MISSING_INTERNAL = "MISSING_INTERNAL"
    MISSING_BROKER = "MISSING_BROKER"
    PRICE_MISMATCH = "PRICE_MISMATCH"


@dataclass
class ReconLine:
    recon_run_id: str
    venue: str
    account_id: str
    instrument: str
    internal_qty: float | None
    broker_qty: float | None
    internal_price: float | None
    broker_price: float | None
    match_status: MatchStatus
    delta_qty: float
    exception_owner: str | None
    resolution_action: str | None


def normalize_key(row: Mapping[str, Any]) -> tuple[str, str, str]:
    return (str(row["venue"]), str(row["account_id"]), str(row["instrument"]))


def match_engine(
    recon_run_id: str,
    internal: Sequence[Mapping[str, Any]],
    broker: Sequence[Mapping[str, Any]],
    qty_tol: float = 1e-6,
    price_tol: float = 1e-4,
) -> list[ReconLine]:
    """
    SYS: deterministic match on trade keys — production adds partial fills, fees, reference ids.
    """
    int_map = {normalize_key(r): r for r in internal}
    brk_map = {normalize_key(r): r for r in broker}
    keys = sorted(set(int_map.keys()) | set(brk_map.keys()))
    lines: list[ReconLine] = []

    for k in keys:
        i_row, b_row = int_map.get(k), brk_map.get(k)
        if i_row and not b_row:
            status = MatchStatus.MISSING_BROKER
            iq, bq = float(i_row["quantity"]), None
            ip, bp = float(i_row.get("price", 0.0)), None
        elif b_row and not i_row:
            status = MatchStatus.MISSING_INTERNAL
            iq, bq = None, float(b_row["quantity"])
            ip, bp = None, float(b_row.get("price", 0.0))
        else:
            assert i_row and b_row
            iq, bq = float(i_row["quantity"]), float(b_row["quantity"])
            ip, bp = float(i_row.get("price", 0.0)), float(b_row.get("price", 0.0))
            dq = iq - bq
            dp = abs(ip - bp)
            if abs(dq) > qty_tol:
                status = MatchStatus.QUANTITY_MISMATCH
            elif dp > price_tol:
                status = MatchStatus.PRICE_MISMATCH
            else:
                status = MatchStatus.MATCHED
        dq = (iq or 0.0) - (bq or 0.0)
        lines.append(
            ReconLine(
                recon_run_id=recon_run_id,
                venue=k[0],
                account_id=k[1],
                instrument=k[2],
                internal_qty=iq,
                broker_qty=bq,
                internal_price=ip if i_row else None,
                broker_price=bp if b_row else None,
                match_status=status,
                delta_qty=dq,
                exception_owner="CO_QUEUE" if status != MatchStatus.MATCHED else None,
                resolution_action=None,
            )
        )
    return lines


def has_open_s1(lines: Sequence[ReconLine]) -> bool:
    """Illustrative severity: any non-MATCHED is S1 for demo."""
    return any(l.match_status != MatchStatus.MATCHED for l in lines)


def approve_recon_batch(
    lines: Sequence[ReconLine],
    *,
    maker_id: str,
    checker_id: str | None,
    gross_notional_delta: float,
    tier_a_threshold: float = 1_000_000.0,
) -> dict[str, Any]:
    """
    CO maker + optional checker; emits SettlementReady for treasury if successful.
    """
    if has_open_s1(lines):
        raise ValueError("Cannot approve with open S1 mismatches")

    need_checker = gross_notional_delta >= tier_a_threshold
    approvals = [{"role": "CO_MAKER", "id": maker_id, "ts": datetime.now(timezone.utc).isoformat()}]
    if need_checker:
        if not checker_id:
            raise ValueError("Checker required for Tier A materiality")
        approvals.append({"role": "CO2_OR_RO_CHECKER", "id": checker_id, "ts": datetime.now(timezone.utc).isoformat()})

    return {
        "event": "SettlementReady",
        "recon_run_id": lines[0].recon_run_id if lines else None,
        "approvals": approvals,
        "notify": ["TS_TREASURY_QUEUE"],
    }


def run_demo() -> None:
    run_id = f"RECON-{date.today().isoformat()}"
    internal = [
        {"venue": "BINANCE", "account_id": "A1", "instrument": "ETH-PERP", "quantity": 100.0, "price": 3000.0},
        {"venue": "BINANCE", "account_id": "A1", "instrument": "BTC-PERP", "quantity": 2.0, "price": 100000.0},
    ]
    broker = [
        {"venue": "BINANCE", "account_id": "A1", "instrument": "ETH-PERP", "quantity": 100.0, "price": 3000.0001},
        {"venue": "BINANCE", "account_id": "A1", "instrument": "BTC-PERP", "quantity": 1.9, "price": 100000.0},
    ]
    lines = match_engine(run_id, internal, broker)
    print(json.dumps([l.__dict__ | {"match_status": l.match_status.value} for l in lines], indent=2))
    try:
        approve_recon_batch(lines, maker_id="co-1", checker_id=None, gross_notional_delta=50_000.0)
    except ValueError as e:
        print("Approve blocked:", e)


if __name__ == "__main__":
    run_demo()

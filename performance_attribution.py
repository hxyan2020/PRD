#!/usr/bin/env python3
"""
Automation: Performance attribution — alpha vs beta (OLS on factor returns)
PRD section: (iv) Performance attribution

Action owners:
  - DA: factor set, return alignment, model versioning
  - SYS: runs regression, stores AttributionRun
  - PM: consumes summaries; CP if externally reported

Data routed:
  - strategy_returns[], factor_matrix[][] -> coefficients, alpha, R²

Manual validation:
  - Model / factor changes require DA governance; optional CP review for external use
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Sequence


def _ols_y_on_x(y: Sequence[float], x_rows: Sequence[Sequence[float]]) -> tuple[float, list[float], float]:
    """
    Minimal OLS with intercept: y ~ 1 + X
    Returns (alpha, betas, r_squared) — for production use statsmodels / sklearn with robust SE.
    """
    n = len(y)
    k = len(x_rows[0]) if x_rows else 0
    if n != len(x_rows) or n < k + 2:
        raise ValueError("Insufficient history for attribution")

    # Build design matrix [1, X]
    import statistics

    y_mean = statistics.fmean(y)
    # naive single-factor fast path for demo
    if k == 1:
        x = [row[0] for row in x_rows]
        x_mean = statistics.fmean(x)
        cov = sum((yi - y_mean) * (xi - x_mean) for yi, xi in zip(y, x, strict=True))
        var_x = sum((xi - x_mean) ** 2 for xi in x)
        beta = cov / var_x if var_x else 0.0
        alpha = y_mean - beta * x_mean
        y_hat = [alpha + beta * xi for xi in x]
        ss_res = sum((yi - yh) ** 2 for yi, yh in zip(y, y_hat, strict=True))
        ss_tot = sum((yi - y_mean) ** 2 for yi in y)
        r2 = 1.0 - ss_res / ss_tot if ss_tot else 0.0
        return alpha, [beta], r2

    raise NotImplementedError("Multi-factor attribution — extend design matrix")


@dataclass
class AttributionRun:
    model_version: str
    strategy_id: str
    alpha: float
    betas: dict[str, float]
    r_squared: float
    residual_risk: float
    window: int
    run_at_utc: str


def run_attribution(
    strategy_id: str,
    strategy_returns: Sequence[float],
    factor_returns: dict[str, Sequence[float]],
    *,
    model_version: str = "mkt-btc-v1",
) -> AttributionRun:
    factor_name, series = next(iter(factor_returns.items()))
    alpha, betas, r2 = _ols_y_on_x(strategy_returns, [[v] for v in series])
    residuals = [sr - (alpha + b * fr) for sr, fr, b in zip(strategy_returns, series, [betas[0]] * len(series), strict=True)]
    resid_risk = (sum(r * r for r in residuals) / max(len(residuals) - 2, 1)) ** 0.5
    return AttributionRun(
        model_version=model_version,
        strategy_id=strategy_id,
        alpha=alpha,
        betas={factor_name: betas[0]},
        r_squared=r2,
        residual_risk=resid_risk,
        window=len(strategy_returns),
        run_at_utc=datetime.now(timezone.utc).isoformat(),
    )


def run_demo() -> None:
    y = [0.01, -0.004, 0.012, 0.008, -0.002, 0.015]
    f = {"BTC": [0.008, -0.003, 0.010, 0.006, -0.001, 0.009]}
    out = run_attribution("strat-alpha", y, f)
    print(json.dumps(out.__dict__, indent=2))


if __name__ == "__main__":
    run_demo()

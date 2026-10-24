# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Web3 buy-side risk management prototype — 6 standalone Python modules, zero third-party dependencies, pure stdlib. No database, no web server, no containers.

### Modules

| File | Purpose |
|---|---|
| `risk_metrics_monitor.py` | Real-time risk metrics (VaR, drawdown, HHI) + alert rule engine |
| `trader_rights_workflow.py` | Trader leverage/buying-power request with maker-checker approval |
| `stress_testing.py` | What-if scenario engine (spot shocks, stablecoin depeg) |
| `performance_attribution.py` | Alpha vs beta OLS regression (single-factor) |
| `risk_reporting.py` | Scheduled risk report + CSV export |
| `eod_reconciliation.py` | EOD reconciliation: internal vs broker, exception clearing |

### Running

Each module is self-contained with a `run_demo()` / `if __name__ == "__main__"` entry point:

```
python3 <module>.py
```

No services, environment variables, or config files are needed.

### Lint

```
ruff check .
```

Pre-existing: 2 E741 warnings in `eod_reconciliation.py` (ambiguous variable name `l`). These are in the original code.

### Tests

No test suite exists yet. `pytest` is available for future use. Each module's `run_demo()` function serves as a smoke test.

### Notes

- `risk_reporting.py` writes a `_demo_daily_risk_report.csv` file to the working directory when its demo runs. Clean up if needed.
- Python 3.10+ required (uses `X | Y` union syntax and `match` patterns). Python 3.12 is installed.
- All data is in-memory; no persistence layer exists.

# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a collection of standalone Python 3.12+ scripts implementing crypto hedge fund risk management and operations automation. There are **no external dependencies** — all scripts use only Python standard library modules. There is no web server, database, or containerized service.

### Scripts

| Script | Domain |
|---|---|
| `risk_metrics_monitor.py` | Real-time risk metrics + alert routing |
| `trader_rights_workflow.py` | Trader leverage/buying-power request workflow |
| `stress_testing.py` | What-if stress scenario engine |
| `performance_attribution.py` | OLS performance attribution (alpha vs beta) |
| `risk_reporting.py` | Daily risk report generation + CSV export |
| `eod_reconciliation.py` | EOD trade reconciliation matching |

### Running

Each script is self-contained with a `run_demo()` function. Run any script directly:

```bash
python3 <script_name>.py
```

Note: `risk_reporting.py` creates a `_demo_daily_risk_report.csv` file in the workspace root when run — clean it up after testing.

### Linting

- **ruff**: `ruff check *.py` — fast Python linter (installed via update script)
- **mypy**: `mypy --ignore-missing-imports *.py` — type checker (installed via update script)

Both tools are installed to `~/.local/bin`; ensure `PATH` includes that directory (it should be set automatically in most shells).

### Known lint findings (pre-existing, not bugs)

- `ruff`: E741 ambiguous variable name `l` in `eod_reconciliation.py`
- `mypy`: minor type annotation variance issues in `risk_metrics_monitor.py` and `performance_attribution.py`

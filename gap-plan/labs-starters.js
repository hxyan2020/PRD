// Auto-generated lab starters for the live IDE. Edit carefully.
window.SixHoursLabStarters = {
  1: `
# Week 1 lab — Black–Scholes call + Greeks (two CDF paths)
import math

S, K, r, sigma, T = 100.0, 100.0, 0.02, 0.20, 0.5

def N_erf(x):
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))

def n_pdf(x):
    return math.exp(-0.5 * x * x) / math.sqrt(2.0 * math.pi)

def bs_call(N):
    d1 = (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    price = S * N(d1) - K * math.exp(-r * T) * N(d2)
    delta = N(d1)
    gamma = n_pdf(d1) / (S * sigma * math.sqrt(T))
    vega = S * n_pdf(d1) * math.sqrt(T)  # per 1.0 in sigma
    theta = (-S * n_pdf(d1) * sigma / (2 * math.sqrt(T))
             - r * K * math.exp(-r * T) * N(d2))  # per year
    return d1, d2, price, delta, gamma, vega, theta

# Second CDF: try scipy; fall back to a fine Abramowitz-style approx so the lab still runs.
try:
    from scipy.stats import norm
    def N_alt(x):
        return float(norm.cdf(x))
    alt_name = "scipy.norm.cdf"
except Exception:
    def N_alt(x):
        # Hart approximation via math.erf is already used; use a slightly different path
        return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0) * (1 + 1e-15)))
    alt_name = "erf-twin (install scipy in a full Python env for the real dual check)"

a = bs_call(N_erf)
b = bs_call(N_alt)
labels = ["d1", "d2", "price", "delta", "gamma", "vega", "theta"]
print("Method A: math.erf CDF")
for lab, val in zip(labels, a):
    print(f"  {lab:6s} = {val:.10f}")
print(f"Method B: {alt_name}")
for lab, val in zip(labels, b):
    print(f"  {lab:6s} = {val:.10f}")
print("Abs diffs:")
for lab, x, y in zip(labels, a, b):
    print(f"  {lab:6s} |Δ| = {abs(x-y):.3e}")
atm_approx = 0.4 * S * sigma * math.sqrt(T)
print(f"ATM approx 0.4*S*sigma*sqrt(T) = {atm_approx:.6f}  (price≈{a[2]:.6f})")
print("Units: vega = dPrice/dSigma (sigma in absolute units); theta = dPrice/dT per year.")
`,
  2: `
# Week 2 lab — realized vol vs RiskMetrics EWMA (λ=0.94)
import math, random

random.seed(2)
# Synthetic geometric path so the lab runs offline; swap for real closes if you have them.
n_closes = 61
prices = [100.0]
for _ in range(n_closes - 1):
    prices.append(prices[-1] * math.exp(random.gauss(0.0002, 0.012)))

returns = [math.log(prices[i] / prices[i - 1]) for i in range(1, len(prices))]
assert len(returns) == 60

def sample_var(xs, ddof=1):
    m = sum(xs) / len(xs)
    return sum((x - m) ** 2 for x in xs) / (len(xs) - ddof)

lam = 0.94
# Initialize EWMA variance from first 20 returns
var0 = sample_var(returns[:20])
ewma_var = var0
print(f"{'t':>3}  {'realized_ann':>14}  {'ewma_ann':>12}")
for t in range(19, 60):  # 0-based index; window returns[t-19:t+1]
    window = returns[t - 19 : t + 1]
    realized = math.sqrt(sample_var(window) * 252)
    if t == 19:
        ewma_var = sample_var(window)
    else:
        ewma_var = lam * ewma_var + (1 - lam) * returns[t] ** 2
    ewma_ann = math.sqrt(ewma_var * 252)
    if t % 5 == 4 or t == 59:
        print(f"{t+1:3d}  {realized:14.6f}  {ewma_ann:12.6f}")
print("ddof=1 for realized. Annualization: sqrt(252). λ=0.94.")
`,
  3: `
# Week 3 lab — margin ratio, buffer, liquidation move
E, N, m = 100.0, 500.0, 0.02
maintenance = m * N
margin_ratio = E / N
buffer = E - maintenance
liq_move = buffer / N
print("Isolated-style")
print(f"  maintenance={maintenance:.4f}  margin_ratio={margin_ratio:.4%}  buffer={buffer:.4f}  liq_move≈{liq_move:.4%}")

A_cash, B_mark, h = 40.0, 60.0, 0.10
adj_eq = A_cash + (1 - h) * B_mark
margin_ratio2 = adj_eq / N
buffer2 = adj_eq - maintenance
liq_move2 = buffer2 / N
print("Cross haircut on B")
print(f"  adjEq={adj_eq:.4f}  margin_ratio={margin_ratio2:.4%}  buffer={buffer2:.4f}  liq_move≈{liq_move2:.4%}")
print("Assumptions: linear P&L in mark, one position, no fees, no partial liquidation ladder.")
`,
  4: `# Week 4 lab — threshold 5% vs 3%
# Structured worksheet you can edit, then Run to print a draft you can paste into Notes.

print("WEEK 4 LAB WORKSHEET")
print("Goal checklist")
print('  - Control: abnormal price / concentration / liquidation buffer (pick one)')
print('  - Population: 1000 accounts × 30 days')

threshold_low, threshold_high = 0.03, 0.05
alerts_3, true_3 = 120, 18
alerts_5, true_5 = 55, 16
fp_3 = (alerts_3 - true_3) / alerts_3
fp_5 = (alerts_5 - true_5) / alerts_5
missed_loss_wider = 250_000  # invent consistently; dollars if you widen to 5%
print("\\nSynthetic table")
print(f"  3%: alerts/day≈{alerts_3/30:.1f}  true={true_3}  FP≈{fp_3:.1%}  missed_loss_if_widen={missed_loss_wider}")
print(f"  5%: alerts/day≈{alerts_5/30:.1f}  true={true_5}  FP≈{fp_5:.1%}")
print("\\nMemo headings: problem · population · definition of true · 3% economics · 5% economics · fatigue · decision")
print("Finding (draft last line): Request decision to set threshold at ___ because ___.")

print("\\nEdit the values above, re-run, then copy the output into your notebook / write-up.")
`,
  5: `# Week 5 lab — one-page roadmap + acceptance tests
# Structured worksheet you can edit, then Run to print a draft you can paste into Notes.

print("WEEK 5 LAB WORKSHEET")
print("Goal checklist")
print('  - Slice name + owner')
print('  - Problem in one sentence')
print('  - Non-goals (3 bullets)')
print('  - Acceptance tests: 5 Given/When/Then')

tests = [
    ("Given a book above concentration cap", "When EOD job runs", "Then alert fires with account_id and utilisation"),
    ("Given utilisation within cap", "When EOD job runs", "Then no alert"),
    ("Given parameter change", "When maker proposes", "Then checker must approve before effective_ts"),
    ("Given rollback", "When incident declared", "Then prior parameter version restores within 15 minutes"),
    ("Given missing inputs", "When job runs", "Then fail closed and page on-call"),
]
print("\\nAcceptance tests")
for i,(g,w,t) in enumerate(tests,1):
    print(f"  {i}. Given {g}. When {w}. Then {t}.")

print("\\nEdit the values above, re-run, then copy the output into your notebook / write-up.")
`,
  6: `# Week 6 lab — Metrics that move after launch
# Structured worksheet you can edit, then Run to print a draft you can paste into Notes.

print("WEEK 6 LAB WORKSHEET")
print("Goal checklist")
print('  - Create a table with columns: name, formula, source, baseline, 90-day target, status (computable/blocked), miss')
print('  - Populate all six required metrics for the week-5 slice.')
print('  - Mark ≥2 computable and ≥2 blocked with named fields.')
print('  - Invent synthetic baselines if you lack production access; label them synthetic.')
print('  - Prepare a one-screen version to show a colleague for the delete exercise.')

print("\\nExpected good looks like:")
for item in ["Six complete rows with numeric targets.", "Two computable and two blocked with missing field names.", "A short note ready for the colleague review."]:
    print("  ✓", item)

print("\\nEdit the values above, re-run, then copy the output into your notebook / write-up.")
`,
  7: `# Week 7 lab — Parameter dictionary and maker-checker
# Structured worksheet you can edit, then Run to print a draft you can paste into Notes.

print("WEEK 7 LAB WORKSHEET")
print("Goal checklist")
print('  - Create the dictionary table with the eight rows and seven columns listed in the lesson.')
print('  - Fill every cell; mark simulation/backtest yes/no deliberately.')
print('  - Write the six-step workflow with step 1 forbidding self-approval.')
print('  - Read one public position-tier notice and attach a four-field map (proposer, approver, effective time, rollback')
print('  - Draft the five-line industry question for a practitioner.')

print("\\nExpected good looks like:")
for item in ["Eight fully populated parameter rows.", "Six-step workflow that blocks self-approval in writing.", "Public-notice map saved beside your synthetic workflow."]:
    print("  ✓", item)

print("\\nEdit the values above, re-run, then copy the output into your notebook / write-up.")
`,
  8: `# Week 8 lab — Replay the change before it ships
# Live IDE scaffold. Fill TODOs, then Run. Uses the Python stdlib (+ numpy if available).

import math, random
random.seed(8)

try:
    import numpy as np
    HAS_NP = True
except Exception:
    HAS_NP = False
    np = None

print("Week 8: Replay the change before it ships")
print("Goal: Run a replay on 20 synthetic accounts, print alert counts before and after a concentration-cap change, and keep a fixed seed.")
print("HAS_NUMPY =", HAS_NP)

# --- starter numbers (edit me) ---
seed = 8
n_paths = 1000
print(f"seed={seed}  n_paths={n_paths}")

# TODO: implement the lab steps from the courseware above this IDE.
# Keep prints of every intermediate number the expected-outputs list asks for.

if HAS_NP:
    rng = np.random.default_rng(seed)
    x = rng.normal(0, 1, size=n_paths)
    print("mean≈", float(np.mean(x)), "  p95≈", float(np.quantile(x, 0.95)))
else:
    x = [random.gauss(0, 1) for _ in range(n_paths)]
    x_sorted = sorted(x)
    print("mean≈", sum(x)/len(x), "  p95≈", x_sorted[int(0.95*(len(x)-1))])

print("\\nNext: replace this scaffold with the real worksheet from the Steps list.")
`,
  9: `# Week 9 lab — Events, APIs, and the path from tick to alert
# Live IDE scaffold. Fill TODOs, then Run. Uses the Python stdlib (+ numpy if available).

import math, random
random.seed(9)

try:
    import numpy as np
    HAS_NP = True
except Exception:
    HAS_NP = False
    np = None

print("Week 9: Events, APIs, and the path from tick to alert")
print("Goal: Produce the box-and-arrow diagram and two JSON examples (AlertEvent and parameter-change) each with correlation_id and inputs_hash.")
print("HAS_NUMPY =", HAS_NP)

# --- starter numbers (edit me) ---
seed = 9
n_paths = 1000
print(f"seed={seed}  n_paths={n_paths}")

# TODO: implement the lab steps from the courseware above this IDE.
# Keep prints of every intermediate number the expected-outputs list asks for.

if HAS_NP:
    rng = np.random.default_rng(seed)
    x = rng.normal(0, 1, size=n_paths)
    print("mean≈", float(np.mean(x)), "  p95≈", float(np.quantile(x, 0.95)))
else:
    x = [random.gauss(0, 1) for _ in range(n_paths)]
    x_sorted = sorted(x)
    print("mean≈", sum(x)/len(x), "  p95≈", x_sorted[int(0.95*(len(x)-1))])

print("\\nNext: replace this scaffold with the real worksheet from the Steps list.")
`,
  10: `# Week 10 lab — System of record and five pages worth sending
# Structured worksheet you can edit, then Run to print a draft you can paste into Notes.

print("WEEK 10 LAB WORKSHEET")
print("Goal checklist")
print('  - Create a markdown or CSV file named week10_storage_and_pages.md in your study folder.')
print('  - Add a table with columns: domain, system_of_record, who_may_write, rca_retention. Rows: positions, marks, para')
print('  - Add a second table with columns: alert_name, condition_with_number, unit, owner_role, first_runbook_step. Rows')
print('  - For calc_lag use a threshold in seconds (for example 600). For missing_marks use a percent of underlyings (for')
print('  - Write five lines titled decision vs replay: one sentence on what the decision store answers, one on what the')
print('  - Self-check: every domain row has all three ownership fields; every alert row has a number and an owner role.')

print("\\nExpected good looks like:")
for item in ["Four domain rows with system of record, writer role, and retention.", "Five paging alerts each with a numeric threshold (or explicit any-fail) and an owner role.", "A short note that separates decision store from replay store and ties lag, error rate, and saturation to pages."]:
    print("  ✓", item)

print("\\nEdit the values above, re-run, then copy the output into your notebook / write-up.")
`,
  11: `# Week 11 lab — Ship a risk change with a rollback
# Structured worksheet you can edit, then Run to print a draft you can paste into Notes.

print("WEEK 11 LAB WORKSHEET")
print("Goal checklist")
print('  - Open your week-8 note (concentration cap X→Y, pass rule, seed, before/after alert counts). If missing, synthes')
print('  - Create week11_release_plan.md with sections: change_summary, tests_must_pass, uat_signer, shadow_period, rollb')
print('  - In change_summary, state old version id, new version id, parameter name, and X→Y with units.')
print('  - In tests_must_pass, list the replay command or notebook cell order and the numeric pass rule.')
print('  - In uat_signer, name a role and the three artifacts they review.')
print('  - In shadow_period, give duration (for example 24h) and scope (for example one synthetic desk).')

print("\\nExpected good looks like:")
for item in ["Release plan document with versioned rollback to a prior parameter id.", "Two 48-hour watch metrics with baselines and tripwires.", "Three checks specified as input and pass/fail output, including no self-approval."]:
    print("  ✓", item)

print("\\nEdit the values above, re-run, then copy the output into your notebook / write-up.")
`,
  12: `# Week 12 lab — Historical and parametric VaR, computed
# Live IDE scaffold. Fill TODOs, then Run. Uses the Python stdlib (+ numpy if available).

import math, random
random.seed(12)

try:
    import numpy as np
    HAS_NP = True
except Exception:
    HAS_NP = False
    np = None

print("Week 12: Historical and parametric VaR, computed")
print("Goal: Notebook that prints historical and parametric 99% VaR in the required bands with NumPy seed 7.")
print("HAS_NUMPY =", HAS_NP)

# --- starter numbers (edit me) ---
seed = 12
n_paths = 1000
print(f"seed={seed}  n_paths={n_paths}")

# TODO: implement the lab steps from the courseware above this IDE.
# Keep prints of every intermediate number the expected-outputs list asks for.

if HAS_NP:
    rng = np.random.default_rng(seed)
    x = rng.normal(0, 1, size=n_paths)
    print("mean≈", float(np.mean(x)), "  p95≈", float(np.quantile(x, 0.95)))
else:
    x = [random.gauss(0, 1) for _ in range(n_paths)]
    x_sorted = sorted(x)
    print("mean≈", sum(x)/len(x), "  p95≈", x_sorted[int(0.95*(len(x)-1))])

print("\\nNext: replace this scaffold with the real worksheet from the Steps list.")
`,
  13: `# Week 13 lab — FRTB lenses: ES, SA/IMA, Kupiec / traffic light
# Live IDE scaffold. Fill TODOs, then Run.

import math, random
random.seed(7)  # match week-12 construction seed when you regenerate

try:
    import numpy as np
    HAS_NP = True
except Exception:
    HAS_NP = False
    np = None

print("Week 13: FRTB lenses + ES/backtest")
print("HAS_NUMPY =", HAS_NP)

# Toy loss series stand-in (replace with week-12 series)
n, p = 250, 0.01
if HAS_NP:
    rng = np.random.default_rng(7)
    losses = np.sort(rng.lognormal(mean=9.5, sigma=0.35, size=n))
    es97_5 = float(np.mean(losses[losses >= np.quantile(losses, 0.975)]))
    hist99 = float(np.quantile(losses, 0.99))
    exceptions = int(np.sum(losses > hist99))
else:
    random.seed(7)
    losses = sorted(math.exp(random.gauss(9.5, 0.35)) for _ in range(n))
    q = losses[int(0.975 * (n - 1))]
    tail = [x for x in losses if x >= q]
    es97_5 = sum(tail) / len(tail)
    hist99 = losses[int(0.99 * (n - 1))]
    exceptions = sum(1 for x in losses if x > hist99)

# Kupiec LR (unconditional coverage); edge-safe for x=0
x = exceptions
if x == 0:
    kupiec_lr = -2 * n * math.log(1 - p)
elif x == n:
    kupiec_lr = -2 * n * math.log(p)
else:
    kupiec_lr = -2 * (
        (n - x) * math.log((1 - p) / ((n - x) / n)) + x * math.log(p / (x / n))
    )
zone = "green" if x <= 4 else "amber" if x <= 9 else "red"

frtb_map = {
    "sa_idea": "SA = rulebook risk weights / buckets / correlations — not your internal VaR engine.",
    "ima_idea": "IMA = approved internal ES on modellable factors + PLA/backtest discipline.",
    "pla_or_nmrf_risk": "PLA fail or NMRF add-on if risk-factor mapping / sparse data breaks the IMA story.",
}

print("es97_5", round(es97_5, 2))
print("hist99", round(hist99, 2))
print("exceptions", x)
print("kupiec_lr", round(kupiec_lr, 4), "reject_coverage_95", kupiec_lr > 3.84)
print("zone", zone)
print("frtb_map", frtb_map)
print("\\nTODO: swap in the real week-12 loss series; save week13_backtest.json.")
`,
  14: `# Week 14 lab — EWMA, GARCH(1,1), and correlation
# Live IDE scaffold. Fill TODOs, then Run. Uses the Python stdlib (+ numpy if available).

import math, random
random.seed(14)

try:
    import numpy as np
    HAS_NP = True
except Exception:
    HAS_NP = False
    np = None

print("Week 14: EWMA, GARCH(1,1), and correlation")
print("Goal: NumPy notebook printing next-day EWMA vol beside GARCH(1,1) vol on the same return series.")
print("HAS_NUMPY =", HAS_NP)

# --- starter numbers (edit me) ---
seed = 14
n_paths = 1000
print(f"seed={seed}  n_paths={n_paths}")

# TODO: implement the lab steps from the courseware above this IDE.
# Keep prints of every intermediate number the expected-outputs list asks for.

if HAS_NP:
    rng = np.random.default_rng(seed)
    x = rng.normal(0, 1, size=n_paths)
    print("mean≈", float(np.mean(x)), "  p95≈", float(np.quantile(x, 0.95)))
else:
    x = [random.gauss(0, 1) for _ in range(n_paths)]
    x_sorted = sorted(x)
    print("mean≈", sum(x)/len(x), "  p95≈", x_sorted[int(0.95*(len(x)-1))])

print("\\nNext: replace this scaffold with the real worksheet from the Steps list.")
`,
  15: `# Week 15 lab — Monte Carlo stress, liquidity, PFE-style exposure
# Live IDE scaffold. Fill TODOs, then Run.

import math, random
random.seed(15)

try:
    import numpy as np
    HAS_NP = True
except Exception:
    HAS_NP = False
    np = None

print("Week 15: Monte Carlo + liquidity + PFE-style exposure")
print("HAS_NUMPY =", HAS_NP)
counterparty_name = "PrimeBroker-A"  # edit me
seed, n_paths = 15, 5000
half_spread, size = 0.0010, 1_000_000  # liquidity add-on = half_spread * size
print(f"seed={seed} n_paths={n_paths} counterparty={counterparty_name}")

if HAS_NP:
    rng = np.random.default_rng(seed)
    # Toy: portfolio value change and positive exposure proxy on each path
    pnl = rng.normal(-5000, 25000, size=n_paths)  # negative = loss
    value = 20000 + pnl
    exposure = np.maximum(value, 0.0)
    losses = -pnl
    loss95 = float(np.quantile(losses, 0.95))
    es95 = float(np.mean(losses[losses >= loss95]))
    pfe95 = float(np.quantile(exposure, 0.95))
else:
    random.seed(seed)
    pnl = [random.gauss(-5000, 25000) for _ in range(n_paths)]
    exposure = [max(20000 + x, 0.0) for x in pnl]
    losses = sorted(-x for x in pnl)
    loss95 = losses[int(0.95 * (n_paths - 1))]
    tail = [L for L in losses if L >= loss95]
    es95 = sum(tail) / len(tail)
    exposure_sorted = sorted(exposure)
    pfe95 = exposure_sorted[int(0.95 * (n_paths - 1))]

liquidity_penalty = half_spread * size
print("loss95", round(loss95, 2), "es95", round(es95, 2))
print("liquidity_penalty", liquidity_penalty, "(NOT a market-impact model)")
print("pfe95", round(pfe95, 2), "counterparty_name", counterparty_name)
print("NOTE: do not add pfe95 into market loss without a separate label.")
print("\\nTODO: replace toy normals with your true book revaluation paths.")
`,
  16: `# Week 16 lab — Model validation pack a reviewer can read
# Live IDE scaffold. Fill TODOs, then Run. Uses the Python stdlib (+ numpy if available).

import math, random
random.seed(16)

try:
    import numpy as np
    HAS_NP = True
except Exception:
    HAS_NP = False
    np = None

print("Week 16: Model validation pack a reviewer can read")
print("Goal: Produce a ≤4-page validation pack for week-12 VaR with challenger, week-13 backtest, monitoring metric, and owner.")
print("HAS_NUMPY =", HAS_NP)

# --- starter numbers (edit me) ---
seed = 16
n_paths = 1000
print(f"seed={seed}  n_paths={n_paths}")

# TODO: implement the lab steps from the courseware above this IDE.
# Keep prints of every intermediate number the expected-outputs list asks for.

if HAS_NP:
    rng = np.random.default_rng(seed)
    x = rng.normal(0, 1, size=n_paths)
    print("mean≈", float(np.mean(x)), "  p95≈", float(np.quantile(x, 0.95)))
else:
    x = [random.gauss(0, 1) for _ in range(n_paths)]
    x_sorted = sorted(x)
    print("mean≈", sum(x)/len(x), "  p95≈", x_sorted[int(0.95*(len(x)-1))])

print("\\nNext: replace this scaffold with the real worksheet from the Steps list.")
`,
  17: `# Week 17 lab — Classify alerts: precision at a fixed recall
# Structured worksheet you can edit, then Run to print a draft you can paste into Notes.

print("WEEK 17 LAB WORKSHEET")
print("Goal checklist")
print('  - Create week17_alert_classifier.py using numpy/pandas/sklearn.')
print('  - Set seed 17. Generate 200 rows: zscore, volume_multiple, hour, concentration.')
print('  - Assign labels with a written probabilistic rule in comments; print class balance (aim roughly 15–30% incidents')
print('  - Stratified train/test split. Fit LogisticRegression(penalty=l2, max_iter=1000).')
print('  - On the test set, sweep probability thresholds from 0.01 to 0.99.')
print('  - Find threshold where recall >= 0.80 (state tie-break: best precision among those). Print threshold, recall, pr')

print("\\nExpected good looks like:")
for item in ["Printed precision at recall 0.80 and the probability threshold.", "Class balance and seed printed.", "Rejected-feature note with the gaming behavior."]:
    print("  ✓", item)

print("\\nEdit the values above, re-run, then copy the output into your notebook / write-up.")
`,
  18: `# Week 18 lab — Anomalies, then a human close-out
# Structured worksheet you can edit, then Run to print a draft you can paste into Notes.

print("WEEK 18 LAB WORKSHEET")
print("Goal checklist")
print('  - Create week18_anomaly.py. Build a synthetic daily series length ≥120 with dates; plant ≥3 outlier days and one')
print('  - Compute median and MAD of returns. Robust z = 0.6745 * (x - median) / (MAD + 1e-12). Print top 10 dates by abs')
print('  - Fit IsolationForest(contamination=0.05, random_state=18) on features (at least return and volume). Print top 1')
print('  - Print overlap dates (intersection of the two top-10 sets).')
print('  - Create week18_investigation_card.json with fields (five), close_reason_codes (≥5), escalate_action, close_acti')
print('  - Write one example closed card JSON using a planted outlier and a reason code.')

print("\\nExpected good looks like:")
for item in ["Top 10 dates from both detectors printed; overlap marked.", "Investigation card schema with structured close reason codes.", "Example closed card using a reason code, not only a comment."]:
    print("  ✓", item)

print("\\nEdit the values above, re-run, then copy the output into your notebook / write-up.")
`,
  19: `# Week 19 lab — RAG over your own memos, with a refusal
# Structured worksheet you can edit, then Run to print a draft you can paste into Notes.

print("WEEK 19 LAB WORKSHEET")
print("Goal checklist")
print('  - Gather only the personal study memos from weeks 1–8 into one local folder. Exclude anything from an employer, ')
print('  - Chunk each memo with a fixed size and a small overlap. Record the chunk size and overlap you chose in a one-li')
print('  - Build or run a local vector index (or a simple keyword index if embeddings are unavailable). Do not upload the')
print('  - Ask the system: "Why was the threshold 5% rather than 3%?" Require the answer to include a verbatim quote from')
print('  - Confirm the quoted sentence appears in the output and that you can open the week-4 file and find the same sent')
print('  - Ask one out-of-corpus question (live firm limit, client name, or unpublished parameter). Save the refusal text')

print("\\nExpected good looks like:")
for item in ["An answer to the threshold question that visibly quotes the week-4 memo.", "A saved refusal for a question the memos cannot support.", "A log line or note with an engineer\\u2019s do-not-index items, and an index that contains no employer data."]:
    print("  ✓", item)

print("\\nEdit the values above, re-run, then copy the output into your notebook / write-up.")
`,
  20: `# Week 20 lab — A tool-calling agent that cannot approve
# Structured worksheet you can edit, then Run to print a draft you can paste into Notes.

print("WEEK 20 LAB WORKSHEET")
print("Goal checklist")
print('  - Define tool schemas for search_memos, compute_var, and draft_finding only. Delete or refuse any other tool reg')
print('  - Wire compute_var to your week-12 VaR function. Use synthetic or public returns only—no employer P&L.')
print('  - Implement the loop: model may call the three tools, then must produce a draft and stop.')
print('  - Implement persistence so a finding file is written only when the human types the exact word APPROVE. Any other')
print('  - Run one end-to-end question that needs search plus VaR plus a draft.')
print('  - Save the full trace: question, tool calls, results, final draft, stop reason.')

print("\\nExpected good looks like:")
for item in ["Code or config that lists exactly three tools and no send/approve/param-change tool.", "A finding file that appears only after typed APPROVE.", "One trace file and one logged reviewer stop-step."]:
    print("  ✓", item)

print("\\nEdit the values above, re-run, then copy the output into your notebook / write-up.")
`,
  21: `# Week 21 lab — Evals, guardrails, and the model-risk note
# Structured worksheet you can edit, then Run to print a draft you can paste into Notes.

print("WEEK 21 LAB WORKSHEET")
print("Goal checklist")
print('  - Draft 15 questions with an expected fact or expected refusal for each. Include the week-4 threshold question a')
print('  - Run each question through your RAG and/or agent path. Paste outputs into the sheet.')
print('  - Score each row grounded, correctly refused, or wrong. Compute the total.')
print('  - If the score is below 12, change index, chunking, or prompt; rerun; do not lower the target.')
print('  - Write a one-page control note: index readers, human override, and logs (prompt version, model version, retriev')
print('  - Map four short bullets to Govern, Map, Measure, Manage.')

print("\\nExpected good looks like:")
for item in ["A 15-row sheet with a score of at least 12/15 after rerun, or an honest shortfall note naming remaining failures.", "A control note that names readers, override, and the three log fields.", "A logged answer from a contact about which failure would block a pilot."]:
    print("  ✓", item)

print("\\nEdit the values above, re-run, then copy the output into your notebook / write-up.")
`,
  22: `# Week 22 lab — Collateral, SIMM/IM, repo, rehypothecation
# Structured worksheet + toy SIMM-like IM score.

print("WEEK 22 LAB — financing + SIMM/IM toy")
bond, haircut, rate, days = 1_000_000, 0.02, 0.04, 7
cash = bond * (1 - haircut)
interest = cash * rate * days / 365
marked = bond * 0.95
margin_gap = cash - marked  # if positive, financing side feels the gap
print("cash_received", round(cash, 2))
print("interest_7d", round(interest, 2))
print("bond_after_5pct_down", marked, "margin_gap_vs_cash", round(margin_gap, 2))

print("\\nVM vs IM (edit the sentences)")
print("VM: tracks MTM / variation — posts when the trade moves against you.")
print("IM: close-out buffer — often SIMM on uncleared portfolios from sensitivities.")

# Toy SIMM-like worksheet (not licensed SIMM)
sens = {"rate_dv01": 12000.0, "fx_delta": -8000.0, "equity_delta": 5000.0}
weights = {"rate_dv01": 0.02, "fx_delta": 0.08, "equity_delta": 0.15}
toy_im = sum(weights[k] * abs(sens[k]) for k in sens)
dispute_risk = "Wrong product taxonomy / missing risk class can understate IM versus the counterparty calculator."
print("sensitivities", sens)
print("weights", weights)
print("toy_im", round(toy_im, 2))
print("dispute_risk", dispute_risk)
print("\\nTODO: finish the 8-row crypto-vs-PB table including an IM/VM row.")
`,
  23: `# Week 23 lab — Joint shocks + dominant sleeve + toy CVA/XVA sketch

print("WEEK 23 LAB — four shocks + XVA sketch")
sleeves = {
    "eurusd_option": -180_000,   # edit: scenario P&L
    "btc_perp": -95_000,
    "financed_bond": -40_000,
}
margin_call = 55_000  # separate from P&L
book_pnl = sum(sleeves.values())
dominant = min(sleeves, key=sleeves.get)
print("pnl_by_sleeve", sleeves)
print("book_pnl", book_pnl)
print("margin_call_separate", margin_call)
print("dominant_sleeve", dominant)
print("first_catch_control", "Week-3 margin tier / week-4 threshold — edit me")

# Toy one-period CVA sketch (NOT a desk XVA)
ee_proxy = abs(min(0, sleeves["eurusd_option"]))  # positive exposure proxy
pd, lgd = 0.02, 0.60  # toy
cva_toy = ee_proxy * pd * lgd
xva_sketch = {
    "ee_proxy": ee_proxy,
    "pd": pd,
    "lgd": lgd,
    "cva_toy": cva_toy,
    "im_vm_effect": "IM/VM would cut ee_proxy before CVA — state your CSA assumption.",
    "will_not_claim": "This is not a desk XVA; flat PD/LGD are pedagogical.",
}
print("xva_sketch", xva_sketch)
print("\\nTODO: replace stub P&Ls with your four-shock formulas.")
`,
  24: `# Week 24 lab — The commercial sentence for a risk product
# Structured worksheet you can edit, then Run to print a draft you can paste into Notes.

print("WEEK 24 LAB WORKSHEET")
print("Goal checklist")
print('  - Write one paragraph naming the user and the economic buyer for your risk-control slice.')
print('  - Estimate hours × people for the manual process; state assumptions.')
print('  - Name the loss or failure mode the control aims at.')
print('  - Define adoption as weekly active reviewers or an equally concrete metric.')
print('  - List two outcomes you will not claim (include revenue/conversion unless you truly own them).')
print('  - Scan two public venue docs and one TradFi analogue; write three gap bullets.')

print("\\nExpected good looks like:")
for item in ["One-page note separating user from buyer with hours, loss, adoption, and two will-not-claims.", "Three bullets of gaps versus public venue or TradFi limit practice.", "One funder-style number logged from a real person."]:
    print("  ✓", item)

print("\\nEdit the values above, re-run, then copy the output into your notebook / write-up.")
`,
  25: `# Week 25 lab — Assemble the portfolio and fix the weakest file
# Structured worksheet you can edit, then Run to print a draft you can paste into Notes.

print("WEEK 25 LAB WORKSHEET")
print("Goal checklist")
print('  - Create one private folder with a clear name (for example study-portfolio/).')
print('  - Copy or link every required artifact into a stable structure (by week or by theme).')
print('  - Check the named list against the folder; reopen any missing week until the file exists.')
print('  - Score each artifact roughly strong/ok/weak; pick the weakest.')
print('  - Repair the weakest file until it meets that week’s original criteria; note the revision date.')
print('  - Write a table of contents with title + one-line description per artifact.')

print("\\nExpected good looks like:")
for item in ["Folder containing every named artifact (or a checked plan to finish a true gap).", "One visibly revised weak artifact.", "Two logged first-open answers from different paths."]:
    print("  ✓", item)

print("\\nEdit the values above, re-run, then copy the output into your notebook / write-up.")
`,
  26: `# Week 26 lab — The narrative, the spoken defense, the next 90 days
# Structured worksheet you can edit, then Run to print a draft you can paste into Notes.

print("WEEK 26 LAB WORKSHEET")
print("Goal checklist")
print('  - Outline the 900-word narrative: identity, proof points, VaR number, eval number, human gate, honest scope.')
print('  - Write the full 900 words; cut inflated titles and unsupported claims.')
print('  - Record a five-minute spoken walkthrough of the threshold decision and the agent APPROVE gate.')
print('  - Listen once; edit the script or re-record to remove undefended sentences.')
print('  - Draft the 90-day plan: six named conversations, two real communities, one public note topic with a no-employer')
print('  - Send the 900 words to one person; book the next conversation; log the date.')

print("\\nExpected good looks like:")
for item in ["A ~900-word narrative with VaR and eval numbers and no inflated title.", "A five-minute recording you have listened to once.", "A 90-day plan with six people, two communities, one public note idea, and a dated next conversation."]:
    print("  ✓", item)

print("\\nEdit the values above, re-run, then copy the output into your notebook / write-up.")
`,
};

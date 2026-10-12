#!/usr/bin/env python3
"""Merge courseware drafts into plan.json."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def load_courseware() -> dict[int, dict]:
    pieces: list[dict] = []
    for name in ("_cw_1_9.json", "_cw_10_18.json", "_cw_19_26.json"):
        pieces.extend(json.loads((ROOT / name).read_text(encoding="utf-8")))
    by_n = {item["n"]: item for item in pieces}
    if sorted(by_n) != list(range(1, 27)):
        raise SystemExit(f"expected weeks 1-26, got {sorted(by_n)}")
    for n, week in by_n.items():
        for key in ("goal", "bigIdea", "lessons", "lab", "writeGuide", "industryGuide"):
            if key not in week:
                raise SystemExit(f"week {n} missing {key}")
        for lesson in week["lessons"]:
            words = sum(len(p.split()) for p in lesson["body"])
            if words < 160:
                raise SystemExit(f"week {n} lesson {lesson['title']!r} only {words} words")
    return by_n


def main() -> None:
    by_n = load_courseware()
    plan_path = ROOT / "plan.json"
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    for week in plan["weeks"]:
        cw = by_n[week["n"]]
        week["goal"] = cw["goal"]
        week["bigIdea"] = cw["bigIdea"]
        week["lessons"] = cw["lessons"]
        week["lab"] = cw["lab"]
        week["writeGuide"] = cw["writeGuide"]
        week["industryGuide"] = cw["industryGuide"]
    plan_path.write_text(json.dumps(plan, indent=2) + "\n", encoding="utf-8")
    total_words = 0
    for week in plan["weeks"]:
        for lesson in week["lessons"]:
            total_words += sum(len(p.split()) for p in lesson["body"])
    print(f"merged {len(plan['weeks'])} weeks, lesson_words={total_words}, bytes={plan_path.stat().st_size}")


if __name__ == "__main__":
    main()

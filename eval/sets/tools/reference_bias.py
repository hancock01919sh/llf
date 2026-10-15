#!/usr/bin/env python3
"""Measure how much the Opus-assisted labels favour Opus (BD3244-37).

Splits each run's cases into groups whose labels Opus did or didn't influence,
then reports every cell's micro precision/recall per group and Opus's lead over
the best other cell. If the labels favour Opus, its lead is larger on the
Opus-influenced group than on the independent one.

  v2       v2-mixed dishes: "independent" = labels from the Nutrition5k dataset
           (plus the rule-based pizza `tomato-sauce` slug); "opus-reviewed" =
           dishes whose expected or acceptable slugs changed in the v2 consensus
           review. Non-food cases are left out.
  source   any set: groups are the cases' `source` ids (for v3-product the
           synthetic sources are labeled by construction, `commons-product` by
           Opus).
  lenient  one run: re-scores precision with every extra slug that at least
           half of the non-reference cells reported on a case counted as
           acceptable. A large jump for the other cells but not for Opus means
           the gap is partly Opus's own labeling choices.

Usage:
  python3 eval/sets/tools/reference_bias.py v2 eval/runs/arena-…-v2-p3-final.json …
  python3 eval/sets/tools/reference_bias.py source --set eval/sets/v3-product.json eval/runs/arena-…-v3.json
  python3 eval/sets/tools/reference_bias.py lenient eval/runs/arena-…-v3-commons.json
"""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
GLOBAL_ACCEPTABLE = {"butter", "cooking-oil", "spices"}
REFERENCE = "claude-opus-5-5"


def v2_groups() -> dict[str, str]:
    v1 = {c["id"]: c for c in json.loads((ROOT / "eval/sets/v1-mixed.json").read_text())["cases"]}
    v2 = json.loads((ROOT / "eval/sets/v2-mixed.json").read_text())["cases"]
    groups = {}
    for case in v2:
        if not case.get("expectedReadable", True):
            continue
        old = v1[case["id"]]
        exp_change = set(case.get("expectedSlugs", [])) ^ set(old.get("expectedSlugs", []))
        exp_change -= {"tomato-sauce"}
        acc_change = (set(case.get("acceptableSlugs", [])) - GLOBAL_ACCEPTABLE) ^ set(
            old.get("acceptableSlugs", [])
        )
        groups[case["id"]] = "opus-reviewed" if exp_change or acc_change else "independent"
    return groups


def source_groups(set_path: Path) -> dict[str, str]:
    data = json.loads(set_path.read_text())
    return {c["id"]: c.get("source", "none") for c in data["cases"] if c.get("expectedSlugs")}


def cell_model(cell: dict) -> str:
    c = cell["cell"]
    return c["model"] + (f"/{c['effort']}" if c.get("effort") else "")


def tally(run_paths: list[Path], groups: dict[str, str]) -> dict[str, dict[str, list[int]]]:
    totals: dict[str, dict[str, list[int]]] = defaultdict(lambda: defaultdict(lambda: [0, 0, 0]))
    for path in run_paths:
        for cell in json.loads(path.read_text())["cells"]:
            if cell["cell"]["provider"] == "mock" or not cell.get("run"):
                continue
            name = cell_model(cell)
            for score in cell["run"]["scores"]:
                group = groups.get(score["id"])
                if group is None:
                    continue
                t = totals[name][group]
                t[0] += score["tp"]
                t[1] += score["fp"]
                t[2] += score["fn"]
    return totals


def pr(t: list[int]) -> tuple[float, float]:
    tp, fp, fn = t
    return (tp / (tp + fp) if tp + fp else 0.0, tp / (tp + fn) if tp + fn else 0.0)


def lenient(run_path: Path) -> None:
    cells = [c for c in json.loads(run_path.read_text())["cells"]
             if c["cell"]["provider"] != "mock" and c.get("run")]
    others = [c for c in cells if not c["cell"]["model"].startswith(REFERENCE)]
    votes: dict[str, Counter[str]] = defaultdict(Counter)
    for cell in others:
        for score in cell["run"]["scores"]:
            votes[score["id"]].update(score["extraSlugs"])
    need = (len(others) + 1) // 2
    agreed = {cid: {s for s, n in v.items() if n >= need} for cid, v in votes.items()}
    print(f"Extras reported by ≥ {need} of {len(others)} non-reference cells:")
    for cid in sorted(agreed):
        if agreed[cid]:
            print(f"  {cid}: " + ", ".join(f"{s} ({votes[cid][s]})" for s in sorted(agreed[cid])))
    print()
    print("| Cell | Precision | Recall | Precision, lenient | Extras that are majority calls |")
    print("|---|---|---|---|---|")
    for cell in cells:
        tp = fp = fn = shared = 0
        for score in cell["run"]["scores"]:
            tp, fp, fn = tp + score["tp"], fp + score["fp"], fn + score["fn"]
            shared += len(set(score["extraSlugs"]) & agreed.get(score["id"], set()))
        p, r = pr([tp, fp, fn])
        pl, _ = pr([tp, fp - shared, fn])
        print(f"| {cell_model(cell)} | {p:.1%} | {r:.1%} | {pl:.1%} | {shared} of {fp} |")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["v2", "source", "lenient"])
    ap.add_argument("runs", nargs="+", type=Path)
    ap.add_argument("--set", type=Path)
    args = ap.parse_args()
    if args.mode == "lenient":
        for path in args.runs:
            lenient(path)
        return
    groups = v2_groups() if args.mode == "v2" else source_groups(args.set)
    totals = tally(args.runs, groups)
    seen = {sid for path in args.runs for c in json.loads(path.read_text())["cells"]
            for sid in (s["id"] for s in (c.get("run") or {}).get("scores", []))}
    names = sorted({g for sid, g in groups.items() if sid in seen})
    counts = {g: sum(1 for sid, v in groups.items() if v == g and sid in seen) for g in names}

    print("| Cell | " + " | ".join(f"{g} ({counts[g]}) P / R" for g in names) + " |")
    print("|---|" + "---|" * len(names))
    for name in sorted(totals, key=lambda n: -pr(totals[n][names[0]])[1]):
        cols = []
        for g in names:
            p, r = pr(totals[name][g])
            cols.append(f"{p:.1%} / {r:.1%}")
        print(f"| {name} | " + " | ".join(cols) + " |")

    ref = next((n for n in totals if n.startswith(REFERENCE)), None)
    if ref is None:
        return
    print()
    for g in names:
        rp, rr = pr(totals[ref][g])
        others = [pr(totals[n][g]) for n in totals if n != ref]
        bp = max(p for p, _ in others)
        br = max(r for _, r in others)
        f1 = lambda p, r: 2 * p * r / (p + r) if p + r else 0.0  # noqa: E731
        bf = max(f1(p, r) for p, r in others)
        print(
            f"{g}: Opus lead over best other cell: precision {rp - bp:+.1%}, "
            f"recall {rr - br:+.1%}, F1 {f1(rp, rr) - bf:+.1%}"
        )


if __name__ == "__main__":
    main()

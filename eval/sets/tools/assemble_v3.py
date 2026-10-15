#!/usr/bin/env python3
"""Assemble eval/sets/v3-product.json from the synthetic cases and the Commons photo cases."""

import json
from pathlib import Path

SETS = Path(__file__).resolve().parents[1]
OUT = SETS / "v3-product"

SOURCES = {
    "synthetic-receipt": {
        "description": "Grocery receipts rendered by eval/sets/tools/gen_v3_synthetic.py: fictional stores, abbreviated item lines, non-food lines, no card or loyalty numbers. Labels are fixed by construction (each printed line maps to one eval-v2 slug).",
        "license": "CC0 (generated for this project)",
        "piiReviewed": True,
    },
    "synthetic-list": {
        "description": "Shopping lists rendered by eval/sets/tools/gen_v3_synthetic.py: phone-notes screenshots and handwriting fonts on notepads and sticky notes, with abbreviations and non-food items. Labels are fixed by construction.",
        "license": "CC0 (generated for this project)",
        "piiReviewed": True,
    },
    "nutrition5k-overlay": {
        "description": "Nutrition5k dishes from v1-n5k-dishes with injected text added by gen_v3_synthetic.py (caption, faint, tiny, sticky note, fake JSON). Labels are the v2-mixed labels of the base dish.",
        "license": "CC BY 4.0 (attribution: Google Research, Nutrition5k); modified: text overlay added",
        "piiReviewed": True,
    },
    "commons-pd-overlay": {
        "description": "Non-food v1-nonfood images (Wikimedia Commons, PD/CC0) with a caption claiming food, added by gen_v3_synthetic.py.",
        "license": "Public domain / CC0 (per file, see v1-nonfood/CREDITS.md)",
        "piiReviewed": True,
    },
    "commons-product": {
        "description": "Fridge and freezer photos from Wikimedia Commons, screened for people and PII, plus two sticky-note injection probes on them (build_v3_commons.py). Labeled by Claude Opus 5.5 (two independent passes, mechanical adjudication); see v3-product/CREDITS.md and LABELS.md.",
        "license": "Public domain / CC0 / CC BY / CC BY-SA (per file, see v3-product/CREDITS.md)",
        "piiReviewed": True,
    },
}


def main() -> None:
    cases = json.loads((OUT / "synthetic.cases.json").read_text())["cases"]
    commons = OUT / "commons.cases.json"
    if commons.exists():
        cases += json.loads(commons.read_text())["cases"]
    used = {c["source"] for c in cases}
    out = {
        "version": "v3-product",
        "description": "Product-shaped photos (BD3244-37): receipts, shopping lists, fridge/pantry/grocery photos and image-based prompt injection. Synthetic cases are labeled by construction; Commons photos are labeled by Opus 5.5 (report them separately). Score with --catalog eval/catalogs/eval-v2.json.",
        "sources": {k: v for k, v in SOURCES.items() if k in used},
        "cases": cases,
    }
    (SETS / "v3-product.json").write_text(json.dumps(out, indent=2) + "\n")
    print(f"{len(cases)} cases; sources: {sorted(used)}")


if __name__ == "__main__":
    main()

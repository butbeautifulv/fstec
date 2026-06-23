#!/usr/bin/env python3
"""Offline CatBoost trainer for measure→subdivision routing. Optional."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LABELS = ROOT / "labels-dataset.jsonl"
OUT = ROOT / "routing-model.cbm"

TAG_RULES = [
    ("network", r"сетев|ngfw|чёрн|белым списк"),
    ("siem", r"мониторинг|корреляц|siem"),
    ("email", r"почтов|вложен"),
    ("av", r"антивирус|kaspersky"),
    ("vulnerability", r"bdu:|уязвим|cvss"),
    ("organizational", r"утверд|многофактор"),
]


def tag_features(text: str) -> list[int]:
    import re
    return [1 if re.search(pat, text, re.I) else 0 for _, pat in TAG_RULES]


def main():
    if not LABELS.exists():
        print("labels-dataset.jsonl not found; run extract-labels-dataset first", file=sys.stderr)
        sys.exit(1)
    try:
        from catboost import CatBoostClassifier
        import numpy as np
    except ImportError:
        print("catboost not installed; skip ML training (pip install catboost)", file=sys.stderr)
        sys.exit(0)

    rows = []
    for line in LABELS.read_text().splitlines():
        if line.strip():
            rows.append(json.loads(line))

    subs = sorted({r["subdivisionName"] for r in rows if r.get("subdivisionName")})
    sub_to_id = {s: i for i, s in enumerate(subs)}

    X, y = [], []
    for r in rows:
        sub = r.get("subdivisionName")
        if not sub or sub not in sub_to_id:
            continue
        X.append(tag_features(r.get("measureTextSnippet", "")))
        y.append(sub_to_id[sub])

    if len(X) < 50:
        print(f"Too few samples ({len(X)}); skip training")
        sys.exit(0)

    model = CatBoostClassifier(iterations=100, depth=4, verbose=0)
    model.fit(X, y)
    model.save_model(str(OUT))
    print(f"Saved {OUT} ({len(X)} samples, {len(subs)} classes)")


if __name__ == "__main__":
    main()

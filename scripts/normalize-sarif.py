#!/usr/bin/env python3
"""Ensure SARIF files satisfy GitHub upload-sarif schema before upload."""
from __future__ import annotations

import json
import sys
from pathlib import Path

DEFAULT_LOCATION = {
    "physicalLocation": {
        "artifactLocation": {"uri": "Dockerfile", "uriBaseId": "%SRCROOT%"},
        "region": {"startLine": 1},
    }
}


def ensure_locations(run: dict) -> None:
    for result in run.get("results", []):
        if not isinstance(result, dict):
            continue
        locations = result.get("locations")
        if not isinstance(locations, list) or not locations:
            result["locations"] = [DEFAULT_LOCATION.copy()]


def normalize(path: Path, tool_name: str = "scanner") -> None:
    if path.exists() and path.stat().st_size > 0:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            data = {}
    else:
        data = {}

    data.setdefault("version", "2.1.0")
    runs = data.get("runs")
    if not isinstance(runs, list) or not runs:
        runs = [{"results": []}]
    for run in runs:
        if not isinstance(run, dict):
            continue
        run.setdefault("results", [])
        tool = run.get("tool")
        if not isinstance(tool, dict) or "driver" not in tool:
            run["tool"] = {"driver": {"name": tool_name}}
        elif not tool["driver"].get("name"):
            tool["driver"]["name"] = tool_name
        ensure_locations(run)
    data["runs"] = runs
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def main() -> None:
    if len(sys.argv) < 2:
        print("usage: normalize-sarif.py <report> [tool-name]", file=sys.stderr)
        sys.exit(2)
    normalize(Path(sys.argv[1]), sys.argv[2] if len(sys.argv) > 2 else "scanner")


if __name__ == "__main__":
    main()

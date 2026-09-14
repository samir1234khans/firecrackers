#!/usr/bin/env python3
"""Validate this documentation baseline, not application behavior or graphics."""
from __future__ import annotations

import json
import math
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []
checks = 0


def check(condition: bool, message: str) -> None:
    global checks
    checks += 1
    if not condition:
        errors.append(message)


def load(relative: str) -> dict:
    try:
        value = json.loads((ROOT / relative).read_text(encoding="utf-8"))
        if not isinstance(value, dict):
            raise ValueError("expected JSON object")
        return value
    except (OSError, ValueError) as exc:
        errors.append(f"{relative}: {exc}")
        return {}


def text(relative: str) -> str:
    try:
        return (ROOT / relative).read_text(encoding="utf-8")
    except OSError as exc:
        errors.append(f"{relative}: {exc}")
        return ""


def check_range(value: object, name: str) -> None:
    valid = isinstance(value, list) and len(value) == 2 and all(
        isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)
        for x in value
    )
    check(valid, f"{name}: expected two finite numeric endpoints")
    if valid:
        check(0 <= value[0] <= value[1], f"{name}: unordered or negative range")


def main() -> int:
    markdown = sorted(ROOT.rglob("*.md"))
    for path in markdown:
        if any(part in {"node_modules", ".git", "dist"} for part in path.parts):
            continue
        body = path.read_text(encoding="utf-8")
        body_without_fences = re.sub(r"```.*?```", "", body, flags=re.S)
        for match in re.finditer(r"\[[^\]]+\]\(([^)]+)\)", body_without_fences):
            target = match.group(1).strip().split(" \"")[0]
            parsed = urlsplit(target)
            if parsed.scheme or target.startswith(("#", "//")):
                continue
            local = (path.parent / unquote(parsed.path)).resolve()
            check(local.exists(), f"{path.relative_to(ROOT)}: broken local link {target}")

    requirements = text("docs/02-requirements-and-acceptance.md")
    trace = text("docs/22-requirements-traceability.md")
    tests = text("docs/17-test-and-release-plan.md")
    req_ids = re.findall(r"^\| ((?:NFR|FR)-\d{2}) \|", requirements, re.M)
    trace_ids = re.findall(r"^\| ((?:NFR|FR)-\d{2}) \|", trace, re.M)
    test_ids = set(re.findall(r"^\| (T-\d{2}) \|", tests, re.M))
    check(len(req_ids) == 30 and len(set(req_ids)) == 30, "Expected 30 unique requirements")
    check(len(trace_ids) == len(set(trace_ids)), "Duplicate requirement traceability row")
    check(set(req_ids) == set(trace_ids), "Requirement/traceability coverage mismatch")
    check(len(test_ids) == 32, "Expected 32 defined application test scenarios")
    check(set(re.findall(r"\bT-\d{2}\b", trace)) <= test_ids, "Unknown traceability test ID")

    research = text("docs/19-research-and-reuse.md")
    source_ids = set(re.findall(r"^\| (S\d{2}) \|", research, re.M))
    check(len(source_ids) == 30, "Expected 30 research source records")
    for path in (ROOT / "docs").glob("*.md"):
        mentioned = set(re.findall(r"\bS\d{2}\b", path.read_text(encoding="utf-8")))
        check(mentioned <= source_ids, f"Unknown source ID in {path.name}")

    catalog = load("specs/fireworks.v1.json")
    schema = load("specs/fireworks.schema.json")
    quality = load("specs/quality-budgets.v1.json")
    shows = load("specs/show-presets.v1.json")
    tokens = load("design/tokens.json")
    assets = load("specs/asset-manifest.template.json")
    try:
        import jsonschema
        jsonschema.Draft202012Validator.check_schema(schema)
        schema_errors = list(jsonschema.Draft202012Validator(schema).iter_errors(catalog))
        for issue in schema_errors:
            errors.append(f"Catalog schema {list(issue.path)}: {issue.message}")
        check(not schema_errors, "Catalog JSON Schema validation failed")
    except ImportError:
        errors.append("Install scripts/requirements-docs.txt to run required JSON Schema validation")
    except Exception as exc:
        errors.append(f"Schema validation error: {exc}")

    expected = {
        "gold-willow": "willow", "multicolor-peony": "peony",
        "chrysanthemum": "chrysanthemum", "silver-crossette-crackle": "crossette",
        "grand-finale": "multibreak",
    }
    effects = catalog.get("effects", [])
    check(len(effects) == 5, "Expected five effect records")
    ids = [effect.get("id") for effect in effects]
    check(len(ids) == len(set(ids)) and set(ids) == set(expected), "Effect IDs mismatch/duplicate")
    range_keys = ("fuseSeconds", "ascentSeconds", "visualDurationSecondsApprox", "burstYNormalized", "radiusNormalized", "primaryEmittersStandard")
    for effect in effects:
        name = str(effect.get("id"))
        check(effect.get("family") == expected.get(name), f"{name}: wrong family")
        for key in range_keys:
            check_range(effect.get(key), f"{name}.{key}")
        for key in ("trailLifeSeconds", "splitDelaySeconds", "crackleDelayAfterSplitSeconds"):
            if key in effect:
                check_range(effect[key], f"{name}.{key}")
        count_range = effect.get("primaryEmittersStandard", [0, 0])
        check(effect.get("minimumPrimaryEmittersLow", 0) <= count_range[0], f"{name}: low minimum exceeds standard minimum")
        if name == "grand-finale":
            groups = effect.get("childGroups", [])
            offsets = [group.get("offsetSeconds", -1) for group in groups]
            check(offsets == sorted(offsets), "Finale child offsets are unordered")
            check(effect.get("maxChildGeneration") == 1, "Finale recursion must be bounded")
            for group in groups:
                check(group.get("effectId") in set(expected) - {"grand-finale"}, "Invalid or recursive finale child")
                check(group.get("countLow", 0) <= group.get("countStandard", 0), "Low finale topology exceeds Standard")

    tiers = quality.get("tiers", {})
    check(set(tiers) == {"low", "standard", "ultra"}, "Quality tiers mismatch")
    for tier, values in tiers.items():
        for key, value in values.items():
            check(isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and value > 0, f"{tier}.{key}: nonpositive/nonfinite budget")
        check(values.get("launchCostUnits", 0) >= 3, f"{tier}: cannot admit a bounded finale")
    presets = shows.get("presets", [])
    check({p.get("id") for p in presets} == {"calm", "festival", "finale"}, "Show preset IDs mismatch")
    for preset in presets:
        name = str(preset.get("id"))
        check_range(preset.get("burstSpacingSeconds"), f"{name}.burstSpacingSeconds")
        check_range(preset.get("phraseSeconds"), f"{name}.phraseSeconds")
        weights = preset.get("weights", {})
        check(set(weights) == set(expected), f"{name}: weight IDs mismatch")
        check(all(isinstance(v, (int, float)) and math.isfinite(v) and v >= 0 for v in weights.values()), f"{name}: invalid weights")
        check(sum(weights.values()) > 0, f"{name}: empty weighted choice")
    check(tokens.get("motion", {}).get("holdToLightMs") == 650, "Hold default mismatch")
    check(tokens.get("motion", {}).get("hideDelayMs") == 3000, "Auto-hide default mismatch")
    check(assets.get("assets") == [], "Asset template must not claim acquired assets")
    check(shows.get("defaults", {}).get("maxCueCount") == quality.get("simulation", {}).get("maxCueCount"), "Cue cap mismatch")
    check(shows.get("defaults", {}).get("maxPlanningHorizonSeconds") == quality.get("simulation", {}).get("maxPlanningHorizonSeconds"), "Planning horizon mismatch")

    if errors:
        print(f"FAIL: {len(errors)} issue(s) across {checks} structural checks")
        for error in errors:
            print(f"- {error}")
        return 1
    print(f"PASS: {checks} documentation/configuration structural checks")
    print("Application graphics, browser, performance, audio, rights, and safety tests remain unrun.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (KeyError, TypeError, ValueError, OSError) as exc:
        print(f"FAIL: malformed documentation/configuration: {exc}", file=sys.stderr)
        raise SystemExit(1)

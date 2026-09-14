# Development workflow

## Initial state and branch policy

The planning baseline is stored on `main` with the original initial commit preserved. No application implementation branch or hosting deployment is created by the documentation task.

Proposed future workflow: `main` is the consolidated reviewed state; use short-lived `feat/<area>-<task>`, `fix/<area>-<task>`, or `docs/<topic>` branches from the latest main. The first application branch can be `feat/gold-willow-vertical-slice`. Do not create competing permanent development branches without a reason. If later owner-approved work establishes a different documented branch hierarchy, inspect and respect it.

Before editing, fetch latest refs, inspect the working tree, and identify any existing work. Never force push, hard reset, delete branches, or overwrite uncommitted changes to simplify a task. If a fast-forward update conflicts, refresh and reconcile; do not retry with force.

## Commits and review

Commit coherent completed units with clear scope. Include requirement IDs in PR descriptions and explain visible behavior, tests, and limitations. Keep code/configuration/documentation changes aligned. A task branch merge/promotion follows the owner's authorization and the repository's actual rules; a documentation task is not blanket permission to publish a production release.

Do not mark a milestone complete until its exit evidence exists. An art-quality gate can remain open even when the build passes. Changes to final branding, public licensing, external services, domains, or telemetry are owner decisions rather than incidental refactors.

## Documentation validation

The supplied validator checks local Markdown link destinations, requirement/test references, five catalog IDs, range ordering, finite quality caps, show references, source-register coverage, and JSON Schema where the validation dependency is installed.

```sh
python -m pip install -r scripts/requirements-docs.txt
python scripts/validate_docs.py
```

Use a virtual environment if appropriate. This only validates documentation/configuration structure; it does not run the application. No Node application scripts exist until M0 is implemented.

## Application validation after scaffold

Establish and document fresh-checkout install, lint, typecheck, unit test, browser test, and production build commands. Pin the toolchain and lock dependencies. Add a minimal-permissions CI workflow only for commands that actually exist. Keep device/art/audio/accessibility reviews as explicit manual evidence alongside automation.

## Documentation maintenance

Update PROJECT_STATUS after each work session. Decisions belong in document 03; new testable obligations in 02; quantitative defaults in specialist documents and specs; release evidence in the future `docs/evidence/` location. A new shader dependency requires revisiting backend parity, resource budgets, and asset/license records.

Do not commit generated dependency directories, build output, secrets, unnecessary binary masters, or personal machine configuration. Keep runtime assets optimized and separately attributed. No root code license is chosen in this baseline.

# Firecrackers

A single-screen, realistic digital fireworks experience: choose a firework, place it, light its fuse, watch it rise, and stay with the smoke and falling embers. A restrained layered-glass interface gives way to a festival night sky.

**Stage: complete pre-implementation documentation baseline. The application, finished media, device benchmarks, and production deployment are not implemented or verified yet.**

## Start here

- [Documentation index](docs/README.md) — the complete set of 22 specialist documents.
- [Product brief](docs/01-product-brief.md) and [V1 requirements](docs/02-requirements-and-acceptance.md) — goals and 30 testable obligations.
- [Decisions and open questions](docs/03-decisions-and-open-questions.md) — confirmed direction versus proposed defaults.
- [Implementation roadmap](docs/16-implementation-roadmap.md) — gated build sequence, beginning with Gold Willow.
- [Implementation handover](docs/20-implementation-handover.md) — ready-to-use prompt for the development phase.
- [Machine-readable specifications](specs/README.md), [development workflow](DEVELOPMENT.md), and [current status](PROJECT_STATUS.md).

## Agreed direction

Web app first, installable PWA. Five distinctive fireworks: Gold Willow, Multicolor Peony, Chrysanthemum, Silver Crossette Crackle, and Grand Finale. Manual placement and deliberate ignition, realistic ascent and bursts, persistent smoke, optional spatial sound, and directed continuous shows. No accounts, payments, advertising, or server-side AI in V1.

The fireworks should resemble real festival displays, not confetti or neon screensavers. Glass styling belongs to the small interface, not the firework simulation. Continuous display means a visible, active page, with honest browser capability fallbacks.

## Documentation validation

```sh
python -m pip install -r scripts/requirements-docs.txt
python scripts/validate_docs.py
```

The [documentation workflow](.github/workflows/docs-validation.yml) runs link, requirement-coverage, catalog-schema, and configuration checks and packages the baseline. Its success validates documentation structure, not graphics, performance, audio quality, asset rights, or application readiness. See PROJECT_STATUS for the recorded verification boundary.

No Node application commands exist until the implementation scaffold is created. Do not deploy this documentation directory as though it were the finished app.

## Repository use

The baseline is stored on `main`, preserving the original initial commit. Before implementation, inspect the latest repository state and follow AGENTS.md and DEVELOPMENT.md. Preserve existing work and use non-force Git updates.

Working title: **Firecrackers**. Final consumer branding and a public code license remain owner choices; neither blocks the first working Gold Willow.

Baseline date: 15 September 2026. This is a software simulation, not a guide to handling or constructing physical fireworks.

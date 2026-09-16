# Firecrackers

A single-screen digital festival night. Choose a firework, place it, light its fuse, watch it rise, and stay with the smoke and falling embers. A restrained layered-glass interface gets out of the way.

**Stage: working V1 implementation and isolated preview. Not yet a production-certified or photorealism-approved release.**

[Open the preview](https://firecrackers-a93nle.v2.appdeploy.ai/)

Implementation lives on `feat/fireworks-v1`. The original documentation baseline on `main` is preserved until review and promotion. There are no accounts, purchases, API keys, or backend services.

## What is implemented

Five different effects: Gold Willow, Multicolor Peony, Chrysanthemum, Silver Crossette Crackle, and a layered Grand Finale. Each uses the same deliberate placement/ignition lifecycle, not a canned movie. A 650 ms hold lights the fuse; early release cancels. Light once and keyboard controls provide alternatives.

The app includes seeded particle physics, persistent wind-drifted smoke, local blast illumination, 3D rocket props, original procedural spatial sound, optional haptics, Calm/Festival/finite Finale automatic shows, manual takeover, adaptive quality, pause/resume, tab-hidden suspension, responsive glass controls, first-run help, versioned preferences, reset, fullscreen and wake-lock capability handling, and an installable offline PWA.

## Run and verify

Use the Node version in `.nvmrc` and the committed dependency lock.

```sh
npm ci
npm run dev
```

```sh
npm run typecheck
npm run lint
npm test
npm run test:soak
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run preview` serves the production build. Install/offline testing requires a build and a secure origin or localhost; it is not enabled in the development server. Build output is `dist/`. Development/preview servers bind to loopback by default. Do not publish a Vite development server.

Keyboard: 1–5 choose, Left/Right place, L lights once, Space pauses/resumes, M controls sound, Escape reveals controls or closes a panel. Every action also has an accessible named control.

## Evidence and release boundary

The application passed TypeScript checks, lint, 18 engine tests, accelerated two-hour logical soaks, documentation validation, and 12 Chromium desktop/mobile-emulation browser scenarios, including offline cold reload. Actual screenshots capture all five families. See the [implementation record](docs/evidence/runtime-implementation.md) for source commits, CI runs, hardening results, and gaps.

Mobile emulation is not a physical phone test. True hardware WebGPU parity, Safari/iOS, long-session GPU/thermal behavior, full service-worker update/recovery testing, flash-risk assessment, and final visual/audio realism approval remain release gates. Layered smoke and soft additive glow are implementation choices, not claims of a volumetric fluid solver or HDR bloom pipeline.

## Documentation

- [Documentation index](docs/README.md) — the 22 specialist specifications remain preserved.
- [Product brief](docs/01-product-brief.md), [requirements](docs/02-requirements-and-acceptance.md), and [decisions](docs/03-decisions-and-open-questions.md).
- [Runtime implementation and evidence](docs/evidence/runtime-implementation.md).
- [Current project status](PROJECT_STATUS.md), [development workflow](DEVELOPMENT.md), and [agent instructions](AGENTS.md).
- [Original implementation roadmap](docs/16-implementation-roadmap.md), [handover](docs/20-implementation-handover.md), and [machine-readable specifications](specs/README.md).

```sh
python -m pip install -r scripts/requirements-docs.txt
python scripts/validate_docs.py
```

Documentation validation checks structure, links, and coverage; it does not certify graphics or performance. Historical pre-implementation documents describe the target; the runtime evidence record describes what has actually been built and tested.

All visual/audio assets in this implementation are procedural/original except installed libraries and their icons. Builds preserve third-party license notices. Final branding, production hosting/domain, and a public license for the application remain owner choices. This is software simulation, not physical firework guidance.

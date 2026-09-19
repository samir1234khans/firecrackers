# Firecrackers

An interactive, single-screen festival night: choose a firework, place it, light its fuse, watch it rise, and stay for the falling embers. Realism V3 combines a spatial launch stage with a restrained cinematic glass interface.

**Current build: Realism V3 / UI V3 — `2026-09-19.4`. Working preview, with production hardware and final art approval still open.**

[Open the live preview](https://firecrackers-a93nle.v2.appdeploy.ai/)

Implementation remains on `feat/fireworks-v1`. The original `main` documentation baseline and the alternate implementation branch are preserved. There are no accounts, purchases, API keys or backend services.

## What is implemented

The five families are Gold Willow, Multicolor Peony, Chrysanthemum, Silver Crossette Crackle and Grand Finale. Each runs the actual seeded simulation, not a recorded movie. A 650 ms hold commits the fuse; early release cancels. Light once, Enter and keyboard placement provide alternatives.

The rendered world includes a dimensional, concentric launch stage, printed-paper rocket wraps with trim, a shared arc-length fuse path, fuse smoke, launch exhaust, powered ascent and coast, perspective depth, connected trails, spatial splits, visible secondary carriers, detached cooling embers, persistent locally illuminated smoke, an original night environment and native Three.js TSL bloom.

The UI has Manual/Auto/Festival/Finale controls, family-specific previews, a selected-family inspector on desktop, radial ignition, responsive phone/landscape layouts and coordinated settings/help/show panels. Hidden controls cannot accidentally ignite a rocket on their first reveal tap. Manual pause, audio cancellation and wake-lock cancellation are preserved.

Automatic displays, validated seeded links, protected output areas and transparent output are available. The PWA caches its runtime for offline play. Sound and haptics require user activation. Preferences stay local to the browser.

Ultra is the default quality, with a 60 fps target rather than a guaranteed measured rate. Reduced flashes stays on; sound and haptics stay off. Explicit saved Low/Standard choices remain respected. The empty scene renders on demand; active effects use bounded time updates so slower rendering does not unnecessarily stretch fuse and flight timing.

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
node --test tests/release-fingerprint.test.mjs
npx playwright install chromium
npm run test:e2e
```

`npm run preview` serves `dist/`. Offline/install testing requires the production build and a secure origin or localhost. Local servers bind to loopback; do not publish a Vite development server.

Keyboard: 1–5 choose, Left/Right place, L lights once, Space pauses/resumes, M controls sound, and Escape reveals controls or closes a panel. A different family can be selected while a committed fuse finishes; the already-lit rocket retains its original family.

## Verified evidence

Runtime checkpoint `dabd00c8358f65e961ac4c67eea89043016e9165` passed 51 unit/engine/lifecycle tests, all 44 browser cases (22 desktop and 22 mobile Chromium emulation), typecheck, lint, production build, dependency security review and 258 documentation checks. Neither browser project had failures, flaky cases or skips. The two-hour logical simulation remained bounded; it is not a real-time GPU endurance test.

The build writes `/release.json`, containing a SHA-256 fingerprint of the 21 delivered upgrade modules. Public verification passed on 19 September 2026. JSX is canonicalized with the pinned TypeScript parser, excluding only the host's static diagnostic labels; engine and CSS files remain byte-exact after line-ending normalization. The public-preview verification workflow compares the actual published receipt with the repository, rather than assuming a deployment label proves source parity. See the [Realism V3 delivery record](docs/evidence/realism-v3-delivery.md) for exact CI/deployment evidence and limitations.

## Release boundary

This build does not claim physical Android/tablet, hardware WebGPU, Safari/iOS, OBS, thermal/endurance or flash-risk certification. Those tests and final owner visual/audio approval remain open. Smoke and rocket art are original procedural assets, not Blender fluid bakes or imported production GLBs. Audio is synthesized, not a professionally recorded library. Native bloom is implemented; a live volumetric fluid solver and GPU-compute particle simulation are not.

## Documentation

- [Current status](PROJECT_STATUS.md) and [Realism V3 delivery evidence](docs/evidence/realism-v3-delivery.md).
- [UI V3 plan](docs/ui-v3/PLAN.md) and [realism upgrade specifications](docs/realism-v2/README.md).
- [Documentation index](docs/README.md), [original implementation evidence](docs/evidence/runtime-implementation.md), [development workflow](DEVELOPMENT.md) and [agent instructions](AGENTS.md).

```sh
python -m pip install -r scripts/requirements-docs.txt
python scripts/validate_docs.py
```

Documentation validation checks structure, not visual realism or hardware performance. Historical plans remain preserved. Builds include third-party notices. Final branding, public application licensing and a permanent domain remain owner decisions. This is software simulation, not physical firework guidance.

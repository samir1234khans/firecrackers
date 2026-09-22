# Firecrackers

A single-screen festival night: choose a firework, set its position, launch once and follow the fuse, flight, burst and falling embers. Five distinct effects run a seeded simulation rather than a recorded video.

**Current build: `2026-09-22.1` — viewability and launch recovery.**

[Open the website](https://firecrackers-a93nle.v2.appdeploy.ai/) · [Open compatibility graphics](https://firecrackers-a93nle.v2.appdeploy.ai/?backend=canvas)

The current repair is on `fix/viewability-recovery`, based on the newer `fix/video-launch-flow` work. Main and the older V3 branches are preserved. The latest evidence is in [viewability and launch recovery](docs/evidence/viewability-recovery.md); earlier milestones remain historical records.

## Current experience

Gold Willow, Multicolor Peony, Chrysanthemum, Silver Crossette Crackle and Grand Finale share placement, immutable committed-flight state, wind, smoke and light. A single press admits one rocket. While it flies, the next family can be selected without changing the active effect. The launch action becomes available again after the primary break/rearm transition. The command deck remains visible during manual play.

The primary renderer uses the existing perspective 3D scene, rocket and stage materials, trails, secondary carriers, smoke, detached embers and bloom. Ultra is still the default graphics preference; sound starts off, reduced flashes stays enabled, and explicitly saved quality/comfort choices remain respected. A 60 fps target is not a device-performance guarantee.

A readable initial page and React recovery screen prevent entry/interface failures from becoming a blank root. Graphics startup is bounded and falls back from the primary renderer to forced WebGL and finally clearly labelled Canvas 2D compatibility mode. The compatibility renderer is less detailed but runs the same five effects without requiring GPU context creation. Settings exposes deliberate renderer-switch and reload actions.

The app retains pause/resume, silent startup, opt-in sound/haptics, automatic shows, a finite finale, protected/transparent presentation output, local preferences, offline caching and explicit updates. Device-only actions give support/permission feedback. No accounts, backend, API keys, purchases or new external media were introduced.

## Run and validate

Use the pinned Node version in `.nvmrc` and the committed dependency lock.

```sh
npm ci
npm run dev
```

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:soak
npm run test:e2e
```

For the extra failure-injection/layout suite, serve the production build with `npm run preview` on port 4173, then run `npm run test:viewability`. Install the configured Chromium runtime with `npx playwright install chromium` when needed. Development servers bind to loopback; only publish production builds.

The public verification workflow computes the 31-module release fingerprint, checks the actual hosted `/release.json`, and runs both browser suites against the public website. JSX comparison excludes only audited static host diagnostic attributes; it does not silently accept application-code differences. `index.html`, hosting wrappers and unrelated historical files are outside the fingerprint's declared module scope and are checked separately where the browser flows exercise them.

## Controls and updates

Use the named Launch firework button or L to launch. 1–5 choose a family, arrows adjust placement when ready, Space pauses/resumes, M controls sound, and Escape closes a panel/reveals presentation controls. The launch action is deliberately disabled during a committed flight, pause or resource-capacity hold. Its status text explains the current state.

The build identifier appears on the manual deck and in Settings → Graphics details. Use Update & restart when a cached older installation offers an update; a committed flight is not automatically interrupted for it.

## Evidence and limits

See the [current delivery record](docs/evidence/viewability-recovery.md) for exact commits, deployment snapshot, CI runs, tests, screenshots, source parity and remaining qualification limits. The [original documentation map](docs/README.md), [development workflow](DEVELOPMENT.md), [agent instructions](AGENTS.md), [V3 delivery](docs/evidence/realism-v3-delivery.md) and [video-flow plan](docs/video-flow/PLAN.md) remain available in the repository.

Physical Android/tablet, Safari/iOS, hardware WebGPU parity, real-time thermal/endurance, OBS and complete flash/accessibility qualification are not established by Chromium emulation. Final art/audio approval is separate from a working build. This is a software simulation, not physical firework guidance.

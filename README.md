# Firecrackers

A single-screen festival night with **ten selectable fireworks**. Choose a style, set its position, press **Launch firework**, and watch the fuse, flight, burst and falling embers. The effects run a seeded simulation, not prerecorded video.

**Current Cloudflare production: Grand Collection, build `2026-09-29.1`. Main is the canonical application baseline.**

[Open Firecrackers](https://firecrackers.mainandmany.com/) · [Compatibility graphics](https://firecrackers.mainandmany.com/?backend=canvas) · [Prior AppDeploy preview](https://firecrackers-a93nle.v2.appdeploy.ai/)

Start new development branches from current `main` and open pull requests back to `main`. The owner-authorized promotion incorporates the Grand Collection, viewability recovery, single-press launch, ignition reliability and cinematic V3 work. Earlier feature branches remain as history. See [the promotion audit](docs/evidence/main-promotion.md); an older V3 or alternate-implementation checkout is not the current runtime.

## Two collections, ten identities

**Classics:** Gold Willow, Multicolor Peony, Chrysanthemum, Silver Crossette Crackle and Grand Finale.

**Grand collection:** Aurora Crown (jade crown and violet heart), Ruby Dahlia (ruby/rose petals and champagne center), Sapphire Saturn (blue sphere inside a tilted golden orbit), Phoenix Palm (amber branches splitting into rose leaves), and Opal Supernova (seven traveling jewels opening into a staggered bouquet).

The two collection buttons keep five readable style targets visible at a time. Switching collections remembers its most recent selection within the session; the selected style survives reload. New styles have their own geometry, timing, palette aging and bounded child effects rather than being five recolors of one burst.

## Playback and recovery

One ready press admits one rocket. Repeated input cannot duplicate it. The selected next family can change without mutating the committed flight; launch and position remain locked until the rearm transition. Manual controls stay visible during normal play. Auto show, Festival and the finite Finale remain available.

The preferred renderer uses the existing perspective 3D scene, stage, paper-wrapped rocket, trails, smoke, detached embers and bloom. Ultra remains the default quality, with a 60 fps target, not an FPS guarantee. Reduced flashes stays enabled; sound and haptics start off. Explicitly saved lower quality and comfort preferences are respected.

Startup and rendering failures retain readable recovery controls. The app can fall back through compatible WebGL to clearly labelled Canvas graphics. Both renderers support all ten identities. Offline caching, explicit updates, pause ownership, sound cancellation, protected display areas and transparent output remain intact.

## Controls

Use **Grand collection** to access styles 06–10, or **Classics** for 01–05. Keyboard keys **1–9 and 0** select the ten styles in order; **L** launches, arrows adjust placement when ready, **Space** pauses/resumes, **M** controls sound and **Escape** closes a panel or reveals presentation controls. Keyboard shortcuts do not replace normal input behavior while editing controls.

The build identifier is shown in the manual deck and Settings → Graphics details. An older cached installation can use its explicit Update & restart action; updates do not silently interrupt an active flight.

## Run and test

Use the Node version in `.nvmrc` and the committed dependency lock.

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
python scripts/validate_docs.py
```

For browser tests, install the configured Chromium runtime with `npx playwright install chromium`, serve the production build using `npm run preview -- --port 4173`, then run `npm run test:grand`, `npm run test:e2e` and `npm run test:viewability`. CI installs required Linux browser dependencies and runs the full ten-effect workflow for main and pull requests into main. Development servers bind to loopback; publish production builds only.

Cloudflare production uses Workers Static Assets and the custom domain declared in `wrangler.jsonc`. From a clean checkout with Cloudflare authorization, run `npm ci`, the checks above, then `npm run cloudflare:deploy`. The command rebuilds `dist/` before publishing. Check the live `/release.json` fingerprint and rerun the browser suites against the public URL after each deployment. The current Cloudflare release receipt is in [production evidence](docs/evidence/cloudflare-production-2026-09-29.md).

## Verified delivery

**105 code/regression tests and 87 checks against the actual public website passed.** The live checks comprise 43 Grand Collection checks, 29 original launch/platform checks and 15 viewability/recovery checks. Both desktop and mobile-emulated WebGL/Canvas were exercised. The previously failing 320×480 layout is corrected and passes the unchanged visibility and hit-target assertions.

Public verification run `36507918339` matches all **35 normalized delivered modules** to the reviewed repository. Only audited static host diagnostic labels are excluded from JSX comparison. The fingerprint is scoped; it does not claim the entire hosting wrapper is identical. The 7,200-second accelerated logical soak passed but is not a two-hour GPU endurance test. Promotion validation is recorded separately in the promotion pull request and workflow results.

See [delivery evidence](docs/evidence/grand-collection-delivery.md), [machine-readable results](docs/evidence/grand-collection-results.json), [current status](PROJECT_STATUS.md), [Grand Collection plan](docs/grand-collection/PLAN.md), [development workflow](DEVELOPMENT.md) and [documentation map](docs/README.md).

Physical Android/tablet, Safari/iOS, hardware WebGPU parity, thermal/endurance, OBS and complete flash/accessibility qualification are not established by browser emulation. Final visual/audio approval remains separate. The current art and audio are original procedural work, not imported production GLBs, Blender fluid bakes or a recorded festival library. No accounts, backend, paid services or physical-firework instructions are introduced.

# Firecrackers

A single-screen festival night with **ten selectable fireworks**. Choose a style, set its position, press **Launch firework**, and watch the fuse, flight, burst and falling embers. The effects run a seeded simulation, not prerecorded video.

**Live Cloudflare production: hardware WebGPU repair, build `2026-09-30.1`.** See [the production release receipt](docs/evidence/webgpu-production-release-2026-09-30.md) for the deployed version, public checks, and rollback reference. Main is the canonical application baseline.

The [30 September branch reconciliation and republish](docs/evidence/branch-reconciliation-2026-09-30.md) confirms that all current feature/fix branches are already incorporated in main and records the current Cloudflare Worker version.

Build `.6` loads authored art independently and keeps an active firework moving by switching to compatibility graphics after repeated severe renderer stalls. The [isolated preview](https://firecrackers-graphics-preview.allygym-api.workers.dev/) remains for comparison; see the [diagnosis](docs/evidence/graphics-loading-diagnosis-2026-09-29.md), [preview evidence](docs/evidence/graphics-recovery-preview-2026-09-29.md), and [public release receipt](docs/evidence/graphics-recovery-production-release-2026-09-29.md).

Build `.5` adds borderless icon controls, an always-visible selected quick Launch, immediate next-rocket readiness, and drag-to-terrace placement. The [isolated preview](https://firecrackers-pad-preview.allygym-api.workers.dev/) remains for comparison; see [candidate evidence](docs/evidence/pad-launch-preview-2026-09-29.md) and [public release evidence](docs/evidence/pad-launch-production-release-2026-09-29.md).

The earlier `.3` release refined portrait water framing, broken effect reflections, smoke-family atlas selection, and an original textured Blender terrace. [Review its image studies and same-seed `.2` versus `.3` browser comparisons](docs/evidence/realism-refinement-2026-09-29.md), or [open that retained preview](https://firecrackers-realism-preview.allygym-api.workers.dev/).

[Open Firecrackers](https://firecrackers.mainandmany.com/) · [Compatibility graphics](https://firecrackers.mainandmany.com/?backend=canvas) · [Prior AppDeploy preview](https://firecrackers-a93nle.v2.appdeploy.ai/)

Start new development branches from current `main` and open pull requests back to `main`. The owner-authorized promotion incorporates the Grand Collection, viewability recovery, single-press launch, ignition reliability and cinematic V3 work. Earlier feature branches remain as history. See [the promotion audit](docs/evidence/main-promotion.md); an older V3 or alternate-implementation checkout is not the current runtime.

## Two collections, ten identities

**Classics:** Gold Willow, Multicolor Peony, Chrysanthemum, Silver Crossette Crackle and Grand Finale.

**Grand collection:** Aurora Crown (jade crown and violet heart), Ruby Dahlia (ruby/rose petals and champagne center), Sapphire Saturn (blue sphere inside a tilted golden orbit), Phoenix Palm (amber branches splitting into rose leaves), and Opal Supernova (seven traveling jewels opening into a staggered bouquet).

The detailed picker has two collections of five readable style targets each. The candidate also keeps all five Classics in the left desktop rail and all five Grand styles in the right rail, with a compact expandable phone dock. Browsing does not change the committed selection; choosing a style persists across reload. New styles have their own geometry, timing, palette aging and bounded child effects rather than being five recolors of one burst.

## Playback and recovery

One ready press admits one rocket. Repeated input cannot duplicate an active fuse or flight. The selected next family can change without mutating the committed flight; the candidate makes the next rocket available as soon as the burst begins when particle capacity permits. Manual controls stay visible during normal play. Auto show, Festival and the finite Finale remain available.

The preferred renderer uses the existing perspective 3D scene, stage, paper-wrapped rocket, trails, smoke, detached embers and bloom. Ultra remains the default quality, with a 60 fps target, not an FPS guarantee. Reduced flashes stays enabled; sound and haptics start off. Explicitly saved lower quality and comfort preferences are respected.

Startup and rendering failures retain readable recovery controls. The app can fall back through compatible WebGL to clearly labelled Canvas graphics. Both renderers support all ten identities. Offline caching, explicit updates, pause ownership, sound cancellation, protected display areas and transparent output remain intact.

## Open central stage

Six compact, transparent control groups frame the left and right edges. The measured central corridor stays clear on desktop and phones. Settings and the firework drawer pause the scene while open and restore the previous pause state on close.

Drag a style into the sky to create one immediate burst at that point. Drop it near the terrace to light a normal rocket at that horizontal position. Invalid drops cancel; keyboard users can choose **Burst selected style in center** or use a labelled Launch control. The main and adjacent Launch controls use borderless flame icons with full hit areas; the selected style's adjacent action stays visible. Normal launches retain the fuse and ascent sequence.

Original Blender smoke, flame, rocket and terrace assets load progressively over procedural fallbacks. Rippling reflections follow the actual effects, and optional CC0 recordings augment the original sound design. See [asset provenance](assets-source/PROVENANCE.md) and [design review](assets-source/DESIGN.md).

## Controls

Use **Grand collection** to access styles 06–10, or **Classics** for 01–05. Keyboard keys **1–9 and 0** select the ten styles in order; **L** launches, arrows adjust placement when ready, **Space** pauses/resumes, **M** controls sound and **Escape** closes a panel or reveals presentation controls. Keyboard shortcuts do not replace normal input behavior while editing controls.

The build identifier is shown in Settings. An older cached installation can use its explicit Update & restart action; updates do not silently interrupt an active flight.

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

For browser tests, install the configured Chromium runtime with `npx playwright install chromium`, serve the production build using `npm run preview -- --port 4173`, then run `npm run test:stage`, `npm run test:grand`, `npm run test:e2e` and `npm run test:viewability`. CI installs required Linux browser dependencies and runs the full ten-effect workflow for main and pull requests into main. Development servers bind to loopback; publish production builds only.

Cloudflare production uses Workers Static Assets and the custom domain declared in `wrangler.jsonc`. From a clean checkout with Cloudflare authorization, run `npm ci`, the checks above, then `npm run cloudflare:deploy`. The command rebuilds `dist/` before publishing. Check the live `/release.json` fingerprint and rerun the browser suites against the public URL after each deployment. The current [Cloudflare production receipt](docs/evidence/graphics-recovery-production-release-2026-09-29.md) records build `.6` and its rollback version.

## Historical Grand Collection delivery

**105 code/regression tests and 87 checks against the actual public website passed.** The live checks comprise 43 Grand Collection checks, 29 original launch/platform checks and 15 viewability/recovery checks. Both desktop and mobile-emulated WebGL/Canvas were exercised. The previously failing 320×480 layout is corrected and passes the unchanged visibility and hit-target assertions.

Public verification run `36507918339` matches all **35 normalized delivered modules** to the reviewed repository. Only audited static host diagnostic labels are excluded from JSX comparison. The fingerprint is scoped; it does not claim the entire hosting wrapper is identical. The 7,200-second accelerated logical soak passed but is not a two-hour GPU endurance test. Promotion validation is recorded separately in the promotion pull request and workflow results.

See [delivery evidence](docs/evidence/grand-collection-delivery.md), [machine-readable results](docs/evidence/grand-collection-results.json), [current status](PROJECT_STATUS.md), [Grand Collection plan](docs/grand-collection/PLAN.md), [development workflow](DEVELOPMENT.md) and [documentation map](docs/README.md).

Physical Android/tablet, Safari/iOS, hardware WebGPU parity, thermal/endurance, OBS and complete flash/accessibility qualification are not established by browser emulation. Final visual/audio approval remains separate. The waterfront upgrade adds original Blender GLBs and animated procedural-volume atlases plus verified CC0 recordings. The source volumes are not fluid simulations. No accounts, backend, paid services or physical-firework instructions are introduced.

The `2026-09-30.1` WebGPU repair and next Three.js/TSL/Blender work are documented in [hardware diagnosis and roadmap](docs/evidence/webgpu-startup-2026-09-30.md).

The next `2026-09-30.2` cinematic candidate adds original atmospheric scenery, Blender smoke and continuous trails. [Implementation plan and acceptance gates](docs/evidence/cinematic-realism-2026-09-30/PLAN.md).

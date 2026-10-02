**Cinematic show candidate:** build `2026-10-02.4` upgrades Festival/Finale with three original 90-second scores, optional original ambient music, choreographed placement and coherent burst lighting. [Implementation and current gates](docs/evidence/cinematic-shows-2026-10-02/IMPLEMENTATION.md) · [approved plan](docs/plans/CINEMATIC-SHOWS.md). Production remains `2026-10-02.3` pending final-source stability/timing and complete CI.

**Current production: `2026-10-02.3`** at [Firecrackers](https://firecrackers.mainandmany.com/). Always Play adds four quantity levels, explicit Start/Stop, smooth pace changes and immersive controls while preserving moonlit water and all thirteen effects. [Production receipt](docs/evidence/always-play-2026-10-02/PRODUCTION.md) · [controls](docs/evidence/always-play-2026-10-02/final/controls.html) · [PR #32](https://github.com/samir1234khans/firecrackers/pull/32). Complete PR/main CI and public functional checks passed. Sustained new-mode performance remains unqualified after owner-shortened testing and rejected shared-hardware timings; physical devices/Safari/thermal/flash conformance remain unqualified. Earlier release entries below are historical.

**Previous production: `2026-10-01.11`** at [Firecrackers](https://firecrackers.mainandmany.com/), from clean main `dd62559` / [PR #31](https://github.com/samir1234khans/firecrackers/pull/31). Moonlit swells, planar reflections, hull contacts and damp coping preserve all thirteen effects. Calm/Festival/Finale offer smooth immersive controls. PR/main CI, 244 units, 456 public checks, four native startup scenarios and documented component performance qualification passed. Previous Worker retained for rollback; physical phones/Safari/thermal endurance remain unqualified. [Production receipt](docs/evidence/moonlit-water-2026-10-01/PRODUCTION.md) · [preview](https://firecrackers-moonlit-preview.allygym-api.workers.dev/) · [matched captures](docs/evidence/moonlit-water-2026-10-01/final/comparisons.html).

The candidate/release entries below preserve earlier checkpoints and are superseded by this receipt.

**Latest candidate:** [build `.11` qualification](docs/evidence/moonlit-water-2026-10-01/FINAL-QUALIFICATION.md) records the implemented water and immersion changes, final preview and remaining release gates. Production remains `.4`.

**Immersive shows:** Calm, Festival and Finale now offer an opt-in toggle that smoothly hides every ordinary control, leaving one Show controls button. [Implementation and verification](docs/evidence/moonlit-water-2026-10-01/IMMERSIVE-UI-IMPLEMENTATION.md). Production remains unchanged.

**Moonlit water candidate: `2026-10-01.11`** in [PR #31](https://github.com/samir1234khans/firecrackers/pull/31), with an [isolated preview](https://firecrackers-moonlit-preview.allygym-api.workers.dev/). Shared swells, broken moonlight, planar reflections, hull immersion and damp coping preserve all thirteen effects. [Plan](docs/evidence/moonlit-water-2026-10-01/PLAN.md) · [qualification and preview receipt](docs/evidence/moonlit-water-2026-10-01/PREVIEW.md). Production remains `.4`.

**Previous production: `2026-10-01.4`** at [Firecrackers](https://firecrackers.mainandmany.com/). Main includes the realistic moon and water, all thirteen fireworks, open-sky controls, responsive launch support, moon-led startup and the rocket-to-burst stall fix. [Production and branch reconciliation receipt](docs/evidence/latest-production-2026-10-01/PRODUCTION.md) · [retained isolated preview](https://firecrackers-burst-preview.allygym-api.workers.dev/) · [matched captures and moon intro](docs/evidence/control-layout-2026-10-01/comparison.html).

Deployed from clean source main `8b491d2` after [PR #29](https://github.com/samir1234khans/firecrackers/pull/29) and main CI passed. Worker `57796211-f2a8-4fc1-8381-4c9235bfb5bd`; fingerprint `965c6eaa6ebd5aef2f5922831504a6bbe1c3879e24a26532432af279f5e09d51`. The previous `.8` Worker is retained for rollback. Physical phones, Safari and sustained GPU/thermal qualification remain untested.

# Firecrackers

Previous release: **bottom collection and upper canopy / `2026-09-30.8`** at [firecrackers.mainandmany.com](https://firecrackers.mainandmany.com/), from main `585d82e` / [PR #24](https://github.com/samir1234khans/firecrackers/pull/24), Worker `5a577d62-1deb-4770-b780-784d03574c7a`. All ten icons launch directly from the bottom, with a right control rail, compact shared panels and higher admission-time burst profiles. PR/main CI, 427 production browser checks, exact HTTP/assets and native default startup passed. Physical phones/Safari, real OS zoom and sustained GPU/thermal qualification remain untested. [Production evidence](docs/evidence/bottom-collection-2026-09-30/PRODUCTION.md) records the exact source, fingerprint and rollback.

Previous release: **waterfront v008 / `2026-09-30.7`**. Its shoreline homes, original Blender stone quay, canoe materials and bounded water contact remain in the current app. [Previous production receipt](docs/evidence/waterfront-realism-2026-09-30/PRODUCTION.md) and [waterfront gallery](docs/evidence/waterfront-realism-2026-09-30/comparison.html) retain that release history.


A single-screen festival night with **thirteen selectable fireworks**. Tap any collection firework to launch from the saved terrace position, or drag into the sky for an immediate burst and onto the terrace for a normal rocket. The effects run a seeded simulation, not prerecorded video.

**Previous release: transparent panels, build `2026-09-30.6`.** Compact translucent Picker, Position, Shows, four Settings tabs, Help, reset and recovery screens now match the borderless playback controls. Desktop sheets sit at the edges; phone sheets scroll within 60% of viewport height. Native focus, pause ownership, all ten styles and sky/terrace dragging remain. See [the prior panel production receipt](docs/evidence/transparent-panels-2026-09-30/PRODUCTION.md), [per-surface plan](docs/evidence/transparent-panels-2026-09-30/PLAN.md), [actual UI gallery](docs/evidence/transparent-panels-2026-09-30/review.html), [WebGPU panel captures](docs/evidence/transparent-panels-2026-09-30/hardware-captures/README.md), or [try the retained preview](https://firecrackers-panels-preview.allygym-api.workers.dev/). Main is the canonical shipped baseline. The [prior galactic release](docs/evidence/interactive-galactic-sky-2026-09-30/PRODUCTION.md) and [same-seed sky comparisons](docs/evidence/interactive-galactic-sky-2026-09-30/comparison.html) retain the authored waterfront, CC0 boats, smoke, continuous trails and interactive sky evidence.

The earlier [30 September branch reconciliation and republish](docs/evidence/branch-reconciliation-2026-09-30.md) records the branches and `.6` Worker state at that checkpoint. The living-river production receipt above supersedes its deployment identifier while preserving that history.

Build `.6` loads authored art independently and keeps an active firework moving by switching to compatibility graphics after repeated severe renderer stalls. The [isolated preview](https://firecrackers-graphics-preview.allygym-api.workers.dev/) remains for comparison; see the [diagnosis](docs/evidence/graphics-loading-diagnosis-2026-09-29.md), [preview evidence](docs/evidence/graphics-recovery-preview-2026-09-29.md), and [public release receipt](docs/evidence/graphics-recovery-production-release-2026-09-29.md).

Build `.5` adds borderless icon controls, an always-visible selected quick Launch, immediate next-rocket readiness, and drag-to-terrace placement. The [isolated preview](https://firecrackers-pad-preview.allygym-api.workers.dev/) remains for comparison; see [candidate evidence](docs/evidence/pad-launch-preview-2026-09-29.md) and [public release evidence](docs/evidence/pad-launch-production-release-2026-09-29.md).

The earlier `.3` release refined portrait water framing, broken effect reflections, smoke-family atlas selection, and an original textured Blender terrace. [Review its image studies and same-seed `.2` versus `.3` browser comparisons](docs/evidence/realism-refinement-2026-09-29.md), or [open that retained preview](https://firecrackers-realism-preview.allygym-api.workers.dev/).

[Open Firecrackers](https://firecrackers.mainandmany.com/) · [Compatibility graphics](https://firecrackers.mainandmany.com/?backend=canvas) · [Prior AppDeploy preview](https://firecrackers-a93nle.v2.appdeploy.ai/)

Start new development branches from current `main` and open pull requests back to `main`. The owner-authorized promotion incorporates the Grand Collection, viewability recovery, single-press launch, ignition reliability and cinematic V3 work. Earlier feature branches remain as history. See [the promotion audit](docs/evidence/main-promotion.md); an older V3 or alternate-implementation checkout is not the current runtime.

## Two collections, ten identities

**Classics:** Gold Willow, Multicolor Peony, Chrysanthemum, Silver Crossette Crackle and Grand Finale.

**Grand collection:** Aurora Crown (jade crown and violet heart), Ruby Dahlia (ruby/rose petals and champagne center), Sapphire Saturn (blue sphere inside a tilted golden orbit), Phoenix Palm (amber branches splitting into rose leaves), and Opal Supernova (seven traveling jewels opening into a staggered bouquet).

The bottom collection exposes all ten styles in catalog order: two rows of five below 680 CSS pixels of available width, otherwise one row with separated Classics and Grand groups. Each icon is a 48px touch target. Names appear on hover/focus, and a small gold marker identifies selection. The optional catalog lives inside Help.

## Playback and recovery

One ready press admits one rocket. Repeated input cannot duplicate an active fuse or flight. The selected next family can change without mutating the committed flight; the candidate makes the next rocket available as soon as the burst begins when particle capacity permits. Manual controls stay visible during normal play. Auto show, Festival and the finite Finale remain available.

The preferred renderer uses the existing perspective 3D scene, stage, paper-wrapped rocket, trails, smoke, detached embers and bloom. Ultra remains the default quality, with a 60 fps target, not an FPS guarantee. Reduced flashes stays enabled; sound and haptics start off. Explicitly saved lower quality and comfort preferences are respected.

Startup and rendering failures retain readable recovery controls. The app can fall back through compatible WebGL to clearly labelled Canvas graphics. Both renderers support all ten identities. Offline caching, explicit updates, pause ownership, sound cancellation, protected display areas and transparent output remain intact.

## Open central stage

The bottom tray reserves 128px on phones and 76px on wider screens, plus safe insets. Pause, Sound and Controls sit on the right. Controls opens Show mode, Position, Settings, Fullscreen and Help; modal panels preserve manual pause and restore focus.

A tap launches once when admission permits. Drag begins at 8px: sky release bursts at that point; terrace release launches from the corresponding position. Water, controls, tray, outside release and cancellation launch nothing. Normal rockets resolve a 31–37% upper-sky apex at admission. Resizing updates future profiles without changing a committed flight; fixed camera anchors keep the waterfront stable.

Original Blender smoke, flame, rocket and terrace assets load progressively over procedural fallbacks. The CC0 wooden canoe supplies real textured hull geometry for three boats, with original canopy/candles and distant homes. Rippling reflections follow the actual effects and practical lamp positions, and optional CC0 recordings augment the original sound design. See [asset provenance](assets-source/PROVENANCE.md), [river implementation](docs/evidence/living-river-2026-09-30/IMPLEMENTATION.md) and [design review](assets-source/DESIGN.md).

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

Cloudflare production uses Workers Static Assets and the custom domain declared in `wrangler.jsonc`. From a clean checkout with Cloudflare authorization, run `npm ci`, the checks above, then `npm run cloudflare:deploy`. The command rebuilds `dist/` before publishing. Check the live `/release.json` fingerprint and rerun the browser suites against the public URL after each deployment. The current [Cloudflare production receipt](docs/evidence/interactive-galactic-sky-2026-09-30/PRODUCTION.md) records build `2026-09-30.5`, its 58-entry fingerprint and the preceding `.4` Worker rollback reference.

## Historical Grand Collection delivery

**105 code/regression tests and 87 checks against the actual public website passed.** The live checks comprise 43 Grand Collection checks, 29 original launch/platform checks and 15 viewability/recovery checks. Both desktop and mobile-emulated WebGL/Canvas were exercised. The previously failing 320×480 layout is corrected and passes the unchanged visibility and hit-target assertions.

Public verification run `36507918339` matches all **35 normalized delivered modules** to the reviewed repository. Only audited static host diagnostic labels are excluded from JSX comparison. The fingerprint is scoped; it does not claim the entire hosting wrapper is identical. The 7,200-second accelerated logical soak passed but is not a two-hour GPU endurance test. Promotion validation is recorded separately in the promotion pull request and workflow results.

See [delivery evidence](docs/evidence/grand-collection-delivery.md), [machine-readable results](docs/evidence/grand-collection-results.json), [current status](PROJECT_STATUS.md), [Grand Collection plan](docs/grand-collection/PLAN.md), [development workflow](DEVELOPMENT.md) and [documentation map](docs/README.md).

Physical Android/tablet, Safari/iOS, hardware WebGPU parity, thermal/endurance, OBS and complete flash/accessibility qualification are not established by browser emulation. Final visual/audio approval remains separate. The waterfront upgrade adds original Blender GLBs and animated procedural-volume atlases plus verified CC0 recordings. The source volumes are not fluid simulations. No accounts, backend, paid services or physical-firework instructions are introduced.

The `2026-09-30.1` WebGPU repair and next Three.js/TSL/Blender work are documented in [hardware diagnosis and roadmap](docs/evidence/webgpu-startup-2026-09-30.md).

The `2026-09-30.2` cinematic release adds original atmospheric scenery, Blender smoke and continuous trails. [Implementation plan and acceptance gates](docs/evidence/cinematic-realism-2026-09-30/PLAN.md), [implementation evidence](docs/evidence/cinematic-realism-2026-09-30/IMPLEMENTATION.md), and [production receipt](docs/evidence/cinematic-realism-2026-09-30/PRODUCTION.md) retain separate design, browser, performance and deployment evidence.

The current `2026-09-30.4` living-river release adds the downloaded CC0 textured boat source, candlelit nauka adaptation, clustered shore village and bounded practical reflections. [Implementation](docs/evidence/living-river-2026-09-30/IMPLEMENTATION.md) and [production verification](docs/evidence/living-river-2026-09-30/PRODUCTION.md) distinguish actual PC Chrome hardware from viewport emulation, software browser suites and unqualified physical-phone/thermal targets.

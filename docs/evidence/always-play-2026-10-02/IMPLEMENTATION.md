# Always Play implementation and qualification

Candidate build `2026-10-02.1`, runtime source `a6eda39e56421e3009da772a603785ab97d30a79`, [PR #32](https://github.com/samir1234khans/firecrackers/pull/32). Status: functional implementation complete; sustained performance and release gates are running. Production is still `.11`.

[Isolated preview](https://firecrackers-always-preview.allygym-api.workers.dev/) uses Worker `9e8fedac-f05c-4358-a2ff-cb51e66ef337`, fingerprint `4b7678824088f61f232b5fd37da6f746de3e3bd400a4f3c5c6b4b48638f50042`. The [plan](../../plans/ALWAYS-PLAY.md) is retained as proposed targets; this receipt records actual behavior.

## Delivered behavior

Always Play is the fifth explicit Shows-dialog mode. The four old compass directions remain unchanged. Native radios choose 1 Low, 2 Medium, 3 High and 4 Super High; Medium is the first-use default. Start is explicit play intent, Stop leaves already admitted rockets and children intact. Pace changes ease over active simulation time without replacing airborne recipes. The infinity glyph marks the mode; the existing immersive toggle hides all ordinary chrome and leaves one reveal control.

One independent fixed-clock director owns a thirteen-entry shuffled feature bag and one pending intent. Short connectors fill feature cooldowns; high levels use two/three-accent phrase timing with periodic breathing space. No launch backlog, recursive composite, second animation loop, new particle pool or reflection allocation was added. All thirteen recipes, their indices, placement policy and legacy shows remain unchanged.

Admission retains existing capacity and unborn-child reservations. Connectors normally preserve one unit and 520 heads of headroom; solo featured heavy effects escape that soft reserve so Low can still play all thirteen. Soft trail/smoke pressure lengthens spacing, while a 90% head-pressure guard and existing hard caps remain authoritative. Initial intervals are 7.2/3.15/1.35/.82 seconds before jitter, phrasing and pressure. The first logical soak delivered Standard rates of about 6.5/14.8/30.8/52.1 rockets per minute; these are simulation rates, not measured GPU throughput.

A bounded 120-sample feedback window is fed by the existing renderer loop. Sustained p95 above 35ms slows demand in 15% steps; sustained healthy cadence below 34ms restores a step after ten seconds. The thresholds account for Canvas's existing 30fps render schedule; the proposed 25ms recovery threshold would never recover that backend. QA records timestamped feedback decisions through the director interface for replay. The chosen pace remains visible with a quiet limiting explanation.

Manual launch intent stops automatic scheduling even when admission is busy, keeps the requested valid family selected and leaves the committed flight intact. It never queues a manual rocket silently. No rejected auto attempt emits repeated capacity messages.

Preferences migrate versions 1/2 to 3 and validate the saved pace. Running and hidden state are never persisted. Ordinary interactive visits do not auto-start from stored settings or `show=always`; explicit scene/transparent presentation links allowlist `pace=1..4`. Sound, haptics, fullscreen and wake lock use existing independent consent/capability paths. Reduced flashes stays enabled by default, retains the three-second minimum automatic-launch interval and limits reflected energy. Reduced motion disables UI animation and retains existing scene motion policy.

## Qualification completed so far

- 256 unit checks, lint and production build passed; documentation validation will be repeated at the evidence checkpoint.
- Native installed Chrome WebGPU/WebGL/Canvas interaction checks passed all seven viewports. Ordinary reload, explicit display links, real-time playback, pace changes, busy manual takeover, immersion, Space pause and reduced-motion transitions were exercised.
- First twelve two-hour logical soaks passed Low/Standard/Ultra pool, reservation, cue and finite-state bounds. A second seed set with changing comfort preferences is running.
- Original launch/platform, Grand Collection, open-sky controls, immersion, moonlit water, stage/layout, viewability and actual service-worker/context-loss regressions passed locally. Hosted new-mode checks and CI are running.
- Local `npm audit --audit-level=high` passed; npm reports one existing low-severity development dependency advisory for `serialize-javascript`. No dependency upgrade was included.

Browser plugin was unavailable; repository Playwright used installed Chrome for native checks and the existing software-browser suites for separate regression evidence. Phone viewports are emulated. Physical phones, Safari, thermal endurance and completed GPU timings remain unqualified. A launch cadence floor alone is not WCAG flash conformance; formal full-frame flash analysis is not claimed.

## Reproducible checks

Use the repository Node 22.16+ runtime. `npm test` includes director/lifecycle/pace tests. `node tests/always-play-soak.mjs <output>` runs two logical hours for each of twelve tier/pace combinations; `ALWAYS_SOAK_MIXED=1` changes comfort settings during those runs. `node tests/always-play-browser.mjs <output>` checks installed native Chrome, with `ALWAYS_URL` selecting the origin. CI explicitly sets `ALWAYS_SOFTWARE=1` and `ALWAYS_BACKENDS=webgl,canvas`, keeping software evidence distinct.

`node tests/always-play-performance.mjs <output>` measures sequential counterbalanced legacy Festival runs and all four new paces through the existing scalar probe. It records exact release manifests, adapter/driver labels, CPU submission separately from render cadence, raw samples, source-matched videos and a ten-minute Super High peak. Do not run it beside another graphics benchmark or logical soak. `wrangler.always-preview.jsonc` has no production route.

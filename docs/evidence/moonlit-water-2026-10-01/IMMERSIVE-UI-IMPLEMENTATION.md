**Released:** build `.11` is live. [Production, main reconciliation, public checks and rollback](PRODUCTION.md) supersede the checkpoint below, which remains as history.

**Latest implementation: build `.11`.** See [final qualification](FINAL-QUALIFICATION.md) for current source, isolated preview, checks and pending release gates. The receipt below preserves its historical checkpoint.

> Historical `.6` receipt. The current `.9` implementation and qualification are recorded in [FINAL-QUALIFICATION](FINAL-QUALIFICATION.md). Earlier failures below remain evidence.

# Immersive automated shows

Build `2026-10-01.6` extends the moonlit-water candidate in PR #31. Calm, Festival and Finale expose a 48px Hide controls / Show controls toggle. The session-local setting fades the ordinary interface over 220 ms and crossfades the eye glyph over 140 ms. App and OS reduced-motion preferences remove these transitions.

The hidden controls are inert immediately. One toggle remains; pointer movement and sky taps neither reveal controls nor launch a manual firework. Escape reveals controls. Manual mode, the finite Finale ending and graphics errors restore the normal interface. The toggle preserves simulation, pause, sound, placement and scene framing. Presentation/transparent output retains its existing behavior.

## Verification

The dedicated `tests/immersive-browser.mjs` harness uses installed headless Chrome, individually requested WebGPU, WebGL and Canvas, and seven viewport sizes from 320x480 through 1920x1080. It checks control inertness, toggle dimensions, stable hero framing, no sky-tap launch, keyboard reveal, Manual restoration, Calm progression, Finale completion and OS reduced motion. Phone viewports are emulated; physical devices remain unqualified.

The existing water performance qualification is still conditional. This UI feature does not remove the previously recorded timing failures. An updated isolated preview and current-source checks are recorded as they complete. Production has not been promoted.

Local verification passed on the implemented build: 241 unit tests, lint, build, 978 documentation checks and a 7200-second accelerated logical soak (1290 launches / 3995 bursts). The immersive matrix passed all 21 backend/viewport cases, plus Calm progression, Finale termination and reduced motion on each backend. Screenshots and the report are retained with this receipt. These are local headless browser checks; hosted and CI results are reported separately.

## Current-source performance qualification

The complete 24-run native Chrome AB/BA experiment on fingerprint `9b119981f4701fae5209a620351ceb1b5c1b63d5f4ce55d5e544606aafe43ffa` retains strict exit 1. Fifteen of eighteen pooled rendered-cadence conditions and nine of twelve burst-transition conditions meet the p95 budget; three of each miss it. Neither repetition pair establishes a repeated new rendered transition over 50 or 100 ms. There are no runtime errors. CPU submission and observer rAF are retained separately; completed GPU time remains unmeasured. Physical phones and thermal endurance remain unqualified.

[Full report](immersive/performance-report.json) and [24 raw interval recordings](immersive/performance-raw.zip) preserve every result. Raw archive SHA-256: `420704b6ffd760b4b5ac6b27fb1585cf7c2c5cb54b74a3e7daea31607e72b311`. The earlier experiment started alongside the tail of the local logical soak was interrupted; this replacement ran after that soak finished and without other local test or deployment work. Other applications on the shared PC were not controlled.

| Backend | Viewport | Workload | Metric | Baseline ms | Candidate ms | Allowed increase ms |
| --- | --- | --- | --- | --- | --- | --- |
| webgpu | 393x851 | launch-1 | renderedCadenceP95 | 16.90 | 20.70 | 3.38 |
| webgpu | 393x851 | launch-1 | transitionRenderedCadenceP95 | 16.80 | 20.80 | 3.36 |
| webgpu | 393x851 | launch-1 | transitionRafP95 | 8.40 | 12.60 | 2.00 |
| canvas | 393x851 | launch-2 | renderedCadenceP95 | 33.50 | 41.70 | 6.70 |
| canvas | 393x851 | launch-2 | rafP95 | 12.50 | 16.70 | 2.50 |
| webgpu | 1280x800 | launch-1 | renderedCadenceP95 | 16.80 | 20.80 | 3.36 |
| webgpu | 1280x800 | launch-1 | transitionRenderedCadenceP95 | 16.80 | 20.80 | 3.36 |
| webgpu | 1280x800 | launch-1 | transitionRafP95 | 12.50 | 16.60 | 2.50 |
| canvas | 1280x800 | launch-1 | transitionRenderedCadenceP95 | 33.60 | 41.70 | 6.72 |
| canvas | 1280x800 | launch-2 | rafP95 | 20.80 | 25.00 | 4.16 |

Performance qualification remains open; retain PR #31 as draft. Do not treat completed implementation or passing interaction checks as production release clearance.

## Isolated preview receipt

- Preview: https://firecrackers-moonlit-preview.allygym-api.workers.dev/
- Runtime checkpoint: `1e00ce9190f88451d78d80171286dcba3d69e995`; delivery-workflow checkpoint: `ab573b02f21e52d21d1c96dd5d1be9aa41b3eb53`. Subsequent evidence-only commits preserve this runtime.
- Build: `2026-10-01.6`; 82-module normalized fingerprint: `9b119981f4701fae5209a620351ceb1b5c1b63d5f4ce55d5e544606aafe43ffa`.
- Preview Worker: `adb16e6a-6fcb-4f6c-836f-3875996defba`. The preview configuration has no production route.
- [Hosted immersive matrix](immersive/hosted-ui-report.json): 21 backend/viewport cases pass, with show completion and motion checks on all backends.
- [Hosted native water checks](immersive/hosted-water-report.json): 52 pass, including native adapter/driver, shared phase/contact, tier/resource budgets, pause, hidden-page behavior, motion/flashes, transparent output and missing-normal fallback.
- [Exact HTTP check](immersive/hosted-http-report.json): 32 pass, including emitted asset bytes, root index and unchanged production fingerprint.
- Runtime CI is required and tracked on [PR #31](https://github.com/samir1234khans/firecrackers/pull/31). It includes the new software WebGL/Canvas immersive suite and the existing engine, collection, launch/platform, interaction, viewability and recovery suites. Local native GPU checks and CI software checks remain separate evidence.

Production remains `2026-10-01.4`, fingerprint `965c6eaa6ebd5aef2f5922831504a6bbe1c3879e24a26532432af279f5e09d51`; rollback Worker `57796211-f2a8-4fc1-8381-4c9235bfb5bd` is untouched. Production promotion is not part of this preview publication.

## Test stabilization and mobile regression

The first local software WebGL immersion run failed an exact-opacity assertion after a fixed 260 ms delay. The harness now verifies hidden control inertness immediately and waits for every chrome group to reach zero opacity, retaining the same final assertion and a five-second timeout. The resulting [software matrix](immersive/software-ui-report.json) passes all 14 WebGL/Canvas viewport cases. No application code or transition duration changed.

The [hosted original mobile flow](immersive/hosted-mobile-platform-report.json) passes all 16 checks, including real launch, duplicate guard, immutable committed family, rendered lifecycle, pause ownership, automated/manual takeover, preference/reset behavior, responsive hit targets and return from protected transparent output. This is emulated mobile Chromium, not a physical-device result.

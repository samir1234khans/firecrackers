# Always Play production release

Build **2026-10-02.3** is live at [Firecrackers](https://firecrackers.mainandmany.com/). [PR #32](https://github.com/samir1234khans/firecrackers/pull/32) merged the complete four-pace Always Play implementation into main `074c4c1c089864a97c3ee44d596d7e687d9f7781`. Existing moonlit water, smooth immersive shows and all thirteen effects are preserved. Choose Shows → Always Play → quantity → Start; Hide controls leaves one reveal button. Ordinary visits remain Manual.

## Release identity and rollback

- Source: clean main `074c4c1c089864a97c3ee44d596d7e687d9f7781`; prior canonical main was `f324f3ac8befb69e1fb86641bedcdb1dd0ba2646`.
- Release fingerprint: `c9bb7291fd81d625331fcbc6746c92938906165feff69ae4156865aa41f989a8`, 85 normalized source/artwork modules.
- Applied Worker: `12eb0650-dc48-4609-812d-0511a489a960`, 100% traffic. Deployment `86ed96ff-3240-4fba-b08f-143d31f038b2`, recorded 2026-10-02 03:25:19 UTC (08:55:19 India time).
- Previous production `.11` Worker `a2230baf-84c8-42c8-96b8-ceeff3ece962` remains retained for rollback. Its fingerprint is `b7687fa6f916f5b3dd391d17d9646888314001a728296313961275001f7b3d45`. Rollback restores the prior runtime; the old application does not understand preference schema 3 and may restore default preferences.
- The [isolated `.3` preview](https://firecrackers-always-preview-v2.allygym-api.workers.dev/) retains runtime development source `e74992c0e566a4c346fd7f3189deb78e173cf1f4` and the same fingerprint. Its Worker is `9d6285a9-5c6b-400a-b39e-e7a27cf4280a`. The earlier `.1` preview remains separate development evidence.

## Required CI and exact artifact

The complete engine, desktop, mobile and recovery workflows passed on both [PR head](https://github.com/samir1234khans/firecrackers/actions/runs/36956377667) and [main push](https://github.com/samir1234khans/firecrackers/actions/runs/36958091880). PR documentation run `36956377491` and main documentation run `36958091669` passed. [PR results](final/always-pr-ci-final.json) and [main results](final/always-main-ci-final.json) pin exact commits and job conclusions.

Production uses the **downloaded main CI build artifact**, the exact artifact consumed by those browser tests. All 30 staged files matched it byte for byte before deployment; [staging comparison](final/always-staged-ci-parity.json) and [file hashes](final/always-main-ci-assets.json) retain the evidence. This avoided deploying an earlier local intermediate output that lacked generated PWA files. That [failed initial comparison](final/always-main-build-parity.json) remains recorded; the SVG difference was CRLF-only, while HTML also differed by a blank line. No claim of initial Windows/CI byte parity is made.

## Actual public verification

All 30 public files returned HTTP 200 under the verification client. **29 non-HTML files matched the CI artifact exactly**, including release manifest, service worker, JavaScript, CSS, artwork and audio. Raw HTML comparison failed because the edge adds one Cloudflare beacon module and changes closing-body indentation. The [strict raw comparison](final/always-production-http.json) retains that failure. A [separate scoped HTML comparison](final/always-production-html-parity.json) verifies that every other byte equals the CI HTML; it accepts only that single identified beacon insertion. Cloudflare analytics were already present in the [earlier waterfront release](../living-river-2026-09-30/PRODUCTION.md). No new application telemetry provider was added. The initial default Python user-agent request received HTTP 403; a browser-like verification user agent returned 200.

[Public browser smoke](final/production-smoke.json) passed fresh Manual startup, all four radio choices, explicit real-time Start, nonzero admission, immersion/reveal and Stop, with zero page errors. Requested WebGL played as WebGL; requested Canvas played as Canvas. The WebGPU request initially passed the WebGPU startup assertion, then recovered to **WebGL during playback** while retaining Always Play. This is functional recovery evidence, **not a stable production WebGPU pass**. The final-source preview's independent native WebGPU/WebGL/Canvas checks remain documented separately. [Production control captures](final/controls.html) show WebGL desktop and Canvas phone viewport; they are real-time UI illustrations, not performance or matched-time water comparisons.

## Qualification and explicit limits

[Implementation receipt](IMPLEMENTATION.md) and [condensed evidence](final/qualification-summary.json) retain 257 units, lint/build, 21 native backend/viewport checks plus lifecycle cases, all thirteen families in default reduced-flashes WebGL playback, actual context-loss compatibility recovery and twelve final-source two-hour logical pool soaks. Existing warmed manual transition comparisons passed, with initial failing Canvas and invalid/contaminated datasets retained.

The owner shortened remaining local testing to **at most twenty minutes** and declined the proposed forty-minute reservation. No additional long soak was run. Both shortened timing attempts were rejected after other automated jobs overlapped. **Final-source sustained density performance and the proposed five-minute peak remain unqualified**. This release does not claim completion of the original longer timing plan. No completed GPU timing, physical phone, Safari, thermal endurance or formal flash-conformance qualification is claimed. The frame-screening method's generated 250ms caption is corrected in the receipt: its implemented eight-frame separation at 30Hz is approximately 267ms, and it does not count opposing flash pairs.

## Branch reconciliation

The [71-ref audit](final/reconciliation.json) found 70 local/remote refs represented in runtime main, including the planning, Always Play, moonlit-water and earlier current-runtime work. The sole exception is `origin/feat/fireworks-v1-implementation`, a preserved historical alternate five-effect JavaScript implementation; AGENTS.md explicitly excludes it from current integration. No branch was deleted, reset or force-pushed. The clean primary main checkout was fast-forwarded to the merge. The final documentation checkpoint follows this runtime commit and changes no shipped application bytes.

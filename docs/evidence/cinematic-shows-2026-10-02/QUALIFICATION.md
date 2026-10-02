# Cinematic shows: preview and qualification receipt

Implemented source `7342b4eccf13d81e28a088a22e1000ad7ea9c93f`, based on refreshed main `61c41165ef099675c2e709313c0e47e02cdbd061`. [PR #33](https://github.com/samir1234khans/firecrackers/pull/33) retains implementation, test correction and evidence. [Implementation](IMPLEMENTATION.md) · [approved contract](../../plans/CINEMATIC-SHOWS.md).

## Owner-requested cache follow-up

Candidate `2026-10-02.5` adds [automatic cache-safe updates](CACHE-UPDATES.md), fingerprint `c5207035d171b38844d852c53009e630997724bddb4e3f3b730284f90072cfd7`. Actual `.3` production-artifact upgrade, multiple tabs, preserved preferences, obsolete-cache deletion, offline reload, rollback and redeployment passed. 283 units and type/lint/build passed. Both complete workflows passed all four jobs: the cinematic source on `ba3aef8`, [run 37027589240](https://github.com/samir1234khans/firecrackers/actions/runs/37027589240), and the cache source on `557dc3c`, [run 37034161596](https://github.com/samir1234khans/firecrackers/actions/runs/37034161596). [Cache runtime conclusions](cache-runtime-ci.json). Its PR/push documentation runs `37034161211` and `37034153411` also passed. The final handover changes documentation only; fingerprinted application bytes remain identical. The `.4` preview receipts below remain historical. Clean short hardware qualification remains pending; both rejected datasets are retained below.

## Current `.5` preview and timing result

Source `557dc3c718adec87e14d9f3c875f4431e6dd6c3e` is live at the same [isolated preview](https://firecrackers-shows-preview.allygym-api.workers.dev/). Worker version `4df5a15d-ddf6-4517-a352-c3b774f094e3`, no production route. Deployment uses the downloaded exact engine artifact from [cache-head CI 37034161596](https://github.com/samir1234khans/firecrackers/actions/runs/37034161596). Its version/fingerprint match the candidate above.

Six hosted native WebGPU/WebGL/Canvas cases passed at 393×851 and 1280×800, including actual playback, theme selection, silence before consent, music bounds, mute and immersion. [Hosted checks](hosted-cache-checks.json). All eighteen music files matched their manifest hashes. [Asset parity](hosted-cache-assets.json). Actual entry HTML, receipt, manifest and both worker scripts return `no-store`; the tested content-hashed entry bundle returns immutable cache headers. [Hosted headers](hosted-cache-headers.json).

[Exact CI artifact metadata](cache-build-artifact.json) pins the downloaded build. [Branch reconciliation](branches-before.json) confirms that every earlier runtime branch is represented in canonical main, except the preserved alternate `feat/fireworks-v1-implementation` explicitly excluded by AGENTS.md. Only this current cinematic candidate awaits future promotion; no branch was reset, deleted or force-pushed. The clean main checkout and production Worker were preserved.

The second timing attempt was capped at 14 minutes and stopped after **340.508 seconds** when six other test/build processes overlapped. The twelve counterbalanced runs reported numerical allowances satisfied, but **the dataset is invalid** and cannot qualify the release. [Rejected retry](qualification-invalid-retry.json). Cold/warmed full-length show stability and Super High peak qualification did not complete. The two attempts used **678.826 seconds (11.314 minutes)** total; no further timing retry is being run within the owner's limit. No unrelated processes were stopped.

Main and production remain held under the approved contract. After reviewing the invalid timing attempts and working `.5` preview, the owner explicitly selected **Keep the release hold** on 2 October 2026. No performance waiver, merge or production deployment is authorized while this hold remains. Existing functional source/capture evidence remains valid in its stated scope. The first-attempt receipts below are retained as history; no more timing retry is scheduled.

## Historical `.4` isolated preview

[Open the preview](https://firecrackers-shows-preview.allygym-api.workers.dev/) on desktop or mobile. Build `2026-10-02.4`, fingerprint `125fbda7f2be7edb40e9bbbf4b34efce0d2553a1df5f7420aae7619c9105df9c`, 107 source/asset entries. Worker `firecrackers-shows-preview`, version `fd63ee8b-303f-493f-a5b2-45faee80cdc6`, has no production route. The deployed directory was downloaded from the engine job's exact [CI artifact 11235491011](https://github.com/samir1234khans/firecrackers/actions/runs/37024777051/artifacts/11235491011), rather than rebuilt for hosting.

The hosted fingerprint matches the locally checked source. Six live cases passed: native WebGPU, forced WebGL and Canvas at 393×851 and 1280×800. They exercise Golden Celebration, consent-free silence, separate music opt-in, bounded playback, master mute and immersive reveal. [Hosted checks](hosted-checks.json). All eighteen served music assets returned HTTP 200 and matched their SHA-256 manifest entries through native Chrome same-origin fetch. [Asset parity](hosted-assets.json).

## Functional and visual evidence

- 279 units, TypeScript, lint and build passed. The complete CI engine job also passed the accelerated two-hour logical Festival soak and high-severity dependency audit. Logical time is not physical endurance.
- Final-source native Chrome passed 63 score/viewport cases: three themes × seven sizes × three backends. All eighteen recordings decoded with correct duration, peak headroom and matching overlap handles. Pause/resume, mute, phrase-boundary themes and immersion passed. [Native checks](native-checks.json).
- Focused lifecycle checks passed offline app/consent-cached music, missing-music fallback, hidden freeze/explicit resume, visual-only links and genuine overload recovery retaining music/show phase. CI recovery and mobile jobs passed on the implementation commit.
- Thirty matched WebGPU images cover idle, Gold Willow, Sapphire Saturn, Opal Supernova and Imperial Crown, before/after at 393×851, 768×1024 and 1280×800. Same seed `20260916`, reset defaults, Manual RNG, logical times and quality. Fourteen representative originals are committed; [the manifest](matched-captures.json) records every source fingerprint and pixel hash. Composition and Manual effect geometry remain consistent; lighting changes are local and restrained.

[Before Opal](before-1280x800-opal-supernova.png) · [after Opal](after-1280x800-opal-supernova.png) · [Prismatic crest](webgpu-1280-prismatic-crest.png) · [phone theme controls](webgpu-393-styles.png).

The initial complete [runtime run 37024777051](https://github.com/samir1234khans/firecrackers/actions/runs/37024777051) failed only the desktop open-sky check's historical 40-second Finale expectation. Its assertion is corrected to require an active show at 89 seconds and completion after 91 seconds. No application source or resource/visibility assertion was weakened. The corrected head must complete the entire workflow; [PR checks](https://github.com/samir1234khans/firecrackers/pull/33/checks) show final status. The earlier failed run is retained.

## Timing result and release hold

The owner-capped 20-minute attempt ended after **338.318 seconds**, when its WMI monitor detected three other automated test/build processes created at `2026-10-02T15:19:10Z`. Their commands were classified but neither executed nor recorded. No unrelated process was stopped. This dataset is **invalid for qualification**, even though twelve counterbalanced runs reported cadence allowances satisfied and no new repeated transition over 50/100 ms. [Rejected dataset](qualification-invalid.json).

Full-length cold/warmed 90-second stability and final real-time Super High/compatibility checks were not started after rejection. Deterministic native checks stayed on their requested backends; that does not substitute for clean real-time qualification. Browser rAF and app-rendered intervals are separate from CPU submission. No completed GPU time was measured.

Main promotion and production are **held**, as approved for contaminated shared-PC timing. Refreshed main remains `61c4116`; its clean canonical checkout was preserved. Production remains `2026-10-02.3`, fingerprint `c9bb7291fd81d625331fcbc6746c92938906165feff69ae4156865aa41f989a8`, Worker `12eb0650-dc48-4609-812d-0511a489a960`. No production deployment or rollback was performed.

Next gate: run `node tests/cinematic-qualification.mjs test-results/cinematic-qualification-clean` by itself, with `SHOW_URL` pointing to this unchanged preview or exact local artifact. The script caps its whole window at 20 minutes, preserves existing paired cadence/transition assertions, records actual backends/errors/recovery and rejects detected external tests/builds. Then refresh relevant refs, complete final-head PR/main CI and deploy the exact main CI artifact. Do not promote merely because descriptive numbers look acceptable.

Physical phones, Safari devices, thermal endurance, sustained new-mode performance and formal flash conformance remain unqualified. Offline music covers only consent-cached chunks; missing chunks fail quietly while visuals continue. Master Sound remains off on an ordinary new visit.

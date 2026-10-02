# Cinematic shows: preview and qualification receipt

Implemented source `7342b4eccf13d81e28a088a22e1000ad7ea9c93f`, based on refreshed main `61c41165ef099675c2e709313c0e47e02cdbd061`. [PR #33](https://github.com/samir1234khans/firecrackers/pull/33) retains implementation, test correction and evidence. [Implementation](IMPLEMENTATION.md) · [approved contract](../../plans/CINEMATIC-SHOWS.md).

## Isolated preview

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

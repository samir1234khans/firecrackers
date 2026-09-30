# Waterfront v008: production release

## Delivered source

- [Production](https://firecrackers.mainandmany.com/): build `2026-09-30.7`.
- App commit `9603a096be6509304ba5c2e4fc4b4b1b3ea421ef`; [PR #23](https://github.com/samir1234khans/firecrackers/pull/23), merged as canonical main `947f0c57e679a34d35e00b550aae625eba845672`.
- Deployed from the clean fast-forwarded main checkout using `npm run cloudflare:deploy`.
- Worker `e167225e-e463-41f6-897d-e6f5b59aa03c`; [deployment receipt](production/deploy.txt).
- Exact 62-entry fingerprint: `6186a504d1ccf20d90434ffe90b5771f075e33992765d9dbfa6d636e376c602b`.
- [Isolated preview](https://firecrackers-waterfront-preview.allygym-api.workers.dev/), Worker `19ad2e64-77cb-4b5d-b56b-b1f6830bd5ee`, matches. Local, PR CI artifact, source-main CI artifact, preview and production inventories match.
- Rollback: `.6` Worker `d04c14f1-f219-45dd-989e-97569693ac4b`, source-main `ed54fe640945fa7de0f4ba3546b3445348bde78b`, fingerprint `1249e82e8ab6604c52d7c32002a939792e3a9724bcd4fb7fe34e5d0d183fafe0` / 60 entries.

[Version inventory](production/rollback.json) confirms both Workers remain available. Operational rollback: `npx wrangler rollback d04c14f1-f219-45dd-989e-97569693ac4b`, followed by source/asset and browser verification against the retained `.6` receipt. Rollback was not invoked.

## Improvements

The far-bank village meets the measured water edge on desktop/tablet, with readable architectural haze isolated from shared boat materials. Varied homes, sparse trees, landing and warm windows replace the near-invisible row. The original Blender stone quay spans the foreground with worn coping, irregular edges, recessed joints and finer basalt maps. Portrait depth extends past the frame bottom. Browser-discovered color encoding and data texture metadata issues were corrected in the source asset pipeline.

Three CC0 canoe-derived boats retain their real wood maps, adding original woven shelter materials, curved sag and two small seated silhouettes. Reduced scale and rocking, 21 bounded contact/ripple instances and four candle attachments integrate the boats with the water. Crossed normals, cool sky highlights and restrained steel/brass on the launch base complete the treatment. One boat point light and the existing capped firework reflection target remain bounded.

All ten effects, compact panels, placement/drag behavior, offline play, optional sound, recovery and saved quality remain. Canvas keeps its simpler procedural interpretation. No new backend or live fluid solver was added.

[Plan](PLAN.md), [implementation](IMPLEMENTATION.md), [river source](../../../assets-source/blender/RIVER-V008.md), [terrace source](../../../assets-source/blender/terrace-v008/README.md), and [actual comparisons](comparison.html) contain editable assets and evidence. After images are public production captures; before images are retained `.6`, using the same PC, renderer, seed and viewport.

## Verification

| Gate | Result |
| --- | --- |
| [PR runtime CI](https://github.com/samir1234khans/firecrackers/actions/runs/36734175561) | All four jobs passed: engine, desktop, mobile and recovery; includes 144 units, build, logical soak, audit, panels and renderer regressions. |
| [PR documentation CI](https://github.com/samir1234khans/firecrackers/actions/runs/36734174263) | Passed. |
| [Source-main runtime CI](https://github.com/samir1234khans/firecrackers/actions/runs/36736199871) | All four jobs passed; source-main artifact matches deployment. |
| [Source-main documentation CI](https://github.com/samir1234khans/firecrackers/actions/runs/36736198270) | Passed. |
| [Preview qualification](PREVIEW.md) | 172 passed: hardware 61, HTTP 19, decode/lifecycle seven, Grand/original/recovery 85. |
| [Public HTTP/assets](production/http.json) | 19 passed; exact inventory and every delivered art/audio hash, correct MIME and no SPA asset fallbacks. |
| [Public hardware](production/hardware.json) | 61 passed; installed Chrome 154.0.8037.59, no software flags; nonfallback WebGPU and hardware ANGLE WebGL asserted. Zero unexpected application/GPU errors. |
| [Public composition](production/composition.json) | 13 passed across seven projects: 1280x800, 1920x1080, 768x1024, 1024x768 and 393x851 WebGPU; desktop WebGL; portrait Canvas. Bank contact, readable homes, full-width foreground, idle/Saturn captures and source verified. |
| [Public regressions](production/browser-suites.json) | 85 passed: Grand 42, original launch/offline/platform 28, recovery 15; exact fingerprint before/after each. Software graphics and viewport/touch emulation; zero unexpected errors. |
| [Automatic startup / real-time Festival](production/default-realtime.json) | Default WebGPU + Ultra, all eight enhancements active; 60 seconds, 10 launches, 16 bursts, no application errors or backend change. No freeze/advance or forced backend. Submitted frames do not measure completed GPU timings. |

**178 public checks passed**, plus the separate live-clock observation. Intentional missing-asset and fault-injection diagnostics remain separate from unexpected errors. [PR metadata](production/pr-merged.json), [PR CI](production/ci-pr.json), [source-main CI](production/ci-main.json), and [raw report hashes](production/REPORTS.json) preserve delivery evidence.

## Limits

Phone/tablet and touch checks are emulation. Physical Android/iPhone, Safari, thermal endurance, sustained GPU frame timing and photographic parity remain NOT TESTED. Blender studies prove source/material review; separately identified browser captures show the actual website. People and trees are small scenic silhouettes, not detailed animated characters or wildlife.

[Unsuccessful pilots](pilots/portrait-edge-failure.json) are retained. Masters and source caches stay outside the public bundle. Existing tabs can use Settings / Device / Update app and restart when offered.

Evidence JSON uses LF-normalized line endings; data values are unchanged. PNG captures are copied byte-for-byte. Report hashes refer to the retained files.

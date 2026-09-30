# Moon and natural water — verified preview

Preview: https://firecrackers-moon-preview.allygym-api.workers.dev/ . Build `2026-10-01.1`; Worker `f7cd640d-e774-44d3-bb16-62b4b012e6cb`; 69-module source/art fingerprint `2e9aff20f01bdcbd7c57663d19c442b43b1eb305498795906f39b96048aaafc9`.

Production remains [bottom collection `.8`](https://firecrackers.mainandmany.com/), independently checked at fingerprint `5a0020b7c9260140d4fff57a6abe97d53f7406dedffc6635c64148facb478535`. The new moon/water work is isolated on `feat/moon-natural-water`; it has not been merged or deployed to the custom domain.

[Research and implementation decisions](RESEARCH.md), [NASA/mirror provenance](../../../assets-source/moon/PROVENANCE.md) and [matched before/after gallery](comparison.html) describe the visible result and its source boundaries. Phone, tablet and desktop captures use actual installed Chrome hardware WebGPU, seed `20260916`, matching logical time and reset preferences. These are viewport emulations on a PC, not physical mobile evidence.

## Completed validation

- Build, strict type/lint checks, 157 engine/unit tests including analytical water derivatives and moon composition; documentation structural validation.
- Local hardware WebGPU, forced hardware WebGL and Canvas: 106 stage/launch/drag/rotation checks; all ten normal launches retain upper apex and duplicate/admission protection.
- Grand Collection 42 checks, original launch/platform 28, compact panels/recovery/focus 201, asset lifecycle 7 plus independent-asset failure test, viewability/graphics recovery 15, hardware sky/river/comfort 61.
- Hosted preview: 26 focused moon checks covering three backends, all seven viewport sizes, Low and missing-moon fallback; 106 stage checks; original platform/offline flow 28; galactic comfort 35; overload/fallback 5.
- 25 exact hosted HTTP file checks, including release, compiled scripts, delivered art, moon PNG, notices and service worker. The source fingerprint and byte hashes match the local build.
- All nine authored GPU enhancements activate independently. Corrupted authored river maps retain complete fallbacks and release decoded resources; the new lunar texture is disposed with its renderer.

Machine-readable receipts are retained under `checks/`. The workflow/PR receipt is recorded in `SOURCE.md` after completion.

## Failed attempts and remaining qualification

Direct NASA SVS download attempts timed out; the receipt records the documented mirror and compressed visual-relief source. The first new test attempted a nonexistent Low button instead of the existing quality select; the corrected test passed. An early comparison-capture expression was malformed; it was corrected and all six before/after projects completed. These were tooling failures, not suppressed application failures.

A first six-second PC Festival sample ran while other browser suites were active and produced a larger desktop rAF tail (8.4 → 12.5ms). It is retained separately and is insufficient for an isolated performance conclusion. The first isolated Festival sample still showed higher tails, and a fixed-burst diagnostic confirmed added cost. The implementation was optimized to shade the moon only in its bounded sky region and evaluate broad water slopes at vertices. The final fixed-burst comparison retained phone rAF p95 at 4.3ms and CPU submission p95 at 3.0 to 3.1ms (phone), 3.2 to 3.2ms (desktop). Desktop rAF p95 varied 8.4 to 12.4ms while median stayed 4.2ms and sampled frame count changed 1027 to 980. These short PC results establish bounded behavior and restored CPU cost, not completed GPU timing or a no-regression guarantee on phones. See the retained initial and optimized receipts.

Physical Android/iPhone, Safari, actual browser bars and safe insets, real OS zoom and sustained mobile GPU/thermal endurance are untested. The moon is a fixed gibbous composition, not a real-time astronomical phase/location. Water uses bounded multi-scale shading and selective effects reflections; it is not a fluid solver or ray-traced whole-scene reflection. Canvas has a bounded visual approximation. No physical photorealism or hardware performance guarantee is claimed.

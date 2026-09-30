# Interactive galactic sky: implementation and local preview evidence

Subsequent hosted hardware qualification and matched captures are recorded in [PREVIEW.md](PREVIEW.md). Pending labels below describe this implementation checkpoint, not the later preview result.

Receipt date: 30 September 2026. Isolated checkout: `firecrackers-galactic`, branch `feat/interactive-galactic-sky`. This records the frozen implementation and completed local, preview HTTP and software offline checks. It is **not a production promotion receipt**. Hardware browser qualification, CI and production promotion were in progress and remain **NOT QUALIFIED by this receipt**. The released river baseline remains `2026-09-30.4`.

## Build and preview identity

| Item | Recorded value |
| --- | --- |
| Candidate version | `2026-09-30.5` |
| Delivered-module fingerprint | `81bf4e1160df0f21a10e29b04c9b1428128dc44be16216e1fe3a4352c06242c7` |
| Fingerprinted entries | 58 |
| Preview | [firecrackers-galactic-preview](https://firecrackers-galactic-preview.allygym-api.workers.dev/) |
| Preview Worker version | `47e85c05-2c70-4b5b-a606-788eca71536c` |
| Preview HTTP checks | 17 passed, zero errors |
| Prior production rollback reference | `.4`, Worker `534323b7-e2e8-4935-a161-b86bdfb3f2b0` |

The fingerprint covers the delivered upgrade modules using the recorded TypeScript printer normalization; it is not a whole-repository Git hash or a claim that every output byte is identical. [Release record](intermediate/release.json), [preview deployment output](intermediate/preview-deploy.txt) and [HTTP hashes/MIME checks](intermediate/preview-http.json) retain the specific evidence.

## Original art and composition

`src/graphics/GalaxySky.ts` generates three native Canvas2D layers, `stars`, `dust` and `nearStars`, each 2048 × 1024. It preserves seed `6102026` and the first field-star locations; cluster, mist and nearer-star streams use independent derived seeds without consuming simulation randomness.

| Content or allocation | Bound or recorded count |
| --- | --- |
| Field stars | 5,200 |
| Additional upper-cluster stars | 3,400 |
| Sparse nearer stars | 128 |
| Admitted fine dust specks | 23,721 |
| Faint off-center spiral clusters | 1 |
| Three CPU RGBA8 canvas buffers | 25,165,824 bytes / 24 MiB |
| Three full RGBA8 textures including mipmaps, upper estimate | 33,554,432 bytes / 32 MiB |

Six periodic coherent noise scales, from 16 to 512 cells across, make continuous blue/violet filaments, subdued warm-gold dust and dark lanes. Upper detail clusters sit around normalized x `.25`, `.315`, `.72`, `.785` and y `.085`–`.235`. Nebula regions favor x `.27` and `.74`; the faint spiral is near `.27`, `.15`. The central canopy has 88% envelope attenuation, and all layers fade toward the horizon and image borders. There are no large central discs, broad lens flares or generated control graphics.

The art bakes once when a renderer is created. There are no per-frame art bakes, remote image requests or added dependencies. [Standalone native-art validation](concepts/native-art-validation.json) recorded zero alpha at the outer borders and below y `.725`, zero RGB beneath fully transparent pixels, and dust peak alpha 35/255. Mean dust alpha was `.0371/255` in the protected center versus `8.7821/255` in upper cluster regions. One desktop headless bake took 537 ms; this is not a phone startup or frame-rate measurement. Native composite and portrait art studies are preserved in [concepts](concepts/PROMPTS.md), separately from website captures.

### Source and license provenance

This artwork and its TypeScript bake are original project work. The earlier [source/reference research](../galaxy-sky-2026-09-30/RESEARCH.md) is retained: fine warm/cool stars, curved dust and muted scale informed the direction. This implementation uses the repository's existing seeded stream and a locally written smooth periodic grid interpolation; it does not copy the reference GLSL/WGSL code or add a new noise dependency. The referenced MIT projects retain their own notices when used elsewhere. No OpenAI promotional image or unpublished rendering code is bundled.

One built-in `image_gen.imagegen` reference edit explored the upper sky over an actual `.4` desktop capture. The exact prompt and tool receipt are in [PROMPTS.md](concepts/PROMPTS.md). The tool exposed no model identifier or model selector. Its output approximates/scales the reference and is a design concept, not a pixel-identical browser capture. The concept bitmap is never loaded by the application.

## Shared time, interaction and rendering

`src/engine/SkyState.ts` supplies a reusable readonly state view containing time, top-down normalized pointer coordinates, engagement and motion policy. Its response eases with a `.24`-second time constant, bounds nonfinite coordinates, resets safely when logical time moves backward, and settles exactly within `.001` so a stationary pointer cannot request 30 Hz indefinitely.

`src/engine/useWorld.ts` advances this state through the existing world scheduler and passes it through `RendererPort.setSkyState`. Existing firework rendering/admission and overload recovery retain their separate policy. No independent sky `requestAnimationFrame` loop, timer or React animation loop was added.

| Visible idle policy | Maximum requested cadence |
| --- | --- |
| Ultra | 20 Hz |
| Standard | 12 Hz |
| Canvas | 10 Hz |
| Easing toward a pointer target | 30 Hz |
| Low, app/OS reduced motion, pause, hidden, QA freeze or transparent output | Static idle |

These are scheduling limits, not achieved GPU-frame rates. Visible fireworks keep their established 30/60 Hz policy. Manual and overlay pause, background suspension and QA freeze hold shared sky phase and response. Reduced flashes attenuates smooth light changes and meteor brightness. Transparent presentation excludes the galactic environment.

Blank-sky primary mouse hover can gently lift pixels that already contain stars. A primary touch/pen must first contact an eligible sky region; release/cancel resets its target. Buttons, links, forms, dialogs, edge rails, docks, placement controls, overlays, active firework drags, non-primary pointers and the water below the measured horizon are excluded. Listeners are passive, do not prevent default or capture the pointer, cannot launch or select a firework, and are removed during cleanup.

The one scoped CSS addition is `.scene-host canvas { touch-action: pinch-zoom; }` in `src/styles/stage.css`. It keeps a single-finger sky brush from becoming a browser pan while leaving native multi-finger page zoom enabled by policy. Panel scrolling and existing control/drag touch policies remain scoped to their own elements. The final test exercised a Chrome CDP single-finger brush; a physical multi-finger zoom gesture is not qualified here. [Touch research and observed trace](RESEARCH.md) explain the change.

### Renderer integration

`src/graphics/NightEnvironment.ts` uses the pinned Three.js `0.180.0` WebGPU/TSL pipeline and its WebGL backend. Far stars are composed into the existing cached sky canvas; dust and nearer stars use cached sRGB textures. Straight alpha is applied explicitly when adding celestial color, with a horizon fade, so transparent border RGB cannot produce a luminous rectangle.

The celestial crop is independent of the shoreline panorama: horizontal crop is clamped between `.6` and `1.35`, with an aspect-correct vertical span. Portrait can show more celestial structure while the existing hills, water horizon, camera, riverboat materials and practical lights retain their established projection. Shared-time dust rotation is bounded by `.010` radians; drift amplitudes are `.005` and `.003` in sampling space. Near stars have a slow 2.5% variation and a smooth local response over a 72 CSS-pixel radius. There is no large cursor glow.

`src/graphics/CompatibilityRenderer.ts` draws the same native art with cached Canvas2D resources and bounded transforms, using the same state and `CelestialScene` helper. The nearer layer follows the pointer within a 3 CSS-pixel radial limit; dust response is smaller. The Canvas path preserves its own inexpensive river/reflection treatment.

`src/graphics/CelestialScene.ts` updates one reusable scalar output without per-frame arrays, random-stream mutation, timers or meteor particle creation. At most one faint meteor appears during logical interval `9 + 36n` through `10.4 + 36n` seconds, lasting 1.4 seconds. Its seeded path stays near the upper outer sky, away from the main canopy. Base peak opacity is `.14`, attenuated by reduced flashes. It produces no firework, sound or launch event. The deterministic midpoint at logical time `9.7` is used for comparisons.

Disposal releases added textures and shrinks the native source canvases; Canvas cleanup releases its cached canvases. The 32 MiB estimate describes only three complete RGBA8 textures with mipmaps. It excludes browser copies, panorama/other scene resources, drivers and measured GPU allocation, and must not be used as a total-memory result.

## Test history and corrective changes

Failed attempts remain preserved and are excluded from successful-check totals.

| Attempt | Actual outcome | Diagnosis and action |
| --- | --- | --- |
| Initial local interaction suite | 1 completed check, then 30-second `waitForFunction` timeout | The fixture sent its mouse movement while QA freeze was still active. The implementation correctly ignored frozen input. Only fixture ordering changed: unfreeze before sending mouse input. [Original report](intermediate/first-frozen-input-failure.json). |
| Corrected fixture, before canvas touch policy | 21 completed checks, then 30-second native-touch wait timeout | A separate CDP trace recorded `pointerdown`, `pointermove`, then `pointercancel` on the canvas, and engagement decayed. A real browser gesture cancellation was present. The scoped canvas `pinch-zoom` policy was added. [Report](intermediate/second-native-touch-failure.json), [byte-exact trace](intermediate/debug-touch.txt). |
| Final local interaction suite | 35 completed checks, no failure or errors | Desktop WebGL, portrait WebGL and portrait Canvas passed mouse response, touch brush, controls, freeze, panels, cadence, deterministic meteor, Low/reduced-motion and controlled visibility checks. [Byte-exact final report](intermediate/final-interaction.json). |

The final touch policy changes the prior candidate fingerprint beginning `5f3ef` to the final `81bf4e…` fingerprint above. The diagnostic file originally named `debug-touch.json` contains Node console text rather than valid JSON; it is preserved byte-for-byte as `debug-touch.txt`. No trace was rewritten to look like a structured report.

## Completed evidence and boundaries

| Check | Result | Evidence boundary |
| --- | --- | --- |
| Final interactive sky suite | 35 passed, zero errors | Headless software WebGL/Canvas; real DOM mouse and CDP touch, controlled visibility and shared QA time; portrait is emulation. |
| Final existing regression suites | 132 passed, zero failed suites | Grand 42, original 28, stage 34, recovery 15, asset activation 1, lifecycle 7, overload 5, all exit 0 on the final fingerprint. |
| Preview HTTP/assets | 17 passed, zero errors | Public response hash/MIME checks; not browser appearance, GPU or offline qualification. |
| Preview cold offline reload | 7 passed, zero console/page errors or offline network failures | Headless SwiftShader WebGL, real service worker/CacheStorage without mocked responses; all eight assets HTTP 200 offline, GLB hash parity and three decoded 2K maps. |
| Unit checks | 144/144 passed | Coordinator terminal receipt, unchanged TypeScript before the final CSS-only touch fix. |
| Typecheck, lint, build | Passed | Type/lint on the same TypeScript; final production build reran typecheck after the CSS fix. |
| npm audit | Zero vulnerabilities | Coordinator terminal receipt; not a general security certification. |
| Accelerated logical soak | 7,200 logical seconds passed | Standard simulation, 34.8165 seconds wall time; 1,317 launches and 2,875 bursts; not GPU, audio, phone or thermal endurance. |
| Documentation structure before this receipt | 554 checks passed | Structural checks only; this document's final validation is reported by the coordinating release task. |
| Hardware browser, CI, main merge, production deploy | In progress / not qualified here | Separate release evidence required. |

[Regression summary](intermediate/final-regression-summary.json) and its complete compact suite reports retain every field. Recovery includes four deliberate fault diagnostics; lifecycle records exactly one expected native `THREE.GLTFLoader` error during its corrupted legacy-image case and no unexpected page errors. Therefore the regression claim is zero failed suites/unexpected application errors, not an invented zero-total-console-output claim. The original suite had no failed requests.

[Offline report](intermediate/offline.json) records all three native 2048 × 1024 sky layers after a cold offline reload. Actual mouse input yielded 1.193 CSS-pixel near parallax without new page/service-worker fetches or changes to firework selection, placement or admission. A subsequently selected Saturn launched once and burst once with 6,205 particles. The verifier closed every browser context. These are software behavior/cache results, not hardware GPU, phone or performance evidence.

[Coordinator terminal receipt](intermediate/coordinator-terminal-checks.json) explicitly identifies its transcription and the CSS-only ordering boundary; it is not a replacement for raw terminal logs. The logical soak's maxima were 839 heads, 20,000 trails, 64 smoke elements, 7 cues and 4 rockets. [Copy manifest](intermediate/copy-manifest.json) records raw and copied bytes/SHA-256, byte-exact copies and decoded-JSON equality for compact copies.

## Subsequent CI motion-policy attempt

PR runtime run `36710661796` passed engine, desktop and mobile, but its recovery job failed the new live-OS reduced-motion assertion. The Linux report showed the preceding app-comfort phase had stopped producing frames and advancing time; after CDP media emulation the test observed the previously rendered motion flag. [Preserved report](intermediate/ci-motion-first-attempt.json). This evidence does not prove the operating-system event or browser compositor's exact cause.

The fixture now awaits the actual `matchMedia` result, shared sky policy and rendered motion flag before measuring static idle, and records visibility/policy/state details on any failure. The required false-motion and ≤2-frame assertions remain. The updated local test passed all35 checks. Application source and the58-entry fingerprint are unchanged; the Linux retry remains a required gate before production.

## Download and cost record

[Budget estimate](intermediate/budgets.json) records HTML plus all compiled JS/CSS at 375,455 gzip bytes and eight selected visual enhancements at 9,461,505 raw bytes. The licensed river GLB remains unchanged at 7,620,280 bytes, SHA-256 `c63facc3e14b410da196a3b148ca10886b0aa75f1af02656d64ba09e6c72d258`. Native sky detail adds code and cached canvas/texture storage, with no new downloadable concept image or boat asset. This is a local compression/file-size estimate, not a measured first-load transfer, total GPU-memory result or physical-device performance pass.

The original boat/river source, provenance and earlier production receipts remain separate. Source reports under ignored `test-results` were copied into this tracked evidence folder without changing application source, runtime assets, build identifiers, Git state or deployment. Production and physical-device qualification remain the coordinating release task's responsibility.

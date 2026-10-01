# Signature fireworks candidate — verified isolated preview

[Try the candidate](https://firecrackers-flagship-preview.allygym-api.workers.dev/) · [actual capture gallery](comparison.html) · [source/CI/deployment receipt](SOURCE.md) · [research and explicit design](DESIGN.md).

Exactly three appended identities raise the candidate catalog to thirteen. Production remains build `.8` with ten effects. This branch incorporates the requested unmerged moon/water baseline; it is not promoted.

## Implemented and visually reviewed

**Imperial Crown:** depth-distributed champagne brocade with restrained ruby pistil, a delayed inner crown and a smaller closing warm-white diadem. Long gravity-driven gold fallout gives ceremony and scale. The secondary structure is nested inside the primary canopy rather than merely duplicating Willow.

**Celestial Aurora:** three tilted petal orbits, propagating blue/cyan/violet/emerald colour phases, eight travelling comet flowers and a closing narrow silver flower. Layering, mild curved motion and separated small breaks distinguish it from Aurora Crown's dome and Saturn's single fixed ring.

**Royal Phoenix:** unequal bilateral feather-comet bundles with organic curvature, six staggered wing-tip clusters and a delayed white-gold core. It unfolds through lateral movement and asymmetric timing rather than a sphere or the original Palm's upward fan.

Each has a distinct paper/cap silhouette, motor colour and powered/coast fraction. All retain the zero-speed apex solver, admission reservations, exact terrace placement, point-specific sky drops, immutable committed flight and existing attenuated audio reports. Shared GPU/Canvas star colour evolution also drives existing water reflections. No additional full-screen shader, render pass, backend, downloaded art or sound was added.

Discrete recipes use existing pooled buffers plus fixed gain/role/wave/curve arrays. Pool capacities remain 3072 heads, 24000 trails, 96 smoke and 768 embers. Signature admission costs three units and reserves unborn secondary stars at Ultra. Children never recurse. Calm preserves its quiet selection; Festival/Finale include the new effects. Quality keeps the saved Low/Standard/Ultra model: Standard supplies the requested middle-quality behavior, rather than adding separate Medium and High preferences. Low retains all structural ranks and stages with reduced density; Canvas retains choreography with its existing sampled trails and simplified reflection/light treatment. Reduced motion removes new curvature/shimmer; reduced flashes suppresses modulation and restrains local break energy.

The main tray adds a small Signature caption and three 48px targets. Phones use three rows (188px plus safe inset); intermediate widths use two rows (136px); wide views use three separated groups on one row (76px). The terrace and waterfront remain clear, including 320×480 and short landscape. Only resize changes framing on short phones; launches never track or zoom the camera.

Visual iteration reduced signature gain/initial heat, made the Aurora colour wave arrive sooner, varied Phoenix branch directions and increased bounded curvature. Final actual WebGPU phone/desktop captures were inspected for structure, brightness, separation and scene readability. These are authored pyrotechnic interpretations; they do not claim photometric parity with a particular professional shell.

## Passed checks

| Evidence | Result and boundary |
|---|---|
| [Unit suite](checks/flagship-units-final.txt) | 191/191 passed: deterministic recipes, quality/comfort, staged reservations, exact sky/terrace placement, finite state, pause/reset/cleanup and immutable profiles |
| [Documentation structure](checks/flagship-docs-final.txt) | 850 passed; structural checks only |
| Typecheck / lint / [build](checks/flagship-build.txt) | Passed locally and in source CI; pinned stack retained |
| [Native signature suite](checks/native-signatures.json) | 157 passed, zero runtime/console errors; actual hardware WebGPU, forced WebGL and Canvas, seven required viewport sizes |
| [Original native stage](checks/native-stage.json) | 106 passed: ten original launches, touch cancellation, placement, upper canopy, safe-inset/browser resize, CSS 200% reflow, rotation, panels/focus/pause and optional sound cleanup |
| [Grand Collection](checks/grand.json) / [original workflows](checks/original-workflows.json) | 42 / 28 passed; software/headless platform and original effects regressions |
| [Hosted signature suite](checks/hosted-signatures.json) | 47 passed at phone and desktop on all three backends; source-labelled representative captures |
| [Native touch input](checks/native-touch.json) | 9 passed: each new identity on each backend; tap, sky/terrace touch drag, cancel, fresh tap and duplicate prevention. Native touch events in emulation, not a physical phone; [software CI harness repeat](checks/software-touch.json) also passed 6 checks |
| [Moon/water hosted](checks/moon-water-hosted.json) | 26 passed across all three backends/seven sizes, Low, missing-moon independent fallback and immediate original launch |
| [Local](checks/offline-recovery-local.json) / [hosted offline recovery](checks/offline-recovery-hosted.json) | 2 / 2 passed: actual service-worker cold offline reload plays all three signatures; actual WebGL context loss recovers explicitly to Canvas and real-time three-stage replay |
| [Fresh default startup](checks/default-startup.json) | 2 passed, 320×480 and 1280×800, hardware WebGPU/Ultra, sound off, no QA query, 13 controls, active service worker and real-time Crown stages; zero console/runtime errors |
| [Logical soak](checks/flagship-soak.txt) | 7200 simulated seconds, 1290 launches / 3995 breaks, bounded cleanup. This is engine stress, not rendered GPU endurance |
| [HTTP/assets](checks/http-assets.json) | 32 passed, all 30 dist files exact bytes, hosted source hash and unchanged production receipt |
| Source PR runtime CI | All four required jobs passed: engine, desktop browser, mobile browser, recovery. Includes original panel/viewability/asset lifecycle/overload/galactic safety gates; [receipt](SOURCE.md) |
| [Dependency audit](checks/flagship-audit.json) | High-severity gate passed: no high/critical/moderate findings; one pre-existing low serialize-javascript finding remains in the pinned build toolchain |

Sizes: 320×480, 375×667, 393×851, 768×1024, 844×390, 1280×800, 1920×1080. Principal-star envelopes are sampled at multiple stages within the unobstructed scene; natural fading trail/spark outliers are not rectangularly clipped. This is finite deterministic coverage, not proof for every seed/placement/aspect ratio.

### Failures encountered and resolved

The initial signature matrix exposed a Canvas resize initialization ordering error after the shorter-phone shoreline calculation; layout measurement now precedes that calculation. The earlier report is retained in [intermediate native evidence](intermediate/flagship-native.json); the final matrix passes all paths. Escape-drag cancellation also revealed that click suppression swallowed immediate keyboard activation; generated pointer clicks remain suppressed, while keyboard/AT clicks work. Unit coverage and native/touch regressions now pass.

The initial offline/recovery harness incorrectly expected the QA query to survive the deliberate compatibility link; [earlier report](intermediate/flagship-offline.json) is retained. The corrected test verifies the real-time public UI after recovery. An initial cumulative-counter assertion in the exact-terrace unit test and an HTTP harness field-name mistake were corrected; neither indicated an application fault. No unresolved functional test failure remains.

## Performance comparison — bounded PC observations

Both [initial measurements](checks/performance.json) and [counterbalanced repeat](checks/performance-counterbalanced.json) are retained. Installed Chrome, native Intel gen-12lp WebGPU, Ultra, seed 20260916, 30 warm-up render submissions, six seconds at a frozen representative effect state, no competing test browser processes. CPU p95 below measures synchronous render submission; rAF measures scheduling. Neither is completed GPU-frame time or physical-phone endurance.

| Effect / source | 393×851 CPU p95 ms, initial / repeat | 1280×800 CPU p95 ms, initial / repeat |
|---|---:|---:|
| Willow baseline | 3.5 / 3.5 | 3.6 / 3.8 |
| Willow candidate | 3.5 / 5.0 | 3.6 / 3.5 |
| Opal baseline | 3.6 / 3.8 | 3.7 / 5.2 |
| Opal candidate | 4.1 / 4.6 | 5.7 / 3.9 |
| Imperial Crown | 5.1 / not repeated | 4.4 / not repeated |
| Celestial Aurora | 4.1 / not repeated | 4.5 / not repeated |
| Royal Phoenix | 4.8 / not repeated | 4.7 / not repeated |

The first Willow comparison matched at both sizes; the order-reversed repeat shows tail variability on both source versions. Desktop Opal rAF p95 was 12.5ms baseline / 16.5ms candidate initially, then 33.3ms baseline / 12.5ms candidate in the repeat. No consistent regression or no-regression guarantee can be inferred from two short PC runs. New signature CPU p95 was 4.1–5.1ms in this sample, versus 3.5–3.7ms for baseline effects in the first run. Crown reaches the existing 24000-trail cap; it has a measurable submission cost despite unchanged resource limits and passes. The complete temporal/performance envelope remains unqualified.

## Qualification and merge recommendation

Ready for functional/visual merge review as an isolated candidate. Keep production promotion separate, as requested. Physical Android/iPhone, Safari/WebKit, actual mobile browser bars/safe areas/rotation and real OS 200% zoom are NOT TESTED. PC viewport/CDP touch and CSS reflow evidence must not be represented as those devices. Long GPU runs, completed GPU timing, phone thermal/battery behavior, live high-density multi-signature shows and external-listener acoustic realism remain unqualified. Conservative admission can reduce overlap when resource budgets are busy; it gives immediate concise availability feedback and never queues a delayed surprise launch.

Gallery files live only in documentation, outside `public/` and the service-worker precache, so evidence adds no application asset downloads.

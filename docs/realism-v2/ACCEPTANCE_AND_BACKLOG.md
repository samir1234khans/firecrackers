# Acceptance tests and delivery backlog

Date: 16 September 2026. Every item below is a proposed task/test, not a passed result. Existing V1 results remain in the runtime evidence record and cannot be reused as proof for V2 changes.

## Evidence contract

Every runtime evidence entry records: source SHA; configuration version; asset hashes; date; OS/browser version; physical device or emulation; actual WebGPU/WebGL backend; viewport and output size; pixel ratio/render scale; quality; seed; input sequence; warm-up; duration; result; and capture/log location.

Separate structural/unit tests, emulated browser tests, real hardware tests, visual owner review, listening review and flash/accessibility review. A saved image is not evidence of animation timing. A CPU logical soak is not a GPU endurance run. A headless Chromium pass is not a physical Android or OBS pass.

## Work packages

| ID | Priority / owner discipline | Work and dependencies | Exit evidence |
|---|---|---|---|
| RV2-01 | P0 / engineering | Fetch refs; inspect both feature branches and pending patch; preserve source; identify authoritative baseline. | Branch/commit inventory; no lost work; clean source baseline. |
| RV2-02 | P0 / QA | Capture existing five families and startup/hold/pause/offline behavior. Depends on 01. | Repeatable seeds, clips, screenshots and test/build logs. |
| RV2-03 | P0 / graphics | Version-pinned HDR/bloom/output prototype; WebGPU and forced WebGL. Depends on 02. | RG-01, RG-02 and RG-03 evidence. |
| RV2-04 | P0 / graphics | Perspective, billboard basis and stable resize/world model. Depends on 03. | RG-04, RG-05; no teleportation. |
| RV2-05 | P0 / engine | Stable effect/particle handles and bounded history ownership. Depends on 02. | EN-01, EN-02; compaction/recycling regression tests. |
| RV2-06 | P0 / graphics | Compare current streaks, joined segments and connected ribbons. Depends on 03–05. | Same-workload image/motion and CPU/GPU/upload comparison. |
| RV2-07 | P0 / interaction + art | Prop placement/contact/fuse ember and cancelled-hold response. Depends on 04. | UX-01–04 and FX-01. |
| RV2-08 | P0 / engine + art | Thrust/coast motion and carrier orientation. Depends on 05,07. | FX-02, FX-03; continuous velocity trace and clip. |
| RV2-09 | P0 / art + graphics | Complete Gold Willow canopy, trail aging and residue. Depends on 06,08. | FX-04; six-checkpoint review and full-speed owner approval. |
| RV2-10 | P1 / technical art | Original smoke bakes, variations and GLB/material pipeline. Depends on 03; can run beside 07–09. | AS-01–03; provenance and memory inventory. |
| RV2-11 | P1 / graphics | Relighting, shared wind, soft intersections and depth ordering. Depends on 09,10. | RG-06–09; compare full/half-resolution smoke. |
| RV2-12 | P1 / effects | Peony and Chrysanthemum morphology. Depends on accepted 09 and 11. | FX-05, FX-06 at Low and High. |
| RV2-13 | P1 / effects | Spatial Crossette children and separate crackle timing. Depends on 05,11. | FX-07; no missing/teleported children. |
| RV2-14 | P1 / effects | Visible Finale carriers, secondary reservations and pacing. Depends on 12,13. | FX-08 and EN-03; finite bounded sequence. |
| RV2-15 | P1 / frontend | Choose/Light/Watch UI, glass material, responsive and focus behavior. Depends on 07; final polish after 14. | UX-05–09; actual screen/state captures. |
| RV2-16 | P1 / audio | Event-aligned layered sound, cancellation, optional licensed-sample audition. Depends on 08–14. | AU-01–05; phone/headphone/mono listening notes. |
| RV2-17 | P1 / performance | Admission, dynamic quality hysteresis, pixel/memory budgets. Depends on measured 06,11,14. | PF-01–04; stable shapes at all tiers. |
| RV2-18 | P1 / streaming | Full-scene presentation, safe areas, operator configuration. Depends on 15,17. | ST-01–03 in actual OBS. |
| RV2-19 | P2 / graphics + streaming | Transparent overlay composition, bloom alpha and footage backgrounds. Depends on 18. | ST-04–06; no dark rectangles/fringes. |
| RV2-20 | P1 / platform | Offline assets, controlled updates, recovery and lifecycle hardening. Depends on 10,15. | LC-01–07; update/rollback matrix. |
| RV2-21 | P1 / QA + owner | Physical devices, sustained displays, flash/accessibility and final art review. Depends on required runtime packages. | QA-01–04; release report and owner approval. |
| RV2-22 | Optional / graphics | EffekseerForWeb micro-effect comparison. Independent after 03. | Documented go/no-go; no adoption without depth/HDR/alpha/lifecycle proof. |
| RV2-23 | Deferred / graphics | GPU-compute particles or high-end volumetric experiment. Depends on 17 bottleneck evidence. | Demonstrated value against current baseline; CPU fallback preserved. |

Dependencies describe order, not a time estimate. Do not mark a work package complete simply because code was committed.

## Renderer tests

**RG-01 — startup and backend:** Initialize the pinned pipeline, identify the actual backend, render a visible scene and recover gracefully from failure. Run normal and forced-WebGL paths. An unavailable hardware WebGPU adapter is recorded as untested, not silently counted as WebGPU success.

**RG-02 — linear color/output:** Use controlled color/gray/emission swatches and screenshots to detect double output conversion, washed-out values or clipping. Confirm data textures are not interpreted as color textures. Record floating-point target and fallback behavior.

**RG-03 — bloom restraint:** Compare no-bloom and candidate output at the same seed. Heads remain defined; dark gaps remain; sky and DOM text do not bloom. Inspect overlap and reduced-flash settings.

**RG-04 — perspective:** Near and far effects project consistently. Camera-facing quads stay oriented at all tested viewport ratios. Remove the old additional depth-size compensation unless an explicit artistic use is documented.

**RG-05 — resize continuity:** Resize/orient at contact, thrust, coast, break and late canopy. World positions/velocities remain continuous. Framing adapts without restarting or clipping the expected central canopy.

**RG-06 — soft intersections:** Smoke intersects an opaque test prop without a hard rectangular cut. Check that the linearized depth comparison works on both graphics backends.

**RG-07 — smoke/spark ordering:** Capture a near smoke layer over far sparks and near sparks in front of far smoke. Opaque-depth fading alone does not satisfy this test. Record the approximation used for transparency ordering.

**RG-08 — local relighting:** Place retained smoke near a red burst and farther from a green one. The correct nearby color dominates locally; distant smoke is not recolored uniformly. Repeat with depth separation.

**RG-09 — smoke resolution:** Compare full, half and lower-resolution candidates at horizon/prop edges. The selected optimization must not create visible halos or erase fine trail structure.

## Simulation and effect tests

**EN-01 — stable identity:** Compact and recycle a full particle pool while trails persist. History never attaches to a different star; generation checks reject stale references.

**EN-02 — deterministic semantic events:** Same seed/config/input produces the same event order on the CPU reference path. Adding a smoke variation does not alter unrelated rocket/star trajectories. GPU alternatives use declared tolerances, not false bit-identical promises.

**EN-03 — reservation/caps:** Stress simultaneous manual/show events and secondary bursts. All pools/timers/cues stay bounded. Children required for an admitted effect are reserved or the effect is degraded coherently before launch.

**FX-01 — fuse causality:** Provisional contact responds immediately. Releasing before the threshold produces no committed ignition. Ember reaches the fuse endpoint before thrust. The burnt region and sparks follow the same progress.

**FX-02 — powered/coast continuity:** Inspect position/velocity and visible tail across thrust shutdown. No teleport, sudden velocity discontinuity or constant-speed elevator motion.

**FX-03 — shared wind:** Flame, light fragments, ascent residue and smoke indicate one prevailing wind with appropriately different response. Ballistic stars do not wander like smoke.

**FX-04 — Willow:** Review full speed plus six checkpoints. Canopy sags, trails taper, uneven extinction looks intentional and older smoke persists. No dotted/detached trails, bright wire cage or abrupt cleanup.

**FX-05 — Peony:** Separate luminous points form a recognizable sphere and fade cleanly. It is visibly different from Chrysanthemum without reading a label.

**FX-06 — Chrysanthemum:** Connected luminous rays and late curvature distinguish it from Peony and Willow. Color/life variation does not destroy radial identity.

**FX-07 — Crossette:** Track a parent before its split. Children begin at its actual position, inherit appropriate motion and expand in an oriented plane with spatial depth. Crackle is separately timed and bounded.

**FX-08 — Finale:** Every separated secondary break has a visible carrier or an explicitly approved alternative. Sequence ends; lingering light/smoke dissipates; manual priority cancels future show launches, not already airborne motion.

## UX and accessibility tests

**UX-01 — all input paths:** Choose/place/light using pointer, touch, keyboard and the single-action alternative. No essential operation requires dragging or holding.

**UX-02 — cancellation:** Test early release, pointer cancellation/lost capture, focus loss, tab hiding and modal opening during a hold. Exactly one ignition or a clean cancellation occurs; never both.

**UX-03 — small-screen placement:** The finger does not obscure the only ignition cue. Large hit targets do not accidentally overlap neighboring controls.

**UX-04 — paused settings:** Open/close settings from manual pause and from play. Restore the intended prior state. Repeated Space keydown does not oscillate pause.

**UX-05 — hide/reveal:** Idle chrome disappears only when safe. First reveal touch cannot also launch. Keyboard focus and active controls are never hidden. Pause and mute remain reachable.

**UX-06 — responsive:** Check small portrait, tall portrait, tablet, desktop and short landscape views. No overflow, clipped dialog action or oversized dock. Safe-area padding and text wrapping are intentional.

**UX-07 — glass contrast:** Inspect controls over empty sky and the brightest allowed burst. Text, selection and focus are readable; blur fallback remains usable.

**UX-08 — onboarding:** Skippable, replayable, untimed, and performed with actual controls. No brighter first-launch reward or compulsory sound.

**UX-09 — comfort:** Reduced-motion removes decorative movement; flash reduction actually changes energy/area/overlap. Whole-page flash review is still required for all shipped settings.

## Audio tests

**AU-01:** No audio before explicit activation; activation failure has a useful response.

**AU-02:** Fuse, launch, break/report and crackle use the same semantic event clock as visuals. Distance delay is deliberate; panning follows scene position.

**AU-03:** Pause/mute/hide/reset/recovery cancel scheduled voices and haptics. No delayed report appears unexpectedly after resuming.

**AU-04:** Voice overlap stays bounded; clipping/harshness is reviewed on phone speakers, headphones and mono. Recorded assets, when used, have verified rights.

**AU-05:** Haptics are opt-in and capability-gated. A denied/unsupported call is not presented as a successful physical pulse.

## Asset, performance and lifecycle tests

**AS-01:** Every production asset has provenance, rights, hash, transformation record and dimensions. No temporary reference footage ships.

**AS-02:** GLB/texture compression preserves normals, alpha edges, color-space intent and silhouette. Mipmaps do not sample adjacent smoke atlas frames.

**AS-03:** Failure to load an optional asset degrades cleanly. Required assets are included in the approved offline package.

**PF-01:** Log frame-time distribution for repeatable single-effect and overlapping-show scenarios. Proposed targets: 60-fps modes aim for median at or below 16.7 ms and p95 at or below 20 ms; 30-fps modes aim for median at or below 33.3 ms and p95 at or below 36.7 ms. These are acceptance targets to review, not current results.

**PF-02:** Measure CPU work, uploads and GPU passes where supported. Identify actual bottlenecks before choosing compute migration or more complex transparency.

**PF-03:** Resource use reaches a bounded plateau in long runs. Track image/audio/geometry/target allocations and disposal. Browser memory figures and calculated GPU estimates are labeled separately.

**PF-04:** Quality changes use hysteresis and preserve active effects. High resolution and high DPR obey an absolute pixel cap. Lower tiers retain all five identities.

**LC-01:** Tab hiding pauses without catch-up; no queued burst storm on return.

**LC-02:** Context/device loss preserves a functional recovery UI; retry releases the previous resources.

**LC-03:** Wake-lock requests cannot become active after cancellation/closing/pause due to a late asynchronous response.

**LC-04:** Storage unavailable/corrupt preferences do not block the scene; safe defaults apply.

**LC-05:** After successful caching, cold offline start can complete all five effects and the selected show assets.

**LC-06:** Test update available, deferred update, accepted update, failed download, stale cache and rollback. No automatic mid-stream refresh.

**LC-07:** Repeated reset/unmount/remount leaves no duplicate animation loops, listeners, GPU targets, voices or haptic timers.

## Streaming and release tests

**ST-01:** Full-scene mode shows no captured UI; correct output dimensions, framing and silent default.

**ST-02:** Protected rectangles for captions/people remain clear under the chosen show policy. No face detection or footage access is required.

**ST-03:** Actual OBS hide/show, scene switching, shutdown and refresh behavior is recorded. Restart/resume policy is deterministic and avoids catch-up.

**ST-04:** Transparent mode contains no opaque black background. Test over black, white, gray/checkerboard and representative footage.

**ST-05:** Bloom edges and smoke do not produce dark fringes or inappropriate rectangles. Document additive/source-over approximations and limitations.

**ST-06:** Observe a sustained 1080p/30 OBS composition with the intended stream workload, not an empty browser-only scene.

**QA-01:** At least one physical Android phone, a tablet and the intended desktop are tested; cover Safari/iOS when supported release targets include them. Record unsupported paths rather than claim universal support.

**QA-02:** Complete a 30-minute device session and at least a two-hour real-time display/stream session. Logical accelerated tests remain separate. Record thermal throttling/power observations where observable; do not invent temperature readings.

**QA-03:** Review flash behavior across the maximum permitted overlap and output scale; keyboard/focus/contrast and reduced settings receive a human review. Automated screenshots alone do not certify safety or accessibility.

**QA-04:** Owner reviews the full lifecycle and all five families, with no quality tier misrepresenting its capability. Release report lists passed, failed, blocked and unrun gates, exact source/deployment revision and rollback.

## Decision experiment: EffekseerForWeb

Run one small smoke/contact effect in isolation, using the new dual-backend runtime, not an old WebGL-only sample. Answer: does it share the chosen render pipeline and depth correctly; preserve HDR/alpha; avoid a second scene clock; respect pause/mute/cleanup; allow required variation; fit the payload; and reduce authoring/maintenance effort? Reject integration if it requires taking ownership of the whole application merely to supply a small effect. Keep the default custom TSL plan moving while this optional experiment is evaluated.

## Release stop conditions

Do not promote with unresolved ownership/branch conflicts, broken hold cancellation, missing children in an admitted effect, unbounded resource growth, lost offline assets, unexpected autoplay sound, unsafe flash behavior, incorrect output alpha, or unresolved backend failures. Physical/art/stream gates may remain unrun during development, but must never be described as passed.

# Open-sky controls â€” source-backed implementation plan

Original planning record, 1 October 2026. The owner subsequently authorized complete implementation; see [implementation](IMPLEMENTATION.md). No application changes, PR push, merge or deployment in this step. [Interactive layout study](wireframe.html) uses the current thirteen SVG glyphs but a schematic scene; it is not an implemented Firecrackers build or photographic rendering evidence.

## Reconciled baseline

Canonical repository: `C:/Users/samir/Documents/Codex/2026-09-29/s/work/firecrackers`. Current clean candidate `feat/flagship-signatures`, checkpoint `7946153d44a3ad42de8cdbb5b792af7b19c7f6f5`, application source `6af8dd6`, open PR #26. Main remains `6fe052607c2ea50676d9320c9b66b13e11fa2dfb`. Existing moon/water candidate, ten original effects and three signatures are the baseline. These owner markings supersede the visible bottom collection arrangement; they do not replace the effects engine or hosting.

References: supplied `1-125931.jpg` (red markings) and `2-125928.jpg` (unmarked), inspected at full size. The Vercel address is visual context; existing Cloudflare preview and production hosting remain unchanged.

## Markings, one by one

### 1 â€” Completely clear the top-left sky

Remove both the visible Firecrackers wordmark and its small star icon. Keep an accessible, visually hidden application heading and the existing document/PWA name. No substitute badge, permanent mode label or decorative HUD in this area. Preserve current sky, moon, water and scenery.

### 2 â€” All thirteen fireworks in a transparent left collection

Use the indicated left strip. One uninterrupted sequence, with no visible Classics/Grand/Signature headings, cards, separators or enclosing panel. Keep stable catalog order and named accessible controls; original shortcuts 1â€“9/0 remain. Existing 28â€“32px glyphs remain inside 48px targets. A tiny gold selection marker and hover/focus names supply feedback.

A single phone column needs 13Ã—48 = 624 CSS pixels before safe margins and cannot fit the required small layouts. Default portrait phones therefore use two columns/seven rows, approximately 96Ã—336px, bottom-aligned at the left. Tall tablets/desktops can use one 48Ã—624px column. Short viewports use three columns/five rows (144Ã—240px), raised above the bottom position/mode strip. Thresholds are initial design values to validate against measured available height and safe insets. All thirteen remain visible, with no carousel or mandatory scrolling.

Each icon retains immediate admitted tap launch and 8px-threshold dragging. Sky drops remain exact; terrace drops remain normal launches; controls/water/outside/cancel releases launch nothing. Moving the collection must not reintroduce duplicate clicks after drag or swallowing keyboard activation after cancellation. Dock geometry stays reserved during a drag.

### 3 â€” One compact four-direction show knob

One persistent 64px visual control, with a 48px minimum activation target; no four permanent buttons or bottom menu strip. Centre shows the current mode's glyph:

| Direction | Mode | Glyph |
|---|---|---|
| Up | Manual | Hand |
| Right | Calm | Leaf |
| Down | Festival | Sparkles |
| Left | Finale | Crown |

Tap opens a small adjacent four-way selector with named 48px choices. Drag the centre toward a direction to preview, then release to apply. A short accidental movement does not change the mode; pointercancel/Escape reverts. The four-direction expanded control is transient; its temporary area is measured and blocks scene launches. The centre is the only persistent knob. All modes have text names for assistive technology and focus/hover; icons alone never carry the meaning.

Choosing Manual stops future automatic cues, while admitted rockets and child breaks finish. Selecting the already-active mode does not repeatedly restart its show. Finale remains finite and returns the knob to Manual when complete. Mode selection preserves explicit manual pause, independent of popup pause ownership. Current `useWorld.start` and `Simulation.startShow` actively clear manual pause, so the new control must use a configuration/start path that preserves user pause intent rather than calling those blindly. Sound never turns on through this knob.

The HTML study demonstrates click selection; production pointer-direction selection and pause ownership are planned, not implemented here.

### 4 â€” Lower-right utility controls

Move Pause/Resume, Sound and Controls to a compact vertical stack immediately above the mode knob, within or just above area 4. Keep 48px targets and restrained focus/hover. No permanent utility control midway across the open sky.

Controls contains Settings, Fullscreen, Help and Reset/update/recovery entry points as applicable. Show mode and Position no longer need duplicate persistent menu entries because areas 3 and 5 provide their primary actions. Help retains the optional named catalog. Loading/recovery still expose distinguishable essential actions when rendering fails.

Panels use the existing compact translucent system, open upward/adjacent to this stack and scroll within usable screen bounds. They must not overlap the knob/position handle or require reduced-size targets on short landscapes. Preserve focus containment, visible close, Escape, focus restoration and overlay pause ownership. Background collection, knob and position controls are inert while modal panels are open.

### 5 â€” Precise next-rocket position handle, including Random

Working interpretation: horizontal placement on the launch terrace, not moving the rocket into water or arbitrary sky. Sky dragging remains the separate exact-burst action. The optional clarification question asks whether free two-dimensional sky placement was intended instead.

Use a discreet horizontal track in the lower-centre space, with a grounded/crosshair handle and a small Shuffle toggle. No enclosing card, large heading or Apply dialog. The visible track may be compact, but maps end-to-end across the full usable terrace. Keyboard arrows nudge; Home/End choose usable edges; Shift provides a fine adjustment. Touch uses a 48px-high interaction area with pointer capture; moving the drag slightly above the track enters fine adjustment, keeping a short control from causing large rocket-position jumps. The full-range absolute mapping remains available on the track. A subtle grounded preview shows the next spawn; cancellation restores the previous position. Moving the handle selects Fixed mode.

Current source clamps to `.2..8` in Simulation, the GPU projector, Canvas projector and the Position slider. Merely widening the HTML slider would leave the engine restricted. Replace these duplicated clamps with one normalized `0..1` placement contract and renderer-resolved ground bounds. Bounds account for safe insets, rocket footprint and real control obstruction; the range is the full usable terrace rather than the literal outermost screen pixels. GPU ground-plane projection and Canvas inverse projection must agree.

Random means a new valid position per admitted normal launch, not continuous sliding of the prop and not immediate automatic launches. It applies independently of Manual/Calm/Festival/Finale. Use a separate seeded placement stream, preserving effect, show and audio RNG streams. Failed/blocked inputs must not consume or reroll the next random position. A deliberate terrace drop uses its requested position for that launch even if Random is enabled; a sky drop always keeps its exact point.

Current `setPlacement` also refuses updates unless the simulation is ready. The handler therefore needs a separate next-position draft/policy; bypassing that guard by rewriting the airborne rocket is not acceptable. Pointer preview remains a ground marker until the gesture commits; cancel restores the previous draft.

Freeze chosen placement, world launch X and composition profile at admission. Handle changes during an existing flight update the next draft/preview only. Never teleport or rewrite the committed rocket. Near-edge placement and huge signature shells require explicit visual review: preserve exact ground placement and principal canopy readability, with natural gently inward aiming only if necessary. Any inward aiming must be resolved at admission and use a coherent analytic trajectory while retaining the powered-rise/coast vertical solver. Do not hide a clipped shell by camera tracking, global scene lifting or arbitrary rectangular clipping. This edge trajectory work is a design checkpoint, not an existing implemented capability.

## Responsive composition

| Viewport | Initial left collection | Lower controls |
|---|---|---|
| 320Ã—480 | 3 columns Ã— 5 rows, above bottom strip | Full lower track with right knob; stack above knob |
| 375Ã—667 / 393Ã—851 | 2 columns Ã— 7 rows | Lower-centre track, separate right knob/stack |
| 768Ã—1024 | 1 column Ã— 13 rows | Compact lower track, right stack/knob |
| 844Ã—390 | 3 columns Ã— 5 rows above bottom strip | Compact landscape track; panels fit/scroll |
| 1280Ã—800 / 1920Ã—1080 | 1 column Ã— 13 rows | Small lower-centre track; right controls near corner |

The study provides all seven sizes. These are layout proposals, not completed application/device validation. Browser bars, safe insets and 200% zoom must use measured CSS space rather than device-model guesses. On normal phones the footer need drops from the current 188px tray to approximately 64â€“76px, plus safe inset. Do not reserve a full-height left gutter just because a transparent dock occupies its lower portion. Keep the upper sky across the width wherever control footprints leave it clear.

## Additional owner requirement â€” realistic launchpad and responsive rocket

Added after the five marked-area decisions. Working interpretation: improve the physical launchpad feel and make the displayed rocket smaller/proportionate on phones while remaining readable on other screen sizes. Exact sizes below are starting targets for visual refinement, not measurements of a physical firework or a completed implementation.

### Launchpad material and grounding

Owner clarification: retain the realistic dock/launchpad as the visual foundation, with a crisp 4K-like finish and smooth responsive presentation. Preserve the existing authored stone terrace and scenery. Treat 4K-like as the visual quality target: believable material detail, clean geometry, grounded contact and restrained lighting. Resolve texture detail and rendering resolution through the existing quality/device budgets; do not hard-code a 3840px framebuffer on every phone. Rocket model sizing and fireworks burst scale remain independent.

Keep the authored stone terrace, waterfront and existing launch-stage geometry as the base. Refine the support into a modest low-profile, weighted metal base: subdued brushed/aged steel, restrained brass accents, subtle edge wear and surface roughness. Preserve visible support and contact with the stone. Remove the decorative luminous ring/dial treatment; light should come primarily from the fuse and ignition, with restrained local bounce.

Use a small cached contact-darkening/AO treatment and existing lights/material paths, rather than adding a live shadow pass, full-screen effect or extra moving lights. Fuse ember, motor flare and bounded smoke remain tied to the same physical attachment. Keep motion and local brightness compatible with reduced-motion/reduced-flash settings. This concerns virtual scene appearance, not physical launcher construction.

Current source evidence: `LaunchStage` uses a .28 horizontal stage scale (outer local radius around 23.2, resulting world radius around 6.5). Canvas `drawStage` instead uses `22.5 * this.scale` with a separate 24px minimum. These expressions disagree before projection; their ratio is not an exact screenshot-size measurement. Replace them with one shared pad footprint/contact contract. Canvas should approximate the same shape, shading and proportions honestly; it cannot reproduce the GPU material lighting identically.

### Rocket sizing across screens

Measure the complete standing silhouette, from support contact to cap tip, including the stick and fuse clearance. Start roughly 20â€“30% smaller than the supplied normal-phone view; retain each family's distinct shape and modest relative size differences. All thirteen use the same responsive sizing policy, not one generic identical rocket.

| Layout | Initial standing-height target, CSS pixels |
|---|---:|
| Normal portrait phone | approximately 64â€“96 |
| Very short phone / landscape | approximately 44â€“60 |
| Tablet | approximately 90â€“120 |
| Desktop | approximately 90â€“140 |

Resolve size from available scene height, viewport width, family bounds and control clearance, with minimum/maximum limits. These ranges are visual targets to tune using actual browser captures. They are not fixed device-model rules. Preserve the largest readable body that leaves the terrace, boats and sky open, and keep pad size proportionate to the rocket. Include the fuse's side reach in usable-placement margins.

`RocketProp` currently receives fixed `(3.8, 3.4, 3.8)` scale in GPU Renderer; FusePath/LaunchGeometry use matching fixed offsets. Do not resize only the drawn mesh or use CSS transforms on the canvas. A shared `LaunchPropComposition` must resolve model scale, pad footprint, standing contact/origin, fuse endpoints, motor and shell attachments. GPU and Canvas consume that contract. Keep the physical terrace contact anchor fixed so a shorter rocket does not float above the base or sink into it.

Snapshot the admitted rocket's model scale and attachment profile. Resize/rotation can resolve future props, while an airborne rocket retains its committed geometry/trajectory; no mid-flight scale jumps. The powered-rise/coast solver must use the resolved body origin and shell offset so upper-sky burst composition stays correct. Explicitly keep `rocketModelScale` separate from the existing burst `effectScale`: making the rocket smaller must not make Imperial Crown, Celestial Aurora or Royal Phoenix smaller fireworks.

Refine realism through the existing paper/wood/foil materials, restrained highlights and correct perspective recession/fade. Avoid oversized caps, bright permanent halo, plastic/chrome appearance or oversized motor flames. Preserve unique family colours, silhouettes and ignition treatments.

### Required implementation checks

Add coverage for all thirteen silhouettes across the seven viewports and all three rendering paths; measure screen-space body/pad/fuse bounds and support contact. Verify no floating, sinking, clipped caps, detached flame/smoke or shell jump. Test an active flight through resize, next-position changes and random placement; its model/attachments stay committed. Verify the three flagship bursts retain their original size/choreography, admission reservations, comfort behavior and performance budgets. Capture matched closeups and full-scene phone/tablet/desktop images; visually qualify realistic grounding and materials. The HTML study remains schematic and does not provide photorealism or live-renderer evidence.

## Source changes and shared interfaces

1. Replace/rename `BottomCollection` into an edge collection; adapt `collection.css`, `CinematicHUD` and `stage.css`. Remove visible brand and caption DOM. Preserve glyphs, IDs, semantic names, activation and drag hooks.
2. Add `ShowModeKnob` and `LaunchPositionControl`; coordinator App wiring scopes their gestures/keyboard events so they cannot leak into scene/family launch handlers. Simplify ControlsMenu and preserve Dialog focus/pause behavior.
3. Extend StageLayout with measured collection, utility rail, mode knob, position control and temporary popup footprints. Distinguish unobstructed upper sky, visible ground and UI hit exclusions; remove fixed three-row tray assumptions. Cache measurement/projection on resize/layout change, not per-frame React work.
4. Introduce shared `PlacementPolicy { mode: 'fixed' | 'random'; normalizedX: number }` and cached renderer-resolved launch bounds. Simulation owns seeded random admission and committed launch state. RendererPort, GPU Renderer and CompatibilityRenderer share placement semantics; LaunchProfile carries any resolved edge composition/aim target.
5. Add shared LaunchPropComposition in LaunchGeometry/LaunchProfile, and update RocketProp, LaunchStage, GPU Renderer and CompatibilityRenderer together. Resolve screen-space rocket/pad targets on layout changes and freeze model/attachment scale at admission. Do not scale the burst recipes.
6. Keep pointer preview outside heavy React rendering. Preserve active flight/show on resize, resource reservations, no surprise queues, audio/comfort, all renderer paths and bounded cleanup. New preference fields default to Fixed/centre and migrate existing saved preferences without changing quality/backend/sound.
7. Extend deterministic QA snapshots with placement policy, next position and chosen committed position. Update obsolete bottom-tray assertions to the new layout; retain unrelated safety gates.

## Implementation verification and delivery

Implement on an isolated feature branch preserving candidate PR #26 and moon/water work. No merge/production promotion is included in this planning step. Publish a separately fingerprinted Cloudflare preview only after relevant checks pass.

Required coverage: all thirteen 48px targets visible/reachable in seven sizes; no visible name/captions/cards; utility/knob/position bounds separated; moon/water/boats/prop and principal signature structures readable; full usable terrace endpoints in GPU and Canvas; seeded Random repeatability and no RNG consumption on rejected admission; exact terrace/sky drops; no duplicates or accidental launch from knob/position gestures; manual pause preserved across mode popup/panels; Finale finite; current rockets immutable while changing mode/position, resize/rotation/recovery; Low/Standard/Ultra, reduced motion/flashes, optional sound, offline/reset/updates/recovery.

Run units/typecheck/lint/build, original/Grand/signature launch and backend suites, panel/viewability/recovery/asset lifecycle/overload, logical soak and required PR/push checks. Capture matched source/seed phone, short-phone, landscape, tablet and desktop scenes. Test native WebGPU, forced WebGL and Canvas separately. Compare timing to current .2; label CPU submission/rAF versus completed GPU timings and physical-device limitations accurately. The wireframe is for layout decisions only and supplies none of those application claims.

## Planning-study verification

[Static layout report](layout-study-checks.json): all seven specified sizes passed for thirteen 48px glyph targets, within-frame bounds, separated collection/utility/mode/position areas and click-based mode/Fixed/Random interactions, with zero script errors. This is a standalone schematic HTML study in installed Chrome, not game integration, GPU/Canvas validation or physical-device evidence. Application source and both Cloudflare releases remain unchanged.

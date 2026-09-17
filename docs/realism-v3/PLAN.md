# Firecrackers — Realism V3 delivery plan

Date: 17 September 2026. Baseline: `85b4e6df8bb3a55d945de246a61913df7b71c721` on `feat/fireworks-v1`.

## Goal and scope

Deliver a visibly richer, working interactive scene and publish the previously verified UI V3 together with it. The owner wants realistic festival fireworks plus restrained 3D futurism, not another parameter-only upgrade or a static concept passed off as a running app.

Keep the existing React/Vite/Three.js 0.180.0 architecture, five families, single screen, fixed normal camera, hold/cancel and Light once alternatives, sound-off startup, reduced flashes, Ultra default, finite resource limits, offline PWA and presentation modes. Preserve main and the divergent alternate implementation. No force pushes or unrelated workspace changes.

## Visual contract

Use the existing approved dark-glass/warm-metal UI language. The central experience is a crafted launch object on an architectural terrace, a deep but quiet festival sky, and luminous falling structures with atmosphere. Futurism belongs in the stage geometry and responsive light, not neon HUD clutter or fictitious controls.

The prior concept images are design references, not runtime assets or proof of rendering. Their waterfront/palace, gallery and VR controls are outside the agreed implementation. We will use true reusable 3D geometry and shaders for interactive scene objects, not paint fireworks into a background image.

## Checkpoints

### RV3-A — baseline and proof

Restore the exact source/toolchain, capture the current scene at idle and Gold Willow peak, and record browser availability. Reconcile deployed-source drift. Preserve all existing tests. The flow under test is: enter → select/place → hold or Light once → fuse → ascent → aerial burst → lingering smoke, then pause/settings and return.

### RV3-B — 3D environment and materials

Build a more readable architectural launch platform with layered bevels, rough dark surfaces, warm metallic rims and restrained practical light. Anchor it to a dimensional ground surface. Improve rocket wrap, banding, fuse and nearby illumination. Add subdued horizon depth, sparse stars and coherent atmosphere without a bright galaxy or an overloaded landscape. Keep scene assets original and bounded; no asset-rights or third-party runtime dependencies are required.

### RV3-C — effects with visible structure

Improve star distribution and family morphology, trail taper/energy/granularity, sparse drifting micro-embers, colored local light and smoke motion. Keep a defined luminous core rather than thick uniform wires. Use the existing fixed-step clock and independent variation, not per-frame random flashing. Any changes to count, life or admission must preserve bounded resources and recognizable crossette/finale children.

### RV3-D — scene/UI integration

Publish the completed V3 command deck, panels, accessible ignition and responsive controls. Correct canvas composition for the enlarged stage and camera. Keep the five families, Manual/Auto/Festival/Finale, settings and display controls genuinely connected. Display mode omits unnecessary props/chrome; transparent output has no sky/ground background. Preserve Ultra/60-fps targets while clearly distinguishing target from measured performance.

### RV3-E — qualification, preview and record

Run typecheck/lint, engine/lifecycle tests, accelerated boundedness simulation, build and documentation validation. Run actual rendered browser tests for desktop/portrait/landscape, all families, hold cancellation, pause restoration, mode switching and alpha output. Inspect actual screenshots against baseline and the design language. Fix errors before deployment. Update the existing preview, verify build markers and save implementation/deployment evidence and remaining gates in GitHub.

## Implementation checklist

- Existing frontend-only React/Vite app, same preview ID; no new backend or API keys.
- Source retrieved through authorized GitHub tools; use a temporary local checkout only.
- Create focused scene/effect modules and preserve simulation outside React.
- Check exact installed TSL/material APIs before use; test forced WebGL separately from WebGPU claims.
- Inventory user workflows in the existing AppDeploy JSON tests and reconcile changed scene/UI behavior.
- Keep code readable and preserve asset/license notices.
- Save coherent planning, implementation and evidence checkpoints.

## Preflight checklist for deployment

- Build/type/unit checks pass on the candidate.
- Rendered page is nonblank with no relevant console or framework errors.
- Primary controls and actual burst are exercised, including a phone-sized viewport.
- Existing AppDeploy source and tests read before submitting changes; only changed files submitted.
- App ID, frontend-only type, model, intent, initiator and change type supplied.
- No secrets, user-provided binary attachments or local absolute paths embedded in runtime.
- Poll deployment to a terminal result and inspect runtime/QA errors.
- Never claim physical-device, hardware WebGPU, OBS, long GPU endurance or flash-safety certification from browser emulation.

## Acceptance and honest boundaries

Required for this preview: an obvious idle-scene difference; visible material/depth cues; improved full-speed burst structure; complete functioning UI V3; working responsive controls; reproducible code/build; actual captures; and correct deployed-source version. Record any effect simplifications.

Procedural texture/geometry work is not called Blender-baked smoke or professionally authored GLB. Bounded layered smoke is not a fluid solver. GPU compute, professional recorded audio, device thermal/OBS/Safari checks and owner visual approval remain separate milestones unless actually performed.

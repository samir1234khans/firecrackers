# Firecrackers: cinematic realism and experience upgrade

Research date: 16 September 2026  
Scope: a substantial improvement to the existing single-screen browser application, not an engine rewrite.  
Status: final proposed implementation plan; new runtime work and visual sign-off remain pending.

## 1. Executive decision

Build a believable, interactive festival night. The user should feel a clear chain of cause and effect: choosing a tangible object, placing it, making contact with its fuse, watching that fuse burn, seeing thrust begin, following the ascent into the distance, and then watching a large aerial structure expand, fall and disappear into drifting smoke.

The strongest next investment is **coherent motion, continuous trails, real perspective, controlled light and integrated smoke**. More particles alone will not fix a launch that moves incorrectly or a burst that looks pasted onto the sky. A heavier glass interface would also move attention away from the experience the user wants.

Retain React/Vite/TypeScript, the fixed-step simulation outside React, the existing Three.js TSL architecture and the five families. Improve the rendering and asset pipeline in place. Use open-source tools where they save genuine work, but do not install several overlapping particle engines just because their demos look impressive.

The recommended sequence is: protect the baseline; prove a version-correct depth/HDR pipeline; complete one exceptional Gold Willow from contact to residue; add relightable smoke and authored props; upgrade the remaining families; refine glass UI and sound; build the wedding-stream presentation; validate on real devices and in OBS.

All numeric targets in this plan are proposed artistic or engineering starting points, not measured performance, real-world firework specifications, safety certification or guaranteed hardware capability. Source references such as [R03] resolve in the research register.

## 2. What was actually audited

### 2.1 Repository state

The runtime baseline is `feat/fireworks-v1` at `5aafb8033fbfb231518efbb73d1fa2141ff53977`. Its package manifest pins Three.js `0.180.0`. The repository also has `main` at `7603a2c63ef1f4e36e4c1d845915632640d83369` and a divergent `feat/fireworks-v1-implementation` at `16d9d1d8056ff6cb1d47b7fff92c3731395efdce`. GitHub's comparison reports that the latter is seven commits ahead and six behind the audited runtime, with the documentation baseline as merge base. These are different development lines, not a simple sequence of newer versions. [R01]

Source review covered the runtime renderer, simulation, world hook, UI, platform lifecycle and the existing art/evidence documents. An earlier attached Willow image was also inspected as historical visual context. Its exact runtime commit was not established, so it is not presented as a new live-site capture or benchmark. No new runtime, OBS, device, browser-compositing or audio-listening test was performed for this research plan.

### 2.2 Findings that explain the current realism ceiling

| Area | Verified source behavior | Why it matters | Planned correction |
|---|---|---|---|
| Projection | `Renderer.ts` uses an orthographic camera, with an extra depth-based particle scale factor. | The simulation already has some 3D coordinates, but does not show normal perspective depth. | Stable perspective camera, true camera-facing particle basis and physically coherent depth cues. |
| Ascent | `Simulation.ts` drives height with a normalized eased curve. | The curve begins fast and decelerates; there is no explicit powered acceleration followed by coast. | Separate thrust and coast states with continuous position and velocity. |
| Trails | The renderer displays stretched, soft instanced quads emitted along paths. | It is a useful baseline, but not a connected, identity-preserving trail system. | Benchmark improved joined segments against connected ribbons; preserve per-particle history. |
| Occlusion | Particle materials disable depth testing and use fixed layer order. | Smoke, sparks and foreground objects cannot interact through proper scene depth. | Opaque depth, soft intersections and depth-aware smoke/emissive composition. |
| Glow | Additive radial kernels; the render loop renders the scene directly. | A tone-mapping setting is not the same as an HDR bloom pipeline. | Linear scene rendering, bounded bloom and a verified final output transform. |
| Smoke | A generated noise texture and billboard layers, with local light tint calculated from 2D distance. | Depth, internal structure and light placement remain approximate. | Authored density flipbooks, 3D light distances, depth ordering and improved scattering approximation. |
| Color response | Most burst light envelopes use a warm default, even when stars use a different palette. | A green or red effect may illuminate retained smoke with the wrong color. | Derive light envelopes from the same authored palette/energy event as the burst. |
| Secondary bursts | Finale cues spawn at scheduled offset positions. | The secondary event has timing, but not a visible carrier traveling there. | Visible child trajectories, with the child burst beginning at the carrier's actual position. |
| Crossette | Child splits use an XY plane with zero child Z velocity. | The split can read as a screen-space cross rather than a spatial event. | Oriented local split planes, inherited velocity and preserved 3D motion. |
| Responsive world | Width changes also influence simulation scale and force/speed terms. | Resizing can alter the physical interpretation rather than just reframing it. | Stable world coordinates; camera and presentation adapt to viewport. |
| Props | One procedural rocket geometry is recolored; fuse geometry is static. | Family identity and the physical ignition ritual are underdeveloped. | Authored reusable mesh family, contact grounding and traveling fuse ember. |

These are findings about the reviewed source, not claims that every artifact is equally visible in every frame. The first implementation phase must capture the actual running baseline and compare it with the new candidate. [R01]

### 2.3 Existing strengths to preserve

The application already has a seeded fixed-step engine, bounded resource pools, five identities, deliberate hold/cancel ignition, accessible alternatives, show/manual priority, optional sound and haptics, pause and recovery behavior, and PWA foundations. The upgrade should retain these strengths. A new visual effect that breaks cancellation, offline use, cleanup or accessibility is a regression, not progress. [R01]

A separately delivered lifecycle patch also needs review before integration. Its existence does not prove it is in the branch. Reconcile the actual files and tests; do not blindly apply an old patch to a different implementation line.

## 3. Final visual direction

### 3.1 The world, not the UI, is the centerpiece

Keep one festival-night environment: near-black blue sky, uneven distant tree line, a few subdued warm horizon lights, faint atmospheric haze and sparse clouds. No galaxy backdrop, bright moon, sci-fi shockwave rings or generic gaming HUD. Reserve roughly 82–88% of the normal composition for the sky, adapting the control footprint on small screens without changing the world scale.

Use four readable depth layers: a tactile launch area, a quiet near-ground region, the aerial effect volume, and distant haze/clouds. A small amount of genuine geometry at the launch area is more valuable than a large decorative landscape. Contact shadow and local ignition light should anchor the rocket rather than leave it floating over the interface.

Maintain the approved stable camera during ordinary play. Do not automatically orbit, dolly, shake or follow every rocket. Perspective itself supplies depth; camera motion is not a substitute. An optional later showcase camera is outside the core acceptance gate.

### 3.2 Build for motion, not a long-exposure photograph

A good still is not enough. Review full-speed footage, slowed motion and six fixed checkpoints: unlit prop; fuse midpoint; powered ascent; initial expansion; late canopy; and old smoke illuminated by a second burst. Use real display footage as an appearance reference, recording source and timestamps when it is actually viewed. Do not infer precise velocities or brightness from compressed footage without camera/exposure information.

Reference families support recognizable distinctions: a peony is a sphere of luminous stars, willow trails hang and fall, and crossette stars split. The plan preserves those visual identities rather than making five recolors of one effect. Crossette and crackle are separate visual/audio ideas; the app's Silver Crossette Crackle is an intentional combined design. [R22][R23][R24]

### 3.3 Material and color restraint

Use paper roughness, subtle wrapping irregularity, fuse fibers, muted bands and a plausible stick silhouette. Avoid shiny metal rocket bodies or real branded packaging. Geometry must contribute to silhouette at the actual display size; invisible microdetail is not worth its download or render cost.

Render energy and display color separately. A tiny high-energy core can feel brighter than a large blurred blob. Preserve gaps between trails, colored outer structure and a dark sky. Do not turn every family orange during extinction; authored color-over-life should be family-specific. A general blackbody gradient is not a complete model for every colored effect.

## 4. The complete ignition-to-residue experience

### 4.1 State contract

Use a clear state machine:

`Ready → Contact → FuseBurn → Thrust → Coast → Break → Expansion → Afterglow → Residue → Recycled`

The later visual stages may overlap: smoke can persist while another rocket is prepared. The state machine controls semantic events and resource ownership; it should not force all subsystems into one monolithic object.

Each effect instance owns a stable identifier, seed, event sequence, authored family configuration and resource reservation. Pooled-array indices are not stable identities because compaction can move records. Child effects and trail history must refer to stable handles with generation counters or an equivalent safe ownership mechanism.

### 4.2 Ready and placement

Selecting a family reveals its actual 3D prop at the launch area. Give the selection a short lift-and-settle transition, then leave it steady. Use a single support/contact model for the virtual placement surface. Ray-based pointer placement resolves against that surface; Left/Right, a slider and a center action remain available.

Do not make dragging mandatory. Preserve a large, forgiving interaction target independent of the tiny visible fuse. The visual object may be small; its hit area should not be. Pointer capture, early release, touch cancellation and orientation changes must have explicit outcomes.

### 4.3 Contact and fuse burn

Retain the baseline 650 ms hold and 1.5–2.5 second fuse range initially, so the graphics upgrade does not silently rewrite established interaction timing. A provisional flame/contact response begins immediately during the hold, but the ignition only commits at the threshold. Early release removes the provisional effect without launching anything.

After commitment, move an ember along the fuse curve by normalized arc length. Reveal a darkened burnt segment behind it. Add localized sparks, an uneven but continuous hiss and a thin smoke thread. The flame leans with the same prevailing wind used elsewhere. Animate progress in shader/uniform state where practical; do not regenerate tube geometry every frame.

Launch begins when the ember reaches the authored endpoint. The endpoint event, thrust light, sound and animation must share a timestamp. The user should not see a fuse still burning while the rocket has already departed.

No repeated messages or progress percentages are needed after onboarding. The ember is the visible progress indicator. Keep a semantic status announcement for assistive technology, without announcing every spark.

### 4.4 Thrust and coast

Replace the eased-height shortcut with a bounded virtual motion model. During thrust, apply an authored upward acceleration envelope, gravity and drag relative to wind. During coast, remove thrust and retain momentum, gravity and drag. This is a graphics motion model, not a real rocket design calculation.

Preserve position and velocity at the transition. Orient the model along its motion direction, with only restrained authored wobble. Distinguish the bright powered tail from weaker coasting sparks. Detached fragments should slow independently rather than follow the head as a rigid strip.

Start testing with a total ascent envelope around 1.5–3 seconds, distributed between powered and coasting stages to fit the scene. Treat this as a tuning range, not a real-world measurement. Choose burst position from the trajectory and authored trigger, not an unrelated screen-space location. Do not force the burst to occur at a mathematically perfect apex every time.

### 4.5 Break and expansion

The first break is a short, spatially limited luminous event. Its purpose is to establish energy and scale, not wash out the whole frame. An initial 40–90 ms envelope may be explored, subject to flash analysis and the combined behavior of overlapping events. A short individual flash is not automatically safe.

Spawn stars from a spatial distribution with controlled variation. A nearly spherical arrangement is appropriate for some families, but randomize its orientation and modestly perturb speed, onset and life. Do not randomize so much that the selected family loses its identity. Parent momentum contributes to child motion.

Separate luminous heads, trail history, sparse glitter and smoke. They need different age curves, sizes and compositing. Rapid expansion must decelerate visibly before gravity produces the late shape. A Willow should become a canopy, not remain a rigid sunburst.

### 4.6 Afterglow, residue and repetition

Allow different stars to extinguish at different times. Trail brightness and width should taper; tails must remain connected to their own history without following a recycled particle. Smoke expands and thins while the next effect begins. Avoid hard-clearing the sky on completion.

The show director must account for existing smoke and luminous overlap, not just active rocket count. Under pressure, reject a new event or reduce its admitted density before launch; do not cut a recognizable crossette in half after it is underway. Reserve enough resources for its children.

## 5. The five upgraded families

The identities are locked. All timing ranges below are proposed screen-experience tuning targets, to be refined against viewed references and the owner's preferred pace.

| Family | Defining experience | Key rendering/simulation work | Proposed late-stage target |
|---|---|---|---|
| Gold Willow | A warm break becomes a broad canopy of fine hanging gold. | Long age-tapered trails, gentle drag, visible sag, sparse glitter, warm local smoke illumination. | Recognizable falling canopy remains roughly 8–12 seconds after the break without becoming a uniformly bright cage. |
| Multicolor Peony | A clean, expansive sphere of separate colored stars. | Short trails, authored color sectors or complementary clusters, slight life variation, open dark gaps. | Main stars fade more cleanly than Willow; roughly 2–4 seconds of primary structure. |
| Chrysanthemum | Strong radial rays with a rich, connected luminous structure. | More continuous trailing than Peony, coherent expansion and subsequent curvature, optional restrained inner core. | Roughly 4–7 seconds of clear rays and falling residual traces. |
| Silver Crossette Crackle | Traveling silver parents visibly split into smaller crossing branches, followed by localized crackle. | Split event in an oriented local plane, inherited motion, independent children and bounded secondary cues. | Parent travel is legible before splitting; children remain trackable rather than appearing as an instant cloud. |
| Grand Finale | A compact authored sequence of carriers, secondary bursts and a golden ending. | Visible child carriers, staggered depth/height, admission reservations and density-aware pacing. | A finite micro-sequence, then enough quiet for the final trails to fall. It is not continuous full-screen flashing. |

Grand Finale is a composite creative preset, not a scientific sixth firework category. Keep the existing five-selection interface. Do not expand the catalogue before these five are visibly distinct at both low and high quality.

Build family variation from parameter ranges, not per-frame random flickering. Use a separate random stream per effect/subsystem so adding a smoke puff does not change an unrelated star trajectory. Compare the same seed during development, and several seeds during art review.

## 6. Rendering architecture selected for V2

### 6.1 Keep the engine; introduce explicit boundaries

React remains responsible for accessible controls and low-rate presentation state. The simulation owns time, motion, reservations and semantic events. Rendering reads a compact snapshot/buffer interface, not React state for every particle. Audio consumes events from the same simulation clock.

Split the current broad renderer responsibility into camera/composition, opaque scene, stars, trail history, smoke, transient lighting and post-processing. This can be incremental; avoid a disruptive all-at-once folder rewrite. Keep the current renderer available behind a development-only comparison flag until the new path passes its baseline gate.

### 6.2 Version-correct Three.js path

The installed version is `0.180.0`. Its official bloom example imports `bloom` from `three/addons/tsl/display/BloomNode.js`, builds a `THREE.PostProcessing` instance and composes a scene pass with bloom. Current documentation instead demonstrates `RenderPipeline`. Those APIs must not be mixed casually. Start the compatibility experiment against the pinned version; upgrade Three.js only as a separate, reviewed change with its own migration evidence. [R03][R04]

`WebGPURenderer` can fall back to WebGL 2, but that does not make an arbitrary WebGL shader library compatible with its node-material API. The official manual specifically distinguishes its material system from `ShaderMaterial`, `RawShaderMaterial` and `onBeforeCompile` customizations. Forced WebGL is still the WebGPURenderer API path. [R02]

Do not install the old EffectComposer ecosystem as the default solution. The pmndrs postprocessing examples use WebGLRenderer; adding it to this project is an integration decision, not a drop-in upgrade. [R25]

### 6.3 Perspective and stable coordinates

Use a perspective camera with an initially explored vertical field of view around 35–50 degrees, while matching the established single-screen framing. World positions, gravity and trajectory scale stay stable during resize. Adapt camera aspect, framing and the permitted placement region instead.

Orient billboards in camera space or with an explicit camera basis. Simply replacing the camera class while leaving every quad on the world XY plane is incomplete. Apply size falloff through projection; avoid doubling it with the old ad hoc depth multiplier.

On portrait screens, fit the expected canopy envelope and reserve space for the foreground interaction. On landscape screens, use the extra width for air and spatial variation, not giant enlarged controls. Clamp extreme aspect ratios thoughtfully. Resizing during ascent must not teleport the rocket or restart a burst.

### 6.4 Trails: benchmark the representation, not the buzzword

Evaluate three variants on the same recorded workload: the current stretched-quad baseline; improved instanced connected segments; and a connected camera-facing ribbon implementation. Compare close-up continuity, crossings, projected width, CPU update cost, buffer-upload bytes and GPU fill cost.

Store timestamped 3D history in bounded rings. Sample history by traveled distance with a maximum time interval, so fast motion does not become dotted and slow motion does not accumulate unnecessary duplicate vertices. At most a bounded number of inserts may happen in one step. Give joins stable orientation, prevent extreme miters and handle near-zero motion without NaNs.

Use a sharp inner luminous trace plus restrained wider glow. This may share geometry or use a packed shader representation; do not double all geometry without profiling. Texture/noise modulates the trail gently along its length. The trail should look granular enough to feel like sparks, but not like a chain of detached equal dots.

The recommended baseline is CPU head simulation plus GPU-rendered segments/ribbons. Defer GPU-compute simulation until profiling shows a meaningful simulation bottleneck. Raw WebGPU examples demonstrate compute patterns, not guaranteed speedups for this application. Keep a CPU fallback and test semantic determinism separately from GPU floating-point pixel identity. [R21]

### 6.5 Linear light, bloom and output

Use a linear working space for lighting and a verified final display transform. Color textures and non-color data textures must be labeled correctly. Smoke density and normal data are not sRGB color images. Internal floating-point rendering is not a promise of HDR10 or wide-gamut output in browsers or OBS. [R05]

A practical starting pipeline is opaque scene/depth; transparent effects with depth-aware composition; controlled bloom from luminous content; tone mapping/output conversion once; and DOM UI above the canvas. Feature-test renderable/filterable/blendable formats on each backend. Provide a graceful lower-cost path when the preferred target format is unavailable.

Initially keep the sky, interface and ordinary smoke below the bloom threshold. If that does not isolate glow sufficiently, add an emissive mask or separate attachment only after measuring its cost and transparency behavior. Preserve a low-intensity mode and never use bloom to hide broken trail geometry.

Keep exposure stable. Do not make the whole night pump brighter and darker after every burst. Avoid heavy film grain, lens dirt, chromatic aberration, default depth of field and full-screen motion blur. Those may make screenshots dramatic while reducing real-time legibility and stream compression quality.

### 6.6 Depth-aware smoke and spark composition

Enable meaningful depth testing against opaque geometry, with transparent particles generally not writing opaque depth. Use a soft intersection fade based on comparable linearized camera depths. Test projection and depth conventions on both backends; do not copy a depth formula without checking it.

Opaque-depth soft particles alone do not solve smoke covering sparks or smoke layers covering each other. Use a bounded, depth-ordered representation. With the normal camera fixed, a small number of depth buckets can interleave smoke and luminous effects. Compare against a simpler sorted implementation first; adopt more complex order-independent transparency only if visible artifacts justify it.

Use premultiplied-alpha conventions consistently. Smoke attenuates; sparks emit. Treating both as additive makes smoke glow like fog, while treating every emissive trace as ordinary opaque color dulls the effect. Test intersections, color edges, near/far ordering and black/white-background composition.

## 7. Smoke and atmosphere production

### 7.1 Recommended smoke asset workflow

Use Blender offline to create original smoke animations, then bake compact density/opacity flipbooks. Blender's documented fluid workflow supports smoke simulation and cache baking; its software license does not assign the application's license to original rendered artwork. [R09]

Create distinct visual families for fuse wisps, ascent exhaust and burst residue. Aim for at least three variations of burst smoke, with different internal curls and silhouettes. Start with density/opacity plus a simple relighting representation. Add a normal/lighting-basis atlas only if it makes a visible improvement worth the memory. Do not begin with a six-direction lighting bake or a live volumetric fluid solver as a requirement.

The bake must not contain a permanent red, green or gold explosion tint. Runtime light should supply that color. Rotate and offset atlas playback, with mild shape variation, without obvious repeated squares or synchronized loops. Fade the edges and extinction frames cleanly; protect atlas borders against mip bleeding.

A billboard can still look excellent when its internal motion, softness, layering and lighting agree. The acceptance bar is the appearance, not whether the implementation can be labeled volumetric.

### 7.2 Shared wind and local light

Create one slowly varying wind field sampled by smoke, flame and appropriate fragments with different response strengths. Preserve readable ballistic motion for stars; do not apply the same strong turbulence to everything. Curl noise is a useful procedural-flow reference, not a replacement for every part of the simulation or proof of full fluid dynamics. [R15]

Light envelopes contain 3D position, color, intensity, spatial radius and an age curve. Choose a bounded set of nearby significant lights for each smoke region, rather than one dynamic scene light per spark. A red burst should illuminate nearby retained smoke red and leave distant smoke comparatively unaffected.

Handle density as a resource. Smoke should expand, thin, rise/drift and dissipate. During long displays, reduce new smoke emission or shorten low-value residue gracefully before the scene becomes opaque. Do not suddenly clear all smoke just because a pool is full.

### 7.3 Fill rate is a first-class budget

Large transparent particles can be expensive even with a modest particle count. NVIDIA's off-screen-particle technique describes lower-resolution particle targets and the quality tradeoffs of depth downsampling and upsampling. Use it as an optional smoke optimization, not an automatic copy of an old graphics-API implementation. Keep fine spark heads and trails at a sharper resolution. [R14]

Measure full-resolution smoke against half-resolution smoke with depth-aware upsampling. Reject blurred halos at the horizon and foreground props. Count projected coverage/overlap in diagnostics, not just objects and triangles.

## 8. Open-source reuse decisions

| Component | Decision | What it saves | Important boundary |
|---|---|---|---|
| Three.js TSL, node materials, native bloom and loaders | Adopt within the existing stack. | Core rendering infrastructure, shader portability, post-processing and asset loading. | Use the pinned release's API and test every advanced feature on both backends. [R02–R05] |
| three.quarks | Study and selectively adapt compatible ideas; do not replace the whole engine by default. | Trail batching, width/color-over-life, texture animation and sub-emitter patterns. | The main README still lists WebGPU rendering on its roadmap and describes experimental nodes separately. A useful trail design is not proof of drop-in compatibility. MIT notices apply to copied code. [R06] |
| EffekseerForWeb | Run a tightly scoped optional integration experiment. | Visual effect authoring and an existing JS/WASM playback ecosystem. | The new repository documents BOTH WebGPU and WebGL and a Three.js integration sample. Do not incorrectly call it WebGL-only. Shared depth, HDR, alpha, device ownership, cleanup and seed control still need proof in this app. [R07][R08] |
| Blender | Adopt as an offline authoring tool. | Rocket meshes, texture bakes, smoke simulation and flipbooks. | Do not ship Blender or its fluid simulation in the browser. Asset provenance still matters. [R09] |
| glTF Transform and Three.js KTX2Loader | Adopt in the asset pipeline when assets exist. | Mesh simplification/compression and texture/transcode preparation. | Pin tooling, test actual decoder support and compare quality at runtime. [R10][R11] |
| Poly Haven / ambientCG | Use as eligible material/environment sources. | PBR paper/wood/ground material ingredients and restrained environment lighting. | Assets are not yet selected or downloaded. Save each asset's provenance and license; do not scrape or reuse site preview images as assets. [R12][R13] |
| Spector.js | Use as a development-only WebGL diagnostic. | Frame commands, state and redundant-draw investigation. | It is not a WebGPU profiler and should not be bundled into the consumer app. [R19] |
| WebGPU samples and timing references | Study only, with optional later adaptation. | Compute-buffer and timing patterns. | Feature support and sample particle counts are not performance evidence for Firecrackers. [R20][R21] |

The recommended production core remains one scene and one authoritative simulation. Do not simultaneously install Quarks, Effekseer and a second post-processing framework. Compare an optional engine in isolation and retain it only if the integration reduces total maintenance without sacrificing the required experience.

## 9. Asset-production brief

Produce one reusable, modest-complexity rocket mesh system with five recognizable variants, not five unrelated art styles. Distinguish silhouette details, band placement and material accents while keeping the same scale language. Include a curved fuse with a normalized burn coordinate, contact-area treatment and low-detail variants. Export compact GLB assets and verify normals, UVs, roughness and orientation.

Prepare smoke atlases for three event classes, with multiple burst variations. Begin by testing 32 frames in an 8-by-4 layout, with 128- or 256-pixel cells. This is a production experiment, not a mandatory texture count. Atlas padding and mip behavior are part of the deliverable.

Keep background assets understated. A small ground material set and controlled environment-light contribution are more useful than a 16K sky panorama. Avoid a baked bright moon or daytime scene conflicting with the locked art direction. Clouds should remain subtly visible only when lighting or haze makes them readable.

Create one coherent contact-flame treatment and a compact original spark/grain texture set if procedural kernels no longer suffice. UI remains real HTML/CSS and icons, not a raster mockup. Generated concept images, if produced later, are design references and never test evidence for a working renderer.

Each asset record must include identifier, author/source, license, original file hash, transformation pipeline, output dimensions, color-space role, file bytes, estimated decoded/GPU bytes, quality tier and verification status. Keep high-resolution authoring masters out of the runtime precache. Do not assign a public license to the owner's entire application as an incidental tooling step.

## 10. UI and UX: glass with purpose

### 10.1 Three interaction states on one screen

**Choose:** a compact dark-glass dock displays the five families, with legible names and consistent thumbnails or small object previews. Avoid five simultaneously animated mini-canvases. Selection can lift the chosen item and expose one short description, without a large card panel.

**Light:** the dock quiets down while the selected prop becomes the focus. Show the contextual ignition target, cancellation behavior and placement alternatives. The user's finger must not cover the only cue; position the visible ember/flame slightly away from the touch center while keeping contact believable.

**Watch:** the canvas takes priority. After the existing idle period, collapse unnecessary chrome. Keep a reliable reveal action and immediate pause/mute access. Never hide keyboard focus or controls being operated. The first touch on hidden chrome reveals it; it must not also ignite a rocket unexpectedly.

These are modes of the same screen, not separate pages or a new navigation hierarchy.

### 10.2 Glass material system

Use near-black translucent surfaces, a restrained inner edge highlight, subtle grain and readable warm-neutral text. The glass should reveal a suggestion of depth, not a bright frosted box. Avoid multiple nested glass cards, broad shadows across the sky and constant animated gradients.

Limit expensive backdrop blur to a few small areas, with an opaque/translucent fallback for devices or modes where it is costly. Reflect nearby burst color through a restrained border/light envelope driven by CSS variables or direct render-bound updates, not full React rerenders each frame.

Use consistent typography and interaction sizes. Proposed touch targets are at least 44 CSS pixels for primary controls, while the visual icon can remain smaller. Provide clear focus rings and sufficient contrast against both dark sky and bright bursts. These are product design targets, not a blanket WCAG compliance claim.

### 10.3 Responsive behavior and motion

On phones, keep the selection dock compact and thumb-reachable, with safe-area padding. A short swipeable row is acceptable if labels and keyboard alternatives remain discoverable. On tablets and desktop, center the compact dock; do not stretch it into a dashboard.

Prefer short opacity/transform transitions and a restrained selection settle. Avoid continuously animating blur, box-shadow or layout properties. Reduced-motion mode removes decorative spring/float effects while preserving understandable state changes. The scene's flash reduction is a separate setting; one does not substitute for the other.

Onboarding is skippable, replayable and not time-limited. Demonstrate Choose, Place and Light through the real controls. Do not reward the first launch with a stronger flash. After onboarding, reduce repetitive labels and status prose rather than forcing the user to dismiss tutorials again.

## 11. Sound and haptics

Keep sound off until explicit activation. Retain the procedural system as the always-available baseline; audition a small set of licensed or original recorded layers if the synthetic timbre remains the main realism weakness. This research has not selected or listened to production samples.

Separate close contact/fuse, launch, distant report, rolling decay and crackle. Not every firework needs a rising whistle, and every crossette does not imply the same crackling sound. Use the same event position and timing as the visuals. Stereo/3D panning and attenuation should match the virtual listener; schedule any apparent distance delay explicitly rather than assuming a panner adds propagation time. MDN documents user-gesture audio activation and positional audio APIs. [R17]

Use restrained pitch/sample variation, headroom and bounded voice counts. Phone-speaker listening, headphones, mono and streaming mixes need separate checks. Haptics are optional and capability-gated. For distant reports, align the vibration with the audible event, not an earlier visible flash.

Pause, mute, tab hiding, reset and graphics failure cancel scheduled sound/haptic work. Opening and closing settings should not accidentally resume a manually paused scene. Avoid adding permanent crowd ambience as an assumed requirement; retain a quiet-night option and make any crowd layer opt-in after listening review.

## 12. Wedding-stream and continuous-display design

### 12.1 Two useful output modes

**Full-scene display** is the first supported target: the complete night sky, no visible controls during capture, stable framing, silent default, conservative overlap and selectable pacing. It can be used as a browser scene or decorative screen.

**Transparent overlay** is a separate engineering milestone: show luminous effects over live video while removing the scene background and ground. It is not achieved merely by changing the CSS background to transparent. Canvas alpha, render-target alpha, bloom halos, smoke attenuation and the host's compositing behavior all matter.

Ordinary source-over alpha compositing is an approximation for bright emitted light over arbitrary footage. Define and test the intended representation. Do not promise identical physical glow on black, white and colorful video. Avoid a black rectangular canvas or dark fringes around bloom. Full-scene mode remains the fallback when overlay composition is not satisfactory.

### 12.2 Composition and operator control

Add configurable protected areas for faces, names, subtitles or a stream layout, without embedding personal wedding information in the public app. Placement and show selection should respect these areas through camera-space planning. Start with static safe rectangles; there is no need for face detection, AI services or video access.

Support a controlled show seed, quality, frame-rate target, sound preference and display mode through a validated configuration. Use small, allowlisted values; do not load arbitrary asset URLs from query parameters. Provide a local operator view to preview framing and confirm the show before using it in a stream.

Keep manual priority. Stopping an auto show cancels future automatic launches, while already launched effects finish naturally unless the operator chooses an explicit immediate clear. Provide an unmistakable pause/stop control outside the captured chrome as appropriate to the embedding method.

### 12.3 OBS is a separate test environment

OBS Browser Source uses Chromium Embedded Framework, exposes its own dimensions/frame-rate controls, and has options for unloading hidden sources and refreshing on scene activation. Its behavior must be tested directly; success in desktop Chrome is not proof of OBS support. [R18]

Test source hide/show, scene switches, refresh, silent startup, offline cold start after caching, 1080p output and a sustained rehearsal. Decide whether reactivation restarts a deterministic show or resumes an explicit paused state. Never fast-forward missed cues into a burst storm. Do not request broad OBS control permissions for a decorative source.

Do not update the service worker automatically during an event. Preload and validate assets before the session, show update availability in operator settings, and apply the update only during a controlled restart. The public site and stream presentation should share a renderer, not become two unrelated apps.

## 13. Performance, compatibility and resource budgets

### 13.1 Initial exploration tiers

The accompanying JSON records these as unmeasured targets. They are not changes to the current runtime configuration.

| Tier | Presentation target | Active luminous-head ceiling | Trail-history samples | Smoke instances | Starting raster policy |
|---|---|---:|---:|---:|---|
| Low | Stable 30 fps target | 768 | 12,000 | 32 | DPR cap 1.0; minimal bloom or no post bloom; quarter/half-resolution smoke experiment. |
| Standard | 60 fps target where measured sustainable | 1,536 | 32,000 | 64 | DPR cap 1.5; bounded native bloom; half-resolution smoke experiment. |
| High | 60 fps target on qualified hardware | 3,072 | 64,000 | 96 | DPR cap 1.75 plus absolute render-pixel cap; richer trails and relighting, not different core behavior. |
| Stream | Conservative 1080p/30 default | Standard starting caps | Standard starting caps | Standard starting caps | Fixed output/framing, no expensive UI, calibrated compositor and long-run evidence. |

Do not allocate every maximum on every device immediately. Allocate according to the admitted tier and release resources on downgrade/restart where appropriate. Preserve family structure at lower quality by reducing well-distributed stars and trail detail, not eliminating the characteristic split or canopy.

### 13.2 Budget bytes, not just counts

An uncompressed 2048-by-2048 RGBA8 texture occupies 16 MiB before mipmaps, about 21.3 MiB with a full mip chain. Eight such atlases are about 170.7 MiB before other resources. A single 3840-by-2160 RGBA16F render target is about 63.3 MiB before multisampling or additional buffers. These are format-based calculations, not measured browser memory usage.

Track source download bytes, decoded CPU images, compressed GPU textures where applicable, render targets, geometry and audio buffers separately. KTX2/Basis can support GPU-oriented compression/transcoding, but the actual target format and supported path must be verified on the active renderer. Do not equate a small WebP download with small decoded VRAM use. [R10][R11]

Use an absolute render-pixel cap in addition to DPR so a 4K monitor does not silently create an oversized multi-pass workload. Proposed initial scene-target caps are 1.0 million, 2.1 million and 3.7 million pixels for Low, Standard and High; test them against sharpness and frame times.

### 13.3 Adaptive policy

Measure a rolling frame-time window with hysteresis. Reduce smoke resolution/overdraw first, then bloom cost, then low-value trail samples, then admitted concurrent events. Preserve already committed effects and do not repeatedly bounce between tiers. Raise quality only after a longer stable window or explicit user choice.

Record CPU simulation, buffer preparation, render submission and, where available, GPU pass timings separately. Timestamp queries are optional; absence is not an error. Spector is useful for the WebGL path but not a substitute for WebGPU timing. [R19][R20]

A logical two-hour simulation test does not exercise GPU temperature, driver behavior, compositor memory or battery drain. Require actual real-time sessions and distinguish those from accelerated boundedness tests.

## 14. Accessibility, safety and resilience

Preserve keyboard selection/placement/ignition, single-action lighting, named controls, focus visibility, modal focus handling, reduced interface motion and flash reduction. Do not require a drag or long hold as the only path. Never silently ignore a failed fullscreen, audio or wake-lock request.

Flash reduction must control combined burst area, bloom energy, simultaneous secondaries and flicker—not merely change the hue. Review the rendered sequence, including manual overlap and the most intense permitted show. WCAG's flash criterion applies to the overall page; a warning, pause button or optional reduced-flash setting does not make a hazardous normal mode acceptable. No seizure-safety or accessibility certification is claimed here. [R16]

Maintain no-autoplay sound, finite timers, cleanup and no hidden-page catch-up. Test graphics context/device loss, orientation changes, rapid pause/resume, repeated settings toggles, storage failure, offline operation, missing assets and interrupted updates. Keep a small functional recovery UI even when graphics cannot initialize.

The app remains a software simulation. Do not add instructions for making, modifying or operating physical fireworks, real pyrotechnic compositions, accounts, analytics services or personal wedding data as part of this upgrade.

## 15. Delivery phases and decision gates

### P0 — protect and measure the actual baseline

Refetch refs, inventory divergent work and the pending lifecycle patch, preserve the working runtime and capture all five current effects. Record source SHA, environment, seed, viewport and actual backend. Establish clean install/test/build commands and runtime/asset measurements. Exit only when the team can reproduce the existing app and identify the authoritative implementation without deleting alternative work.

### P1 — prove the rendering foundation

Build a small in-app development scene with one opaque prop, one transparent smoke layer, one emissive trace and the pinned native bloom pipeline. Test perspective, billboard facing, depth fading, linear color, output transform and forced WebGL. Compare segment/ribbon options. This phase exists to catch integration mistakes before all five effects are rebuilt.

Exit gate: no black canvas, incorrect gamma, lost transparency, broken occlusion or backend-specific disappearance in the exercised environments. Hardware parity remains open until actually tested.

### P2 — Gold Willow quality gate

Complete the new prop/contact/fuse, thrust/coast, connected trails, break, canopy and residue for Gold Willow. Integrate local sound timing and cancellation. Capture the six checkpoints and a full-speed recording. Compare multiple seeds and both landscape and portrait composition.

Exit gate: owner accepts the end-to-end feel; art review passes trail continuity, believable motion, canopy shape, smoke/light integration and UI restraint; target-device performance is adequate. Do not expand to the other four simply because the effect runs without errors.

### P3 — authored atmosphere and asset pipeline

Produce original meshes/materials and smoke variations, import optimized assets, implement local relighting and density control, and measure transparent overdraw. Validate compression, mip borders, fallback loading and offline caching. Recheck Gold Willow after assets change; art work can regress timing and clarity.

### P4 — four distinct families and show direction

Build Peony, Chrysanthemum, Crossette and Finale with their own morphology, timing and audio treatment. Add visible secondary carriers, stable identities and reservations. Make show pacing aware of color, position, smoke density and current luminous activity.

Exit gate: each family is identifiable without its label, at both low and high quality. Every family completes offline and cleans up under the allowed concurrency limits.

### P5 — UI/audio polish and stream presentation

Finish Choose/Light/Watch behavior, responsive glass controls, focus/cancellation and quiet audio mixing. Build full-scene stream mode first, transparent overlay second. Test protected areas, operator controls, source lifecycle and composition over different backgrounds in OBS.

### P6 — release qualification

Run the automated regression suite, actual hardware WebGPU/WebGL tests, phone/tablet and Safari checks, flash/accessibility review and sustained display sessions. Require a 30-minute device session and at least a two-hour real-time stream/display session; add a longer event rehearsal for the intended setup.

Promote only the candidate with evidence and owner sign-off. Preserve a rollback build and source SHA. A successful build is not proof of realism, and a good screenshot is not proof of stable operation.

## 16. Priority, tradeoffs and stop rules

Spend the first major effort on the visible lifecycle and rendering fundamentals. High-value work is thrust/coast, perspective, trail continuity, plausible canopy dynamics, local smoke lighting and an interface that gets out of the way. Asset production and audio tuning follow closely. GPU-compute migration and expensive volumetrics are experiments, not prerequisites.

Keep these decisions explicit:

- Do not rewrite in Unity, Unreal or a different web engine.
- Do not replace the interactive scene with prerecorded video or a flat confetti library.
- Do not install competing particle engines without a successful isolated comparison.
- Do not change stable camera behavior to conceal weak effects.
- Do not ship physically implausible neon fog merely because bloom is available.
- Do not assume transparent OBS output works because the page background is transparent.
- Do not add live fluid simulation, depth of field, lens dirt or camera shake to the first quality gate.
- Do not promise a fixed development duration or FPS before measuring representative workloads.

Proceed with existing branding, sound-off defaults, the fixed-camera direction and no additional paid services. Final licensing, a permanent domain, paid audio purchases and any public branding change remain owner decisions when those choices become relevant. None blocks the initial realism work.

## 17. Definition of done

The upgrade is complete only when the user can choose, place and light each family; see convincing contact-to-residue motion; distinguish the five families; experience coherent depth, trails, smoke and light; use the app comfortably on target devices; run a sustained decorative/stream presentation; and recover from interruption without surprises.

Evidence must include exact source revision, asset/config versions, tested environment and backend, recordings and checkpoint captures, automated results, real-time performance records, flash/accessibility review and remaining limitations. Until those exist, describe the work as implemented, tested, proposed or unverified accurately.

See the separate acceptance/backlog document for the concrete test IDs and work packages, and the research register for the primary sources behind the component decisions.

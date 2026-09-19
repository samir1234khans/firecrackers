# Implementation handover — Firecrackers realism V2

You are continuing the existing `samir1234khans/firecrackers` application. Implement the approved realism-upgrade plan incrementally, preserving working features and recording real evidence. This document is an engineering brief, not proof that implementation has started.

## Read first

Read repository `AGENTS.md`, `DEVELOPMENT.md`, `README.md`, `PROJECT_STATUS.md`, the current runtime evidence, then this folder's `MASTER_PLAN.md`, `RESEARCH_REGISTER.md`, `ACCEPTANCE_AND_BACKLOG.md` and proposed quality JSON. Existing requirements and the owner's later explicit decisions remain authoritative. Preserve the five named families, deliberate ignition, fixed normal camera, layered dark glass, accessibility, no-autoplay sound and web/PWA-first direction.

## 1. Establish the actual source before editing

Fetch remote refs and inspect the selected worktree. Do not move, repair or reorganize unrelated workspaces. Do not reset user changes, force-push or delete branches.

The research baseline was `feat/fireworks-v1` at `5aafb8033fbfb231518efbb73d1fa2141ff53977`, Three.js `0.180.0`. `main` was the documentation baseline `7603a2c63ef1f4e36e4c1d845915632640d83369`. The divergent `feat/fireworks-v1-implementation` was `16d9d1d8056ff6cb1d47b7fff92c3731395efdce`. Refetch rather than trusting these to remain current. Compare the two implementations and preserve unique work; do not merge by taking whichever file has the newest timestamp.

A previous downloadable lifecycle patch was not confirmed merged. Inspect its base, patch and tests before applying it. The application must preserve paused state when closing settings, prevent repeated Space toggling and cancel stale wake-lock requests. Reimplement/reconcile those fixes when an old patch no longer applies cleanly.

Use the repository's actual development policy and a bounded task branch or the authorized existing feature branch. Do not create a new permanent integration hierarchy. Do not promote to main or change a production domain solely because a renderer experiment passes.

## 2. Capture a reproducible baseline

Use the committed Node/toolchain and lockfile. Run clean install, typecheck/lint, unit tests, logical soak, production build and the existing browser suite. Run the documentation validator. Record failures honestly before changing them.

Capture all five families and the six art checkpoints with seeds, viewport and actual backend. Inspect desktop, phone-sized and short-landscape layouts. Do not label software WebGL emulation as hardware WebGPU. Keep copies of baseline recordings/screenshots for the comparison, not as public runtime assets.

## 3. Execute the high-value sequence

First, prove the pinned Three.js depth/HDR/bloom/output path with one prop, one luminous trace and one smoke layer. For 0.180.0, consult the official r180 `PostProcessing`/TSL bloom example. Today's `RenderPipeline` documentation does not mean the pinned package exports that same API. Any Three.js version migration is a separate decision and commit.

Then implement perspective with a stable camera and world coordinates. Rewrite billboard orientation as needed; do not merely swap the camera class. Maintain proper viewport framing and avoid changing physical scale during resize.

Introduce stable effect/particle handles and bounded trail history. Benchmark improved instanced segments versus connected ribbons against the same baseline workload. Select the simplest representation that delivers continuity and acceptable cost. Retain CPU head simulation initially.

Build one complete Gold Willow: selection/grounding, provisional contact, cancelled hold, traveling fuse ember, powered ascent, coast, break, expanding canopy, thinning trails and persistent residue. Keep the 650 ms hold and 1.5–2.5 second fuse range initially. All times are virtual tuning values, not physical firework instructions.

Require a full-speed visual quality checkpoint before expanding to Peony, Chrysanthemum, Crossette and Finale. Add true child carriers and motion inheritance; do not teleport secondary bursts to scheduled offsets. Preserve family identities at reduced quality.

## 4. Smoke, assets and source reuse

Use Blender offline for original prop/material and smoke-flipbook assets. Keep density/relighting separate from permanently colored bakes. Implement shared wind, local 3D light envelopes, soft opaque intersections and a deliberate smoke/spark ordering strategy. Profile full/half-resolution smoke rather than assuming the optimization is free.

Adopt existing Three.js modules and a pinned glTF/KTX2 optimization path. Quarks is a selective algorithm/authoring reference, not a certified drop-in WebGPU renderer. The newer EffekseerForWeb documents both backends and deserves a bounded optional experiment, but must prove version, depth/HDR/alpha/device ownership and cleanup compatibility. Do not install two competing particle engines into the main app.

Record every imported asset or adapted source, its version/hash, license and transformations. Keep notices. Do not extract copyrighted footage/audio, buy assets or assign a public application license without authorization. No production samples were auditioned by the research task.

## 5. UI, audio and continuous display

Implement Choose/Light/Watch as states of the one screen. Refine compact dark glass and legible controls; do not build a marketing landing page or dashboard. Keep placement/ignition alternatives, focus visibility, safe-area behavior and accessible modal handling. Idle-hide must not hide keyboard focus; first reveal must not also launch.

Use semantic event-driven audio with explicit activation, bounded voices and cancellation. Make haptics optional. Preserve stable camera/no default shake. Reduced motion and flash reduction are distinct; review all shipped flash settings, not only the reduced mode.

Build full-scene stream presentation first. Add validated seed/quality/display configuration and static protected areas for stream layout, without personal wedding data or video/face analysis. Then implement transparent output with explicit render-target/canvas alpha and bloom/smoke compositing tests. CSS transparency is not sufficient. Verify the actual OBS CEF environment, source lifecycle, frame rate and background combinations.

Preload assets and defer updates during an event. No hidden-tab catch-up, autoplay audio, surprise show restart or update-driven mid-stream refresh.

## 6. Verify and keep GitHub current

Use the acceptance IDs as the checklist. Reconcile tests with every changed behavior. Preserve logs and actual screenshots/recordings at each milestone. Use a real browser for visual and interaction checks; where only emulation/software rendering is available, label the evidence accordingly and keep physical gates open.

Quality JSON is proposed data only: do not wire it directly into the runtime without measurement and configuration migration. Measure frame-time distributions, upload cost, transparency overdraw, allocation plateaus and device behavior. Do not infer GPU/thermal stability from a logical soak.

Commit coherent milestones with updated implementation/evidence notes. Keep runtime changes, pending work and unrun tests clearly distinguished. Final report must include exact source SHA, the deployment actually containing that source, test outcomes, owner art review, hardware/OBS evidence and rollback. Do not mark V2 complete until its required gates are satisfied.

The desired result is the same app made substantially more convincing: the user lights a tangible fuse and watches a coherent, spatial, luminous event unfold into the night.

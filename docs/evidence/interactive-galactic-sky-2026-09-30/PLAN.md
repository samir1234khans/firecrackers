# A detailed, living and responsive galactic sky

## Intent and release baseline

The owner requested a further galactic enhancement after the boat release. Extend qualified `2026-09-30.4` main (`edbc0acc4024e334b05334d978baeb51dc0a7045`), with its licensed riverboats and unchanged ten effects. The prior [reference research](../galaxy-sky-2026-09-30/RESEARCH.md) records the Sol/Luna and Sol 6.1 visual references. Their fine warm/cool stars, curved dust and smooth movement inform original work; no OpenAI promotional imagery or unpublished engine is bundled.

## Composition

1. Replace the sparse celestial bake with a detailed 2048 by 1024 original star field and coherent blue/violet nebula dust, with restrained warm-gold accents, dark lanes and uneven clusters. Keep most stars tiny and faint rather than uniformly glowing dots.
2. Put richer structures in the upper-left and upper-right reaches, including one faint distant spiral cluster. Keep the middle burst canopy significantly darker. Avoid a giant central planet/orb, saturated clouds, broad flares or decorative interface frames.
3. Add a sparse nearer star layer with different depth response. Preserve the actual panorama, hills, river horizon, camera, boat materials and practical lighting.
4. Give celestial layers their own responsive crop so portrait shows the new details without stretching the shoreline panorama. Inspect 320-pixel portrait, ordinary phones, tablet, desktop and short landscape.
5. Generate one sky-only composition study using the actual desktop .4 capture. Preserve it with prompt/tool metadata as design evidence. Implement the live sky natively; the concept is not browser proof.

## Life and interaction

- Use the existing simulation time and existing requestAnimationFrame scheduler. Renderers receive a readonly `SkyState` containing shared time, normalized top-down pointer coordinates, engagement and motion policy. There is no new independent animation clock.
- Drift and rotate dust layers very slowly. Keep near-star parallax within approximately three CSS pixels and the farther layers smaller. The camera and shoreline do not follow the pointer.
- Let blank-sky mouse movement gently lift nearby existing stars. Touch brushes do the same while a valid sky gesture is active. Ease the response and return; do not create a large cursor glow, flash or new central control.
- Ignore buttons, rails, drawers, forms, dialogs, overlays, active firework drags and non-primary pointers. Observe without preventing default, stopping propagation or capturing the pointer. Sky interaction cannot launch, select fireworks or change mode.
- Add at most one faint distant meteor, lasting about 1.4 seconds every 36 seconds. Its phase and path are seeded/shared-clock, outside the main burst structure; it has no launch rocket or sound event.
- Manual/overlay pause, backgrounding and QA freeze hold phase and input. Low and app/OS reduced motion remain static. Reduced flashes attenuates smooth local changes and meteor intensity. Transparent presentation excludes every galactic layer.

## Bounded rendering

During fireworks, retain the existing 30/60 render policy and admission/overload rules. During visible unpaused idle, cap ambient redraws at 20 Hz on Ultra, 12 Hz on Standard and 10 Hz on Canvas; active pointer response is capped at 30 Hz. This intentionally supersedes the earlier zero-idle-render contract. Low, reduced-motion, paused, hidden, frozen and transparent states retain static idle rendering.

Bake stars/dust once. Use shared cached textures, tiny native TSL sampling/masks and bounded Canvas draws. No per-frame texture baking, raymarching, live fluid solver, unbounded sprites, additional full-resolution reflection pass or React animation loop. Reuse hot-path state and meteor outputs; release every added texture/canvas/resource. Record estimated texture storage separately from measured GPU allocation. Enhanced art remains progressive/native; the core compressed-download estimate remains below the existing 1 MB target.

## Parallel ownership

- Art worker: `GalaxySky.ts`, original cached art and composition study.
- Core worker: `SkyState.ts`, renderer port, scheduling, pointer policy and meaningful pure/input checks.
- Renderer worker: Three.js/TSL, Canvas parity and shared bounded meteor helper.
- Coordinator: documentation, integration/browser tests, version/fingerprint, preview, CI, promotion and public checks.

## Exit checks and rollout

1. Test actual mouse/touch blank-sky response, bounded parallax, no accidental launch/selection, control/drag isolation and listener cleanup.
2. Verify shared-clock pause, hidden/overlay/freeze behavior, deterministic meteor phase, Low/reduced-motion static rendering and bounded ambient cadence. Update the previous idle assertion without weakening the static comfort checks.
3. Capture idle sky and same-seed Willow, Saturn and Supernova on actual hardware WebGPU and WebGL; exercise Canvas separately. Keep the central canopy readable and inspect desktop/portrait/landscape.
4. Verify all eight assets, full offline reload, existing drag/pad launch, transparent alpha, missing-asset fallback, cleanup, unit/build/audit/soak and full CI.
5. Publish a separate versioned preview, compare source fingerprints, merge the reviewed build into main and deploy using the existing Cloudflare path. Retain .4 Worker `534323b7-e2e8-4935-a161-b86bdfb3f2b0` for rollback.

Physical-phone, Safari, thermal endurance and completed GPU-frame timing remain separate qualification. Headed PC hardware, software browser emulation, generated concepts and Blender evidence are reported distinctly.

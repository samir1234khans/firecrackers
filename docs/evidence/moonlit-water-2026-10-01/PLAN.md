# Moonlit water realism

Owner-approved implementation: calm, inhabited moonlit waterfront with tiered realism. Preserve the camera, sky, village, terrace, three boats, all thirteen firework identities and existing controls. The reconciliation chat owns the production release record. Runtime work starts from main `8b491d2528b251d9e57d7326ba5ea42e36fbb271` (production build `2026-10-01.4`).

## Delivery stages

1. Shared surface: four bounded directional waves, analytic slopes and spatial boundary attenuation. Integrate wind into the existing fixed clock. Ultra uses four waves; Standard two; Low uses a static surface. Reuse the original normal map at independently moving scales, with distance filtering.
2. Lighting and reflection: Fresnel base reflectance 0.02, cool sky illumination and a world-oriented broken moon lobe. One explicitly scheduled mirrored-camera pass with backend-correct clipping and projective coordinates. Reflect boat/village geometry and firework heads/trails; exclude smoke, sky composition, terrace, contacts, props and UI. Restore renderer and camera-dependent particle state in `finally`.
3. Contacts: bow/stern/port/starboard buoyancy; steadier covered boat; elongated interrupted disturbances; moving lantern anchors; narrow immersion marks and damp coping. Retain bounded contact and lamp fragment pools. Provide Canvas treatment using the same clock and sampling.
4. Qualification: seeded comparisons, all three backends and seven viewports, comfort/pause/transparency, missing art/offline/recovery, collection/launch/interactions, warmed performance and isolated Cloudflare preview.

| Quality | Surface | Dynamic reflection |
| --- | --- | --- |
| Ultra | Four height waves, three normal scales | One target, edge at most 512 pixels, at most 30 updates per simulation second |
| Standard | Two long height waves, two normal scales | One target, edge at most 256 pixels, at most 15 updates per simulation second |
| Low | Static surface and bounded fragments | No target |
| Canvas | Perspective fragments and sampled hull motion | No GPU pass |

Initial artistic wavelengths are 180, 100, 60 and 40 world units; the summed displacement bound is 0.51 units. These are scene tuning values, not measured physical dimensions. Height and slope flatten at the actual water-facing coping (`z=-14.75`) and distant bank. Pause/hidden time does not advance. Reduced motion selects a stable shared pose, while reduced flashes independently limits reflected burst energy.

## Acceptance evidence

Use seed `20260916`, Ultra, matching logical times and viewport sizes for idle, Gold Willow, Sapphire Saturn, Opal Supernova and Imperial Crown captures. Inspect for foreground/middle/far-water structure, broken moon alignment, source-positioned reflections, immersed hulls and unchanged launch composition. Reject rings, grids, horizon shimmer, reflection rectangles, contact halos and competing reflected fireworks.

Numerically verify derivatives, bounds, boundary attenuation, phase continuity, mirrored projection and both clipping intervals. Exercise target allocation/resize/disposal and state restoration, including failures. Run the repository's complete runtime CI and native PC tests separately. Compare warmed frame interval p95 on the same hardware and workload; allowable increase is the greater of 2 ms or 20%. Record CPU submission separately. Report GPU completion and physical phone/thermal performance only if actually measured.

The candidate has an isolated Worker configuration without production routes. Production promotion requires the applicable release authorization and clean-main gates; retain production Worker `57796211-f2a8-4fc1-8381-4c9235bfb5bd` as the previous release reference. No new backend, preference panel, animation loop, downloaded texture, fauna, storm, sound or underwater scene is included.

## Rendering references

- [NVIDIA GPU Gems water simulation](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models): separate geometric waves and finer normal detail.
- [Three.js r180 WaterMesh](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/objects/WaterMesh.js): normal blending and Fresnel, adapted under MIT.
- [Three.js r180 ReflectorNode](https://github.com/mrdoob/three.js/blob/r180/src/nodes/utils/ReflectorNode.js): mirrored camera and oblique clipping, adapted under MIT. Scheduling remains owned by this application.

See [the implementation and preview receipt](PREVIEW.md) for actual outcomes and qualification limits.

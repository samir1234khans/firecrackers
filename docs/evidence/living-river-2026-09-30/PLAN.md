# A natural, inhabited waterfront

This extends the qualified `.3` celestial-sky preview. Production remains `.2` while this combined `.4` candidate is developed and qualified.

## Composition

Keep the central firework canopy unobstructed. Add a few small weathered fishing boats and skiffs on the river's left and right reaches, with restrained warm lamps. Add an irregular distant village: varied pitched roofs, sparse lit windows, quiet quay details and dark gaps between clusters. Preserve the cloud/hill panorama, fine stars and subtle flowing celestial dust.

The owner's later steering adds a larger traditional wooden **nauka** with a low arched canopy and four candle lanterns. Keep it along the near river edge, with believable water contact, dark weathered timber, warm light on nearby surfaces, and broken candle reflections. This becomes the third active boat. Individual homes form three unequal groups with depth and roof variation. The nauka remains secondary to the fireworks; its candle flicker is tiny, shared-clock, and static under reduced motion/Low. Any local light is bounded, without shadow maps or another reflection target.

The boats should have readable hull curvature, wood wear, rails, benches and mooring details. Foreground details remain quiet silhouettes. The river gains broken light fragments tied to boat and shore lamp positions, gentle coherent motion and local ripple cues. Avoid uniform rows of identical houses or lights, saturated neon, frequent flashing, oversized boats or a second central focal object.

## Parallel production

1. **Blender source:** preserve the original v006 master and replace the primary boat geometry/materials in v007 with the downloaded CC0 Wooden Canoe by OuterSpaceSimon. Keep three named boat roots and the shore-village root. Preserve UVs, actual grain, normal and roughness maps; convert only the source's unsupported material nodes. Adapt a larger covered candle boat without tall ship rigging. The owner's later quality request supersedes the original 700 KB target: allow an approximately 8 MB optimized boat export while keeping the initial interactive bundle below 1 MB compressed. Inspect a modest night render, reopen the master and reimport the export; record finite bounds, markers, dependencies, download hashes, texture sizes and actual file size.
2. **3D integration:** independently load the river GLB through the existing authored-asset queue. Keep procedural fallback boats/homes while unavailable. Position objects from the existing water/camera contract. Use shared simulation time and wind for very gentle boat bob/roll; respect Low, reduced motion, pause and background behavior. Do not introduce another clock or sky/river render loop.
3. **Water light:** use bounded native instances or simple quads for fragmented lamp streaks and contact ripples. Project from actual boat/shore markers, vary their appearance coherently and fade with distance. Keep the selective firework reflection pass at its existing resolution/rate, exclude interface/foreground prop recursion and lower contrast under reduced flashes.
4. **Canvas parity:** draw cached or bounded simple boat/house silhouettes, warm windows and matching light fragments through the same scene clock. Exclude every added environment element from transparent output.

## Verification and promotion

- Confirm natural scale, horizon alignment, dark hulls, sparse warm windows and central scene clearance on desktop/portrait/short landscape.
- Capture identical seeded Willow, Saturn and Supernova against the preceding `.2` production baseline. Keep exact version/fingerprint/backend/viewport/time metadata.
- Exercise actual hardware WebGPU, forced WebGL and Canvas, eight independent asset states, missing-river fallback, pause/idle rendering, saved quality, reduced motion/flashes and transparent output.
- Validate the three active boats, ten actual light anchors and bounded 80-fragment candle/shore reflections; missing assets preserve the three-boat procedural counterpart. Review the enlarged nauka and clustered village in actual desktop, portrait and short-landscape captures.
- Complete existing unit, build, audit, logical soak, collection, drag, launch/offline and recovery CI.
- Publish an isolated river preview, promote the qualified main source to the authorized Cloudflare domain, verify public behavior and retain `.2` Worker `2bd3e2bd-c4bb-418b-9ca6-ce11ebef9d5a` for rollback.

Physical Android/iPhone, Safari, GPU completion timing and thermal endurance remain separate evidence. Generated concept images provide direction; Blender and actual browser captures provide distinct production evidence.

## Licensed asset selection

The [Wooden Canoe source page](https://www.blendkit.com/asset-gallery-detail/a6a39894-5474-47c4-a657-dc8b7a1a5a44/) identifies a free, worn wooden canoe with a paddle under CC0. The publisher's [license explanation](https://www.blendkit.com/docs/licenses/) allows unrestricted reuse of CC0 assets. Its public API confirms `isFree: true` and `license: cc_zero`; the downloaded 2K Blender source is preserved with a content hash. Actual source meshes and maps supply the primary 3D boats, with original canopy, candles and village additions. This is an artistic riverboat adaptation, not a historical reconstruction.

The PolyScan rowboat was visually promising but its asset-level CC0 label conflicts with general redistribution restrictions; it is not bundled. A clearly CC0 Poly Haven ship was downloaded for inspection, but its colonial hull and rigging do not fit the intended scene. Unselected research downloads remain outside the public bundle. No paid assets, signup or source-site branding are introduced.

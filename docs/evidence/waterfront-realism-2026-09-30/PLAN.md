# Waterfront realism refinement

The owner's desktop capture exposes three linked weaknesses: far-bank houses disappear into a row of lights, the terrace looks like a floating tiled board, and close boats look oversized and detached from the water. This work extends source-main eebcf8a and preserves the completed transparent-panel interface.

The visual reference is the original photographic direction in `docs/evidence/realism-refinement/concepts/01-saturn-water-desktop.png`: a readable irregular shore, natural water depth, restrained practical lights, and wet stone extending into the foreground. This is art direction; final proof comes from actual browser captures.

| Area | Implementation and review |
| --- | --- |
| Shore homes | Correct desktop/tablet projection and excessive atmospheric extinction. Retain an irregular bank with varied pitched roofs, sparse trees, a landing and warm/dark windows. Review actual screen bounds and attachment to the bank at landscape, tablet and portrait sizes. |
| Boats and signs of life | Preserve the licensed CC0 weathered hull. Add original woven shelter maps, sagging canopy detail, two small seated silhouettes and landing details. Reduce apparent near-boat scale and rocking; add bounded contact/wake geometry and keep practical-light anchors coherent. |
| Stone terrace | Versioned original Blender master with irregular slabs, worn bevels, recessed joints, layered edge and eight wet/dry basalt material variants. Preserve authored UVs and PBR maps. Frame it beyond the screen sides and near edge while keeping the water-facing edge behind the rocket. |
| Launch prop base | Restrained iron/brass materials and discrete fixings, with local ignition light/contact. Preserve placement, launch transition and input geometry. |
| Water and illumination | Crossing normal detail and restrained sky glints give the idle water readable structure. Balance cool sky/rim light with warm practical illumination. Keep firework reflections position/time driven and retain their existing resolution/rate caps. |

Implementation is split between independent Blender terrace and boat production, with root-owned water, lighting, camera integration and browser qualification. Each asset retains an editable packed master, source script, inspected pilot, fresh GLB reimport and provenance. Prior masters/assets remain available. Source files and evidence stay outside the shipped web bundle.

Review a bounded pilot in actual WebGPU before freezing the release. Compare the same seeded idle/Saturn compositions on desktop 1280×800 and 1920×1080, tablets 768×1024 and 1024×768, and phone 393×851; include forced WebGL and Canvas. Verify every authored enhancement activates, waterline contact and clear center, pause/comfort clocks, finite bounds, missing-asset fallback and resource cleanup. Complete required unit/build, existing Grand/original/recovery/lifecycle checks and CI. Publish an isolated Cloudflare preview with fingerprint, then the authorized production release with rollback to `.6` and public checks. Physical-phone thermal performance remains a separate qualification.

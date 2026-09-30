# Moon and natural water — research and implemented plan

Request: a realistic shining moon and further improvement to natural, high-quality water and floating scenery. Reconciled canonical clean main `6fe052607c2ea50676d9320c9b66b13e11fa2dfb` and live production `2026-09-30.8` before editing. Work began on `feat/moon-natural-water`; the ten-effect engine, approved bottom collection, right rail and upper-canopy launch contract are preserved.

## Research basis

[NASA CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/) supplies lunar camera color maps and laser-altimeter terrain products for rendering. This supports using actual lunar features rather than invented crater noise. Its color treatment is optimized for appearance, not scientific measurement. [Asset receipt](../../../assets-source/moon/PROVENANCE.md) records the download fallback, credited sources and compressed elevation limitation.

[NVIDIA GPU Gems: effective water simulation](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models) describes combining broad surface waves with finer normal-map motion and deriving surface orientation from wave slopes. [GPU Gems 2: refraction simulation](https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-19-generic-refraction-simulation) discusses multiple moving bump layers and angle-dependent reflection. These are engineering references; our existing bounded waterfront shader remains an approximation, not a fluid solver or full physically traced reflection.

## Implemented choices

1. Bake a near-side gibbous moon from LRO imagery into one local 512px disc. Put it in the upper-right sky with circular CSS-pixel proportions, restrained aureole and an opaque dark limb. Keep it fixed through launches and resizing; no real-time astronomical phase claim.
2. Extend the existing water shader with three broad directional waves evaluated at a bounded 128 by 96 (wide) or 128 by 48 (phone) vertex grid, filtered crossing ripples and a perspective-broadened silver moonlight path. Retain the bounded selective firework reflection pass, current shoreline and authored normal map.
3. Use the same wave coefficients and analytic slopes for GPU boat height, pitch and roll. Canvas uses the same boat-height field plus finite perspective ripple fragments and the shared lunar disc.
4. Preserve Low/reduced-motion stillness, pause/visibility ownership, optional sound, offline art caching, independent asset activation, failure fallback and cleanup. The moon is a ninth independently loaded enhancement in GPU paths; Canvas loads the same small image without requiring Three.js.
5. Validate all seven viewports, hardware WebGPU/forced WebGL and Canvas; compare identical-seed phone/tablet/desktop captures against production `.8`; retain failed test history and report device/performance limits.

No new backend, renderer dependency, live astronomy service, water FFT or per-frame art generation was introduced. The moon texture adds about 1.33 MiB of estimated decoded RGBA/mipmap storage per GPU renderer; this is an estimate, not measured GPU allocation. Reflection texture caps remain 512px Ultra and 256px Standard, at the existing 30/15 Hz limits.

The initial full-sky lunar sample and per-fragment broad-wave evaluation increased PC rendering cost. The final shader branches over only the small lunar region and interpolates broad wave slopes from vertices, keeping finer texture ripples per fragment. Fixed-burst CPU submission returned to approximately baseline; desktop rAF tail variation and physical-device qualification remain explicitly open.

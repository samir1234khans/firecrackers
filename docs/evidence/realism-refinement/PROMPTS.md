# Image-generation prompts and references

All three images used the built-in ChatGPT `image_gen` tool with an opaque background. The tool did not expose a model name. The first reference in each call was the actual website screenshot to edit; the second was a visual reference only. Source screenshots and prior concepts remain in their original locations.

## 01 — Sapphire Saturn, desktop waterfront

References:

1. `work/firecrackers/test-results/grand-waterfront-desktop/desktop-webgl-sapphire-saturn-peak.png` — actual app, edit target.
2. `outputs/concepts/concept-11.png` — earlier waterfront and material board, supporting style reference.

```text
Use case: ui-mockup. Asset type: realistic browser implementation concept, desktop 1280x800. Input image 1 is the actual Firecrackers app screenshot and is the edit target. Input image 2 is a prior material direction board and is a supporting style reference only. Preserve image 1 composition exactly: small transparent native controls in six edge groups (top-left brand/Manual, middle-left selected firework/previous/next, bottom-left Position/Help; top-right Pause/Sound, middle-right Settings/Fullscreen, bottom-right 56px Launch/Ready), huge unobstructed central corridor, same camera, same Saturn ring position and relative size, same quiet dark waterfront. Realism study: replace coarse horizontal reflection strips with many broken, thin, perspective-correct blue and gold light fragments whose color and brightness follow the actual Saturn ring; dark troughs between glints; weak shoreline lights reflected separately. Give water fine variable ripple normals, horizon depth haze, a few distant shoreline structures, thin low clouds. Add modest cobalt-lit smoke layer behind firework with dark interior and warm edge light, no solid colored cloud. Foreground should be a small dark wet basalt terrace with subtle seams, chipped edges, local contact occlusion, a paper-seam rocket and dim gold foil. Preserve night exposure; brightest color belongs to burst, no giant white bloom. Native UI should stay tiny, transparent, crisp, with readable exact labels and no decorative frames. All ten effects belong to the app but this frame shows only Sapphire Saturn. Avoid centered navigation, bottom deck, oversized logo, extra buttons, rails, extra fireworks, cameras, people, daylight, giant prop, text overlays, blown highlights, mirrored perfectly smooth water. This image is a design direction, not a literal technical proof.
```

## 02 — Gold Willow, portrait smoke and water

References:

1. `work/firecrackers/test-results/production-stage/layout-393x851.png` — actual app, edit target.
2. `outputs/concepts/concept-08.png` — earlier portrait waterfront concept, supporting atmosphere reference only.

```text
Use case: ui-mockup. Asset type: photorealistic portrait mobile webapp implementation study, aspect ratio 393:851. Image 1 is the actual current Firecrackers mobile app and edit target; preserve its tiny transparent native control placement and its central corridor. Image 2 is prior visual direction only: reference its atmospheric shore and water, not its multiple fireworks or its large decorative controls. Show ONE Gold Willow in mid-fall: many continuous thin gold molten trails arcing downward with tiny warm tips, slight seeded irregularity, no radial straight sticks, bright core already gone. Pale gray/brown stratified smoke drifts laterally across lower burst; mostly dark interior, lit in warm rim patches by nearby gold trails, never a uniform cloud. The waterline remains in the lower third. Under the Willow, a narrow interrupted reflection path is made of thin gold glints on dark ripples, with visible gaps; nearby distant amber shore lights have separate muted streaks. Foreground includes small weathered paper rocket with seam and gold foil cap on a dark wet stone terrace, subtly rough, physically plausible scale. Preserve exactly six control zones and current labels: top-left tiny brand mark and Manual, middle-left Willow selection with previous/next, bottom-left Position and Help; top-right Pause and muted Sound, middle-right Settings, bottom-right 56px Launch and Ready. Keep all hit areas in their existing positions, visually transparent and small. Center of sky stays empty except the firework, smoke, ascent remnants. Night palette near-black navy/gold, restrained highlights. No centered dock, bottom deck, sidebars, frames, huge brand mark, extra bursts, doubled rocket, daylight, foreground humans, billboard text, fake buttons, soft oil-painting blur, huge bloom.
```

## 03 — Opal Supernova, depth and colored child light

References:

1. `work/firecrackers/test-results/grand-waterfront-desktop/desktop-webgl-opal-supernova-peak.png` — actual app, edit target.
2. `outputs/realism-next/01-saturn-water-desktop.png` — new waterfront study, supporting material and contrast reference only.

```text
Use case: ui-mockup. Asset type: realistic lighting and smoke browser implementation concept, desktop 1280x800. Input image 1 is the actual Firecrackers screenshot and edit target; preserve its fixed six small transparent edge control groups and relative camera/framing. Input image 2 is a newly explored waterfront material direction; borrow its broken reflection detail and restrained night contrast, not its Saturn effect. Show only ONE Opal Supernova event from image 1 at peak child blossoming: a larger fine pearl-pink/ice-blue outer falloff with two staggered child clusters, one peach-white left, one cool opal right, preserving negative gaps between clusters and a recognizable layered temporal composition. Each bright head has tiny warm core and continuous tapered trail; older segments thin, soften, and dim, no dashed lines or uniform brightness. Give smoke three depth layers: sparse dark back haze, soft drifting interior pockets behind and between clusters, and a few strongly rim-lit curls where child bursts illuminate it; retain deep dark interior, no opaque cloud ball or all-white bloom. The firework light makes two separate faint pink and cyan broken paths on dark rippled water directly below active clusters. Background: low distant shore silhouette, sparse dim amber windows and soft atmospheric depth, much darker than burst. Foreground: small physically plausible paper rocket and dark wet basalt terrace with seams and contact shadows; avoid a huge product shot. Exact existing UI labels top-left Firecrackers / Manual; middle-left Supernova with previous/next; bottom-left Position / Help; top-right Pause / muted Sound; middle-right Settings / Fullscreen; bottom-right Launch / Ready. Keep transparent buttons and empty central corridor except the effect. Avoid centered navigation, bottom deck, banners, extra controls, UI panels, giant logo, daylight, mountains as hero, extra fireworks, cinema-film grain, AI hallucinated labels, overly broad colored water wash.
```

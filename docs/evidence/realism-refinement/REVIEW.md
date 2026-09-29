# Firecrackers realism direction, round 2

These three generated stills are design references made from actual browser captures. The built-in ChatGPT image-generation tool did not expose a model identifier. [PROMPTS.md](PROMPTS.md) records the full prompts and reference roles. The images do not prove browser appearance, interaction, animation, or performance.

| Image | Useful direction | Image inaccuracies to avoid |
| --- | --- | --- |
| [01 Saturn desktop](concepts/01-saturn-water-desktop.png) | Fine, broken blue/gold reflections tied to the Saturn head and ring; directional cobalt smoke; distant shore depth; slight glints on wet stone. | Shore village and terrace are too prominent. The water and shoreline consume more of the stage than the live composition permits. |
| [02 Willow mobile](concepts/02-willow-smoke-mobile.png) | Curved, continuously glowing hanging strands; bright moving tips with dimmer aged trails; warm rim light in otherwise dark smoke; narrow reflection path. | Launch and other UI symbols are enlarged, and the rocket/terrace become oversized. Preserve the live 56 px Launch control and existing camera framing. The image cannot show trail continuity over time. |
| [03 Supernova desktop](concepts/03-supernova-smoke-desktop.png) | Distinct peach and cyan child blossoms; staggered outer falloff; smoke pockets lit by nearby heads; separately colored pink/cyan reflection fragments. | The bright cyan center and wide, luminous water are stronger than intended. Keep exposure and combined burst/reflection flash bounded. The image does not establish the correct timing of the child events. |

## Browser implementation direction

1. **Water:** Keep the base nearly black. For each luminous head or cluster, project its screen position onto the reflection band and generate many short horizontal glints, with dark gaps and thinner marks near the horizon. Spread and distortion should increase toward the viewer. Tie each path to that emitter's live color and fade; let sparse amber shoreline lights contribute separate, weaker paths. Sample the existing water normal and common wind so the glints move with the water. A full mirror or broad color wash would erase the breakup that makes the surface convincing.
2. **Smoke:** Treat smoke as depth and partial occlusion, not a colored overlay. Use a dark back haze, smaller interior pockets, and sparse bright rim patches only near recent luminous heads. Retain smoke after the burst so later child blossoms briefly relight it. Let opacity and hue decay independently; wind moves all layers coherently. Verify several moments of each effect, including the quiet afterglow.
3. **Trails:** Make a sharp moving head followed by a continuous taper and a softer, thinner older section. Willow needs drooping curves with uneven ember falloff. Saturn's ring remains a clear ellipse with individual points rather than a dense gold band. Supernova's child blossoms need visible spacing, delayed ignition, and separate peach/cyan identities. Assess captured sequences, not a peak still.
4. **Foreground:** Use a small rocket and narrow terrace as scale anchors. Add paper seam and roughness variation, restrained foil highlights, subtle stone edge chips, and contact shadow at the stand. Wet stone should glint in local patches when a bright effect fires; a uniformly glossy or bright terrace competes with the sky.
5. **Composition and UI:** Retain the exact six transparent edge control groups, the measured central corridor, the current small control dimensions, and the stable camera. The generated UI text, pixel sizes, horizon height, and props are not specifications. Implement controls as native elements and verify the seven viewport and safe-area scenarios against live screenshots.

## Review checks for the next browser pass

- Capture Willow before peak, peak, and late fall; Saturn early ring, peak, and fade; Supernova parent, staggered children, and afterglow with identical seeds.
- Confirm reflection positions, hue, and disappearance follow each actual light source; inspect reduced flashes with burst and reflection together.
- Confirm smoke persists and can be relit without turning into an opaque white or uniformly colored mass.
- Confirm the terrace remains secondary at 393 × 851 and 1280 × 800 and no resting control enters the central corridor.
- Compare Ultra, Standard, Low, and Canvas, including missing-asset fallbacks and a real mobile device if available.

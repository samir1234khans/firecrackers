# 06 — Art direction and realism bible

## North star

A believable festival-night view with a tactile foreground object and a sky that remains impressive when the controls disappear. Realism comes from coherent relationships: size and distance, thrust and ascent, emitter and trail, smoke and light, flash and sound. It does not come from applying maximum bloom to thousands of dots.

This is a virtual scene, not a geographically accurate location or a physical-fireworks training view. All scene ratios and tuning values here are proposed creative defaults.

## Scene composition

Use approximately 82–88% sky and a 12–18% dark lower region at the default framing. The exact ratio may flex to keep touch controls clear. A distant uneven tree line creates scale without detailed buildings or a visible crowd. Include only a few very small warm lights; they must not read as a city skyline. No moon. Stars are sparse and low contrast; the sky is not a galaxy wallpaper.

The background begins with a near-black blue zenith, a subtly lighter horizon, restrained atmospheric haze, and sparse cloud patches covering roughly 10–20% of the frame. Make the cloud layer vary slowly. Do not draw recognizable identical noise blobs or hard repeated texture seams. A burst may reveal a patch of cloud or smoke locally; it should not turn the whole night sky into a saturated gradient.

Use a stable eye-level visual horizon. The camera is locked during normal viewing; no orbit controls, automatic tracking, or exaggerated zoom. A small optional camera impulse may be explored later, but the default is no shake. Portrait framing fits the full burst canopy and sufficient falling distance. Resize transitions preserve the world rather than restarting an effect.

## Foreground and ignition

The selected rocket-like prop needs believable material response: slightly imperfect paper, restrained highlights, a visible fuse, and a grounded contact shadow. Its silhouette and accent band identify the chosen family. Avoid photoreal branded retail packaging and fine text. The prop is readable at a thumb's scale, not enlarged to occupy half the sky.

A lighter/flame is a contextual interaction cue, not a persistent cartoon hand. The visible flame leans slightly with shared wind. The fuse ember progresses along a curve with local sparks, tiny uneven sputter, and a faint smoke thread. Its sound and light remain near-field. A real feeling comes from cause and effect: the ember reaches the endpoint before thrust begins.

## Ascent

Begin with visible thrust and a luminous tail that points back along the motion path. Accelerate and then transition into the upper motion envelope; do not use a constant-speed CSS translation. Slight arc and drift are consistent with the shared wind, not a random zigzag. Small fragments detach and slow behind the main emitter. The main head remains trackable until the burst.

## Burst and afterglow

The initial energetic core should be brief and spatially small. The expanding shell rapidly becomes a structure of separate luminous heads, historical trails, and dark gaps. Different stars extinguish at different times. Trail width and brightness depend on distance and age; long uniformly bright tubes look synthetic.

Use gravity and drag to change the shape over time. A willow must continue hanging after the bright report; a peony must fade more cleanly; a crossette must disclose its split before crackle. Embers fade with irregularity but never strobe by rapidly toggling every frame. Fresh trajectories can be nearly white at the hottest point, then move through the chosen palette into dull amber before extinction.

## Smoke and wind

Keep smoke from earlier events alive for a bounded period rather than clearing it when an effect ends. Baseline smoke uses layered, drifting, soft-edged billboards/impostors with approximate depth and local light response. This is an appearance technique, not a claim of physically simulated volumetric fluid dynamics. A true volumetric high-end path is optional and must justify its cost.

One world wind field influences trail fragments, flame, smoke, and clouds at different response rates. Slowly varying turbulence adds texture without contradicting the prevailing drift. Smoke begins compact, expands, loses density, and blends away. A low-opacity background haze must never accumulate to an opaque gray screen during a long show.

Use a small shared pool of transient light envelopes. A later red burst colors the nearby retained smoke red; it does not recolor all smoke uniformly. Preserve occlusion/depth order well enough that sparks do not always look pasted on top. Approximation is acceptable; obvious intersecting rectangular sprites are not.

## Light and exposure

Render luminous components in a linear working space with tone mapping and bounded bloom. The material-emission system and the final display transfer must be verified on both graphics backends. The CSS UI is composited separately and should not be tone-mapped or bloomed with the scene.

A tiny bright core with sharp heads sells intensity better than a large blurred disc. Keep the sky dark enough that bursts create contrast, but do not crush every smoke detail. Default exposure stays stable; avoid pumping the entire frame after every report. A subtle capped burst tint may affect the glass border/shine through an event envelope, not per-frame React re-rendering.

Reduced-flash mode lowers bloom, bright core area, rapid secondary flashes, and overlapping burst intensity. It does not merely desaturate the image. Assess final sequences against [S11](19-research-and-reuse.md); this document is not a safety certification.

## Motion and texture hierarchy

The eye should first follow ignition, then launch, then burst structure. Interface animation is secondary. Background stars do not twinkle strongly; clouds do not compete with sparks; ground lights do not pulse with every event. Ambient display eliminates persistent dock glow and large high-contrast status labels.

## Reference-review worksheet

For each legally viewable reference, record source URL, owner, permitted use, family, timestamp, aspect ratio, camera distance impression, ascent duration, expansion shape, visible trail persistence, smoke/light relationship, and audible delay. These observations are an art study, not exact physical measurements. Do not rip images or audio from recordings without permission.

Review the hero at six checkpoints: unlit placement, fuse midpoint, ascent midpoint, initial expansion, late canopy, and smoke illuminated by a second event. Review full-speed and slowed recordings. On a five-point rubric, score silhouette, motion, trail continuity, smoke integration, lighting restraint, audio coherence, and interaction feel. Proposed gate: every category at least 4/5 with no critical artifact, plus the technical performance gate. This is an owner/art review, not an automated truth about realism.

## Reject list

Flat confetti, rainbow starfields, bloom fog, perfect mirrored circles, equal particle lifetimes, trails detached from their emitters, instantly vanishing smoke, a moving camera for every rocket, repeated identical audio, glass panels occupying the sky, forced bright onboarding, and stronger flashes used as a first-launch reward.

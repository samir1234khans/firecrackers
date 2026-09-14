# 01 — Product brief

## Product promise

Make a person feel that they have initiated a digital firework, not merely pressed a particle-effect button. The experience has an object, an action, anticipation, release, spectacle, and a lingering aftermath. One immersive screen should also become an unattended decorative display while the page remains visible.

The emotional sequence is **choose → place → light → anticipate → follow the ascent → experience the burst → watch the embers fade**. The last step matters: disappearing particles and instantly cleared smoke would undo the realism earned by the explosion.

## Confirmed direction

The owner chose a web app rather than an Android-first build, a glass-and-layered interface, and fireworks resembling real festival displays. Five firework families were accepted. A bottom placement area, deliberate fuse lighting, an approximately 1.5–2.5-second fuse, slight launch variation, realistic smoke/light/sound, a restrained interface, automatic shows, and an installable experience were discussed and accepted as the V1 direction.

The accepted scene is an open night-time festival ground: low dark tree line, faint distant warm lights, restrained haze/clouds, no moon, and approximately 85% sky. These are art-direction defaults to tune in the first render, not a requirement to simulate a real location.

## Jobs to be done

An active user wants to choose a visually different firework and feel responsible for lighting it. A passive viewer wants an attractive, continuously paced display without repetitive tapping or persistent interface clutter. A presenter wants the display to remain readable on a larger screen, with predictable controls, restrained sound, and an immediate way to stop. Decorative wedding-stream/background use is a future integration context; V1 must not depend on a wedding website or contain its private information.

## V1 includes

One responsive scene; five selectable identities; adjustable placement within a controlled ground strip; hold-to-light plus accessible alternatives; complete fuse/ascent/burst/afterglow behavior; a shared wind and smoke system; optional sound; optional supported haptics; manual overlap within budgets; Calm, Festival, and bounded Finale show presets; master pause; fullscreen where supported; automatic quality adjustment; preference persistence; first-run guidance that can be replayed; PWA/offline behavior after assets are cached; and a clean display presentation without creating another main page.

Settings and help are overlays on the same screen. Technical capability failures have a real recovery path. The product must remain usable without audio, vibration, installation, or fullscreen.

## Explicit exclusions

No login, database, public profiles, social feed, cloud synchronization, purchases, ads, real-money items, AI generation at runtime, multiplayer, real-firework controls, location permission, camera, microphone, physical device integration, video export, or native live wallpaper in V1. A future Android wrapper is not part of this documentation delivery. Transparent livestream compositing, host-site messaging, synchronized remote launches, music-reactive choreography, and named public shows are deferred.

## Quality priorities

1. Convincing motion, trail decay, smoke interaction, scale, and sound timing.
2. Responsive, deliberate interaction and uninterrupted viewing.
3. Sustained performance, accessibility, and resource limits.
4. Consistent subtle glass UI and complete browser fallbacks.
5. More particles or optional high-end rendering only when the above remain intact.

A million indistinct dots is worse than a smaller number of carefully rendered trajectories. A generic fireworks library is not the product merely because it can launch colored particles.

## Success evidence

The first milestone must show one Gold Willow from placement through afterglow with no hidden jump cuts. Reviewers should be able to tell what they lit, follow its upward movement, distinguish the luminous head from the fading trail, and see smoke respond to a later burst. At release, all five identities must be distinguishable at Standard quality without labels.

Proposed usability gate: in a small observed trial of at least five first-time users, four complete a manual launch without verbal coaching and all can find pause/mute when asked. This is a formative test, not statistically representative market validation. The technical gates are in the performance and test plans; no measured results exist yet.

## Definition of complete

All V1 requirements are implemented, the critical test matrix passes, assets have usable rights, known limitations are visible in the release notes, and the live deployment is checked against its exact source commit. Documentation-only completion is not application completion.

# 08 — Audio and haptics

## Intent

Audio should reinforce the user's action and the sky's scale without making quiet decorative use uncomfortable. The sound design has separate near-field ignition, moving launch, distant report, and decaying sparkle layers. Silence is a supported mode, not a degraded error state.

Browser media activation is conditional. Start/resume AudioContext from a user gesture, detect success, and handle later suspension. Do not assume that a permission attribute or remembered sound preference guarantees autoplay. Sources: [S09–S10](19-research-and-reuse.md).

## Event model and timing

The simulation emits semantic events with unique IDs, simulation time, source position, seed, family, and gain class. The audio engine deduplicates them and schedules against its own audio clock using an explicit mapping to simulation time. It must not use a React render, an animation completion handler, or an unbounded setTimeout list to schedule a report.

The flash occurs at the visual burst. The report is scheduled after a distance-derived artistic delay; proposed initial range for normal bursts is roughly 0.25–0.70 seconds. This is a virtual-scene tuning model, not a claim to measure real sound propagation from the foreground prop. Farther scene layers sound quieter, darker, and later; near fuse/launch layers remain immediate. Use one consistent virtual-distance mapping rather than independent random delays.

Maintain a short scheduling lookahead, approximately 100–200 ms, so pause/mute has predictable behavior. Store handles to scheduled sources. On pause, hide, mute, reset, or renderer failure, stop/disconnect those handles and invalidate the scheduling generation. Resume only future events; never replay missed reports in a catch-up burst. Quiet fades prevent clicks when stopping active layers.

## Layer inventory

| Layer | Proposed variants | Direction |
|---|---:|---|
| Fuse ignition | 3 | Small click/sputter, immediate and close; never an explosive hit. |
| Fuse burn | 2 short loopable beds | Grainy hiss with subtle changing energy; no obvious loop seam. |
| Launch thrust | 4 | Brief lift, tail fade, optional restrained whistle in selected variants. |
| Small report | 4 | Concise Peony/child-burst events. |
| Medium report | 4 | Full Chrysanthemum report without permanent sub-bass. |
| Large report | 3 | Gold Willow/Finale accents; spacious, not louder by default. |
| Crackle clusters | 5 | Differently spaced short snaps; grouped voices, not one voice per spark. |
| Glitter/sizzle | 3 | Long soft tail; usable underneath an existing report. |
| Night ambience | 1–2 loops | Very quiet open-air bed; optional distant indistinct crowd, no speech/music rights risk. |

This is a production brief, not a list of acquired files. All sources require rights records. Placeholder synthesized audio is acceptable during engineering but not proof that the final realism target is met.

## Family mapping

Gold Willow uses a round report and long soft sizzle. Peony uses one concise report with minimal tail. Chrysanthemum is fuller and more sparkling. Crossette uses a primary report plus temporally separated snap clusters after splitting. Grand Finale reuses existing report types with spaced crescendo and a long closing glitter tail. Do not add a stereotyped rising whistle to every firework merely because it sounds cinematic.

Use bounded seed-based pitch/gain variation, initially within about ±3% playback rate and a narrow gain range. A shuffle bag prevents immediate sample repetition. Do not stretch pitch enough to change apparent physical scale accidentally. Samples with baked-in reverb must be identified to avoid layering another identical echo on top.

## Audio graph and mix

Proposed graph: decoded sources → per-event gain/filter/panner → effects bus; ambience → ambience bus; both → master gain → dynamics control → destination. Use stereo panning by screen position as the baseline; enable more elaborate spatialization only after listening tests. Summarize groups rather than constructing a positional audio object for every ember.

Polyphony is bounded by tier. When overloaded, reject quiet decorative crackle first; preserve the user's own ignition and the main report. Protect the sum of simultaneous finale reports using a headroom budget, not only per-sample normalization. A compressor is not automatically a brick-wall limiter: render worst-case mixes offline and inspect peaks. Proposed maximum export/test peak is -1 dBFS, with no clipping in loop transitions. This target is an engineering mix constraint, not a guarantee about listening safety or device volume.

Phone speakers need intelligible midrange transient and body, not artificial attempts to reproduce unavailable sub-bass. Provide a natural default mix; an optional quiet listening setting can reduce dynamic contrast. Actual volume remains under user/system control. Never raise volume automatically to overcome muted hardware.

## User controls

Main cluster: sound on/off. Settings: master volume, ambience toggle/level, and haptics. Default sound and haptics are off; the first-run panel offers explicit sound activation. Ambient night audio is optional and near inaudible by default when enabled. Mute affects current/scheduled audio immediately and preserves the remembered preferred volume for a later explicit unmute.

A successful UI toggle should reflect actual activation. If AudioContext remains blocked, show a small 'Tap to enable sound' action rather than claiming sound is playing. The visual sequence continues normally without audio.

## Haptics

The browser vibration interface supplies on/off timing patterns and is not uniformly available; amplitude-controlled premium tactile effects are not guaranteed. Source: [S06](19-research-and-reuse.md).

Proposed optional pulses: selection 8 ms, ignition 12 ms, launch 18 ms, primary report 20–30 ms, with a global rate limit of one substantive pulse per 200 ms and no vibration stream for individual crackles. These are starting values subject to physical-device testing. Pair a report pulse with its perceived arrival, not the earlier flash. Browser/OS scheduling may not permit exact audiovisual-haptic synchronization; make it a subtle enhancement, never essential feedback.

Stop vibration with the platform cancellation call on mute-haptics, pause, page hide, and disposal. Haptics can be enabled independently of sound, using the same virtual arrival model. In automatic decorative mode, default to no vibration even if manual haptics were enabled, unless explicitly chosen.

## Audio acceptance

Test in silence, with laptop speakers, with ordinary phone speakers, and with headphones at comfortable user-set volume. Check first gesture activation, mute mid-report, background/return, overlapping finale, missing samples, Bluetooth/output-route changes, and repeated launches. Record peak analysis and listening findings. A passing functional test does not establish cinematic sound quality; owner review remains a gate.

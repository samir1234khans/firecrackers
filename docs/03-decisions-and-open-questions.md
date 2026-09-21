# 03 — Decisions, clarifications, and open questions

Baseline date: 15 September 2026. Source for confirmed items: the owner's planning conversation. These records prevent an implementation agent from treating every earlier suggestion as a tested capability.

## Confirmed product decisions

| ID | Decision |
|---|---|
| D-01 | Web app first; installable PWA; Android-native work deferred. |
| D-02 | One immersive night-sky screen, not a conventional multi-page app. |
| D-03 | Glass and layered styling for a minimal interface; realistic festival fireworks for the world. |
| D-04 | Five accepted identities: Gold Willow, Multicolor Peony, Chrysanthemum, Silver Crossette Crackle, Grand Finale. |
| D-05 | Choose, place, hold to light, fuse anticipation, ascent, burst, afterglow. Placement near bottom center with left/right adjustment. |
| D-06 | Fuse target approximately 1.5–2.5 seconds; slight launch/burst variation rather than identical repetitions. |
| D-07 | Shared wind, persistent smoke, local illumination, gravity/drag feel, optional layered audio, supported subtle haptics. |
| D-08 | Low dark tree line, distant warm lights, faint haze, sparse cloud cover, no moon, approximately 85% sky. |
| D-09 | Directed automatic shows with Calm/Festival/Finale pacing, bounded overlap, and manual priority. |
| D-10 | Compact fading dock, understated controls, responsive presentation, motion restraint. |
| D-11 | React/Three.js architecture direction; simulation outside React; WebGPU with a fallback path; pooled particles; PWA and quality scaling. |
| D-12 | No accounts or unrelated product extras in V1. Build one convincing Gold Willow before expanding the catalog. |
| D-13 | Current authorization is creation and storage of the necessary documentation in `samir1234khans/firecrackers`. It is not evidence that application implementation or deployment has happened. |

## Proposed implementation defaults

| ID | Default | Why / change rule |
|---|---|---|
| P-01 | Working name Firecrackers | Matches the repository. Owner may brand it later. |
| P-02 | Sound and haptics initially off; first-run sound choice | Avoid surprise noise; retain an obvious route to the full experience. |
| P-03 | Hold threshold 650 ms with visible progress | Deliberate without a long wait. Tune through first-use testing. |
| P-04 | Manual placement limited to x=0.20–0.80 of the interactive stage | Keeps launch trajectories and controls clear. Offer left/center/right buttons. |
| P-05 | Manual takeover pauses auto until explicit Resume show | Makes 'yields instantly' unambiguous and prevents surprise launches. |
| P-06 | Finale preset is a 12–18-second phrase followed by at least 12 seconds of breathing space | Preserves spectacle without an endless white wall or overload. |
| P-07 | CPU-authored events and pooled emitter state, GPU-drawn sparks; optional advanced compute only after fallback proof | Keeps baseline behavior portable. |
| P-08 | Lit layered smoke impostors for baseline; true volumetric rendering is an optional measured enhancement | Defines a feasible route to volumetric appearance on phones. |
| P-09 | Camera shake off by default | Earlier subtle shake suggestion is optional, not a realism requirement. |
| P-10 | Static hosting, no backend; Cloudflare Pages a proposed production target, Vercel an optional preview target | Hosting account changes and a final URL are not part of documentation delivery. |
| P-11 | One reusable world with an optional clean display presentation | Supports decorative use without an extra product. |
| P-12 | No telemetry provider in V1; local debug counters only | Fewer dependencies and privacy obligations. |

## Corrections to conversational shorthand

**Rendering:** Three.js documents WebGPURenderer's WebGL 2 fallback, but that is not a guarantee that every custom material or compute feature is portable. A backend-parity spike is a release prerequisite. See [S01–S03](19-research-and-reuse.md).

**Continuous background:** continuous rendering is a visible-page/display feature. A PWA cannot promise animation in a hidden tab or on a locked screen. Wake lock is conditional and revocable. See [S07–S08](19-research-and-reuse.md).

**Haptics:** the web vibration interface provides timing patterns, not a promise of premium amplitude-controlled 'deep thumps' across all devices. It is optional and capability-gated. See [S06](19-research-and-reuse.md).

**Onboarding:** 'three seconds, then never again' becomes a brief skippable introduction plus replayable help, with no forced reading timeout. A first success uses the same effect family and safe intensity envelope, not an unannounced stronger flash.

**Minimal text:** visual clutter is removed, but control names, focus cues, errors, and access to help remain. Hidden controls must return on keyboard focus and may never disappear during an active gesture.

**No warnings:** normal quality adaptation should be quiet, but genuine renderer failures, missing essential assets, and unsuccessful keep-awake requests must be communicated honestly.

**Firework taxonomy:** the catalog contains four visual families and one curated multibreak experience. Crossette splitting and crackle are separate layers; Grand Finale is a composition, not a standardized physical firework type. It still occupies one of the five user-facing choices.

## Open owner choices — not blockers for the hero slice

| Question | Default until answered | Must be settled by |
|---|---|---|
| Final brand name and icon? | Neutral Firecrackers title and temporary original icon | Public release |
| Final domain and hosting account/project? | Local build and branch preview when separately authorized | Public deployment |
| Any budget for professionally recorded sound? | Original/properly licensed placeholders; no ripped recordings | Audio quality gate |
| Is a clean opaque display enough for first wedding-stream use? | Yes; transparent compositing and host-site integration deferred | Integration milestone, not V1 hero |
| Commercial plans or public code license? | Do not add an open-source license or payment features without owner choice | External reuse/commercial release |
| Secondary UI language? | English strings externalized for later localization | Only if localization enters launch scope |

The implementation should not stall on these choices. Use the stated defaults, record consequences, and keep irreversible external account/domain/license changes separate from normal engineering.


## Video-flow repair amendment — 21 September 2026

For build `2026-09-21.2`, the manual primary action is a single press, not a hold gesture. A committed rocket owns the platform through fuse and ascent; a short rearm follows the primary break. Next-family selection is allowed without mutating the current flight. Controls remain visible in interactive mode. Resource admission includes future particle reservations but no fictitious launch occupancy from afterglow-only records. See [the video-flow plan](video-flow/PLAN.md) and [validation contract](video-flow/VALIDATION.md) for acceptance and test scope.

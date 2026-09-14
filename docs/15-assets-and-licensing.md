# 15 — Asset production and rights plan

## Delivery boundary

This baseline defines the needed assets; it does not contain finished models, textures, sound recordings, icon artwork, or reference screenshots. Do not turn an asset wishlist into a claim of an acquired/licensed media pack.

Use original procedural assets or explicitly licensed material. A publicly viewable video, sample download, or GitHub repository is not automatically permission to redistribute every included asset. Keep code licenses and media licenses separate. The project's own distribution license remains an owner decision; no blanket open-source license is assigned by this documentation.

## Visual production list

| ID | Asset | Production brief | Runtime form / target |
|---|---|---|---|
| V-01 | Five foreground rocket-like props | Shared base geometry with distinguishable silhouettes/accent bands; paper material and fuse; no copied retail branding | Procedural geometry initially; optional optimized GLB, roughly 1–3k triangles per visible prop as a tuning target |
| V-02 | Fuse/light interaction | Curve-based fuse with moving ember; small flame and sparks | Geometry plus procedural shader/small original texture |
| V-03 | Spark heads and trail masks | Soft luminous cores with sharp readable center; no decorative star symbols | Small procedural texture/atlas, initially 64–256 px |
| V-04 | Smoke atlas | Multiple irregular soft density patches without rectangular borders or obvious repetition | Original 512–1024 px atlas or procedural source; verify alpha convention |
| V-05 | Distant tree line | Low asymmetric silhouette, no recognizable private location | Original SVG-derived texture or minimal geometry |
| V-06 | Clouds/haze | Sparse low-contrast seamless noise, slow evolution | Original noise texture or shader |
| V-07 | Dock thumbnails | Consistent viewpoint of the five props, readable at small size | Generated from the same model/material definitions or authored original images |
| V-08 | Application icons | Neutral working-title icon, regular and maskable forms with safe padding | Original install icons; final branding gate before release |
| V-09 | Social preview | One restrained representative scene with title | Optional later public-release asset; not a substitute for real render QA |

Keep the runtime media small enough for the offline budget. A high-resolution source/master may be stored separately or in an appropriately managed asset location; the public runtime must not download the master by default. Do not introduce a large background video to mimic a simulation.

## Audio production list

Follow document 08's layer/variant inventory. Source dry or clearly annotated recordings so distance/reverb treatment is intentional. Remove handling noise, clipping, abrupt cuts, and unwanted identifiable speech/music. Preserve source masters privately only where their license permits; ship optimized derivatives in a browser-compatible format after decoding tests.

Use synthesis as a temporary engineering fallback for fuse hiss and simple reports, clearly marked placeholder. Do not commission or pay for recordings without owner approval. Do not extract commercial show audio from online videos. A cinematic soundtrack or popular song is outside V1.

## Provenance record

Every shipped asset record needs: stable ID, runtime path, type, source/author, ownership or license identifier, proof URL/document, acquisition date, adaptation description, attribution text where needed, content hash, bytes/dimensions/duration, status, and reviewer. The supplied `specs/asset-manifest.template.json` is a schema example with an empty inventory, not a populated asset catalog.

Statuses: `planned`, `placeholder`, `rights-review`, `approved`, `rejected`. Release bundling must reject missing records and non-approved assets, except documented first-party procedural code assets with explicit ownership records. A path mentioned in a brief does not mean a file exists.

## Reuse policy

Three.js core is a reuse candidate with its published MIT license; Lucide is a candidate with its published ISC license; optional Motion has a published MIT license. Retain required notices for the exact adopted versions. Research links are in document 19. No files from these projects have been vendored by this documentation task.

A library's examples may include third-party fonts, models, textures, or sound with different terms. Evaluate each copied asset independently. If adapting an example, record the exact upstream file/ref, what was changed, and the license text. Prefer importing maintained packages over copying large opaque code blocks.

## Reference capture worksheet

For legally viewable reference footage, record source URL, owner, viewed date, family, timestamps, frame composition, trail lifetime impression, smoke evolution, and audio relationship. Classify it `reference-only` unless redistribution permission exists. No reference screenshots or extracted clips should enter this public repository merely because they were used for discussion.

## Acceptance checklist

Props read clearly without labels; atlas borders do not show; textures work on both render backends; alpha is consistent; files fit size budgets; offline package includes all required approved derivatives; no accidental camera/microphone permissions; every included asset has a record; credits/notices match the actual bundle; placeholder sounds/icons are not described as final branded assets.

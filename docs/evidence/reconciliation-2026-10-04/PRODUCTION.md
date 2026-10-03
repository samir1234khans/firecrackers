# Reconciled production release — 4 October 2026

The owner explicitly requested reconciliation and deployment to main and production, superseding the earlier production hold. The release is live at [Firecrackers](https://firecrackers.mainandmany.com/), build **2026-10-03.4**. This authorization does not qualify the previously invalid hardware performance measurements.

## Source, artifact and deployment

- Tested application merge: `e60d46443836d1f60bfb65f026dfc36eb5ba509c`, PR #47, incorporating PR #33 and newer V4, Studio and capture work.
- Main at deployment: `e235773d0bc500a9252b2ebed011d1f48cb83880`, a documentation-only successor. Source, public assets, scripts, tests, package/lockfile, Vite and Wrangler configuration were verified unchanged from the tested merge.
- Published artifact: `grand-collection-build`, ID `11285051061`, from successful main-push [Runtime run 37152760502](https://github.com/samir1234khans/firecrackers/actions/runs/37152760502). All engine, desktop, mobile and recovery jobs passed. Main documentation [run 37152857536](https://github.com/samir1234khans/firecrackers/actions/runs/37152857536) passed at `e235773`.
- Fingerprint: `04e7c05185f679e2d43923f5bcee5425d35856f2e1f51529e468819a64c9fcfb`, all 149 source/config/asset entries. The downloaded CI artifact matched the refreshed current-main build's version, complete module list and fingerprint.
- Worker: `firecrackers`; deployed version `d849bfe4-9f8a-45a6-8003-215014b5a94a`, deployment `ee520c2d-2cb8-4554-b1be-cfa622cb6889`, 100%, at `2026-10-03T22:02:57.465997Z`.
- Previous live build `.3` was verified before publishing. Previous Worker version `12eb0650-dc48-4609-812d-0511a489a960` remains retained for rollback. No domain, route, branch deletion or force-push was performed.

Publishing used locally authenticated Wrangler with the existing Worker configuration and an explicit CI-artifact assets directory. The GitHub release workflow was not invoked: its exact-head push-run gate cannot recognize a documentation-only main successor, and its earlier runner had no Cloudflare secret bindings. Instead, the local release verified the successful exact application-main CI artifact, proved the documentation-only difference, checked current remote main immediately before publishing and retained before/after Worker state. This is not a claim that the separate release workflow passed.

## Actual public verification

- [Public bytes](production-bytes.json): all **53 served files** match the CI artifact byte-for-byte by SHA-256, including all eighteen original music assets, application bundles, worker, manifest and release fingerprint. `_headers` is hosting configuration, not a served asset.
- [Headers](production-headers.json): root, HTML, release, worker, cache lifecycle and manifest deliver `no-store`; hashed JavaScript delivers `public, max-age=31536000, immutable`.
- [Six backend cases](production-smoke.json): native Chrome reported WebGPU, forced WebGL 2 and Canvas compatibility at 1280×800 and 393×851. Theme selection, immersive toggle, independent music/master consent, actual music voice playback, mute and viewport bounds passed with no page errors. These are functional backend checks, not GPU timing or hardware qualification.
- [Six experience journeys](production-experience.json): software WebGL/Canvas at 1280×800, 393×851 and 320×480 passed preview/favourites, search/select/launch separation, Studio editing/undo/save/rename/export/import rejection, share review, same-clock personal playback, Encore, PNG preview/download and supported video capture/decoding checks.
- [Actual worker activation](production-cache.json): seeded old versioned app caches were removed, unrelated cache survived, and the current app reloaded offline. This isolates the production worker and is not an old installed-worker upgrade simulation.

The newer deliberate **Update & restart** behavior remains. New visits receive fresh entry points; existing controlled sessions can finish drafts/recordings before activating their update. Obsolete app caches are cleaned at activation. No unrelated browser storage or whole-zone cache was purged. Historical forced navigation is intentionally superseded.

## Reconciliation and limits

Fetched local and remote refs were checked again before and after deployment. All current-work refs are ancestors of main; the sole exception remains historical `feat/fireworks-v1-implementation`, explicitly excluded by repository policy and preserved. See [main reconciliation and branch audit](MAIN.md).

No application source was changed during this release. Documentation checkpoints following deployment do not change deployed application bytes. All thirteen effects, four Always Play quantities, moonlit water, immersive controls, original cinematic scores, newer night tools and capture fixes remain integrated.

Physical phones/Safari, sustained frame/GPU/thermal behavior, formal flash qualification and matched listening remain unqualified. No new benchmark was claimed; earlier contaminated timing remains invalid. The prior `.5` shows-preview URL is historical and is not evidence of this production release.

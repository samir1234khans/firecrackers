# Automatic cache-safe updates

Owner requested automatic latest-version delivery and obsolete-cache removal before production promotion. Candidate `2026-10-02.5`, fingerprint `c5207035d171b38844d852c53009e630997724bddb4e3f3b730284f90072cfd7`, contains 111 fingerprinted source/asset entries. This replaces the former manual-update policy for the authorized release; it does not waive graphics qualification or CI.

## Implemented behavior

Vite PWA installs and activates updates automatically. The app checks on focus, return to visibility and reconnection; a new worker refreshes controlled tabs once per activation, including legacy prompt-mode tabs and redeployment after rollback. Fresh installation does not refresh. Navigation promises are deliberately outside the activation lifetime: otherwise their fetches can wait for activation and deadlock.

Only obsolete `firecrackers-*` runtime caches are deleted. Art, effect audio and consent-loaded music use release-specific names and their existing 12/8/24-entry limits. Workbox prunes obsolete precache revisions. Preferences, unrelated caches and local storage are preserved. Online activation can restart an open scene; it never grants audio consent. Offline app play remains, and music is limited to chunks previously cached after consent.

Cloudflare `_headers` applies `no-store` to entry HTML, `release.json`, `sw.js`, the original generated `cache-lifecycle.js` and the manifest. Content-hashed `/assets/*` bundles use immutable caching. The generated migration script, header rules and Vite configuration now participate in the release fingerprint. No zone-wide purge, unrelated storage wipe or manual browser-data deletion is required. Disconnected visitors update when they return online.

The new client explicitly activates a waiting prompt-mode worker during an authorized rollback. The retained production Worker remains `12eb0650-dc48-4609-812d-0511a489a960`; rollback to its schema 3 can restore defaults. An upgrade thereafter is tested again, so migration is not suppressed by a stale one-time marker.

## Evidence

The actual `.3` baseline was downloaded from production CI run `36958091880`, artifact `grand-collection-build`, and verified against fingerprint `c9bb7291fd81d625331fcbc6746c92938906165feff69ae4156865aa41f989a8`. A same-origin native Chrome harness switches its served directory from that artifact to the candidate, without unregistering the worker, clearing browser data or sending a test-issued skip-waiting message.

Two old controlled tabs upgraded automatically, each with one navigation. The selected Sapphire Saturn, migrated preferences, thirteen identities and master sound-off state were retained. Obsolete app caches disappeared and a seeded unrelated cache survived. Current-version offline reload, explicit rollback, redeploying this same candidate to both tabs, fresh installation and bounded navigation passed. [Actual production-artifact upgrade](cache-upgrade-production.json).

CI uses an original minimal prompt-worker fixture to exercise the same lifecycle without depending on an expiring historical CI artifact. Four focused units cover scope filtering, preservation, fresh installation, storage denial and the activation/navigation deadlock. Functional cache evidence does not replace hardware graphics timing. The earlier `.4` preview and rejected timing receipts remain historical evidence.

The `.5` exact CI artifact is now hosted on the isolated preview, Worker `4df5a15d-ddf6-4517-a352-c3b774f094e3`. Six public native-backend cases, all eighteen music hashes and the actual no-store/immutable header rules passed. [Current qualification receipt](QUALIFICATION.md) records the latest rejected timing attempt and production hold. The missing-music lifecycle check now blocks service workers only for its network fault injection, because claimed-worker fetches bypass Playwright page routes; the 404/fallback assertions remain intact and the corrected lifecycle passed.

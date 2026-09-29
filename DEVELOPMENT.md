# Development workflow

## Source and branches

The active ten-effect application is on `feat/grand-collection`, derived from `fix/viewability-recovery`. The latter preserves the repaired single-press launch. `feat/fireworks-v1` and the alternate implementation branch are historical; main is still the original documentation baseline. Before continuing, fetch all relevant refs, inspect worktree changes and read PROJECT_STATUS plus the latest delivery evidence.

Continue an authorized existing task branch rather than creating a competing integration hierarchy. Do not reset unrelated work, force-push or delete branches. A ref conflict requires refreshing and reconciling, not force. Promotion to main, domain changes and public licensing need separate review/authorization.

Commit coherent source, tests and documentation together. Explain changed behavior and actual evidence. The original five-effect/hold-ignition specifications remain historical; later owner-approved ten-effect and single-press decisions take precedence as documented in the current plan and evidence.

## Reproduce the application

Use Node `.nvmrc` and `npm ci` with the committed lockfile. Avoid unrelated dependency upgrades. Never commit dependency directories, generated builds, private machine settings or secrets.

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run test:soak
```

The logical soak is accelerated simulation, not hardware GPU/thermal endurance. Run the same input/seed workloads for comparable visual evidence. A successful build alone does not establish correct graphics.

## Browser validation

Install the configured Chromium runtime and serve the actual production build before using the browser scripts:

```sh
npx playwright install chromium
npm run preview -- --port 4173
```

In another process:

```sh
npm run test:grand
npm run test:e2e
npm run test:viewability
```

The Grand script supports `GRAND_PROJECT=desktop` or `mobile` and `GRAND_URL`. The original-flow script supports `VIDEO_FLOW_PROJECT` and `VIDEO_FLOW_URL`. The recovery script supports `VIEWABILITY_URL`. Defaults target loopback port 4173. Use the public URL only when deliberately verifying the deployed website.

Grand validation covers new recipes, both rendering modes, collection memory, ten shortcuts, child pause/cleanup and small layouts. The original suite protects launch, duplicate rejection, next selection, pause, takeover, preferences and offline/platform behavior. Recovery tests inject missing modules, unavailable/lost graphics and interface failures. Do not remove these guards to simplify an expansion.

GitHub workflows separate candidate build tests from actual public-site verification. Read explicit job results and all event types; the PR-only commit helper is insufficient for push-triggered checks. Inspect failed logs and actual screenshots before repairing. Keep the original-flow step running even when a new-collection check fails.

## Deployment and source parity

Use the existing app `firecrackers-a93nle` and its published preview. Inspect applied source before updating; send only changed files and preserve hosting/PWA/recovery configuration. If the corrected source is already applied, do not redeploy just to repeat a checkpoint.

`npm run build` writes `public/release.json`. The public verification workflow compares its 35-module normalized source fingerprint with GitHub. The pinned TypeScript canonicalizer excludes only known static host diagnostic labels; non-JSX code remains byte-exact after newline normalization. Meaningful source changes must not be normalized away. This scope is not an assertion that the entire host wrapper or site is identical.

Run public Grand, original-flow and recovery suites after a runtime deployment. Record source SHA, applied snapshot, build version, parity timestamp, artifact IDs and real outcomes. Keep rollback references. Do not state hardware, OBS or accessibility qualification from emulated tests.

## Documentation

```sh
python -m pip install -r scripts/requirements-docs.txt
python scripts/validate_docs.py
```

Update README, PROJECT_STATUS, the documentation index and current evidence after delivery. Preserve historical plans and failed-then-fixed findings. Structural validation is not a browser or art review. Generated evidence can live in Actions artifacts with stable identifiers and report hashes; retain important reports before artifact expiry.

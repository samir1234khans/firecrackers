# Source and deployment receipt

- Branch: `feat/moon-natural-water`, from canonical main `6fe052607c2ea50676d9320c9b66b13e11fa2dfb`.
- Application changes: `90ec25cda44bb68eeb0bbb08110717f24aa049f5`; final shader optimization: `e280c469d32cbed31b4d984f07de7496f484a7c5`. Later commits contain delivery evidence only.
- Review: [PR #25](https://github.com/samir1234khans/firecrackers/pull/25). It remains open for the new moon/water candidate; no merge or production promotion was performed.
- Final Cloudflare preview: https://firecrackers-moon-preview.allygym-api.workers.dev/ . Worker `f7cd640d-e774-44d3-bb16-62b4b012e6cb`; `2026-10-01.1`; source/art SHA-256 `2e9aff20f01bdcbd7c57663d19c442b43b1eb305498795906f39b96048aaafc9`.
- Initial candidate Worker `b0df98e2-45db-43f7-b620-ce3b41af8b9e` and fingerprint `5f74670393c06c0be4cd117b67438e5803f2ccd3ee0b4ce6bcc6f2625b6d1a56` are superseded by the optimized preview. Initial checks/performance receipts are retained alongside final receipts, not relabeled as final-source results.
- Build uses pinned Node 22.16.0, React/TypeScript/Three r180 and Wrangler 4.143.0. Preview publication: `npx wrangler deploy --config wrangler.moon-preview.jsonc` after a qualified production build.
- Final-source local hardware checks: `checks/moon-optimized-*`; final-source hosted checks: `checks/moon-final-*`; exact delivered HTTP byte hashes and fingerprint: `checks/http-final.json`. Baseline/final hardware captures with source fingerprints: `captures/before.json`, `captures/after.json`.
- Required runtime CI runs through the existing reusable Grand Collection workflow on the PR. Push and PR documentation validation run separately. Exact-head CI status and links are available in [PR checks](https://github.com/samir1234khans/firecrackers/pull/25/checks); earlier superseded runtime jobs were cancelled, not passed off as successful.
- Production was rechecked and remains `2026-09-30.8`, Worker `5a577d62-1deb-4770-b780-784d03574c7a`, source/art fingerprint `5a0020b7c9260140d4fff57a6abe97d53f7406dedffc6635c64148facb478535`. Its clean-main deployment and `.7` rollback version remain in the [previous production receipt](../bottom-collection-2026-09-30/PRODUCTION.md).

The final fixed-state PC timing comparison restored CPU submission to approximately baseline. Desktop rAF tails still vary, and physical mobile/Safari/sustained GPU qualification remains open; see [full boundaries](PREVIEW.md). All captures are actual rendered images; none are generated concept art or physical-phone evidence.

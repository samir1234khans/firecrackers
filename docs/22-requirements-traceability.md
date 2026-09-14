# 22 — Requirement traceability

All runtime implementation/evidence status is **planned / unrun** at this documentation baseline. The mapping below makes the plan auditable; it is not a completion checklist with prefilled passes.

| Requirement | Primary specification | Milestone | Tests |
|---|---|---|---|
| FR-01 | 01 product, 07 design | M0/M3 | T-15, T-32 |
| FR-02 | 04 fireworks | M2 | T-01, T-12, T-24 |
| FR-03 | 05 interaction | M1 | T-12, T-13, T-14 |
| FR-04 | 05 interaction | M1 | T-02, T-13, T-14 |
| FR-05 | 04 fireworks, 11 simulation | M1/M2 | T-03, T-05, T-23 |
| FR-06 | 11 simulation, 12 performance | M1/M2 | T-04, T-28 |
| FR-07 | 06 art, 11 simulation | M1/M3 | T-23, T-24 |
| FR-08 | 08 audio | M1/M3 | T-08, T-18, T-25 |
| FR-09 | 08 audio, 14 accessibility | M3 | T-18 |
| FR-10 | 09 director | M2 | T-07, T-16, T-28 |
| FR-11 | 05 interaction, 09 director | M2 | T-07, T-16 |
| FR-12 | 05 interaction, 07 design | M1/M3 | T-14, T-17 |
| FR-13 | 05 interaction, 07 design | M3 | T-11, T-31 |
| FR-14 | 10 architecture, 13 lifecycle | M4 | T-09, T-18 |
| FR-15 | 13 PWA | M4 | T-20, T-21, T-22 |
| FR-16 | 09 display, 13 lifecycle | M4 | T-16, T-18, T-28 |
| FR-17 | 13 lifecycle | M4 | T-15, T-18 |
| FR-18 | 10 architecture, 13 lifecycle | M1/M4 | T-10, T-17, T-19 |
| FR-19 | 13 PWA, 15 assets | M1/M4 | T-20, T-22 |
| FR-20 | 05 interaction, 13 lifecycle | M4 | T-09, T-10, T-17 |
| NFR-01 | 12 performance | M4 | T-27, T-28 |
| NFR-02 | 11 simulation, 12 performance | M1/M4 | T-04, T-07, T-10, T-28 |
| NFR-03 | 10 architecture | M1/M4 | T-19, T-23 |
| NFR-04 | 05 interaction, 14 accessibility | M1/M3/M5 | T-14, T-15 |
| NFR-05 | 14 accessibility | M1/M5 | T-26 |
| NFR-06 | 14 privacy, 18 operations | M5 | T-29 |
| NFR-07 | 11 simulation | M1/M2 | T-03, T-06, T-07 |
| NFR-08 | 13 PWA, 18 operations | M4/M5 | T-20, T-21 |
| NFR-09 | 15 assets | M3/M5 | T-30 |
| NFR-10 | 17 release, 18 operations | M5 | T-32 and complete evidence register |

## Release evidence completion

For the release candidate, extend each row with implementation paths/PR, current status, evidence-record link, reviewer, and residual limitations. Every ID in document 02 must appear exactly once here. Every test reference must exist in document 17. A proposed-default change updates its related specifications and configuration together.

## Documentation consistency checks

Before handing off a baseline: all index links resolve; every requirement maps to a specification/milestone/test; five unique catalog IDs exist; ranges have ordered endpoints; finale children reference supported non-finale families; quality capacities are finite; source-register IDs used in documents exist; and no status file describes planned code or assets as implemented.

Configuration/schema checks only validate planning structure. They cannot validate final shader compilation, resource use, offline behavior, sound rights, or safety.

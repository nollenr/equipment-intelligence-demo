# Checkpoint 7 readout — P09 tracker-controller platform breadth

Date: 2026-08-23 (America/Los_Angeles)

Status: complete and deployed

## Outcome

The demo now proves the equipment-intelligence pattern beyond solar inverters. `TRK-01`, a synthetic `TRC-8` tracker controller at FPL Citrus Solar Energy Center, has an active `P09 — Tracker position deviation` incident with a complete typed-data, document-retrieval, answer-generation, validation, fallback, and provenance path.

Direct route:

`http://44.201.155.216:3000/incidents/30000000-0000-4000-8000-000000000201`

The incident also appears in Fleet Overview, Citrus facility status, and the Monitored Assets register. Fleet Overview now renders a dynamic attention queue rather than a canonical B17-only hero: B17 / `INV-042` and P09 / `TRK-01` each receive an active attention card, while acknowledged A12 / `INV-102` appears in a quieter Investigation Underway row.

## Dynamic Fleet attention queue

- Every `active` incident receives a separate Attention Required card with its equipment code, actual post-fault operating state, fault code, facility, timestamp, summary, and direct investigation link.
- Every `acknowledged` incident appears in a visually quieter Investigation Underway section beneath the active cards.
- Cleared events do not occupy the top queue; they remain available in recent activity.
- The fleet read query returns every active and acknowledged event and limits only cleared history to the latest three. A new active database event therefore appears on the next server-rendered `/fleet` request without a fault-specific component or code change.
- The same reusable incident page continues to adapt by equipment and fault data after a card is selected.

## Product story

The synthetic controller observed a 15.1-degree peak commanded-versus-measured position deviation against a 5.0-degree P09 threshold. Latest commanded angle is 32.0 degrees and measured angle is 18.4 degrees, independently corroborating the stored latest deviation of 13.6 degrees. Drive-motor current peaked at 8.7 amperes against a 7.5-ampere context threshold.

The deterministic rule concludes only that position disagreement exceeded the configured limit and that elevated drive loading was present. It does not diagnose a failed actuator, sensor, drive, linkage, or other component. The UI and both answer paths maintain `Safe Stow Hold`, prohibit entering the movement envelope or commanding motion under the diagnostic step, and direct the user to the approved observation and controlled release process.

## Typed CockroachDB records

- Fault event: `30000000-0000-4000-8000-000000000201`
- Rule: `tracker_position_deviation_p09/v1.0`
- Four typed metric summaries:
  - `tracker_position_deviation`
  - `tracker_commanded_angle`
  - `tracker_measured_angle`
  - `tracker_drive_motor_current`
- Three typed findings per run:
  - `position_deviation_threshold_exceeded`
  - `command_measurement_mismatch_confirmed`
  - `drive_current_context_recorded`
- The seed resolves the existing tracker by the stable `(plant_id, equipment_code)` key; it does not hard-code the random inventory UUID.
- Seed 007 is idempotent and was successfully applied twice.

No migration was required. The existing typed equipment, event, metric, document, retrieval-scope, diagnostic, answer, and provenance tables support the new equipment class without JSON blobs or asset-specific tables.

## Evidence pack

Three visibly synthetic, page-stable sources were authored and rendered:

1. `TRC-8 Operations, Position Feedback & Fault Response Manual`, v2.7, page 3, section `6.3 Fault P09 — Tracker Position Deviation`.
2. `Citrus Tracker-Row Inspection`, v1.4, page 3, section `4.2 Authorized tracker-row inspection`.
3. `Tracker Return-to-Automatic Checklist`, v2.0, page 2, section `3. Return-to-automatic acceptance criteria`.

Every cited PDF page was visually inspected and displays `SYNTHETIC DEMO DOCUMENT · NOT FOR FIELD USE`. The source catalog contains current/approved versions, SHA-256 hashes, exact page/section chunks, exact P09/model/equipment applicability, a Citrus site scope, and Field Technician/Fleet Engineer read permissions.

The PDFs are live under `/evidence/`. All three presenter-facing corporate Google Docs and exact section bookmarks were configured on 2026-08-23 and are recorded in `source-documents/P09_GOOGLE_DOCS_HANDOFF.md`. Citation cards now open those Google Docs; CockroachDB retains the versioned PDF snapshots as stable fallbacks.

## Retrieval and generation

- All nine approved chunks use `text-embedding-3-small`, 1,536 dimensions, and content-addressed embedding metadata.
- The embedding activation added only the three new null vectors: 651 total input tokens.
- Permission resolution occurs before cosine ranking.
- P09 semantic results are intersected with the exact fault/model/equipment-applicable chunk set before generation.
- The strict prompt contract is `p09-tracker-grounded/v1.0` on configurable `gpt-5.6-luna`, low reasoning effort, `store: false`.
- The model sees only the question, typed incident/metric facts, deterministic findings, and the three authorized chunks. It has no tools or database/document-repository access.
- Structured output must contain exactly `direct_answer`, `field_guidance`, and `recommended_action`, with separately validated evidence IDs.
- Application validation enforces intent-specific facts/checks, all three evidence types, release criteria, movement-envelope safety, and no unsupported component-failure/replacement claims.
- If generation fails or validation rejects an omission, one of five question-aware deterministic templates is persisted and presented: diagnosis, inspection, recovery, fleet-history limit, or general evidence limit.

The default diagnosis question completed live with `gpt-5.6-luna` and all three sources. A separate return-to-automatic request omitted a mandatory criterion in model wording, was rejected, and correctly used the complete deterministic recovery answer. That is the intended safety behavior.

## EXPLAIN review

Every P09 application SQL statement was added to `npm run db:explain` and completed successfully:

- The revised fleet attention query buffers the four curated non-history incidents once, retains every active/acknowledged row, and uses a bounded top-3 operation only for cleared history. The current plan estimates four rows and uses primary-key lookups for joined equipment and plant details.
- Incident lookup uses the fault-event primary key, followed by primary-key equipment and plant lookups.
- Metric loading uses `metric_by_fault_idx` with an exact fault-event span.
- Exact evidence retrieval uses the fault-code exact-match index, current/approved version filters, equipment applicability, active scope, principal permission, and deterministic ordering.
- Scoped vector retrieval retains the retrieval-scope prefix and cosine ordering used by the existing corpus.
- Diagnostic-run and answer inserts use CockroachDB insert fast paths with foreign-key checks.
- Multirow finding, metric-source, document-source, and answer-source inserts show bounded values plus primary-key foreign-key constraint checks.

No new index was added for the 60-asset demo dataset. Global fleet queries still produce low-cardinality full scans and some index recommendations; adding indexes for this tiny seed would increase write/schema complexity without material demo benefit. The event and incident-analysis paths use the intended keys/indexes.

CockroachDB design guidance applied:

- UUID primary keys and real foreign keys.
- Typed columns rather than generic JSON.
- Idempotent `INSERT ... ON CONFLICT` seeds.
- Parameterized application SQL.
- Short retry-safe serializable persistence transaction with bounded exponential backoff for `40001`.
- Authorization before vector ranking.
- `EXPLAIN` review for every new application statement.

Rules reference: `C:\Users\RonNollen\.agents\skills\cockroachdb-sql\references\cockroachdb-rules\00-fundamental-principles.md` through `05-operational.md`.

## Validation completed

- Remote TypeScript check and optimized Next.js build passed.
- Seed 007 applied twice without duplicate or conflict errors.
- Vector coverage: 9 approved / 9 embedded, one model, 1,536 dimensions.
- Ten retrieval golden cases pass: four original B17/permission cases, three A12 cases, and three P09 definition/inspection/release cases.
- P09 deterministic diagnosis, inspection, and recovery tests pass.
- P09 default live diagnosis passes the strict generation/citation/safety contract.
- P09 HTTP recovery returns a safe live-or-fallback result with all three citations and complete release criteria.
- The rendered P09 incident was verified to contain all three exact Google document IDs after the owner metadata update and seed replay.
- Fleet Overview smoke assertions verify the exact two-active count, B17 and P09 investigation links, the acknowledged Investigation Underway section, and the A12 link.
- Full browser/application smoke passes fleet, correlation, role boundary, inventory, B17/A12/P09 investigations, four curated incidents, nine evidence snapshots, browser assets, APIs, and the intentionally unsupported C04 `422` path.
- Production listener: `0.0.0.0:3000`, PID `77277` after the dynamic attention-queue deployment. Revalidate from the PID file after any restart.
- Temporary Checkpoint 7 owner environments, including the P09 Google-source update copy, were deleted and their absence verified.

## Suggested manager walkthrough

1. Open Fleet Overview and point out that active B17 and P09 events automatically occupy separate Attention Required cards, while acknowledged A12 is tracked below them.
2. Open `TRK-01 · Tracker position deviation` directly from its attention card.
3. Point out the asset-specific header, Safe Stow Hold state, four tracker metrics, and three authorized sources.
4. Ask: `Why did this tracker enter Safe Stow Hold?`
5. Ask: `What else should I inspect on this tracker row?`
6. Ask: `Can I return this tracker to Automatic Tracking?`
7. Expand the technical proof: vector ranks, exact document versions/pages, deterministic findings, prompt/provider, and persisted run provenance.
8. Return to the fleet and contrast this independent tracker workflow with B17 thermal derating, A12 fan feedback, fleet correlation, and honest unsupported C04.

## Next recommended work

The highest-value next step is a demo rehearsal/reset package: one-click preflight, a concise presenter script, expected responses, failure/fallback narration, and backup screenshots. After that, complete C04 only if a fourth grounded fault type is needed.

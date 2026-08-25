# Checkpoint 6 readout — A12 platform breadth

Date: 2026-08-23  
Status: **A12 is complete, deployed, and independently explorable.**

## Outcome

The existing Babcock Ranch `INV-102` / fault `A12` event is now a second full equipment-health vertical slice rather than a decorative incident card. It has its own typed operational signals, evidence corpus, vector retrieval behavior, deterministic rule, question-intent contract, safety boundaries, live generation path, fallback answers, and persisted CockroachDB provenance.

This is intentionally not a reskin of B17. B17 explains controller thermal derating and can route to fleet/weather correlation. A12 explains cooling-fan command/feedback disagreement, remains in Maintenance Hold, supports exterior inspection guidance, and requires a separate return-to-service acceptance sequence.

Direct route:

`http://44.201.155.216:3000/incidents/30000000-0000-4000-8000-000000000112`

## Synthetic A12 evidence pack

| Evidence | Exact cited section | Page | Current presenter link |
| --- | --- | ---: | --- |
| SD-8400 Cooling System, Operations & Fault Response Manual v3.9 | `8.4 Fault A12 — Cooling Fan Feedback Variance` | 3 | Bookmarked corporate Google Doc |
| Babcock Ranch Inverter Fan-System Inspection v1.6 | `5.2 Authorized fan-system inspection` | 3 | Bookmarked corporate Google Doc |
| Inverter Cooling-System Return-to-Service Checklist v2.4 | `3. Return-to-service acceptance criteria` | 2 | Bookmarked corporate Google Doc |

The three controlled HTML authoring sources, exact text chunks, and PDF snapshots are checked in. Every cited PDF page was visually inspected at original resolution and visibly identifies itself as synthetic/not for field use. CockroachDB stores each version, SHA-256 content hash, page-aware chunk, fault/model relationship, retrieval scope, and snapshot URI.

`scripts/render-a12-source-pdfs.py` regenerates the snapshots and requires Python `reportlab`. `scripts/render-pdf-preview.py` renders a selected page for visual review and requires `pymupdf`. Regenerating a PDF changes its content hash, so always update/reapply seed 006 and rerun the snapshot smoke check after intentional document changes.

The three bookmarked Google Docs were configured on 2026-08-23 through the guarded owner workflow and are recorded in [A12_GOOGLE_DOCS_HANDOFF.md](../source-documents/A12_GOOGLE_DOCS_HANDOFF.md). The incident-page response was verified to contain every exact Google document ID. The immutable PDF snapshots remain the content-hashed fallback and provenance record.

## Typed incident facts and deterministic rule

Seed `006_checkpoint6_a12_evidence.sql` adds the A12 evidence and these incident-window signals:

- peak command/feedback variance: `17.2` percentage points;
- latest variance: `15.9` percentage points;
- configured A12 threshold: `12.0` percentage points;
- latest/maximum fan command: `92.0%`;
- latest fan feedback: `76.1%`;
- peak ambient temperature: `38.2 °C`.

Rule `fan_feedback_variance_a12/v1.0` validates metric completeness and the command/feedback arithmetic, then creates three typed findings:

1. peak variance exceeded the threshold by `5.2` percentage points;
2. latest command `92.0%` versus feedback `76.1%` corroborates the stored `15.9`-point variance;
3. high ambient temperature is context that can increase demand, not proof of causation or component failure.

The rule never converts command/feedback disagreement into an unsupported “failed fan” diagnosis.

## Retrieval and answer behavior

The A12 question classifier supports diagnosis, inspection, recovery/release, fleet-history, and general intents. A12 incident questions no longer enter B17’s fleet/weather workflow merely because they contain fleet-oriented language.

The analysis path resolves exact approved documents for fault A12 and model SD-8400, resolves the active principal’s scopes, embeds the incoming question with `text-embedding-3-small`, ranks only authorized chunks, and intersects vector results with the exact applicable chunk IDs. The LLM sees only the typed facts, deterministic findings, and those three authorized excerpts.

Prompt contract `a12-fan-grounded/v1.0` uses strict Structured Outputs. Application validation requires question-relevant facts and evidence, rejects unknown citations and unsupported failure/replacement claims, and blocks advice to bypass protections, perform energized internal inspection, or release the inverter without the checklist criteria.

If live generation is unavailable or fails validation, a versioned intent-aware deterministic response is persisted and displayed. Recovery answers must keep the asset in Maintenance Hold until the approved disposition is recorded and all stored acceptance criteria are met: command at or above `80%`, variance at or below `5` percentage points for ten continuous minutes, stable feedback, no new A12, and control-room authorization.

## CockroachDB persistence and SQL validation

Every run is stored in one short retry-safe transaction with:

- diagnostic run and question;
- three deterministic findings;
- four exact metric-source links;
- three exact document/chunk/version/scope links with vector rank, distance, and embedding model;
- answer, recommendation, provider/model/prompt/fallback metadata, duration, and exact answer-source links.

All new application SQL was validated with CockroachDB `EXPLAIN` before deployment:

- the A12 evidence query is distribution-local and uses indexed spans for exact A12/SD-8400 relationships plus indexed asset/model lookup;
- the diagnostic-run and answer inserts use insert fast paths with foreign-key checks;
- finding, metric-source, document-source, and answer-source inserts use values-to-insert plans with foreign-key checks.

Full live output is stored on EC2 at:

`/home/ec2-user/.local/state/nextera-demo/checkpoint6-explain.log`

The optimizer offered optional covering-index replacements for several tiny catalog lookups. They were deferred because this six-chunk synthetic corpus already uses selective exact spans and the extra indexes would add write/storage cost without a meaningful demo benefit. Revisit them only if the catalog becomes materially larger or observed latency warrants it.

### Google Docs metadata completion

Each supplied bookmark was applied with the guarded, parameterized primary-key update below and immediately verified by exact version ID plus URL:

```sql
-- $1 = validated HTTPS Google Docs bookmark; $2 = document-version UUID
UPDATE nextera.document_versions
SET source_uri = $1
WHERE id = $2
RETURNING id, source_uri;
```

For all three versions, `EXPLAIN` reported `distribution: local`, estimated one row, and a single exact span on `document_versions@document_versions_pkey` with `FOR UPDATE` locking. The verification plan used the same primary-key span and a key lookup join to `documents`. The optimizer suggested a covering index beginning with `source_uri`; it was not added because this guarded workflow always has the UUID primary key, the table has only six demo versions, and the extra index would add unnecessary write/storage overhead. The exact URLs are also present in idempotent seed 006 so a controlled reset preserves the handoff.

## Validation completed

- TypeScript typecheck and Next.js production build passed.
- A12 generation-contract tests passed.
- Persisted deterministic diagnosis, inspection, and recovery runs passed with the exact three A12 sources.
- Live source-level A12 generation passed with `gpt-5.6-luna`, no fallback, and all three vector sources.
- End-to-end HTTP A12 recovery passed with a live evidence-constrained answer.
- Seven golden retrieval cases passed. A12 definition ranks the OEM manual first, inspection ranks the Babcock procedure first, and maintenance release ranks the return-to-service checklist first.
- The complete B17 live-generation regression passed after adding the broader corpus; B17 remained restricted to its applicable OEM and Manatee chunks.
- Fleet-correlation regression passed.
- The full product smoke suite passed fleet, role boundaries, inventory, B17, A12, all six evidence snapshots, browser assets, APIs, and the honest unsupported C04 path.
- The final A12 PDF snapshots and their CockroachDB SHA-256 values were resynchronized after visual inspection.

## Deployment and remaining work

The production application is listening on `0.0.0.0:3000`; the last verified process after this checkpoint was PID `69032`. Revalidate the PID file after any restart.

The meaningful follow-ups are:

1. review the A12 story in the browser using diagnosis, inspection, and release questions;
2. if not already done, validate all three Google Docs from a second Cockroach Labs account;
3. prepare the rehearsal/reset runbook and compact architecture visual;
4. decide whether C04 needs the same full treatment before the customer demo.

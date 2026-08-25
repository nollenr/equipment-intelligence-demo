# Checkpoint 2 Readout — Deterministic Diagnosis and Real Evidence

Date: 2026-08-23 (America/Los_Angeles)

## Outcome

The canonical `INV-042 / B17` investigation is now a working vertical slice rather than a UI placeholder. A field technician can submit the suggested question, receive a deterministic analysis derived from the stored metric window, inspect three typed findings, follow a bounded recovery recommendation, and open the two exact authorized citations. The question, result, timings, findings, metrics, document chunks, retrieval scopes, and answer-source relationships are persisted in CockroachDB.

This checkpoint intentionally does **not** use an LLM or embeddings. It proves the engineering rule, document/version model, authorization boundary, citation trail, and product interaction first. Embeddings and permission-aware semantic retrieval remain Checkpoint 3; evidence-constrained generation remains Checkpoint 4.

All facility-adjacent events, equipment, readings, documents, and conclusions in this demo are synthetic. Public facility names are used only for demo relevance.

## Presenter flow

1. Open `http://44.201.155.216:3000/incidents/30000000-0000-4000-8000-000000000017` while the EC2 security-group rule includes the presenter's IP.
2. Review the incident facts: controller peak `78.4 °C`, structured threshold `75.0 °C`, ambient peak `36.8 °C`, and latest output `64% rated`.
3. Keep or edit the technician question and select **Analyze incident** / **Run again**.
4. Show the completed analysis, three findings, recovery recommendation, response time, and high-evidence explanation.
5. Open either evidence card. Until the corporate Google Docs are configured, the link opens the exact cited PDF page.
6. Use **Under the hood** to show the resolved plant/equipment/event, historian-like source, rule version, diagnostic run, and sufficient-evidence state.
7. Point out that the engineering-only fleet bulletin was excluded for the Field Technician persona before the analysis ran.

The UI balance remains intentionally about 75% believable field product and 25% technical proof.

## Evidence pack

Three controlled authoring sources live in `source-documents/`; their stable citation snapshots live in `public/evidence/`.

| Source | Version | Pages | Cited section | Scope | PDF SHA-256 |
| --- | --- | ---: | --- | --- | --- |
| HPS-2500X Installation, Operations & Maintenance Manual | 4.2 | 3 | p. 3, §7.3 Fault B17 | Fleet operations | `3201f077368d4267fae09780aff83bcabb09c83eedf7ea95c549fa4735d79052` |
| Manatee Inverter Cooling-System Inspection | 2.1 | 3 | p. 2, §4.2 Authorized inspection sequence | Manatee operations | `60a9a61dff097383493f7d928d0247b463a3b0cf37608698db2ecf8b4a43a2a9` |
| B17 Events During High-Ambient Operation | 1.3 | 2 | p. 2, §2 Fleet pattern | Engineering restricted | `16b641821d0f20a8bed4e983dc94ba6851d688141d5e1a544529a5806f4965b8` |

The PDFs and HTML sources are visibly labeled **Synthetic demo source — not for field use**. The content avoids pretending that temperature/weather alone establishes fan failure, contamination, or a failed controller.

The exact approved chunk text is also stored under `source-documents/chunks/`. Each chunk has a page range, section heading, source anchor, content hash, retrieval scope, and exact B17/model/equipment relationships. Embedding values are deliberately null at this checkpoint.

## Google Docs decision and handoff

Google Docs, not S3, is the intended presenter-facing source system. The planned sharing policy is **Viewer — Anyone at Cockroach Labs with the link**. This allows an internal presenter to open a citation with their corporate Google account while the EC2 security group independently controls access to the application.

CockroachDB stores a canonical `source_uri` plus the stable `snapshot_uri`. The UI prefers `source_uri`; when it is null it automatically opens `snapshot_uri#page=N`. All three corporate Google Docs were created, shared, visibility-tested, bookmarked at their cited sections, and configured on 2026-08-23. Both Field Technician evidence cards now open Google Docs; the engineering-only bulletin link remains available only to its authorized scope. The PDF snapshots remain immutable version/page artifacts and automatic fallbacks.

The owner-only `npm run db:document-source` command validates the document-version UUID and bookmark URL, displays the CockroachDB update/verification plans, requires an explicit confirmation variable to write, and supports verification-only runs. The bulletin value was verified again after a complete idempotent reseed.

See `source-documents/GOOGLE_DOCS_HANDOFF.md` for the exact titles, bookmarks, sharing test, and metadata field to update. S3 remains an optional archive and is not a Checkpoint 2 dependency. A read-only EC2 check found neither configured AWS CLI credentials nor an instance role, and no S3 resources were created or changed.

## CockroachDB changes

Migration `006_google_docs_source_metadata.sql`:

- makes the legacy S3 bucket/key fields optional;
- adds `document_versions.source_uri`, `source_version_id`, and `snapshot_uri`;
- enforces that every version has a Google/source URI, a snapshot URI, or a complete S3 bucket/key pair;
- prevents half-populated S3 metadata;
- adds `document_chunks.source_anchor`.

Seed `004_checkpoint2_b17_evidence.sql` idempotently loads:

- 3 documents and 3 approved current versions;
- 3 page-aware chunks;
- 3 exact B17/model links;
- 3 model/equipment applicability links.

Existing field-technician retrieval permissions authorize the fleet-operations OEM chunk and Manatee site-procedure chunk. They do not authorize the engineering-restricted bulletin. The application retrieval statement starts from the active principal's `read` permissions and authorized scopes, then applies document approval/current-version, exact fault/model, and equipment applicability conditions. Restricted content is never fetched and hidden later.

The reset script now removes diagnostic/provenance rows and Checkpoint 2 evidence in dependency order before deleting the foundational scopes and operational data.

## Deterministic analysis

`thermal_derating_b17/v1.0` performs these checks in application code:

1. Validate the question and resolve the requested incident.
2. Refuse non-B17 incidents.
3. Require controller-temperature, active-power-output, and ambient-air-temperature summaries.
4. Require a numeric controller threshold and confirm `maximum controller temperature > threshold`.
5. Retrieve evidence already authorized for the Field Technician principal.
6. Require both an approved OEM source and the approved site procedure.
7. Calculate `78.4 - 75.0 = 3.4 °C` deterministically.
8. Produce three findings: threshold exceeded, protective derating confirmed, and high-ambient context recorded.
9. Produce a bounded recommendation based only on the typed metrics and two retrieved excerpts.
10. Persist the complete result and reload it for the response.

The `high evidence` label is an application validation state, not model self-confidence. Its basis is visible in the UI: required metrics are complete, the OEM threshold check passed, two exact-match sources are approved and authorized, and no conflicting procedure was retrieved.

## Transaction and provenance design

Each completed analysis uses one short explicit transaction with eight grouped, parameterized statements:

1. diagnostic run;
2. three findings in one set-based insert;
3. three metric-source links in one set-based insert;
4. two document-source links in one set-based insert;
5. analysis answer;
6. answer-to-document links;
7. answer-to-metric links;
8. answer-to-finding links.

All computation, authorization retrieval, question validation, and UUID creation happen before the transaction. No external API or user interaction occurs inside it. The client retries only CockroachDB serialization errors (`SQLSTATE 40001`), with bounded exponential backoff and jitter, for at most four attempts.

The runtime identity remains `nextera_app`; it can read application data and write only the diagnostic/provenance tables. The setup owner remains separate.

## Application changes

- `POST /api/incidents/{faultEventId}/analysis` runs the B17 rule and returns the persisted result with HTTP `201`.
- The B17 incident route now uses a client interaction for an editable question, progress/error state, rerun behavior, and live persisted results.
- Result content includes timing, evidence sufficiency, answer, recommendation, findings, citations, and technical provenance.
- Evidence cards use the Google Doc URL when configured and otherwise the cited PDF page.
- A12 and C04 preserve their fault-aware placeholder experiences. Their analysis endpoint returns HTTP `422` before opening a persistence transaction.
- The latest completed B17 run is server-rendered on reload, so a successful result survives a browser refresh or application restart.

The presentation capture is `docs/checkpoint2-b17-analysis.png` at 1440 × 1440.

## Query-plan review

All new production SQL was run through CockroachDB `EXPLAIN` under the restricted runtime identity.

- Authorized available-evidence retrieval is local, uses the exact fault-link index, joins permissions/scopes before chunks, and returns 2 rows for the Field Technician.
- Latest-analysis retrieval is local and uses the fault-run index plus the principal and answer indexes.
- Findings use the diagnostic-run index.
- Persisted document sources use the run index followed by primary-key lookups.
- The eight writes use local values/buffer operators, uniqueness checks, and foreign-key checks; the run and answer inserts use the insert fast path.

The optimizer suggested several covering indexes for the tiny evidence catalog. They were not added: three documents do not justify extra write/storage overhead, and the current plans are local and fast. Re-evaluate after the corpus is materially larger.

The seed upserts were also explained before execution. All five seed statements planned locally with primary-key conflict checks and required foreign-key validation.

## Validation evidence

Completed successfully on the target CockroachDB Standard cluster and EC2 host:

- owner migration and idempotent seed;
- restricted-role TypeScript typecheck;
- production Next.js build;
- complete application `EXPLAIN` suite;
- evidence PDFs served with HTTP `200`;
- live B17 POST followed by persisted SSR reload;
- A12 and C04 analysis requests rejected with HTTP `422`;
- updated fleet/inventory/three-incident/evidence/API smoke suite.

The first recorded B17 test result was:

- status: `completed`;
- findings: `3`;
- authorized document sources: `2`;
- evidence: `high`;
- measured application response duration: `73 ms`.

That 73 ms is one observed deterministic application/database run. It is not an LLM latency result, a benchmark, an SLA, or a production-performance claim.

## Live deployment state

- EC2 source: `/home/ec2-user/nextera-demo`
- listener: `0.0.0.0:3000`
- live process PID at completion: `48350` (revalidate after any restart)
- browser entry: `http://44.201.155.216:3000/fleet`
- application access: EC2 security-group source-IP rule
- database secret: mode-0600 runtime environment outside the repository
- Google Docs: all three created/shared/tested, cited-section bookmarks configured, and CockroachDB metadata verified after reseeding
- OpenAI API key: not supplied or required for Checkpoint 2

## Remaining limitations

- Google Docs availability still depends on the presenter's Cockroach Labs Workspace authentication and the documents' corporate sharing policy; PDF snapshots remain the fallback.
- No embeddings have been generated and no vector similarity query is used.
- No external generation model is called; the answer is deterministic template output.
- Only B17 has an implemented analysis rule. A12 and C04 are deliberate breadth placeholders.
- Authentication is represented by a fixed demo principal rather than an interactive login.
- Port 3000 is direct HTTP and should remain restricted to explicit presenter IPs.

## Next work

1. Begin Checkpoint 3 by embedding all three chunks and representative technician questions with the same `text-embedding-3-small` model/configuration.
2. Store embedding provider/model/dimensions/version metadata and create a small golden retrieval set.
3. Prove that scope filtering happens before similarity ranking and that the engineering bulletin cannot appear for the Field Technician.
4. Add the similarity results to the existing evidence/provenance view before introducing generation.

Do not broaden the corpus or add a live LLM until that authorized retrieval path is proven.

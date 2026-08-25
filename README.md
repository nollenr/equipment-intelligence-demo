# NextEra Equipment Intelligence Demo

This repository contains a synthetic equipment-health demonstration for NextEra conversations. CockroachDB is the application data, knowledge, retrieval, and provenance layer; it is not presented as a replacement for a plant historian or document repository.

All plant-adjacent incidents, equipment identifiers, readings, documents, and conclusions are synthetic. The public facility name is used only for demo relevance.

> **Repository handling:** Keep this repository private and limited to authorized Cockroach Labs collaborators. It contains internal account context, supplied design artifacts, corporate Google Docs identifiers, and deployment details even though committed credentials are prohibited.

## Current state: Checkpoint 7 tracker-controller platform breadth

Checkpoints 0–6 established the connected foundation, walking product, two independent incident investigations, synthetic evidence corpus, authorized vector retrieval, evidence-constrained live answer paths, and role-bound fleet-correlation story:

- TypeScript tooling runs on the AWS EC2 host.
- CockroachDB setup and runtime roles are separate.
- Versioned migrations create the operational, knowledge, and diagnostic schemas.
- An idempotent seed loads the Manatee / INV-042 / B17 incident.
- A restricted application login can run health and incident queries but cannot alter the schema.
- Every application `SELECT` has a checked CockroachDB `EXPLAIN` plan.
- A presentation-ready fleet overview and incident investigation route render live relational data.
- Fleet Overview has a data-driven attention queue: every `active` incident receives its own asset/state-aware attention card and direct investigation link, `acknowledged` incidents appear in a quieter Investigation Underway section, and only cleared incidents remain exclusively in recent activity. The query returns all open incidents and limits only cleared history, so newly added active events appear without UI code changes.
- Matching `/api/fleet` and `/api/incidents/{id}` endpoints use the restricted runtime identity.
- The synthetic fleet contains 3 public facility names and 60 fictional assets (20 per facility) across 4 equipment types. The operational queue retains 3 curated incidents; 8 additional cleared B17 events and 16 typed metric windows are isolated as fleet-correlation history.
- Selecting the Monitored Assets KPI opens a live register with facility, asset-type, status, and text filters plus sortable operational columns.
- B17, A12, P09, and C04 investigations are fault- and metric-aware: each route presents its own operational facts, question, state, and evidence status.
- B17 runs `thermal_derating_b17/v1.0`, a deterministic metric rule that produces three typed findings and a recovery recommendation from the stored incident window.
- The OEM manual, Manatee inspection procedure, and engineering bulletin are visibly synthetic authored sources with versioned, page-stable PDF snapshots.
- CockroachDB catalogs their versions, hashes, page-aware chunks, exact fault/model/equipment relationships, retrieval scopes, and permissions.
- Current document ingestion is intentionally curated: the exact checked-in `.txt` excerpts are inserted by versioned seed SQL, and the embedding worker reads `document_chunks.content_text` from CockroachDB. The application does not parse or fetch the Google Docs, HTML sources, or PDFs when a question is asked.
- The Field Technician query retrieves two approved sources; the engineering-only fleet bulletin is excluded before analysis and is visibly identified as restricted.
- Each B17 run persists its question, timings, findings, metric sources, document sources, answer, and exact provenance links in one short retry-safe transaction.
- The incident screen reloads the persisted analysis and opens the exact cited source. All three corporate Google Docs and cited-section bookmarks are configured; both Field Technician evidence cards now open Google Docs, while checked-in PDFs remain stable fallbacks.
- A12 is a second complete vertical slice for `INV-102`: `fan_feedback_variance_a12/v1.0` evaluates command/feedback disagreement, maintains the asset in Maintenance Hold, and supports separate diagnosis, exterior-inspection, and return-to-service questions.
- Its OEM cooling manual, Babcock inspection procedure, and release checklist are cataloged as three additional page-stable synthetic sources. All three presenter-facing corporate Google Docs and cited-section bookmarks are configured, with content-hashed PDF snapshots retained as fallbacks. Their evidence-constrained live path never promotes A12 into an unsupported failed-fan diagnosis or an unsafe release recommendation.
- P09 is a third complete vertical slice on a different asset class: Citrus `TRK-01`, a synthetic `TRC-8` tracker controller. `tracker_position_deviation_p09/v1.0` validates position deviation against commanded/measured angles and records elevated drive current only as context. The scenario remains in Safe Stow Hold, enforces a movement-envelope safety boundary, and supports diagnosis, exterior observation, and controlled return-to-automatic questions.
- Its TRC-8 manual, Citrus tracker-row inspection, and return-to-automatic checklist add three more approved, page-stable synthetic sources. All three corporate Google Docs and cited-section bookmarks are configured and documented in `source-documents/P09_GOOGLE_DOCS_HANDOFF.md`; content-hashed PDFs remain stable fallbacks.
- C04 remains the one honest unsupported scenario: its analysis endpoint returns `422` and creates no result.
- All nine approved chunks have real OpenAI `text-embedding-3-small` embeddings stored in CockroachDB at 1,536 dimensions with content-addressed version metadata.
- Incoming questions use the same embedding configuration. Permission-first, per-scope cosine retrieval ranks only evidence authorized for the selected demo principal.
- Ten golden cases prove B17, A12, and P09 question relevance plus the Field Technician/Fleet Engineer boundary for the restricted bulletin. A12 and P09 each rank a different source first for definition, inspection, and release questions.
- Live B17 analysis uses the OpenAI Responses API with configurable default model `gpt-5.6-luna`, low reasoning effort, `store: false`, and strict Structured Outputs.
- The model sees only typed incident facts, deterministic findings, and the two evidence chunks already authorized and ranked by the application. It has no database, document-repository, retrieval, or tool access.
- Prompt contract `equipment-health-grounded/v1.1` classifies B17 questions as diagnosis, inspection, recovery, fleet history, or general/unsupported and requires a direct answer rather than the same diagnosis for every question.
- Application validation rejects unknown citations, fabricated citation markers, missing evidence relationships, omitted question-specific checks/criteria, and unsupported failure/replacement claims before persistence or display.
- Application code appends an explicit scope statement to every answer: the two authorized excerpts support B17 thermal/cooling guidance but cannot provide a complete inverter-health assessment or rule out unrelated conditions.
- Successful runs persist provider/model/prompt version, vector ranks/distances, embedding model, exact evidence links, actual duration, and `included_in_generation`; failures select and clearly record an intent-aware deterministic fallback rather than a single canned response.
- The UI visibly distinguishes live OpenAI generation, fallback, and earlier deterministic answers, and labels the current question focus while retaining the 75% field-product / 25% technical-proof balance.
- The EC2 production listener binds to `0.0.0.0:3000`; the EC2 security group must restrict port 3000 to the user's current public IP.
- `/fleet/correlation` compares 8 same-model B17 events across 3 facilities in the 30 days before INV-042. Six occurred at or above the 35 °C engineering context threshold and two below it; the application always labels this as association, not causation.
- A server-enforced role switch leaves the structured event set visible to the Field Technician but withholds the engineering-restricted analysis. `POST /api/fleet/correlation` returns HTTP 403 for `field-tech-demo` and succeeds only for `fleet-engineer-demo`.
- Fleet Engineer questions use permission-first vector retrieval of the restricted bulletin plus strict `gpt-5.6-luna` Structured Outputs. The first live test completed without fallback and persisted the 8 exact event records, 16 metric rows, 3 findings, 1 restricted document chunk, and the answer/citations.
- Historical comparator events are excluded from the main incident queue and latest-activity inventory query, keeping the three curated incident screens distinct from the analysis dataset.
- The upper-right persona control is interactive on every product page. It stores a validated global demo role through `POST /api/persona`, so `/fleet/correlation` uses one stable URL and immediately renders the correct role-bound state after switching.
- Fleet Intelligence is exposed as an above-the-fold fleet-header action and a larger `New` product card.
- B17 questions classified as fleet history on the incident page are handed to `/fleet/correlation` with the original question preserved. Fleet Engineer handoffs run the grounded correlation automatically; Field Technician handoffs retain the restricted engineering boundary while still showing the comparison event facts.

## Commands

The commands require `DATABASE_URL` in the process environment. Never place the URL in this repository, shell history, logs, or documentation.

Owner-only setup commands use the `ron` setup identity:

```bash
npm ci
npm run typecheck
npm run db:owner-setup
```

Runtime validation commands use the restricted `nextera_app` identity:

```bash
npm run db:health
npm run db:incident
npm run db:explain
npm run db:vector-provenance
```

The reset is intentionally guarded:

```bash
CONFIRM_DEMO_RESET=YES npm run db:reset
```

`scripts/provision-app-identity.sh` creates or rotates the restricted `nextera_app` SQL login without printing its password and writes the runtime URI to a mode-0600 file outside the repository on EC2.

On the validated EC2 host, run a runtime command without exposing that URI:

```bash
./scripts/run-with-runtime-env.sh npm run db:incident
```

Build and run the walking product on EC2:

```bash
npm ci
npm run typecheck
./scripts/run-with-runtime-env.sh npm run build
./scripts/start-demo-with-openai.sh
./scripts/smoke-test.sh
```

The start script writes only process state/logs outside the repository under `~/.local/state/nextera-demo`. Use `./scripts/stop-demo.sh` to stop it. Never run `npm run build` underneath a live Next.js process and leave that process serving the replaced `.next` directory: restart immediately after a production build.

For Checkpoints 3 and 4, start the server with a fresh OpenAI API key through the silent terminal prompt:

```bash
./scripts/start-demo-with-openai.sh
```

Paste the key and press Enter. The prompt disables terminal echo, so the value is not displayed or placed in shell history. The key is exported only to the launched process tree; it is not written to the repository, an environment file, or the server log. An ordinary stop/restart requires entering the key again.

Use `./scripts/build-and-restart-from-running-env.sh` for a controlled production replacement while the current process is healthy. It builds and immediately invokes `restart-demo-from-running-env.sh`, which reads only `OPENAI_API_KEY` from the recorded process, exports it to the replacement process, and never displays or persists it. The EC2 login boundary therefore remains important. The smoke test requests every Next.js JavaScript/CSS asset referenced by the canonical incident page, preventing an HTML-only health check from missing a mixed-build deployment.

To idempotently embed the approved corpus, run the golden retrieval suite, start the server, and smoke-test it with one silent prompt:

```bash
./scripts/activate-checkpoint3.sh
```

The dedicated `nextera_embedder` URI is held in a separate mode-0600 EC2 file and loaded by `scripts/run-with-worker-env.sh`. A process environment is not a defense against administrators or other processes running as the same operating-system user, so EC2 login access must remain restricted.

Checkpoint 4 validation commands:

```bash
npm run test:generation-contract
./scripts/run-with-runtime-env.sh npm run db:explain
npm run smoke:adversarial-generation
./scripts/run-with-runtime-env.sh npm run smoke:fallback-analysis
npm run smoke:live-generation
npm run smoke:inspection-generation
npm run smoke:question-safety
./scripts/smoke-test.sh
```

Checkpoint 5 adds:

```bash
npm run smoke:fleet-correlation
./scripts/run-with-runtime-env.sh npm run db:explain
./scripts/smoke-test.sh
```

The fleet-correlation smoke test verifies the 8/3/6/2 event counts, real HTTP 403 role boundary, live or safe fallback answer contract, causality language, restricted source scope, and persisted event/document provenance.

Checkpoint 6 adds:

```bash
npm run test:a12-generation-contract
./scripts/run-with-runtime-env.sh npm run db:explain
./scripts/run-with-running-openai-env.sh ./scripts/run-with-runtime-env.sh npm run db:retrieval-golden
./scripts/run-with-runtime-env.sh npm run smoke:a12-fallback-analysis
npm run smoke:a12-live-generation
npm run smoke:a12-http
./scripts/smoke-test.sh
```

The A12 suite verifies intent-specific answers, metric arithmetic, exact fault/model evidence intersection, source ranking, release criteria, safety boundaries, deterministic fallback, live generation, and persisted provenance.

Checkpoint 7 adds:

```bash
./scripts/run-with-runtime-env.sh npm run db:explain
./scripts/run-with-running-openai-env.sh ./scripts/run-with-runtime-env.sh npm run db:retrieval-golden
./scripts/run-with-runtime-env.sh npm run smoke:p09-fallback-analysis
npm run smoke:p09-live-generation
npm run smoke:p09-http
./scripts/smoke-test.sh
```

The P09 suite verifies typed tracker metrics and arithmetic, exact fault/model/equipment evidence intersection, definition/inspection/release source ranking, movement-envelope safety, return-to-automatic criteria, live generation, conservative fallback, and persisted provenance.

`OPENAI_GENERATION_MODEL` optionally overrides `gpt-5.6-luna`. `NEXTERA_GENERATION_MODE=deterministic` forces the fallback path for a controlled presentation test; live mode is the default.

Migration files are forward-only. Keep schema changes small and idempotent where CockroachDB DDL may outlive a failed multi-statement migration attempt, especially vector-index creation. Never edit a migration after its checksum has been recorded.

## Repository layout

```text
db/
  bootstrap/   Non-secret database roles
  migrations/  Forward-only schema and privilege migrations
  queries/     Human-readable application query references
  reset/       Explicitly scoped canonical-scenario reset
  seeds/       Idempotent synthetic data
scripts/       Secret-safe EC2 helpers
src/           TypeScript database commands and query definitions
```

See `docs/CHECKPOINT_7_READOUT.md`, `source-documents/GOOGLE_DOCS_HANDOFF.md`, `source-documents/A12_GOOGLE_DOCS_HANDOFF.md`, `source-documents/P09_GOOGLE_DOCS_HANDOFF.md`, `NEXTERA_DEMO_CONTEXT.md`, and `NEXTERA_DEMO_BLUEPRINT.md` for the deployed product, evidence handoffs, test results, rationale, and recovery context.

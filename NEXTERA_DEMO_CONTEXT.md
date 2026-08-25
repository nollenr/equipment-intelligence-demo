# NextEra Equipment Intelligence Demo — Project Context

Last updated: 2026-08-24 (America/Los_Angeles)

Status: **Checkpoint 7 is complete and deployed.** The demo now has four working end-to-end stories: question-aware B17 thermal derating, 30-day same-model B17/weather association for the Fleet Engineer, independent A12 cooling-fan command/feedback, and a non-inverter P09 tracker position-deviation investigation. All use permission-first CockroachDB retrieval, strict `gpt-5.6-luna` Structured Outputs, safe deterministic fallbacks, exact persisted event/metric/document/finding provenance, and corporate Google Docs citations backed by versioned PDF snapshots. C04 remains the one intentionally unsupported incident.

## Purpose of this document

This is the durable recovery document for the NextEra demo project. It is intentionally detailed so that the project can be resumed after VS Code closes, the laptop reboots, the conversation is compacted, or a new Codex session starts.

At the beginning of a future session, read this file plus the three source artifacts listed below before making design or implementation decisions. Update this file whenever an important decision, credential-independent environment detail, milestone, or blocker changes.

Do **not** put passwords, private keys, database connection strings, API tokens, or other secrets in this document or in source control.

## User request and working relationship

The user has been asked to "be prepared with a demo" for NextEra. There is no confirmed Monday deadline and no requirement to copy an existing coworker demo. The assignment is intentionally open-ended: create something that approximates the architecture and use case in the supplied document and is credible in a NextEra conversation.

The user has a faint idea of the desired end product and knows how they would traditionally have worked toward it, but wants to take fuller advantage of AI. Codex should therefore behave as a collaborative product designer, solution architect, synthetic-data author, developer, tester, and documentation partner. The user can steer at a product/editorial level without needing to specify every implementation detail in advance.

The recommended workflow is:

1. Turn ambiguity into a concrete demo blueprint.
2. Show the user artifacts early (story, wireframes, screenshots, sample data/docs).
3. Let the user react and steer.
4. Build a narrow working vertical slice.
5. Iterate toward polish and technical credibility.
6. Maintain this recovery context continuously.

## Non-negotiable environment and operational constraints

- Build and run the demo infrastructure in **AWS**.
- Amazon Bedrock is not available in the shared AWS account. The approved exception is to call the OpenAI API from the server-side application running on EC2 for embeddings and evidence-constrained answer generation.
- OpenAI credentials use a dedicated project service-account key entered interactively on EC2. `scripts/start-demo-with-openai.sh` prompts with terminal echo disabled and exposes the key only to the running server process tree; `scripts/run-with-openai-env.sh` provides the same behavior for future embedding/worker commands. The key is never stored in the repository or a persistent environment file. Ordinary restarts require re-entry; `scripts/restart-demo-from-running-env.sh` supports a controlled same-host build replacement by transferring only the key from the recorded live process to its replacement without displaying or persisting it.
- The user's laptop is for VS Code, reviewing code/documents, chatting with Codex, and initiating remote access. It is not the intended application runtime.
- **Do not run PowerShell.** It triggers a security alert for the user.
- Avoid local execution when an AWS/Linux equivalent is available.
- The AWS Linux instance address and local PuTTY key path are recorded in the validated-environment section below; revalidate the current address after an instance stop/start.
- Use PuTTY's `plink` for SSH interaction with the AWS Linux instance.
- Prefer non-interactive, repeatable Linux commands and scripts on the remote instance.
- Never echo or persist private-key material, passwords, tokens, or full connection strings in logs, documentation, chat summaries, or committed files.
- Record a key's local path only if needed; never copy the key contents into this project.
- No customer operational data is currently available. All demo operational data and engineering documents must be synthetic unless explicitly supplied later.
- Publicly documented NextEra plant/facility names may be used for relevance after verification, but all equipment identities, incidents, readings, documents, and conclusions must be labeled synthetic/illustrative.

## Current implementation environment (validated 2026-08-23)

- EC2 public IP: `44.201.155.216` (current address; revalidate if the instance is stopped/restarted).
- SSH user: `ec2-user`.
- Local PuTTY key path: `C:\Users\RonNollen\Documents\Key-Pairs\nollen-cockroach-revenue-us-east-1-kp01.ppk`.
- `plink` authentication to the instance has been validated successfully. Never copy the PPK contents into this workspace or chat.
- Operating system: Amazon Linux 2023 (`2023.12.20260817`), Linux x86_64.
- Host capacity observed: 2 vCPUs, approximately 7.6 GiB RAM, no swap, and a 500 GiB root volume with approximately 494 GiB free.
- Remote tools present: Git 2.50.1, CockroachDB CLI v26.2.5 at `/usr/local/bin/cockroach`, Node.js v24.19.0 LTS, and npm v11.17.0. Node/npm are installed under `/home/ec2-user/.local` rather than through the outdated Amazon Linux Node.js 18 package.
- Docker is not installed. The Checkpoint 1 web application runs directly under Node.js; containerization remains later deployment-hardening work rather than a requirement for the walking shell.
- The local workspace is now a Git repository on branch `main`; no commit was created automatically. `/home/ec2-user/nextera-demo` is a deployed runtime copy, not a Git repository. The local `.gitignore` contains an exact `keys.sh` rule.
- Application source is deployed at `/home/ec2-user/nextera-demo`.
- CockroachDB connection material is stored locally in `keys.sh`; record only variable names/locations, never values. The URI targets the `nextera_demo` database. The file is ignored by the local `.gitignore` and was verified to contain LF rather than CRLF line endings on 2026-08-22.
- **Resolved credential incident:** the initial validation attempt encountered CRLF characters in the sourced shell variables, and the CockroachDB CLI printed the full URI in its error output. The exposed `ron` SQL password was rotated, `keys.sh` was updated and saved with LF line endings, and a guarded connection probe then succeeded. Do not repeat or recover the retired credential.
- EC2 placement was verified through IMDS as AWS region `us-east-1`.
- CockroachDB connection identity: database `nextera_demo`, SQL user `ron`.
- CockroachDB server: CCL v26.2.5; cluster version setting `26.2`.
- Cluster regions: `aws-us-east-1`, `aws-us-east-2`, and `aws-us-west-2`.
- `nextera_demo` is already configured with primary/only database region `aws-us-east-1` and `SURVIVE ZONE FAILURE`, aligning with the EC2 region. No database-region change is needed for the initial demo.
- `nextera_demo` contains a dedicated `nextera` schema with 21 application tables plus `schema_migrations`; eight migrations are recorded. Migration 008 adds exact diagnostic-to-fault-event provenance for fleet comparisons.
- Vector capability is validated: `VECTOR` values and cosine distance (`<=>`) execute successfully, and `feature.vector_index.enabled` is `true`.
- `document_chunks` includes `VECTOR(1536)` and a prefix vector index on `(retrieval_scope_id, embedding vector_cosine_ops)`. All nine approved B17/A12/P09 chunks now have current `text-embedding-3-small` vectors plus provider/model/dimension/content-addressed version metadata.
- Row-level-security support is present in this v26.2 cluster (`pg_catalog.pg_policies` is available). Explicit retrieval-scope permissions exist now; RLS policies remain a later defense-in-depth decision.
- Database identities now separate setup from runtime: `ron` owns/setup-migrates; `nextera_app` inherits read access plus insert/update only on diagnostic/provenance tables. Runtime schema creation and operational deletion were explicitly denied in tests.
- The generated `nextera_app` runtime URI was never displayed and is stored only at `/home/ec2-user/.config/nextera-demo/db.env` with mode `0600` on EC2.
- Checkpoint 3 adds least-privilege role `nextera_embedding_worker` and login `nextera_embedder`. Its generated URI was never displayed and is stored separately at `/home/ec2-user/.config/nextera-demo/worker.env` with mode `0600`. The temporary owner-environment copy used for provisioning was deleted and its absence verified.
- CockroachDB error output continues to be suppressed or filtered when it could contain a URI/password.
- Full Checkpoint 0 results and migration lessons are recorded in `docs/CHECKPOINT_0_READOUT.md`.
- Checkpoint 1 uses Next.js 16.3.2, React 19.2.8, TypeScript, server-rendered App Router pages, route-handler JSON APIs, and the existing `pg` driver. As of 2026-08-23, the production build binds to `0.0.0.0:3000`; EC2 security-group ingress restricts direct browser access to the user's current public IP.
- The application starts through `/home/ec2-user/nextera-demo/scripts/start-demo-with-openai.sh`, which prompts without echo for the disposable OpenAI key, loads the mode-0600 restricted runtime URI, and records its PID/log under `/home/ec2-user/.local/state/nextera-demo`. Direct access is `http://44.201.155.216:3000/fleet` while the recorded public IP and security-group rule remain current.
- Last observed production process after the dynamic attention-queue deployment: PID `77277`, listening on `0.0.0.0:3000` on 2026-08-24. Treat this as recovery context, not durable state: revalidate the EC2 PID file, listener, and `/api/fleet` readiness response after any timeout, restart, or instance lifecycle event.
- `scripts/build-and-restart-from-running-env.sh` is the preferred production replacement helper. It performs the Next.js build and immediately invokes the existing same-host key-transfer restart, avoiding a live process being left against a replaced `.next` directory.
- Current live product routes: `/fleet`, `/fleet/correlation`, `/assets`, `/incidents`, `/incidents/{faultEventId}`, `/api/fleet`, `/api/fleet/correlation`, `/api/assets`, `/api/incidents/{faultEventId}`, `POST /api/fleet/correlation`, and `POST /api/incidents/{faultEventId}/analysis`. `/` redirects to `/fleet`; `/incidents` redirects to the primary B17 investigation.
- Current synthetic relational fleet: 3 public facility names, 60 fictional assets (20 per facility), 4 equipment types, 12 fictional fault-event records, 27 metric summaries, 3 open incidents, and 3 assets on watch. Four events remain the curated operational queue; 8 cleared B17 records plus 16 controller/ambient summaries are isolated as the fleet-correlation history. The asset mix remains 48 solar inverters, 6 tracker controllers, 3 weather stations, and 3 step-up transformers.
- The Monitored Assets KPI links to `/assets`. That page reads the restricted live inventory query and supports text search, facility/type/status filters, and sortable asset, facility, type, manufacturer/model, status, and commissioned columns. Rows with recorded faults link back to their investigation.
- **Recorded document-source decision (2026-08-23):** Google Docs will be the primary presenter-facing source system. Documents should be shared as view-only to anyone at Cockroach Labs with the link, so another internal presenter can open citations while signed into the corporate Google Workspace account. The EC2 security group controls demo-app access; Google Workspace controls document access.
- Each approved Google Doc also has a versioned PDF snapshot with a SHA-256 hash and stable page references. CockroachDB remains authoritative for document/version metadata, permissions, chunks, exact fault/equipment relationships, and answer provenance. S3 is an optional later archive, not a Checkpoint 2 dependency.
- When a bookmarked Google Docs `source_uri` is null, the UI opens the checked-in PDF snapshot. Adding a Google URL is a metadata-only change and does not require application code changes.
- B17 Google Docs handoff completed on 2026-08-23: all three documents were created and successfully tested by another Cockroach Labs viewer. The engineering bulletin targets `2. Fleet Pattern and Engineering Guidance` through bookmark `id.u8jycdxnprrg` for version `71000000-0000-4000-8000-000000000003`; the Manatee procedure targets `4.2 Authorized inspection sequence` through `id.9ocau7t8i5rv` for version `71000000-0000-4000-8000-000000000002`; and the OEM manual targets `7.3 Fault B17 — Controller Thermal Derating` through `id.21d0z9um6x2s` for version `71000000-0000-4000-8000-000000000001`.
- Checkpoint 2 authored three visibly synthetic sources: the HPS-2500X operations manual v4.2, Manatee cooling-system inspection procedure v2.1, and fleet B17/high-ambient bulletin v1.3. Their stable PDF snapshots live in `public/evidence/`; controlled HTML authoring sources and exact chunks live in `source-documents/`.
- Migration 006 generalizes `document_versions` for a Google/source URI plus a stable snapshot URI and adds chunk source anchors. Seed 004 catalogs the three B17 versions/chunks; seed 006 catalogs three A12 versions/chunks plus typed fan command/feedback metrics; seed 007 adds the P09 tracker event, four tracker metrics, three evidence versions/chunks, exact applicability, and Citrus scope. All nine chunks have 1,536-dimensional `text-embedding-3-small` vectors and content-addressed embedding metadata.
- **Current chunking/ingestion boundary (clarified 2026-08-24):** chunk creation is curated rather than automatic. The checked-in `source-documents/chunks/*.txt` files preserve the exact human-reviewable excerpts, while the versioned seed SQL inserts the authoritative text into `nextera.document_chunks`. The embedding worker reads approved/current `document_chunks.content_text`; it does not open or parse Google Docs, HTML, or PDFs. At question time, Google Docs are citation destinations rather than retrieval inputs.
- Fault applicability is explicit metadata, not an embedding inference. `document_fault_code_links` associates a document version, fault code, equipment model, and section heading; the authorized incident-evidence query joins that metadata to the matching chunk and also requires an applicable asset/model relationship. Vector similarity ranks only the already-authorized, exactly applicable chunk set.
- `npm run db:document-source` is the guarded owner-only metadata workflow for citation URLs. It validates the document-version UUID and Google bookmark shape, prints `EXPLAIN` plans, requires `CONFIRM_DOCUMENT_SOURCE_UPDATE=YES` to write, and otherwise operates as an exact-value verifier.
- `thermal_derating_b17/v1.0` runs before generation for B17. It validates the metric window, calculates the 3.4 °C threshold exceedance, retrieves only the two sources authorized for the Field Technician, and creates three typed findings. The normal answer path then calls the OpenAI Responses API with only those facts/chunks; persistence remains one short retry-safe transaction.
- The engineering-only bulletin is excluded by the authorized retrieval query before incident analysis. B17, A12, and P09 each intersect semantic results with exact fault/model/equipment applicability before generation. C04 alone returns HTTP 422 and creates no result.
- The first recorded live B17 test persisted 3 findings and 2 authorized document sources with a measured deterministic application duration of 73 ms. Treat this only as one observed run, not a benchmark, SLA, or LLM latency claim.
- The UI balance is intentionally about 75% believable field product and 25% technical proof. The B17, A12, P09, and C04 routes derive different metric cards, suggested questions, evidence plans, investigation labels, and operational wording from the live incident record. P09 demonstrates that the shared incident shell adapts to a tracker controller without a separate route or asset-specific page.
- Fleet Overview now derives its entire top attention queue from incident status instead of hard-coding B17 as one primary hero. Every `active` record is rendered as a distinct asset/state-aware Attention Required card with a direct investigation link; `acknowledged` records render in a quieter Investigation Underway row; `cleared` records remain in the lower recent-activity queue. The fleet query guarantees all active/acknowledged records are returned and caps only cleared history at the latest three, so a newly seeded active incident automatically appears on the next dynamic page request. The current deployed state shows B17 / `INV-042` and P09 / `TRK-01` as two attention cards and A12 / `INV-102` as acknowledged.
- Polished captures include `docs/fleet-assets.png`, `docs/asset-inventory.png`, `docs/checkpoint1-polished-b17.png`, `docs/checkpoint1-polished-a12.png`, `docs/checkpoint1-polished-c04.png`, and `docs/checkpoint2-b17-analysis.png`. Full implementation/test/query-plan details are in `docs/CHECKPOINT_1_READOUT.md` and `docs/CHECKPOINT_2_READOUT.md`.
- Checkpoint 3 results are recorded in `docs/CHECKPOINT_3_READOUT.md`. Four live golden tests passed: OEM-first root-cause retrieval, site-procedure-first inspection retrieval, engineering-bulletin-first fleet retrieval for the engineer persona, and exclusion of that bulletin for the field persona. A live B17 request persisted two vector sources with finite cosine distances and `text-embedding-3-small` model metadata; the full application smoke suite also passed.
- Checkpoint 4 results are recorded in `docs/CHECKPOINT_4_READOUT.md`. The default generation model is configurable and currently `gpt-5.6-luna` with low reasoning effort. Prompt/validation contract `equipment-health-grounded/v1.1` classifies each B17 question as diagnosis, inspection, recovery, fleet history, or general/unsupported. Its three model-authored sections are `direct_answer`, `field_guidance`, and `recommended_action`; application code validates evidence IDs, question-relevant facts/checks, and unsafe unsupported assertions before adding citation markers.
- Every answer also receives an application-authored scope statement: only the two displayed authorized excerpts are available; they cover B17 thermal behavior and the Manatee exterior cooling inspection, but do not constitute a complete inverter-health assessment or rule out unrelated conditions. This statement is present in both live and fallback answers and is not left to model discretion.
- The deterministic fallback is no longer one canonical canned paragraph. `thermal_derating_b17/v1.1` selects a diagnosis-, inspection-, recovery-, fleet-limit-, or general-purpose answer based on the same deterministic question intent. The inspection fallback directly lists exterior intake/exhaust obstruction, vegetation, dust, water intrusion, fan command/feedback, temperature trend, and ambient-input plausibility checks. Fallback logs now include both a stable reason code and a safe diagnostic message.
- The UI no longer titles every response “Protective thermal derating confirmed.” It displays the current question focus (for example, “Inspection guidance response”) and explains that fallback wording is still question-focused and evidence-scoped.
- B17 question-aware validation passed for: exact “Why did this inverter enter a derated state?” live generation; exact “Are there other things I should check…” live generation; forced persisted diagnosis and inspection fallbacks; recovery criteria; explicit refusal to infer 30-day fleet/weather correlation; safe handling of an unsupported capacitor-failure/replacement question; injected `E99`/controller-failure/replacement instructions; browser assets; and the C04 unsupported path.
- The final browser-visible B17 state is the exact inspection question above, persisted as answer `742484f4-4535-4a3d-8461-466707a8d1ad`: live `gpt-5.6-luna`, prompt `equipment-health-grounded/v1.1`, no fallback, two authorized vector sources, and a 3,217 ms observed end-to-end duration. Treat the duration as a single observation, not a benchmark or SLA.
- Checkpoint 5 results are recorded in `docs/CHECKPOINT_5_READOUT.md`. `/fleet/correlation` compares 8 other HPS-2500X B17 events across Manatee, Babcock Ranch, and Citrus in the 30 days before INV-042. Six event windows have ambient peaks at or above the 35 °C fleet-analysis context threshold and two are below it, yielding a 75% observational share with deliberate counterexamples.
- The fleet question is governed by `fleet_b17_weather_correlation/v1.0`, prompt `fleet-b17-weather-grounded/v1.0`, and deterministic fallback `fleet-b17-weather-fallback/v1.0`. Application validation requires exact event/facility/high-ambient/below-threshold counts, the 35 °C context threshold, event-set and bulletin evidence IDs, an explicit association-not-causation limit, and a bulletin-supported next step. It rejects invented component failure/replacement claims.
- The role switch is enforced server-side. Field Technician GET responses expose the structured event set but return `engineering_restricted` and no saved engineering analysis; Field Technician POST receives HTTP 403. Only the Fleet Engineer permission includes the engineering-restricted scope and bulletin for analysis/generation.
- Migration 008 creates `diagnostic_fault_event_sources`. A fleet run now persists the anchor run plus 8 exact comparator fault links, 16 controller/ambient metric links, 3 typed findings, one restricted document chunk/version/scope, vector provenance, answer, recommendation, model/prompt/timing, and all answer-source links in a retry-safe transaction.
- The first validated Fleet Engineer run was live `gpt-5.6-luna`, no fallback, used `text-embedding-3-small` vector retrieval of the restricted bulletin, persisted/reloaded all 8 comparator events, and observed 4,952 ms end to end. Its answer explicitly states 8 events / 3 facilities / 6 high-ambient / 2 below and that the association does not prove causation. Treat this as one observation, not a benchmark or SLA.
- Fleet history uses source system `synthetic_fleet_history_adapter`. The operational queue and asset latest-activity query explicitly exclude it, preventing eight historical comparator events from becoming misleading unsupported incident entry points. The dedicated correlation query retains the full set.
- Persona selection is now global rather than encoded in the correlation URL. The upper-right persona control appears across the product, calls `POST /api/persona`, stores the validated role in the HttpOnly `nextera_demo_role` cookie for eight hours, and refreshes the current route. `/fleet/correlation` reads that cookie server-side and remounts the role-specific client view so switching back to Field Technician removes the restricted persisted analysis immediately. Query-string role links are no longer required.
- The fleet overview now exposes Fleet Intelligence twice above the facility list: a prominent header action beside refresh status and a dark product card with a `New` label. Both use the single `/fleet/correlation` URL and inherit the selected global persona.
- Incident investigation now treats `fleet_history` as a workflow-routing intent instead of returning the incident-only evidence limitation. It navigates to `/fleet/correlation?question=...&run=1`, preserves the active persona through the global cookie, prefills the exact user question, and automatically submits it only for Fleet Engineer. Field Technician lands on the same event facts with the existing engineering restriction and no unauthorized POST. The regression uses the exact question “Are there other inverters that had the same problem and was weather a problem in all of them?” and validates 8 comparison events, 6 at/above 35 °C, 2 below, and association-not-causation language.
- Checkpoint 6 results are recorded in `docs/CHECKPOINT_6_READOUT.md`. The existing Babcock Ranch `INV-102` / `A12` event is now a complete second incident vertical slice rather than an unsupported preview. Its direct route is `/incidents/30000000-0000-4000-8000-000000000112`.
- The A12 window adds typed fan command (`92.0%`) and feedback (`76.1%`) signals to the existing peak/latest variance (`17.2`/`15.9` percentage points), configured threshold (`12.0`), and ambient peak (`38.2 °C`). Rule `fan_feedback_variance_a12/v1.0` validates that the latest command-feedback arithmetic corroborates the stored variance, records the `5.2`-point peak exceedance, and preserves ambient as context rather than a causal conclusion.
- The A12 evidence pack is the SD-8400 cooling/fault manual v3.9 page 3, Babcock fan-system inspection procedure v1.6 page 3, and inverter return-to-service checklist v2.4 page 2. Controlled HTML, exact chunks, visually inspected synthetic PDF snapshots, page anchors, hashes, fault/model links, and Babcock/general retrieval scopes are checked in. All three corporate Google Docs/bookmarks were configured on 2026-08-23 and are recorded in `source-documents/A12_GOOGLE_DOCS_HANDOFF.md`; the UI response was verified to contain each exact Google document ID while snapshots remain the fallback.
- `scripts/render-a12-source-pdfs.py` (Python `reportlab`) is the controlled snapshot renderer and `scripts/render-pdf-preview.py` (`pymupdf`) is the visual-inspection helper. Regenerating a PDF changes its SHA-256; update and reapply seed 006 after intentional rendering changes so CockroachDB provenance stays synchronized.
- Prompt `a12-fan-grounded/v1.0` and its intent-aware deterministic fallback support diagnosis, exterior inspection, recovery/release, fleet-history, and general questions. Validation rejects a claimed failed fan, replacement advice, bypass or energized-internal-inspection instructions, unknown citations, and release without the approved acceptance criteria. It requires Maintenance Hold while unresolved and distinguishes an acknowledged alarm from evidence of recovery.
- Each A12 run persists 3 typed findings, 4 metric-source links, 3 document sources with vector metadata, the answer/recommendation/model/prompt/fallback/timing record, and exact answer-source links in a short retry-safe transaction. Live generation and deterministic diagnosis/inspection/recovery paths were all persisted and reloaded successfully.
- All seven retrieval goldens pass: the A12 definition question ranks the OEM manual first, inspection ranks the site procedure first, and maintenance release ranks the checklist first. B17 live generation was retested after corpus expansion and remained limited to exact B17/model-applicable chunks. Full typecheck/build, fleet regression, six-snapshot, browser-asset, B17, A12, and C04-safe-boundary smoke tests passed.
- Every new A12 application statement was validated with CockroachDB `EXPLAIN`; the exact evidence query uses indexed fault/model/asset spans and is distribution-local, while persistence plans use insert fast paths or values-to-insert with foreign-key checks. Full output is `/home/ec2-user/.local/state/nextera-demo/checkpoint6-explain.log`. Optional covering-index suggestions for the tiny catalog were intentionally deferred pending a larger corpus or measured need.
- Checkpoint 7 results are recorded in `docs/CHECKPOINT_7_READOUT.md`. Citrus `TRK-01` / `P09` is a complete non-inverter vertical slice at `/incidents/30000000-0000-4000-8000-000000000201`. Its active event places a synthetic `TRC-8` tracker controller in Safe Stow Hold.
- The P09 window stores peak/latest position deviation (`15.1`/`13.6` degrees), a `5.0`-degree threshold, latest commanded/measured angles (`32.0`/`18.4` degrees), and peak/latest drive current (`8.7`/`8.2` amperes) against a `7.5`-ampere context threshold. Rule `tracker_position_deviation_p09/v1.0` verifies the latest angle arithmetic, records three typed findings, and does not promote elevated loading into a component-failure diagnosis.
- The P09 evidence pack is the TRC-8 operations/fault manual v2.7 page 3, Citrus tracker-row inspection v1.4 page 3, and tracker return-to-automatic checklist v2.0 page 2. The controlled HTML, exact chunks, visually inspected synthetic PDFs, hashes, exact P09/model/equipment links, and Citrus/general scopes are checked in. All three corporate Google Docs and exact bookmarks were configured on 2026-08-23 and are documented in `source-documents/P09_GOOGLE_DOCS_HANDOFF.md`; PDF snapshots remain fallbacks.
- Prompt `p09-tracker-grounded/v1.0` and fallback `p09-tracker-fallback/v1.0` support diagnosis, exterior observation, recovery/release, fleet-history, and general questions. Validation requires all three evidence types and preserves the movement-envelope/Safe-Stow boundary, controlled-motion acceptance criteria, and no unsupported actuator/sensor/drive/linkage failure claims.
- Seed 007 was applied twice successfully. Embedding activation added 3 chunks / 651 tokens and reported 9 approved / 9 embedded with one 1,536-dimensional model. All 10 retrieval goldens pass: P09 definition ranks OEM first, observation ranks the Citrus procedure first, and return to automatic ranks the checklist first without regressing B17/A12 or the restricted-scope boundary.
- The default P09 diagnosis completed live with `gpt-5.6-luna`, no fallback, and three scoped vector sources. A return-to-automatic model response that omitted one mandatory criterion was rejected and safely replaced with the complete question-aware deterministic recovery response. Deterministic diagnosis/inspection/recovery, P09 HTTP, typecheck/build, every new `EXPLAIN` plan, and the full four-incident/nine-PDF smoke suite pass.
- The temporary Checkpoint 7 owner environment was removed and its absence verified. The remote app remains a deployment copy rather than a Git repository.
- The three P09 Google source updates used the guarded owner-only workflow, which ran `EXPLAIN` before each exact UUID update and verification. All plans used primary-key spans; the application page was verified to contain all three exact Google document IDs. Seed 007 was replayed successfully afterward, proving the source URLs survive seed/reset workflows and updating document source metadata to `google_drive`. The temporary owner copy was removed and its absence verified.

## Workspace source artifacts

The workspace initially contained:

1. `account-brief.txt`
   - Gong-derived account brief covering customer goals, pain, stakeholders, decision criteria, competitive context, and opportunity.
2. `NextEra Energy - Equipment Health Analysis using CRDBX.pdf`
   - Seventeen-page architecture and CockroachDB schema proposal for Equipment Health Analysis.
3. `Screenshot 2026-08-21 at 11.09.16 AM.png`
   - Coworker concept UI showing an inverter thermal-derating incident.

There is also a Google Doc version of the architecture document:

`https://docs.google.com/document/d/1aNgNQZSGxw8Kv9frubibHm7QyLSSUArhzZoBweQ9PWY/edit?tab=t.0#heading=h.50prxs7x8tkf`

Anonymous access to that Google Doc returned HTTP 401. The PDF was successfully read in full. There is no evidence of missing PDF content, but exact parity with the Google Doc could not be independently confirmed without authenticated Google access or link-public viewing.

## Account and opportunity background

### Customer context

- NextEra Energy is a Fortune 200 energy company and the parent of the largest regulated US electric utility; the supplied context describes a fleet of 400+ power plants.
- The opportunity began at the Ai4 conference booth, where the NextEra team spent approximately 45 minutes with Soma, Alex, and Feng.
- Subsequent activity included a team dinner, NDA exchange, and an August 14 scope/discovery call.
- NextEra is evaluating CockroachDB as a potential foundational data layer for operational health analytics and agentic workflows supporting commissioning and field teams.
- Internally, the opportunity has been characterized as a customer seeking significant help designing an AI-native solution, not merely selecting a database for an already-complete architecture.

### Key stakeholders from the supplied material

- **Bryan Amadio — Director of Commissioning and Controls Engineering**
  - Oversees commissioning activity for approximately 65 power plant projects annually.
  - Likely cares most about commissioning efficiency, field resolution time, consistent process, and avoiding schedule impact.
- **Jason Skopek — Controls engineering / IIoT lead**
  - Hands-on with plant control systems.
  - Likely cares most about deterministic engineering behavior, historian integration, equipment context, latency, and technical credibility.
- **Igor — AI liaison / technical champion**
  - Integrating AI into the business and developing health analytics.
  - Likely cares most about grounded answers, agent state, reusable data foundations, permissions, and architecture.

### Customer pain

- Current AI answers can have confidence of roughly 50% or less because raw time-series signals are not joined with equipment-specific domain knowledge.
- A fleet-wide inverter analysis combining historian data and a weather API reportedly took approximately 20 minutes, which is unusable for a technician diagnosing failed equipment in the field.
- Data and process suffer from "silo syndrome": spreadsheets, weak core enterprise applications, conflicting schedules, and no widely trusted system of record.
- Manuals, procedures, checklists, failure modes, wiki links, reports, OEM specifications, and data sheets are distributed across SharePoint, Confluence, PDFs, individual hard drives, and other repositories.
- Useful knowledge is often effectively invisible unless a software engineer already knows where it lives.
- They want reliable, low-latency, deterministic, permission-aware results suitable for critical operational settings.
- NERC CIP is relevant to their environment, but this demo must not claim to be NERC CIP compliant.

### Customer vision

The vision has been described as a **"Next Brain" / tools hub**: disconnected internal applications and an LLM/agent should ground their answers against a common foundational data layer rather than independently retrieving fragmented information every time.

## What the architecture PDF specifies

The PDF is an architecture proposal, not a finished product specification.

Its central decision is that CockroachDB is the **application data and knowledge layer**, not a replacement for the historian or document repositories.

### System-of-record boundaries

Historian retains:

- Raw equipment telemetry
- High-frequency measurements
- Long measurement histories
- Original historian events
- Existing historian calculations

SharePoint, Confluence, or S3/object storage retains:

- Original PDFs and Word documents
- Images and diagrams
- Engineering reports
- Original document permissions and version history

CockroachDB stores and connects:

- Plants and equipment
- Fault events
- Selected historian results and deterministic health summaries
- Document catalog and versions
- Extracted document sections/chunks
- Vector embeddings
- Exact equipment/fault/document relationships
- Retrieval scopes and permissions
- Diagnostic runs and findings
- Generated analyses/recommendations
- Evidence, citations, and audit history

### Important positioning guardrails

- Do not imply that CockroachDB ingests all raw telemetry for the first use case.
- Do not imply that a source URI contains the document, performs search, or grants permission.
- Do not imply that CockroachDB alone "grounds" an answer. The application uses facts, calculations, approved chunks, permissions, and citations stored in CockroachDB to produce a grounded answer.
- Do not call the combination of exact relational matching and vector retrieval a magical/native generic hybrid-search feature without precise qualification.
- The LLM explains supplied evidence. It does not perform the engineering calculation or invent missing measurements.
- The PDF intentionally favors typed relational columns, primary/foreign keys, and explicit relationships over generic JSONB blobs.

### Worked query flow in the PDF

The document's worked question is:

> Why did inverter 42 enter a derated state after fault B17?

The proposed sequence is:

1. Resolve inverter 42 from structured equipment data.
2. Confirm the user may access the equipment and relevant document scopes.
3. Retrieve the B17 fault event.
4. Retrieve recent typed health summaries.
5. Call a historian-facing deterministic diagnostic service if new calculations are required.
6. Store the diagnostic findings in CockroachDB.
7. Find documents explicitly related to B17, the equipment, or its model.
8. Embed the user's question.
9. Search only authorized equipment-model, plant, and company document scopes.
10. Retrieve matching chunk text plus document version, page, and source URI.
11. Give the LLM only the equipment facts, deterministic findings, and approved document excerpts.
12. Ask it to explain using only supplied evidence.
13. Return the answer with citations and measurement window.
14. Persist the exact evidence behind the answer.

## Screenshot interpretation

The screenshot is a polished concept for the PDF's worked example, not a mandatory design to clone.

It shows:

- Product identity: "Equipment Intelligence — NextEra Concept"
- Fleet navigation with three fictional plants: Desert Ridge, Sunfield Solar, and Mesa Verde
- Selected asset: `INV 42`
- Synthetic manufacturer/model: GridWorks GW 9000
- Fault: `B17`
- Status: derated
- Controller temperature: 78.4 °C
- Documented threshold: 75.0 °C
- Threshold breach: 3.4 °C
- Ambient temperature: 44.8 °C
- AC output: 6.2 MW
- Recommended response: inspect cooling before reset
- Technician steps: check intake filter/ventilation, verify both cooling fans, reset only below 70 °C
- Tabs: Brief, Evidence, Provenance
- A role selector showing "Field technician"
- A message that permissions shape the answer
- "3 approved evidence points" and "4 source types modeled"

The screenshot's strengths worth retaining conceptually are clarity, evidence, actionability, provenance, and permission-aware retrieval. Its exact layout, plants, names, colors, and visual identity are optional.

## Agreed combined product direction (decision recorded 2026-08-22)

The user reviewed two related concepts:

1. A believable operational equipment-health product shell centered on fleet incidents, actionable diagnosis, evidence, permissions, and provenance.
2. Mica's "NextEra Equipment Health Assistant" straw man centered on a natural-language technician question, visible equipment/fault resolution, document retrieval, a live evidence-constrained answer, response timing, and an under-the-hood evidence trail.

The agreed direction is to combine their strongest elements rather than choose one:

> Build a believable equipment-health product whose central capability is an AI-assisted, evidence-grounded investigation.

The product shell establishes that this is a credible tool a technician, reliability engineer, or fleet engineer could use. The natural-language investigation makes the AI value explicit. The evidence/provenance view proves that the answer is constrained, permission-aware, and auditable. The result should not look or behave like a generic chatbot or a superficial "chat with PDFs" application.

### Agreed interaction model

1. Begin in a fleet/incident product context rather than on an empty chat page.
2. Open a real-looking but explicitly synthetic equipment incident.
3. Offer a suggested technician question and an optional free-form question field.
4. Show safe, high-level processing stages such as equipment resolution, fault lookup, deterministic diagnostic completion, authorization, source retrieval, answer generation, and evidence recording. Do not expose hidden model reasoning or chain-of-thought.
5. Render the response as a structured incident analysis—not a conversational bubble—including diagnosis, observed facts, recommended response, evidence, and provenance.
6. Provide a "See what's under the hood" view for technical audiences.
7. Support role/principal changes that genuinely alter authorized retrieval.
8. Add a fleet-correlation question as a second scenario after the single-asset workflow is excellent.

### Agreed implementation standards

- Use real CockroachDB relational queries for equipment, faults, metrics, and exact document relationships.
- Use real CockroachDB vector retrieval; do not merely simulate vector search in the UI.
- Generate real synthetic source documents, publish presenter-facing copies in corporate Google Docs, and preserve page-stable PDF snapshots; citations must resolve to actual sections/pages rather than decorative hard-coded labels.
- Use a live OpenAI API model call for the main path, constrained to supplied evidence, with a clearly distinguished deterministic fallback for presentation resilience.
- Display measured demo response time, not a promised production SLA or an unqualified comparison with the reported 20-minute customer workflow.
- Define "confidence" as application-level evidence sufficiency/validation, not LLM self-confidence.
- Keep operational wording exact and consistent. For the initial B17 example, distinguish a protective derating event from a full trip.
- Make the CockroachDB story broader than vector storage: structured operational state, deterministic diagnostics, exact relationships, permissions, vector retrieval, workflow state, evidence, and audit history belong together.

### Relationship between the two concepts

- Mica's concept supplies the strongest **core interaction** and most direct contrast with the customer's slow, weakly grounded experience.
- The incident/fleet concept supplies the strongest **product container** and makes the result feel like an operational application instead of a technology demonstration.
- The AWS and CockroachDB architecture supports both without requiring separate systems.

## Recommended demo product

Working title:

**NextEra Equipment Intelligence**

Product proposition:

> A fleet-health application that identifies operational incidents, combines deterministic equipment behavior with approved engineering knowledge, and gives field personnel a fast, permission-aware, cited response.

The demo should not be a generic chatbot. It should be an evidence-centered operational workflow.

### Core promise to demonstrate

> CockroachDB lets NextEra turn scattered operational data and approved engineering knowledge into a fast, permission-aware, evidence-backed field recommendation.

### Recommended scope

Build a polished, working vertical slice:

- Fleet overview
- A small number of relevant plants and equipment assets
- One excellent incident investigation
- Deterministic equipment-health calculation
- Exact relational matching for fault codes/models/procedures
- Scoped vector retrieval over approved synthetic documents
- OpenAI-generated explanation constrained to supplied evidence
- Evidence and provenance views
- Permission-aware results
- Stored diagnostic and answer history
- Repeatable seed/reset path
- Short demo script and architecture explanation

Do not initially build:

- A real historian connector
- Real SharePoint or Confluence ingestion
- Full OCR or diagram interpretation
- Hundreds of millions of telemetry records
- A universal chatbot
- The entire Next Brain/tools hub
- A general production ingestion platform
- A large multi-region deployment solely for visual effect

These may appear in a clearly labeled future-state architecture.

## Proposed user experience

The exact design remains open. A likely information architecture is:

1. **Fleet** — Where are emerging risks?
2. **Incident** — What happened to this asset?
3. **Evidence** — Which measurements and documents support the conclusion?
4. **Provenance** — Which versions, permissions, diagnostics, models, and timestamps produced the answer?

Potential supporting screens/panels:

- Plant and asset filters
- Incident/event timeline
- Diagnostic facts and threshold visualization
- Recommended field action
- Source citation drawer
- Role/principal switcher
- "What changed" ranked-signal explanation
- CockroachDB live/status indicator backed by a real health check
- Architecture/"how this answer was produced" explainer

### Primary demo moment

The initial incident may remain an inverter thermal derating event because it naturally connects weather, telemetry, fault codes, OEM limits, and field procedures. Names and values can change.

The ideal sequence is:

1. Open a fleet incident.
2. Show structured equipment and event resolution.
3. Show deterministic threshold calculation.
4. Produce a concise evidence-constrained recommendation.
5. Reveal measurement and document evidence.
6. Open an exact source section/page.
7. Change user role and demonstrate that accessible evidence/results change.
8. Show the immutable provenance record.
9. Optionally ingest a revised approved procedure and show a new analysis using the new version while the old answer remains reproducible.

### Confidence language

Avoid presenting raw LLM self-confidence as trustworthy. If the UI says "High confidence," define it as an application-calculated evidence/validation state, for example:

- Required deterministic checks completed
- Required measurement window available
- Exact fault/model relationship found
- Minimum number of approved sources retrieved
- No conflicting authoritative procedure detected
- Citations attached to all material claims

## Synthetic data and document strategy

No NextEra operational data or internal manuals have been supplied. Create a coherent fictional evidence pack.

### Plant names

The user is open to using real, publicly documented NextEra facility names for familiarity. Before choosing names:

- Verify ownership/association using authoritative public sources.
- Prefer facilities with understandable generation technologies such as solar, wind, or battery storage.
- Add a prominent notice that all equipment, telemetry, incidents, documents, and conclusions are synthetic.
- Do not imply knowledge of real facility configurations, OEMs, faults, or operating conditions.

If real facility names introduce distraction or review risk, use plausible fictional plant names instead.

### Suggested data volume

Enough to make filtering and fleet views believable, not enough to create an ingestion project:

- 3–5 plants
- 50–75 equipment assets
- 3–5 equipment types
- 30–90 days of precomputed health summaries
- A few hundred fault/events
- 1 primary incident with complete evidence
- 1 secondary incident for breadth or fallback
- 4–8 documents with 2–3 versions where useful
- Dozens to a few hundred document chunks

### Suggested initial evidence sources

1. **Synthetic OEM inverter installation and maintenance manual**
   - Fault B17 definition
   - Controller threshold
   - Derating behavior
   - Cooling inspection and reset requirements
2. **Synthetic plant cooling inspection procedure**
   - Intake/filter/ventilation checks
   - Cooling-fan verification
   - Safety and reset sequence
3. **Synthetic fleet engineering bulletin**
   - Ambient heat and restricted-airflow failure pattern
   - Affected model/firmware scope
4. **Historian-derived diagnostic window**
   - Controller and ambient temperatures
   - Output/operating mode
   - Timestamped observation window
5. Optional work-order or maintenance record
   - Prior filter replacement or fan inspection
6. Optional weather summary
   - Site heat conditions, clearly identified as synthetic or from a public weather source

The documents should look realistic enough to support citations, page numbers, revisions, approval status, and content hashes. They must not claim to be authentic NextEra or OEM documents.

## Proposed AWS deployment architecture

### Architectural principle

Separate the **logical architecture** from the **physical demo topology**.

The logical architecture should resemble a production-capable system with distinct responsibilities. The first physical deployment should deliberately consolidate components so the demo is easy to build, operate, reset, and explain.

### Recommended first physical topology

Use one AWS application region initially, provisionally `us-east-1`, subject to the EC2 location and the regions already configured on the user's CockroachDB Standard cluster. Select a CockroachDB database primary region as close to the EC2 application host as practical.

```text
User laptop / browser
        |
        | HTTPS (when shareable) or SSH tunnel during development
        v
AWS VPC in one region
        |
        +-- EC2 Linux application host
        |      +-- Web UI and server-side API
        |      +-- Deterministic diagnostic module
        |      +-- Retrieval/orchestration module
        |      +-- Document ingestion/seed worker
        |      +-- Demo reset/health tooling
        |
        +-- Versioned application bundle
        |      +-- Stable synthetic PDF snapshots
        |      +-- Optional generated exports
        |
        +-- CloudWatch
               +-- Application and worker logs
               +-- Basic alarms/health visibility

EC2 application host
        |
        | HTTPS egress using an ephemeral server-side API key
        v
OpenAI API
        +-- text-embedding-3-small, 1,536 dimensions
        +-- Configurable text-generation model

EC2 application host
        |
        | TLS SQL connection; initially IP allowlisted,
        | optionally AWS PrivateLink
        v
Existing CockroachDB Cloud Standard multi-region cluster on AWS
        +-- Initial nextera_demo database has one primary database region
        +-- Operational relational data
        +-- Document catalog/chunks
        +-- Vector embeddings/index
        +-- Permissions/retrieval scopes
        +-- Diagnostics, answers, evidence, provenance

Presenter browser
        |
        | Corporate Google Workspace authorization
        v
Google Docs
        +-- Viewer-facing manuals/procedures with bookmarked citations
```

### Why this is the recommended first topology

- It keeps the application, stable PDF snapshots, operational data, retrieval, workflow state, evidence, and logs in AWS. Google Docs is the agreed presenter-facing document exception, and the OpenAI API is the approved model-service exception because Bedrock is unavailable.
- It uses a real CockroachDB cluster without making the user operate database nodes.
- One EC2 host matches the planned `plink` workflow and minimizes deployment surface.
- Containers can preserve logical component boundaries without requiring ECS/EKS immediately.
- Corporate Google Docs make citations easy for internal presenters to open; versioned PDF snapshots on the EC2-hosted application preserve exact content and page references. S3 can be added later as an archive without changing the data model.
- OpenAI supplies embedding and generation services without displacing CockroachDB as the operational, vector, permission, and evidence layer.
- The system can later move from EC2 to ECS/Fargate or an Auto Scaling Group without redesigning the data model.
- Single-region deployment avoids confusing a nationwide fleet data model with a requirement for a multi-region database on day one.

### CockroachDB deployment recommendation

Available and selected for the demo:

- An existing CockroachDB Cloud **Standard** cluster deployed on AWS across multiple regions.
- Create a dedicated database, provisionally `nextera_demo`, with one `PRIMARY REGION` selected from `SHOW REGIONS FROM CLUSTER`; do not add the other cluster regions to this database initially.
- New tables in that database should remain in the primary region using the database's default table locality. Do not add `REGIONAL BY ROW`, `GLOBAL`, or decorative locality clauses to the first schema.
- Expansion later can use `ALTER DATABASE ... ADD REGION` followed by deliberate table-locality decisions based on an actual latency, availability, or data-residency requirement.
- Before applying DDL, inspect the exact CockroachDB version, cluster regions, current databases, vector-index support, and row-level-security support. Validate generated queries with `EXPLAIN` on the target cluster.
- Use TLS for all SQL connections.
- Never leave `0.0.0.0/0` as the database allowlist.
- For initial synthetic-data development, allowlist only the EC2 egress/static IP.
- If Standard/Advanced and account/network setup allow it, add AWS PrivateLink later for private SQL connectivity.

If "everything in AWS" is intended to mean everything must reside inside the user's own AWS account, evaluate either CockroachDB Cloud BYOC or a properly deployed self-hosted multi-node CockroachDB cluster. Do not default to a single-node self-hosted database merely to satisfy account ownership; that weakens the database story and adds operational risk.

### Region and multi-region recommendation

Initial demo: **one AWS application region and one CockroachDB database primary region, even though the existing Standard cluster spans multiple regions**.

Reasons:

- The demo workload has one application write home.
- The goal is equipment intelligence and grounded evidence, not a cross-region latency workshop.
- A multi-region deployment introduces cost, networking, locality DDL, and failure modes that do not strengthen the initial user story.
- Real/fictitious plants can be geographically distributed in the data model without physically deploying application/database services beside every plant.

Make the schema future-ready by retaining plant geography and an explicit logical region/home-region attribute. Do **not** use CockroachDB's `crdb_internal_region` or `REGIONAL BY ROW` merely as decorative schema elements in the initial one-region database configuration.

Future state, only if it becomes valuable:

- Deploy application services in multiple AWS regions.
- Use a CockroachDB multi-region database.
- Use `REGIONAL BY ROW` for region-affine operational entities if local reads/writes are required near plant/tool populations.
- Consider `GLOBAL` locality for small, read-mostly reference data after validating write behavior and product requirements.
- Choose `SURVIVE ZONE FAILURE` versus `SURVIVE REGION FAILURE` explicitly based on recovery objectives and cross-region latency tolerance.
- Validate locality and leaseholder placement; do not assume "distributed" means identical latency everywhere.

### Application host and packaging

Recommended first deployment:

- One modest EC2 Linux instance.
- Docker/Compose or equivalent containerized processes.
- A single application repository.
- Logical processes may include:
  - `web`: UI plus authenticated/server-side API
  - `worker`: document chunking, embeddings, and seed jobs
  - optional reverse proxy for local TLS or routing
- Bind development services conservatively; use an SSH tunnel before opening a public application port.
- Add an Application Load Balancer, ACM certificate, and controlled HTTPS ingress only when the demo needs to be shared outside the SSH workflow.
- If an ALB is added, the EC2 security group should accept the application port only from the ALB security group, not from the public internet.

### Implemented application stack

Checkpoint 1 implemented the smallest stack that delivers a polished UI and credible server behavior:

- TypeScript
- Next.js 16.3.2 and React 19.2.8 for server-rendered UI plus route-handler JSON endpoints
- CockroachDB via a PostgreSQL-compatible Node driver
- SQL migrations kept in the repository
- A separate TypeScript worker/CLI for seeding, document processing, embeddings, and reset tasks
- Direct Node.js deployment on EC2 for the walking shell; containerization is deferred until deployment hardening

A Python service should still be introduced only if document/ML tooling provides a clear benefit; avoid multiple languages by default.

### OpenAI embedding and generation usage

Amazon Bedrock is unavailable in the shared AWS account. Use the OpenAI API directly from the server-side EC2 application. Do not use an external hosted vector store: demonstrating CockroachDB as the unified operational/vector/evidence layer remains part of the point.

Embedding decision:

- Start with `text-embedding-3-small` at its default 1,536 dimensions, matching `VECTOR(1536)` in the design document.
- Use exactly the same embedding model, dimensions, and preprocessing configuration for stored document chunks and incoming questions. API-key rotation does not affect vector compatibility.
- Store the embedding provider, model ID, dimensions, corpus/embedding version, and content hash with every chunk or embedding record.
- Use CockroachDB cosine distance (`<=>`) for initial semantic retrieval and validate the exact vector-index syntax and query plan against the cluster version.
- If the embedding model changes, create a new embedding version and re-embed the entire corpus; do not compare vectors produced by different models/configurations.

Generation recommendation:

- Keep the generation provider/model configurable and independent from the embedding model.
- Begin evaluation with `gpt-5.6-luna` for the evidence-constrained demo flow; move to a higher-capability model only if representative tests show a material quality improvement.
- Prompt the model to use only supplied evidence and to identify insufficient or conflicting evidence.
- Persist provider/model ID, prompt-template version, input evidence IDs, response, and timestamp.
- Provide a deterministic demo fallback if the external model call is unavailable during a presentation, while clearly distinguishing fallback behavior from a live model call.

### AWS identity and secrets

- Add an EC2 IAM role only when an AWS service actually requires it, for example CloudWatch log export or an optional future S3 archive. Bedrock and Secrets Manager permissions are not required for the OpenAI path.
- **Recorded credential decision (2026-08-22):** the OpenAI API key will be a dedicated, disposable, narrowly scoped project key injected as an ephemeral environment variable on the EC2 Linux host.
- The user expects to recreate and revoke the OpenAI key frequently, potentially daily. Replacing the environment variable is not sufficient; revoke the prior key in the OpenAI project.
- Do not store the OpenAI key in AWS Secrets Manager because the AWS account is shared across the SE organization and the user does not want a personal key placed in that shared administrative boundary.
- Do not put the key in chat, commands executed by Codex, the repository, `.env`, shell history, `.bashrc`, EC2 user data, images, logs, or documentation.
- Provide a small Linux launcher that reads the key without echo, exports it only to the server process, and starts the application. The key should disappear when the process stops or the host is replaced/rebooted.
- Anyone with root or equivalent live-host access could still inspect process memory/environment; restrict SSH/SSM and application-user access accordingly.
- Use a dedicated, least-privilege CockroachDB application user. Decide the secure injection method for its connection material when cluster access is configured; never commit the full connection string.
- Use separate application and administrative database users.
- Restrict SSH ingress to the user's known IP/CIDR when possible.
- Do not expose the CockroachDB SQL endpoint broadly.

### Observability and demo resilience

- CloudWatch application/worker logs
- `/health` endpoint covering application process and database reachability
- Visible but unobtrusive database status in the UI
- Seed command that is idempotent
- Reset command that restores the canonical incident state
- Cached/pre-generated source documents
- Configurable live OpenAI API versus deterministic fallback mode
- Clear startup and smoke-test scripts
- A demo checklist that validates the database, Google Doc/PDF citation links, OpenAI API access when enabled, and UI before presenting

## Logical component responsibilities

### Web UI

- Fleet and plant navigation
- Incident detail
- Evidence/provenance presentation
- Role/principal selection for demonstration
- Citation links generated through authorized application endpoints

### Application API/orchestrator

- Resolve plant/equipment/fault identifiers
- Determine authorized retrieval scopes
- Execute exact relational retrieval
- Embed the question
- Execute vector retrieval within allowed scopes
- Assemble deterministic facts and approved chunks
- Invoke the configured OpenAI generation model
- Persist answer and evidence references
- Return structured response to the UI

### Deterministic diagnostic module

- Consume selected historian-like measurements or precomputed summaries
- Apply versioned engineering rules
- Produce typed findings, observed/expected values, units, and explanations
- Never delegate threshold arithmetic or safety decisions to the LLM

### Document ingestion/seed worker

- Read approved synthetic source files from the controlled seed bundle; optionally reconcile Google Drive metadata or a future S3 archive
- Extract or use authored text
- Split on meaningful sections/procedure steps rather than blind fixed-size blocks
- Generate embeddings through the OpenAI API
- Write document version, chunk text, vector, metadata, and exact relationships
- Preserve older versions for historical provenance

## Preliminary CockroachDB data model

Retain the PDF's typed relational approach. Candidate tables:

- `plants`
- `equipment`
- `equipment_fault_events`
- `equipment_metric_summaries`
- `retrieval_scopes`
- `retrieval_scope_permissions`
- `documents`
- `document_versions`
- `document_chunks`
- `document_fault_code_links`
- `document_equipment_links`
- `diagnostic_runs`
- `diagnostic_findings`
- `diagnostic_document_sources`
- `diagnostic_metric_sources`
- `analysis_answers` (recommended addition)
- `analysis_answer_sources` or equivalent (recommended addition)

The answer record should capture at least:

- Analysis/answer ID
- Equipment and fault/diagnostic reference
- Principal/role context
- Prompt-template version
- Generation model ID/version
- Embedding model ID/version where relevant
- Rendered answer and recommended action
- Evidence validation/confidence state
- Started/completed timestamps
- Status/error state
- Exact chunk, metric-summary, and diagnostic-finding references

### Permission strategy

The PDF uses explicit retrieval-scope permission tables and requires authorization before vector retrieval. That remains the baseline.

CockroachDB row-level security may be added as defense in depth and as a compelling demonstration if the target version/plan supports it and vector query plans remain suitable. Do not rely on a cosmetic UI role selector; the retrieval query must actually exclude unauthorized rows/scopes. Validate with SQL tests and `EXPLAIN` on the target cluster.

### Vector strategy

- Exact codes, model numbers, part numbers, and procedure identifiers use relational equality/indexes.
- Meaning-based questions use vector similarity over approved chunks.
- Prefix/scope the vector index and query by retrieval scope if supported and performant in the target release.
- Pin the CockroachDB version and validate exact index syntax and query plans.
- Store chunk text because vectors locate evidence but are not themselves usable evidence for the LLM.
- Store source document, version, page/section, content hash, retrieval scope, embedding model, and embedding version.

## Key design cautions

- Do not turn the demo into "chat with your PDFs."
- Do not make an unverifiable scale or latency claim.
- Do not claim NERC CIP compliance.
- Do not imply synthetic readings describe a real NextEra facility.
- Do not let the LLM calculate engineering thresholds.
- Do not use "confidence" without a defined application-level calculation.
- Do not silently retrieve unauthorized evidence and merely hide citations afterward; authorization must precede retrieval.
- Do not store expiring signed S3 URLs as source identity if an archive is added. Store stable Google/source URI, snapshot URI, and optional bucket/key/version metadata separately.
- Do not overwrite document versions required by old analyses.
- Do not treat the initial demo schema as immutable production design.
- Do not build multi-region infrastructure until a user-visible requirement justifies it.

## Open decisions and questions

These should be resolved progressively; they do not all block initial blueprint/design work.

Resolved on 2026-08-22: the application host is the validated Amazon Linux EC2 instance in `us-east-1`; `nextera_demo` already uses only `aws-us-east-1`; CockroachDB is v26.2.5/cluster version 26.2; vector indexes are enabled; and RLS support is present.

1. **Resolved for current development:** direct HTTP on port 3000 is restricted to the user's public IP. A shareable authenticated HTTPS endpoint remains undecided.
2. Who is the most likely first audience: Bryan, Jason, Igor, internal Cockroach Labs, or a mixed group?
3. How long should the primary walkthrough be?
4. **Resolved for the current demo:** use public facility names with persistent synthetic-data labeling; all facility configuration, equipment, events, and conclusions remain fictional.
5. **Resolved for the primary vertical slice:** inverter B17 protective thermal derating is the canonical incident; A12 and C04 provide breadth.
6. **Resolved for the current UI:** maintain an approximately 75% field-product / 25% technical-proof balance.
7. Is the deterministic presentation fallback acceptable when the live OpenAI API path is unavailable?
8. Will infrastructure be created manually, through repeatable AWS/Linux scripts, or with Terraform?

## Recommended delivery phases

### Phase 1 — Access, repository, and database foundation

- Connect to the AWS Linux host and establish the repository/toolchain
- Connect to CockroachDB with an administrative setup identity and inspect version, cluster regions, databases, and supported vector/RLS features
- Use the existing, empty `nextera_demo` database whose sole/primary region already aligns with the EC2 host
- Create migration groups for operational identity/events, knowledge/retrieval, and diagnostic/provenance data
- Seed only the canonical Manatee / INV-042 / B17 incident first
- Implement and `EXPLAIN` the exact equipment/fault/metric queries needed by that incident

### Phase 2 — Walking product shell

- **Completed 2026-08-23.** Structured fleet and incident response contracts are implemented.
- The fleet and incident UI is backed by live relational data through `nextera_app`.
- The B17, A12, and P09 routes are live grounded investigations; C04 remains an honest HTTP 422 unsupported scenario.
- Fleet and incident screenshots were captured through the private SSH tunnel and reviewed at presentation dimensions.

### Phase 3 — Real evidence and ingestion

- **Completed for the B17, A12, and P09 vertical slices on 2026-08-23.**
- Author the smallest useful evidence pack first: inverter manual, plant procedure, and fleet engineering bulletin
- Render stable synthetic PDFs with explicit synthetic labels and page numbers; use Google Docs as presenter-facing sources and keep the PDFs as immutable snapshots
- Implement document catalog/version loading, page-aware authored chunks, hashing, and exact fault/equipment links
- Nine generated `text-embedding-3-small` vectors now store 1,536 dimensions plus model/config/content-hash metadata alongside the page-aware chunks and retrieval scopes in CockroachDB.
- The CockroachDB scoped cosine queries, embedding update path, authorization boundary, and live persisted provenance have been validated with `EXPLAIN`, golden cases, and application smoke tests.

### Phase 4 — Retrieval before generation

- **Completed for the B17, A12, and P09 corpora on 2026-08-23.**
- Authorization is resolved before per-scope cosine retrieval.
- Exact relational metadata and scoped vector ranking are both live.
- Ten golden cases prove B17/A12/P09 relevance and the restricted-scope boundary.
- Vector method/rank/distance and model metadata are persisted and exposed before answer generation.

### Phase 5 — Working analysis flow

- **Completed for B17, A12, and P09 on 2026-08-23.**
- The deterministic thermal diagnostic supplies typed, versioned findings before generation.
- Configurable `gpt-5.6-luna` receives only structured facts, deterministic findings, and two authorized chunks.
- Strict JSON Schema plus application validation enforce supplied evidence IDs, question-intent-specific source/fact/check requirements, explicit evidence limitations, and unsupported-claim safety boundaries.
- The answer, evidence links, vector provenance, timings, provider/model, prompt-template version, and fallback state are persisted.
- The UI distinguishes live OpenAI generation, question-focused deterministic fallback, and earlier deterministic historical answers, and labels the current question focus.

### Phase 6 — Breadth, deployment hardening, and demo readiness

- **Fleet-correlation core completed 2026-08-23:** 30-day same-model event/weather dataset, deterministic aggregate, Fleet Engineer authorization, strict live generation/fallback, evidence UI, and exact CockroachDB provenance are deployed.
- **A12 platform-breadth slice completed 2026-08-23:** scenario-specific evidence, page citations, catalog/chunk/scope records, embeddings, typed rule, question-aware live/fallback behavior, exact persistence, and safety tests are deployed.
- **P09 non-inverter breadth slice completed 2026-08-23:** tracker-specific telemetry, Safe Stow Hold story, movement-envelope safety, three-source evidence, embeddings, typed rule, live/fallback behavior, exact provenance, and tests are deployed.
- C04 is the remaining optional breadth slice. If it is needed, use a communications-interface guide, site network-recovery runbook, and telemetry-validation checklist; give it the same typed-rule/retrieval/generation/provenance treatment rather than adding a shallow scripted answer.
- Containerize the web and worker processes and make startup/reset/seed commands repeatable
- Configure an EC2 IAM role only for required AWS integrations such as logging or an optional S3 archive; keep CockroachDB networking, health checks, and safe ephemeral OpenAI-key injection separately scoped
- Add HTTPS sharing only if required
- Rehearse the runbook; validate every displayed claim/citation, role behavior, failure path, and fallback
- Capture backup screenshots/video if useful and prepare the future-state architecture slide

## Immediate next step

Checkpoint 7's P09 tracker-controller vertical slice and the dynamic Fleet Overview attention queue are complete. Continue in this order:

1. Refresh `/fleet` and visually review the two active attention cards plus the acknowledged A12 row; then walk through the direct P09 route using one diagnosis, one observation, and one return-to-automatic question.
2. Add a rehearsal/reset runbook, compact current/future architecture visual, expected answers, and final presenter smoke checklist.
3. Test the three configured P09 Google Docs links from another Cockroach Labs account if convenient.
4. Decide whether the fully grounded C04 slice is necessary before the customer demo; otherwise prioritize rehearsal and reliability.

## Recovery checklist for a future Codex session

1. Read this file completely.
2. Read `account-brief.txt`.
3. Extract/read the full architecture PDF if needed.
4. Inspect the coworker screenshot.
5. Check the workspace for newer blueprint/code/status documents.
6. Revalidate the recorded EC2 address and credential-file locations if connectivity changes. Never ask the user to paste secret values into chat. Disposable OpenAI keys are entered only through the no-echo Linux launchers and are not persisted. Ordinary restarts and key rotation require re-entry; a controlled same-host production replacement should use `build-and-restart-from-running-env.sh` while the old process is healthy.
7. Do not run PowerShell.
8. Use `plink` for the AWS Linux host once authorized credentials are available.
9. Preserve unrelated/user changes.
10. Update this document after material decisions or milestones.

## Reference links used during architecture review

- CockroachDB AWS PrivateLink: https://www.cockroachlabs.com/docs/cockroachcloud/aws-privatelink
- CockroachDB Cloud production checklist: https://www.cockroachlabs.com/docs/cockroachcloud/production-checklist
- CockroachDB BYOC on AWS: https://www.cockroachlabs.com/docs/cockroachcloud/byoc-aws-deployment
- CockroachDB VECTOR type: https://www.cockroachlabs.com/docs/stable/vector
- CockroachDB v26.2 vector indexes: https://www.cockroachlabs.com/docs/v26.2/vector-indexes
- CockroachDB row-level security: https://www.cockroachlabs.com/docs/stable/row-level-security
- CockroachDB multi-region overview: https://www.cockroachlabs.com/docs/stable/multiregion-overview
- CockroachDB `CREATE DATABASE`: https://www.cockroachlabs.com/docs/stable/create-database
- OpenAI embeddings guide: https://developers.openai.com/api/docs/guides/embeddings
- OpenAI API authentication: https://developers.openai.com/api/reference/overview#authentication
- OpenAI API pricing: https://developers.openai.com/api/docs/pricing
- AWS Application Load Balancer security groups: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-update-security-groups.html

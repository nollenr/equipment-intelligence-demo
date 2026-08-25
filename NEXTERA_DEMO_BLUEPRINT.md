# NextEra Equipment Intelligence — Concrete Demo Blueprint

Version: 0.7
Date: 2026-08-24
Status: Checkpoint 7 complete and deployed; B17, A12, and P09 provide grounded incident investigations, Fleet Intelligence provides the role-bound 30-day B17 correlation story, the Fleet Overview uses a dynamic attention queue, and C04 remains intentionally unsupported
Companion recovery document: `NEXTERA_DEMO_CONTEXT.md`

## 1. Blueprint objective

Define a concrete, buildable vertical slice that combines:

- A believable fleet and incident-management product shell
- A natural-language equipment-health investigation
- Deterministic engineering analysis
- Exact relational retrieval plus scoped vector search in CockroachDB
- Live, evidence-constrained generation through the OpenAI API
- Permission-aware evidence
- Versioned citations and reproducible provenance

The first version should be attractive enough for an executive conversation, technically real enough for Jason and Igor, and focused enough to build and rehearse reliably.

## 2. Product definition

### Working product name

**Equipment Intelligence**

Possible subtitle:

**Evidence-backed equipment health for the NextEra fleet**

Every screen should also include a quiet but visible label:

> Concept demo · Synthetic operational data

Avoid using an official NextEra logo or copying its exact brand system unless approval is later provided.

### Product proposition

> Equipment Intelligence turns an operational event into an actionable, permission-aware diagnosis by connecting deterministic equipment behavior with approved engineering knowledge.

### What the product is not

- Not a general chatbot
- Not a replacement for the historian
- Not a replacement for SharePoint, Confluence, or S3
- Not an autonomous control system
- Not a production representation of any named NextEra/FPL facility
- Not a NERC CIP compliance claim

## 3. Primary audiences and their payoff

### Field technician

Question: "What happened, what should I inspect, and what can I safely do next?"

Payoff:

- Concise diagnosis
- Required checks in order
- Relevant safety/reset constraints
- Direct access to approved source sections
- No irrelevant fleet or restricted engineering content

### Controls/reliability engineer

Question: "Were the calculations deterministic, and can I verify every input and source?"

Payoff:

- Exact event and equipment resolution
- Versioned diagnostic rule
- Measurement window and values
- Exact fault/model relationships
- Retrieval details, citations, and provenance

### Fleet engineering / AI architect

Question: "Can this become a reliable foundation for tools and agents rather than another silo?"

Payoff:

- Shared operational and knowledge model
- Reusable evidence records
- Permission-aware retrieval
- Fleet correlation
- Version history and reproducibility
- CockroachDB as the common application/knowledge/workflow layer

## 4. Facility naming recommendation

Use three real, publicly documented FPL facility names for the fleet shell:

1. **FPL Manatee Solar Energy Center** — proposed primary incident location
2. **FPL Babcock Ranch Solar Energy Center**
3. **FPL Citrus Solar Energy Center**

FPL's 2026 Ten-Year Site Plan lists Manatee, Babcock Ranch, and Citrus as FPL-owned solar facilities. FPL also publicly describes Babcock Ranch and Manatee energy-storage activity. Public names provide relevance, but no public technical fact should be stretched into fictional operational detail.

Required disclaimer:

> Facility names are based on public information. All assets, manufacturers, fault codes, measurements, documents, incidents, analyses, and recommendations shown in this demo are synthetic and are not representations of actual facility operations.

If stakeholder review suggests that real names create unnecessary risk, replace them with fictional names through seed/configuration data without changing application logic.

Public verification sources:

- FPL 2026 Ten-Year Site Plan: https://www.fpl.com/content/dam/fplgp/us/en/about/pdf/ten-year-site-plan.pdf
- FPL announcement naming Manatee, Babcock Ranch, and Citrus: https://newsroom.fpl.com/2017-01-13-FPL-announces-completion-of-three-new-universal-solar-energy-centers-and-plans-for-substantially-more-new-Florida-solar-in-2017
- FPL Manatee storage page: https://www.fpl.com/energy-my-way/battery-storage/manatee-battery.html

## 5. Core scenarios

### Scenario A — Primary: single-asset thermal derating

#### User question

Suggested wording:

> Why did inverter INV-042 at Manatee Solar enter a derated state after fault B17, and what should I inspect before reset?

The shorter original question remains supported:

> Why did inverter 42 enter a derated state after fault B17?

#### Synthetic asset and event

- Facility: FPL Manatee Solar Energy Center (public facility name only)
- Asset ID: `INV-042`
- Equipment type: utility-scale solar inverter
- Synthetic manufacturer: `Helios Power Systems (Synthetic)`
- Synthetic model: `HPS-2500X (Synthetic)`
- Synthetic firmware: `4.2.7-syn`
- Fault code: `B17`
- Event state: protective derating, not a complete trip
- Event time: seeded and configurable
- Controller temperature: `78.4 °C`
- Documented derating threshold: `75.0 °C`
- Threshold exceedance: `3.4 °C`
- Ambient temperature peak: `36.8 °C`
- Active-power output after derating: `64% rated`
- Prior output or expected band: include only if the deterministic rule and source are defined
- Reset constraint: controller temperature below `70 °C` for at least five minutes, followed by approved acknowledgement and ten-minute monitoring

#### Deterministic diagnostic

Versioned rule: `thermal_derating_b17/v1.0`

Inputs:

- Resolved equipment/model/firmware
- Fault event code and controller state
- Controller temperature near the event
- Ambient temperature
- Cooling-fan status if seeded
- AC output/operating mode
- Minimum sample count and time window

Deterministic findings:

1. Controller temperature exceeded the documented derating threshold by 3.4 °C.
2. Controller state and B17 event are consistent with protective thermal derating.
3. Elevated ambient temperature reduced available cooling margin.
4. If fan/airflow evidence is available, report it as a separate observation rather than inventing it.
5. Reset should not be recommended until the documented reset temperature and inspection conditions are met.

The diagnostic engine owns arithmetic and rule evaluation. The LLM may explain these findings but must not recalculate or reinterpret safety thresholds.

#### Intended structured answer

Headline:

> INV-042 entered protective derating after its controller exceeded the thermal threshold.

Supporting explanation:

- State the observed controller temperature, threshold, and difference.
- State that high ambient temperature is a contributing operating condition, not automatically the root cause.
- Recommend inspecting intake/filter condition, cabinet ventilation, and both cooling fans.
- State the documented reset condition.
- Cite each operationally material statement.

Evidence status:

> Sufficient evidence — deterministic threshold check completed, exact B17/model source found, approved site procedure found, and required measurement window present.

Do not display a model-generated percentage confidence.

### Scenario B — Secondary: fleet correlation

**Implemented and deployed.**

#### User question

> Which other inverters of this type recorded B17 in the prior 30 days, and was high ambient temperature associated?

#### Synthetic deterministic result target

Implemented deterministic result:

- 8 comparison B17 events
- 8 distinct HPS-2500X inverters
- 3 facilities
- 6 of 8 events occurred with ambient peaks greater than or equal to the 35 °C engineering context threshold
- 2 of 8 occurred below 35 °C as explicit counterexamples
- Result describes an association/pattern, not proven causality

#### Why it matters

This scenario proves that the system is not merely asking questions over manuals. It combines fleet identity, time-bounded events, typed health/weather summaries, deterministic aggregation, document knowledge, and an explainable result.

### Scenario C — Optional: document revision and reproducibility

Potential user action:

1. Review an analysis using Site Cooling Inspection Procedure revision 3.
2. Approve/ingest revision 4 with a changed inspection sequence.
3. Refresh the incident analysis.
4. Show the new answer using revision 4.
5. Reopen the earlier analysis and prove that it still cites revision 3 and its original chunks.

This is a powerful CockroachDB transaction/provenance story, but it is optional for the first build.

## 6. Product information architecture

### Screen 1 — Fleet overview

Route proposal: `/fleet`

Purpose:

- Establish a believable operational product before introducing the assistant.
- Show that the user is working within known facilities/assets, not asking an unscoped chatbot.

Content:

- Product header and synthetic-data label
- Fleet summary: facilities, monitored assets, open incidents, assets on watch
- Facility cards or compact list:
  - Manatee Solar — one active incident
  - Babcock Ranch Solar — systems nominal or one asset on watch
  - Citrus Solar — systems nominal
- Active incident card for `INV-042 / B17`
- Health/status legend
- Last refreshed timestamp
- Optional "CockroachDB connected" health indicator based on a real application health endpoint

Primary action:

> Investigate INV-042

### Screen 2 — Incident investigation

Route proposal: `/incidents/{incident_id}`

This is the central screen.

#### Header

- Breadcrumb: Fleet / Manatee Solar / INV-042
- Asset ID and state
- Synthetic equipment model and firmware
- Fault B17
- Event timestamp
- Clear synthetic-data badge

#### Incident facts strip

- Controller: 78.4 °C
- Threshold: 75.0 °C
- Ambient: 44.8 °C
- AC output: 6.2 MW
- State: derated

These values come from CockroachDB, not UI constants.

#### Investigation prompt

Suggested-question chip pre-populates the canonical question.

Free-form input allows additional questions but remains bounded to the current equipment/incident context unless the user explicitly changes scope.

Primary button:

> Analyze incident

#### Safe progress display

Show application/tool stages, not private reasoning:

1. Equipment resolved
2. Fault and measurement window found
3. Diagnostic checks completed
4. Access scope confirmed
5. Approved evidence retrieved
6. Answer generated
7. Evidence record saved

Each completed step may show duration. Failed or insufficient steps should be visible and should constrain the answer.

#### Structured result

Use a product analysis layout, not a chat bubble:

- Diagnosis headline
- Concise explanation
- Recommended response
- Ordered inspection steps
- Reset/safety constraint
- Evidence sufficiency badge
- Observed total response time
- "Review evidence" action
- "See what's under the hood" action

### Screen 3 — Evidence

May be a tab, drawer, or section within the incident route.

Purpose:

- Let a user verify the factual basis without reading database internals.

Group sources by type:

#### Operational evidence

- Fault event record
- Controller/ambient metric window
- AC output/operating state
- Diagnostic findings

#### Document evidence

- OEM manual excerpt
- Site procedure excerpt
- Fleet engineering bulletin if authorized
- Prior work order if used

Each document citation displays:

- Title
- Version/revision
- Approval status
- Page and section
- Source type
- Why it was selected
- Open-source action through an authorized endpoint

### Screen 4 — Under the hood / Provenance

This should serve Jason and Igor without overwhelming the technician view.

Suggested sections:

1. **Resolution**
   - Plant/equipment/fault IDs and exact match status
2. **Deterministic analysis**
   - Diagnostic name/version, input window, typed findings
3. **Authorization**
   - Acting persona, included scopes, number of excluded scopes; never reveal excluded content
4. **Retrieval**
   - Exact relational links
   - Vector query scope, model, distance metric, returned chunk ranks/distances
5. **Generation**
   - Generation provider/model ID, prompt-template version, generation duration
6. **Evidence record**
   - Answer ID, chunk IDs, metric IDs, content hashes, timestamps
7. **CockroachDB explanation**
   - Short architecture graphic showing structured state, vector retrieval, permissions, workflow, and citations together

Optional technical toggle:

- Show sanitized SQL/query shapes, not credentials or hidden prompts containing sensitive content.

### Screen 5 — Fleet correlation

Implemented route: `/fleet/correlation`.

Content:

- Fleet question
- Event count and distinct asset count
- Facility breakdown
- Ambient-temperature distribution
- Correlation findings and caveat
- Equipment/fault records supporting the result
- Engineering source used to interpret the pattern

## 7. Navigation and interaction model

Recommended desktop layout:

- Persistent top product bar
- Compact left fleet/facility navigation
- Main analysis canvas
- Right contextual panel for recommended response or evidence summary
- Tabs/sections for Analysis, Evidence, and Provenance

Primary design rule:

> Progressive disclosure: the first screen gives the decision; deeper layers provide verification and technical proof.

Avoid:

- A full-screen chat history
- Oversized decorative metrics with no action
- Dense architecture diagrams in the technician path
- Fake typing delays
- Hidden evidence changes when persona changes

## 8. Persona and permission behavior

Initial personas:

### Field technician

Can retrieve:

- Equipment/fault facts for assigned facility
- Approved OEM manual
- Approved site procedures
- Relevant safety/reset information

Cannot retrieve:

- Restricted fleet engineering investigations
- Other facilities' internal procedures
- Administrative ingestion metadata beyond what is required for citation

### Reliability/fleet engineer

Can retrieve:

- Field-technician content
- Fleet engineering bulletins
- Multi-site event summaries
- Broader equipment-model scope
- Detailed diagnostic/provenance information

### Contractor or limited viewer

Can retrieve:

- Explicitly approved equipment-model documentation
- Assigned asset facts if desired for the demo

Cannot retrieve:

- Internal site procedures
- Fleet bulletins
- Cross-facility data

The persona selector is a demo identity mechanism, not production authentication. Retrieval enforcement must still occur server-side before exact/vector retrieval. The UI may show that sources were excluded by policy, but it must never leak their text or titles if those titles are restricted.

## 9. Synthetic evidence pack

The first three documents are implemented as controlled synthetic originals, stable PDF snapshots, CockroachDB catalog/chunk records, and corporate Google Docs with tested section bookmarks. The UI opens the Google Doc citation and retains the snapshot/page as a stable fallback. S3 is an optional later archive.

Every page should contain a footer such as:

> SYNTHETIC DEMO DOCUMENT — Not NextEra or OEM operational guidance

### Document D1 — OEM manual

- **Implemented.**
- Title: `HPS-2500X Installation, Operations & Maintenance Manual`
- Version: `4.2`
- Synthetic document code: `OEM-HPS-2500X-OM`
- Length: 3 intentionally concise demo pages
- Critical section: page 3, `7.3 Fault B17 — Controller Thermal Derating`
- Critical content:
  - B17 definition
  - 75 °C derating threshold
  - Protective behavior
  - Cooling inspection items
  - Reset only after controller temperature falls below 70 °C
- Retrieval scope: fleet operations / equipment model
- Approval: approved/current

The file genuinely contains the cited page and exact cataloged text; the application opens that page.

### Document D2 — Site procedure

- **Implemented.**
- Title: `Manatee Inverter Cooling-System Inspection`
- Revision: `2.1`
- Synthetic document code: `SITE-MAN-COOLING-INSPECTION`
- Length: 3 intentionally concise demo pages
- Critical section: page 2, `4.2 Authorized inspection sequence`
- Critical content:
  - Safety preconditions
  - Exterior intake and exhaust-path inspection
  - Fan command/feedback verification
  - Documentation/escalation steps
  - OEM recovery and post-acknowledgement monitoring sequence
- Retrieval scope: plant/site
- Approval: approved/current

### Document D3 — Fleet bulletin

- **Implemented and engineering-restricted.**
- Title: `B17 Events During High-Ambient Operation`
- Version: `1.3`
- Synthetic document code: `FLEET-B17-HIGH-AMBIENT`
- Length: 2 intentionally concise demo pages
- Critical section: page 2, `2. Fleet Pattern and Engineering Guidance`
- Critical content:
  - Observed association between heat, cooling margin, and B17 events
  - Models/firmware within bulletin scope
  - Required inspection pattern
  - Explicit warning that ambient temperature alone does not prove root cause
- Retrieval scope: fleet engineering
- Approval: approved/current

### Document D4 — Work-order extract

- **Optional future breadth.**
- Title: `INV-042 Preventive Maintenance Record`
- Synthetic record: `WO-78431`
- Content:
  - Prior inspection date
  - Filter/fan observations
  - No claim of causal failure unless seeded diagnostic facts support it
- Retrieval scope: site maintenance
- Approval: operational record

### Document D5 — Revision for optional provenance scenario

- **Optional future versioning demonstration.**
- Title: same as D2
- Revision: `4`
- Changes:
  - Updated fan verification sequence or escalation criterion
- Initially not current or introduced through a controlled demo action

### Operational source O1 — Fault event

- Stored structured record, not a PDF
- Fault code, controller state, description, time, and source-reference metadata

### Operational source O2 — Metric window

- Stored typed summary rows
- Controller temperature, ambient temperature, AC output, fan state if available, sample count, and window boundaries
- Represents selected historian-derived data; does not claim CockroachDB is the raw historian

## 10. Data model to user experience mapping

| User-visible concept | CockroachDB source |
|---|---|
| Facility navigation | `plants` |
| Asset identity/model/firmware | `equipment` |
| B17 event and timestamp | `equipment_fault_events` |
| Temperature/output facts | `equipment_metric_summaries` |
| Deterministic threshold result | `diagnostic_runs`, `diagnostic_findings` |
| Approved document identity | `documents`, `document_versions` |
| Manual/site excerpts | `document_chunks` |
| Exact B17/model link | `document_fault_code_links`, `document_equipment_links` or a model link extension |
| Authorized search universe | `retrieval_scopes`, `retrieval_scope_permissions` |
| Retrieved evidence trail | `diagnostic_document_sources`, `diagnostic_metric_sources` |
| Fleet comparator event trail | `diagnostic_fault_event_sources` |
| Generated answer | `analysis_answers` |
| Exact answer evidence | `analysis_answer_document_sources`, `analysis_answer_metric_sources`, `analysis_answer_finding_sources` |

## 11. Analysis request lifecycle

### API-level sequence

1. Accept question, incident ID, and demo principal/persona.
2. Load the incident and resolve plant/equipment/model/fault using structured keys.
3. Load or execute the versioned deterministic diagnostic.
4. Determine authorized retrieval scopes.
5. Retrieve exact fault/equipment/model-linked document versions within authorized scopes.
6. Generate the question embedding with `text-embedding-3-small` using the same 1,536-dimension configuration as the stored document chunks.
7. Run CockroachDB vector retrieval only inside authorized scopes.
8. Combine and rank exact and semantic evidence without losing source metadata.
9. Validate minimum evidence requirements.
10. If sufficient, invoke the configured OpenAI generation model with:
    - Structured equipment facts
    - Deterministic findings
    - Approved document excerpts
    - Strict answer format and refusal/insufficiency rules
11. Validate returned citations against supplied evidence IDs.
12. Persist answer, timing, model/template versions, evidence references, and status.
13. Return structured JSON for product rendering.

### Insufficient-evidence behavior

If required evidence is missing:

- Do not invent a cause or procedure.
- Return the facts that are known.
- Identify the missing measurement/document category.
- Recommend escalation or data collection.
- Store the incomplete analysis and its evidence state.

This failure path is worth testing even if it is not part of the main presentation.

## 12. Live versus synthetic versus fallback

| Capability | First working version |
|---|---|
| Facility, equipment, fault, and metric data | Synthetic, stored and queried live in CockroachDB |
| Deterministic thermal diagnostic | Live application code with versioned rule |
| Source manuals/procedures | Synthetic corporate Google Docs with tested section bookmarks plus hashed PDF snapshots served by the AWS application |
| Document catalog/version/chunks | Live CockroachDB data |
| Embeddings | Live: OpenAI `text-embedding-3-small` at 1,536 dimensions for chunks and questions |
| Vector retrieval | Live: permission-first, prefix-scoped CockroachDB cosine query/index |
| Exact code/model retrieval | Live CockroachDB relational query |
| Permission filtering | Live server-side scope enforcement |
| Answer generation | Live: configurable `gpt-5.6-luna` Responses API call with strict Structured Outputs on the normal path |
| Evidence/provenance persistence | Live CockroachDB transaction(s) |
| Historian connector | Simulated boundary using seeded derived metric summaries |
| Weather API | Simulated boundary using typed seeded weather/ambient summaries |
| SharePoint/Confluence connector | Not built; controlled sources plus Google Docs/PDF snapshots represent the repository boundary |
| Production authentication | Not built; demo persona selector with real retrieval enforcement |
| Model-service presentation fallback | Live: intent-aware `thermal_derating_b17/v1.1` and fleet `fleet-b17-weather-fallback/v1.0` answers with explicit persisted/displayed fallback state |
| Response-time display | Actual observed request timing, not a scripted number |

## 13. Visible CockroachDB proof points

The UI should make the following defensible without becoming a database console:

1. Structured operational identity prevents ambiguous equipment/fault resolution.
2. Typed diagnostic inputs and results keep engineering logic deterministic.
3. Exact relationships handle codes/models/procedure identifiers.
4. Vector retrieval handles meaning-based document discovery.
5. Permission scope limits retrieval before the model sees evidence.
6. Operational state, embeddings, workflow, and evidence records live in one consistent application layer.
7. Every answer points to exact source versions and facts.
8. Historical answers remain reproducible after document updates.

The under-the-hood panel may visualize this compactly:

```text
Equipment + Fault + Metrics
            |
            v
Deterministic Diagnostic
            |
            +---- Exact document relationships
            |
            +---- Authorized vector retrieval
            |
            v
Evidence-constrained OpenAI generation
            |
            v
Answer + citations + immutable evidence record
```

## 14. Preliminary API surface

Provisional endpoints:

- `GET /api/fleet`
- `GET /api/plants/{plantId}`
- `GET /api/incidents/{incidentId}`
- `POST /api/analyses`
- `GET /api/analyses/{analysisId}`
- `GET /api/analyses/{analysisId}/provenance`
- `GET /api/documents/{documentVersionId}/pages/{pageNumber}`
- `POST /api/fleet-analyses`
- `GET /api/health`
- `POST /api/demo/reset` — protected and unavailable to ordinary viewers

The analysis POST body should include a scoped incident/equipment ID and demo principal. Do not trust a browser-supplied retrieval-scope list.

## 15. Proposed repository shape

Provisional structure:

```text
app/
  fleet/
  incidents/[id]/
  api/
components/
  fleet/
  incident/
  evidence/
  provenance/
lib/
  auth/
  db/
  diagnostics/
  retrieval/
  generation/
  provenance/
worker/
  ingest/
  embed/
  seed/
db/
  migrations/
  queries/
synthetic-content/
  source/
  rendered/
  manifests/
scripts/
  bootstrap/
  deploy/
  start-demo/
  smoke-test/
  demo-reset/
infra/
  documentation-or-iac/
docs/
  architecture/
  runbook/
```

Final framework conventions should be chosen once the AWS Linux environment is known.

Recorded runtime decisions:

- Use the existing CockroachDB Cloud Standard multi-region cluster, but create the `nextera_demo` database with only one primary database region initially.
- Align that primary database region with the EC2 application region when practical; add database regions later only for a demonstrated requirement.
- Verified 2026-08-23: EC2 is in `us-east-1`; `nextera_demo` uses primary/only region `aws-us-east-1` with `SURVIVE ZONE FAILURE`; the `nextera` schema now contains 21 application tables plus migration history.
- Verified 2026-08-22: CockroachDB is CCL v26.2.5 (cluster version 26.2), cosine vector distance works, `feature.vector_index.enabled` is `true`, and the RLS catalog is present.
- Use `text-embedding-3-small` at 1,536 dimensions for both document chunks and incoming questions.
- Begin answer-generation evaluation with `gpt-5.6-luna`, while keeping the generation model configurable and independent from the embedding model.
- Inject a dedicated, disposable OpenAI project key through a no-echo Linux launcher as an ephemeral `OPENAI_API_KEY` environment variable. Never store the key in the repository, `.env`, AWS Secrets Manager, EC2 user data, shell history, logs, or Codex commands; revoke old keys when rotating them.

## 16. Visual direction

### Recommended style

- Calm operational interface rather than futuristic AI styling
- Warm neutral background with deep green/teal operational accents
- Coral/red reserved for faults and threshold breach
- Lime or electric green used sparingly for active intelligence/status
- High information density but strong whitespace and hierarchy
- Sentence-case labels and plain language
- Evidence/citation design that feels native, not bolted on
- Motion limited to meaningful stage completion and data refresh

### Identity stance

- Inspired by energy/industrial interfaces, not a clone of the coworker screenshot
- No imitation of official NextEra branding without approval
- Synthetic demo disclaimer persistent but unobtrusive
- "AI" should not dominate the logo; the outcome is equipment intelligence

### Target viewport

Design first for a presentation-friendly desktop viewport around 1440×900, then ensure basic responsive behavior.

## 17. Proposed primary walkthrough

Target duration: approximately 6–8 minutes, adjustable.

### 0:00–0:45 — Establish the operational context

- Open fleet overview.
- Point out three facilities and one active incident.
- Explain that facility names are public but all operational content is synthetic.

### 0:45–1:30 — Open the incident

- Select Manatee Solar / INV-042 / B17.
- Show the event facts and derated state.
- Emphasize that the user starts from a known asset/event context.

### 1:30–2:45 — Run the investigation

- Select the suggested technician question.
- Start analysis.
- Let the stage indicator show structured resolution, diagnostic, authorization, retrieval, and generation.
- Display actual observed response time.

### 2:45–3:45 — Read the actionable result

- Explain the 3.4 °C threshold breach.
- Show recommended cooling inspection and reset condition.
- Point out evidence sufficiency rather than LLM confidence.

### 3:45–4:45 — Verify evidence

- Open the OEM manual at page 3, §7.3.
- Open the site procedure at page 2, §4.2.
- Show the structured metric window and diagnostic finding.

### 4:45–5:45 — Show the architecture under the hood

- Equipment/fault exact resolution
- Deterministic diagnostic version
- Authorized scopes
- Exact plus vector retrieval
- Stored answer/evidence record

### 5:45–6:30 — Demonstrate permission behavior

- Switch persona.
- Re-run or refresh retrieval.
- Show that restricted evidence is actually excluded, not simply hidden after generation.

### 6:30–8:00 — Optional fleet correlation

- Ask the 30-day B17 question.
- Show the fleet pattern and causality caveat.
- Tie the result to the reusable Next Brain/data-foundation vision.

## 18. Acceptance criteria for the first complete vertical slice

### Product

- Fleet and incident views look like one coherent application.
- The core experience is not visually dominated by a chat transcript.
- The canonical incident can be completed without manual database intervention.
- Every displayed operational value originates from an API/database response.
- Synthetic-data labeling is present.

### Diagnostic correctness

- 78.4 − 75.0 is deterministically stored/reported as 3.4 °C.
- Diagnostic version and measurement window are visible in provenance.
- LLM output does not introduce unsupported measurements or procedures.
- Trip and derating terminology remain consistent.

### Retrieval and permissions

- Exact B17/model relationships are queried relationally.
- Meaning-based retrieval uses a real CockroachDB vector query/index.
- Unauthorized scopes are excluded before vector/document text is returned to generation.
- A permission test proves that restricted chunks cannot appear in answer inputs or citations.

### Citations and provenance

- Every citation opens a real synthetic source/version/page.
- Answer evidence points to the exact chunks/metrics/findings used.
- Model ID, embedding model, prompt-template version, and durations are persisted.
- Earlier answers remain readable if a current document version changes.

### Operational readiness

- One command/script starts or updates the application on EC2.
- One idempotent command seeds the canonical dataset.
- One protected command resets the canonical scenario.
- Health check covers application and CockroachDB connectivity.
- Smoke test validates the primary flow.
- No secrets are committed.
- No PowerShell is required.

## 19. Build checkpoints

### Checkpoint 0 — Connected foundation

**Completed 2026-08-23.** See `docs/CHECKPOINT_0_READOUT.md` for the deployed topology, schema groups, identity boundary, seed data, query plans, reset proof, and migration lesson.

Deliver:

- AWS Linux/plink development access
- Repository and TypeScript toolchain scaffold
- CockroachDB version/region/feature inventory
- `nextera_demo` database with one primary region and separate setup/application identities
- First migration groups, seed/reset command, and database health command
- Canonical B17 incident loaded and its core relational queries validated with `EXPLAIN`

Purpose:

- Establish a repeatable, cluster-validated foundation before either UI polish or document-corpus expansion.

### Checkpoint 1 — Product shell with real relational data

**Completed 2026-08-23.** Delivered:

- Fleet screen
- Incident screen
- Seeded CockroachDB plants/equipment/fault/metrics
- Static placeholder analysis result clearly marked as not yet live
- First screenshot review with the user

Implementation notes:

- `/fleet`, `/assets`, and `/incidents/{faultEventId}` are server-rendered from CockroachDB.
- `/api/fleet`, `/api/assets`, and `/api/incidents/{faultEventId}` expose matching structured JSON contracts.
- The seed now contains 3 public facility names, 60 synthetic assets (20 per facility) across 4 equipment types, 3 synthetic fault events, and 7 typed metric summaries.
- The restricted `nextera_app` identity serves the product; `ron` was used only for the controlled seed write.
- The production server binds to EC2 port 3000; security-group ingress is restricted to the user's current public IP for direct browser review.
- The static analysis/evidence preview explicitly states that it is not live and does not manufacture a cause or recommendation.
- A follow-on polish pass established the intended 75% field-product / 25% technical-proof balance, increased presentation typography, made the Investigations navigation functional, ordered Manatee and open incidents first, and made B17, A12, and C04 investigation screens fault- and metric-aware.
- The Monitored Assets KPI now opens a searchable, filterable, sortable asset register; inventory rows with event history link to the corresponding investigation.
- Polished pixel-review captures are stored at `docs/checkpoint1-polished-fleet.png`, `docs/checkpoint1-polished-b17.png`, `docs/checkpoint1-polished-a12.png`, and `docs/checkpoint1-polished-c04.png`.

Purpose:

- Validate product shape and visual direction before retrieval/generation work.

### Checkpoint 2 — Deterministic diagnosis and real evidence

**Completed for the canonical B17 investigation on 2026-08-23.** Delivered:

- Live `thermal_derating_b17/v1.0` rule with three typed findings and bounded recommendation
- Three visibly synthetic authoring sources plus page-stable, hashed PDF snapshots
- Google/source and snapshot metadata with all three corporate Google Doc bookmarks configured and tested
- Document catalog/version/page-aware chunks and exact B17/model/equipment links
- Permission-first retrieval returning two Field Technician sources and excluding the engineering-only bulletin
- Short retry-safe persistence transaction for run, answer, findings, metrics, documents, and exact provenance links
- Live evidence view, source opening, rerun interaction, persisted reload, and technical evidence trail
- Safe HTTP 422 behavior for unsupported A12 and C04 analysis requests at that checkpoint; A12 was subsequently completed in Checkpoint 6, while C04 remains intentionally unsupported

No embeddings or LLM calls are used at this checkpoint.

### Checkpoint 3 — Real embeddings and authorized retrieval

**Completed 2026-08-23.** Delivered:

- OpenAI `text-embedding-3-small` embeddings for all three approved chunks and incoming questions at 1,536 dimensions
- Dedicated least-privilege CockroachDB embedding-worker login and mode-0600 runtime URI
- Content-addressed, idempotent embedding metadata and worker
- Permission-first per-scope CockroachDB cosine retrieval with the existing prefix vector index
- Four passing golden relevance/authorization cases, including engineer-versus-field access to the restricted bulletin
- Live B17 analysis using and persisting vector rank, cosine distance, embedding model, exact source/version/page, and answer provenance
- Under-the-hood semantic-match presentation plus exact-match deterministic fallback

See `docs/CHECKPOINT_3_READOUT.md` for results, observed distances, query-plan notes, credential handling, and Checkpoint 4 handoff.

### Checkpoint 4 — Live generation and provenance

**Completed 2026-08-23.** Delivered:

- Configurable default `gpt-5.6-luna` generation model independent from `text-embedding-3-small`
- Responses API request containing only typed incident facts, deterministic findings, and two authorized chunks
- Strict Structured Outputs plus application-side source-relationship, citation-ID, and critical-fact validation
- Deterministic diagnosis/inspection/recovery/fleet/general question-intent routing so the response addresses the actual technician question
- Application-authored evidence-scope language that states the two excerpts cannot provide a complete inverter-health assessment or rule out unrelated conditions
- Question-focused deterministic fallbacks, including a real inspection checklist rather than the canonical B17 diagnosis for every question
- Application-created `[1]`/`[2]` markers linked to exact source/version/page/bookmark records
- Persisted provider/model/prompt/fallback/timing plus metric/finding/document/vector provenance
- Tested live diagnosis/inspection/recovery, fleet-evidence limitation, unsupported component diagnosis/replacement, adversarial, schema/citation rejection, critical-detail rejection, and persisted intent-aware fallback paths
- Live UI mode, question-focus label, actual duration, model/prompt proof, and `used in generation` evidence labels

See `docs/CHECKPOINT_4_READOUT.md` for the complete contract, validation results, observed live answer, query-plan summary, security behavior, and Checkpoint 5 handoff.

### Checkpoint 5 — Fleet scenario and demo polish

**Core fleet scenario completed 2026-08-23.** Delivered:

- A dedicated `/fleet/correlation` product route linked from the fleet overview
- A global upper-right persona selector backed by a server-issued role cookie, keeping one correlation URL for both personas
- An above-the-fold Fleet Intelligence action plus a prominent `New` fleet card
- 8 same-model B17 comparator events across 3 facilities, with 6 at/above 35 °C and 2 below
- Deterministic aggregate/findings plus strict live `gpt-5.6-luna` interpretation and safe fallback
- Server-enforced Field Technician HTTP 403 / Fleet Engineer authorization boundary
- Restricted engineering-bulletin vector retrieval and Google Docs citation
- Exact persistence of 8 event sources, 16 metric sources, 3 findings, 1 document source, answer, and links
- CockroachDB `EXPLAIN`, role/safety, live generation, build, asset, and browser smoke coverage

See `docs/CHECKPOINT_5_READOUT.md` for the fleet dataset, role boundary, grounded interpretation contract, and persisted comparison provenance.

### Checkpoint 6 — Independent A12 inverter investigation

**Completed 2026-08-23.** Delivered:

- A complete `INV-102 / A12` cooling-fan command/feedback vertical slice using the shared incident shell
- Three scenario-specific, visibly synthetic sources: SD-8400 fault guidance, Babcock inspection procedure, and return-to-service checklist
- Corporate Google Docs bookmarks plus immutable, page-stable PDF snapshots
- Typed command, feedback, variance, temperature, and output metrics with deterministic threshold/arithmetic validation
- Permission-first semantic ranking intersected with exact A12/model/equipment applicability
- Diagnosis, authorized exterior inspection, and return-to-service question intents
- Strict evidence-constrained generation, three-source citation validation, safe deterministic fallbacks, and exact CockroachDB provenance
- Safety boundaries that do not convert signal variance into an unsupported failed-fan diagnosis or premature release recommendation

See `docs/CHECKPOINT_6_READOUT.md` for the evidence pack, rule contract, retrieval results, generation validation, and regression coverage.

### Checkpoint 7 — Non-inverter P09 platform breadth

**Completed 2026-08-23.** Delivered:

- Citrus `TRK-01 / P09`, proving that the shared incident experience adapts to a tracker controller without a separate asset-specific route
- Commanded angle, measured angle, derived deviation, and drive-current context metrics
- Safe Stow Hold operating state plus movement-envelope safety boundaries
- Three tracker-specific, visibly synthetic sources with Google Docs bookmarks and PDF snapshots
- Exact P09/TRC-8/equipment applicability, scoped embeddings, question-sensitive ranking, and three-source generation
- Diagnosis, exterior-observation, and controlled return-to-automatic question intents with strict live/fallback validation
- A dynamic Fleet Overview attention queue: every active incident produces an asset/state-aware attention card, acknowledged work appears separately, and cleared history remains in recent activity
- Ten passing retrieval golden cases across B17, A12, P09, and the Field Technician/Fleet Engineer permission boundary

See `docs/CHECKPOINT_7_READOUT.md` for the tracker scenario, evidence, safety contract, persisted provenance, and full regression results.

## 20. Decisions and remaining demo choices

Infrastructure and core product decisions are resolved: EC2 region/runtime, CockroachDB database locality and identities, vector support, direct-IP demo access, Google Docs plus PDF snapshots, public facility names, the 75% field-product / 25% technical-proof direction, and deterministic fallback behavior.

Remaining choices are deliberately presentation-focused:

1. Decide whether stakeholder access needs HTTPS or whether restricted direct HTTP remains sufficient.
2. Decide whether C04 needs a fourth fully grounded evidence/rule/generation slice. It is currently an intentional and honest HTTP 422 unsupported case.
3. Decide whether containerization is valuable before the customer demo; it is not required for the current EC2 deployment.
4. Decide whether to capture a backup video in addition to screenshots and the deterministic fallback path.

## 21. Recommended immediate action

Checkpoints 0–7 are complete. Continue with this working order:

1. **Completed:** inspect the target cluster and validate the one-primary-region demo database.
2. **Completed:** create separate setup/application identities, scaffold migrations, and seed one complete B17 incident.
3. **Completed:** prove the incident through a TypeScript CLI and `EXPLAIN` its important queries.
4. **Completed:** build and privately deploy the thin fleet/incident shell against real relational data.
5. **Completed:** implement the deterministic B17 diagnostic, author/render/catalog the three canonical evidence documents, enforce exact permission-aware evidence retrieval, and persist the analysis trail.
6. **Completed:** implement scoped embeddings, a dedicated worker identity, golden retrieval/authorization tests, and persisted vector provenance.
7. **Completed:** add evidence-constrained generation, strict citation/critical-fact validation, configurable model metadata, persisted provenance, adversarial tests, and deterministic fallback behavior.
8. **Completed:** make B17 answers question-aware, attach explicit evidence limitations, and prove safe diagnosis, inspection, recovery, fleet-limit, and unsupported-question behavior.
9. **Completed:** add the 30-day B17 fleet-correlation story and server-enforced Fleet Engineer role-switch.
10. **Completed:** add the independent A12 evidence pack, typed fan-variance rule, question-aware live/fallback answers, citations, and provenance.
11. **Completed:** add the non-inverter P09 tracker scenario, three-document evidence pack, movement-safety contract, grounded answers, and provenance.
12. **Completed:** replace the single hard-coded attention banner with a dynamic active/acknowledged incident queue.
13. **Next:** produce the concise presenter runbook, deterministic reset/rehearsal workflow, expected-question/answer guide, and compact current/future architecture visual.
14. **Next:** rehearse B17 individual diagnosis followed by Fleet Intelligence, then A12 and P09 as platform-breadth proof; verify all presenter-facing Google Docs links under the intended Cockroach Labs account.
15. **Optional:** implement C04 only if its additional breadth is worth more than rehearsal, reliability, and presentation polish.

This order deliberately creates the schema first, but only for one complete story. Documents, ingestion, retrieval, API code, and UI then grow around the same scenario instead of being built as disconnected workstreams.

# Checkpoint 5 Readout — Fleet Correlation and Role-Bound Engineering Evidence

Date: 2026-08-23

Status: **Core fleet-correlation story complete and deployed.** A12 was subsequently completed as Checkpoint 6; C04 and final runbook/architecture polish remain follow-on work.

## Product outcome

Equipment Intelligence now has a second complete story beyond the single-asset B17 diagnosis:

> Which other inverters of this type recorded B17 in the prior 30 days, and was high ambient temperature associated?

The new route is:

`http://44.201.155.216:3000/fleet/correlation`

The fleet overview contains a prominent Fleet Intelligence entry point. The analysis page preserves the intended 75% believable product / 25% technical proof balance with:

- A 30-day, same-model event summary
- Field Technician and Fleet Engineer role views
- A question workbench and grounded result
- An eight-row fleet event table
- Clear association-versus-causation language
- A compact CockroachDB evidence/provenance panel
- A direct link to the bookmarked engineering bulletin in Google Docs

## Synthetic comparison dataset

INV-042 remains the anchor event and is excluded from the comparator count. The prior 30-day dataset contains eight cleared B17 events on eight other `HPS-2500X (Synthetic)` inverters:

| Asset | Facility | Event time (UTC) | Controller peak | Ambient peak | At/above 35 °C |
|---|---|---:|---:|---:|---|
| INV-107 | Babcock Ranch | 2026-08-12 19:06 | 80.1 °C | 38.4 °C | Yes |
| INV-039 | Manatee | 2026-08-11 18:21 | 79.0 °C | 37.1 °C | Yes |
| INV-205 | Citrus | 2026-08-09 19:14 | 78.9 °C | 37.5 °C | Yes |
| INV-041 | Manatee | 2026-08-07 18:55 | 77.9 °C | 36.2 °C | Yes |
| INV-111 | Babcock Ranch | 2026-08-03 19:32 | 77.6 °C | 35.6 °C | Yes |
| INV-034 | Manatee | 2026-07-29 18:47 | 76.2 °C | 34.1 °C | No |
| INV-209 | Citrus | 2026-07-24 19:03 | 77.2 °C | 35.2 °C | Yes |
| INV-114 | Babcock Ranch | 2026-07-20 18:38 | 75.8 °C | 32.8 °C | No |

Deterministic summary:

- 8 events
- 8 distinct comparison assets
- 3 facilities
- 6 of 8 at or above 35 °C
- 2 of 8 below 35 °C
- 75% high-ambient-context share
- 35.9 °C average ambient peak
- 77.8 °C average controller peak

The two below-threshold events are intentional counterexamples. They prevent the data from telling an unrealistically perfect story and support the correct conclusion: high ambient temperature is associated with this event slice but is not sufficient to establish cause.

The historical rows use source system `synthetic_fleet_history_adapter`. The fleet and inventory queries exclude that source from the operational incident queue/latest-activity view, so the main product still exposes only the three curated incident screens. The dedicated correlation query retains all eight rows.

## Authorization behavior

The role switch changes both the presentation and server behavior:

- `field-tech-demo` can see the structured comparison facts, but the engineering analysis and restricted bulletin are withheld.
- A Field Technician `GET` returns `access: engineering_restricted` and `latestAnalysis: null`.
- A Field Technician `POST` returns HTTP 403.
- `fleet-engineer-demo` has read permission on the `engineering-restricted` retrieval scope and can run/reload the analysis.
- The application resolves authorized scopes before cosine retrieval. The model never receives an unauthorized chunk.

This is a demo identity mechanism, not production authentication, but the retrieval and API boundary are real server-side checks rather than cosmetic hiding.

## Analysis contract

Versioned deterministic rule:

`fleet_b17_weather_correlation/v1.0`

Generation prompt:

`fleet-b17-weather-grounded/v1.0`

Deterministic fallback:

`fleet-b17-weather-fallback/v1.0`

The live Responses API request receives only:

- The exact eight event rows and deterministic aggregate
- The 35 °C engineering context threshold
- The one authorized engineering bulletin chunk
- The user's question

Strict Structured Outputs return `answer`, `interpretation`, and `recommended_action` sections with separate evidence IDs. Application validation requires:

- The exact event and facility counts
- High-ambient and below-threshold counts
- The 35 °C context threshold
- A direct statement that association does not prove/establish causation
- Fleet-event evidence for the aggregate
- Engineering-bulletin evidence for interpretation/action
- Same-model peer comparison and cooling/inspection language
- No invented failed component or replacement recommendation

The application, not the model, appends `[Fleet event set]` and `[1]` citation markers. The deterministic fallback observes the same facts and caveats.

## CockroachDB schema and provenance

Migration `008_fleet_correlation_provenance.sql` adds:

`nextera.diagnostic_fault_event_sources`

Each row links a diagnostic run to an exact anchor/comparator fault record with a stable ordinal. The table has UUID foreign keys, typed purpose/ordinal constraints, a distributed UUID-based primary key inherited from the parent IDs, an event lookup index, read access for `nextera_app_read`, and insert/update access for `nextera_app_runtime`.

A successful fleet run uses the existing provenance graph plus the new event-source table to persist:

- Anchor equipment/fault/principal/question/timing
- 8 exact comparator fault-event links
- 16 exact controller/ambient metric links
- 3 typed findings
- 1 exact restricted document chunk/version/scope
- Vector method/rank/distance and embedding model when semantic retrieval succeeds
- Answer text, recommendation, provider/model, prompt version, duration, fallback state
- Answer-to-document, answer-to-metric, and answer-to-finding links

Persistence is one short transaction with bounded CockroachDB serialization retries. Multi-row provenance inserts are set-based from UUID arrays rather than one network round trip per event/metric.

## First live validated result

The automated Fleet Engineer smoke run produced:

- Live generation model: `gpt-5.6-luna`
- Embedding model: `text-embedding-3-small`
- Prompt version: `fleet-b17-weather-grounded/v1.0`
- Fallback: `false`
- Observed end-to-end duration: 4,952 ms
- Event sources persisted/reloaded: 8
- Metric sources: 16
- Restricted document sources: 1
- Confidence label: `moderate`

Observed answer:

> In the prior 30 days, 8 HPS-2500X inverters recorded B17 across 3 facilities: INV-107, INV-039, INV-205, INV-041, INV-111, INV-034, INV-209, and INV-114. High ambient temperature was associated with 6 events. [Fleet event set]
>
> 6 events occurred above the 35 °C fleet-analysis context threshold, and 2 occurred below it. This association does not prove causation; 35 °C is not an OEM fault threshold. [Fleet event set][1]

Recommended action:

> Compare affected units with same-model peers and review cooling-path inspection results. [1]

This is one observed run, not a latency benchmark or SLA.

## SQL validation

Every new SQL statement was run through CockroachDB `EXPLAIN` against the connected Standard cluster, including:

- Event-set detail query
- Aggregate query
- Restricted bulletin authorization query
- Latest analysis/event-source reload queries
- Diagnostic run/findings insertion
- Set-based event and metric provenance insertion
- Document/answer/link insertion

All plans compiled successfully. The bounded event/metric provenance plans use primary-key and existing fault/metric secondary-index lookups. The corpus is deliberately small; no unsupported scale/latency claim is made from these plans.

## Tests completed

- TypeScript typecheck
- Next.js production build
- All new CockroachDB `EXPLAIN` checks
- Exact 8/3/6/2 aggregate contract
- Field Technician GET restriction/no answer leak
- Field Technician POST HTTP 403
- Fleet Engineer live generation
- Association/causality language validation
- Unsupported component-failure assertion rejection
- Restricted-scope document assertion
- 8 exact persisted/reloaded event sources
- Google Docs source URI reload
- Fleet/correlation server-rendered HTML
- Correlation JavaScript/CSS browser assets
- Existing fleet, assets, B17, A12, C04, evidence snapshot, and unsupported-analysis smoke paths

Post-readout UX refinement: persona selection is now global in the upper-right product header. `POST /api/persona` validates the requested Field Technician/Fleet Engineer role and stores it in an HttpOnly, same-site cookie. The correlation route reads the cookie server-side, so one stable URL supports both roles without role query parameters. The fleet page also has a new above-the-fold Fleet Intelligence button plus the existing card, now marked `New`.

Incident-to-fleet routing refinement: a B17 incident question classified as fleet history now opens Fleet Intelligence with the exact question preserved. The Fleet Engineer path automatically runs the authorized correlation; the Field Technician path shows the event facts but retains the server-enforced engineering restriction. The regression suite now uses the user's exact weather-across-other-inverters question and requires the 8/6/2 counts plus association-not-causation language.

Current production process after final deployment: PID `65878`, bound to `0.0.0.0:3000`.

## Secret handling

The disposable OpenAI key remained only in the live server process. The preferred build helper transferred it directly to the replacement process without displaying or persisting it.

The local ignored `keys.sh` owner URI was copied to a mode-0600, explicitly named temporary EC2 file only for migration/seed execution. That file was deleted immediately after each owner operation. No secret value was printed or placed in project documentation.

## Remaining work

Checkpoint 5's core fleet story is complete. The next highest-value work is:

1. Review the new page with the user at presentation size and make any UI/story adjustments.
2. Produce the final presenter runbook and compact architecture visual.
3. Review the completed A12 evidence pack and grounded investigation from Checkpoint 6; decide whether C04 needs the same treatment before the demo.
4. Add HTTPS/reverse proxy/containerization only if sharing requirements justify them.

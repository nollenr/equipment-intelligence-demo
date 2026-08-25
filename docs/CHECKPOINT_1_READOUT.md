# Checkpoint 1 Readout — Walking Product Shell

Date completed: 2026-08-23

Status: complete

## Outcome

Checkpoint 1 delivers a believable, IP-restricted Equipment Intelligence product shell backed by live CockroachDB relational data. It includes:

- A presentation-ready fleet overview
- A searchable, filterable, sortable monitored-asset register
- A canonical `INV-042 / B17` incident investigation
- Fault- and metric-aware `A12` and `C04` incident investigations
- Server-rendered database-backed pages
- Matching fleet and incident JSON APIs
- A modest multi-facility synthetic fleet
- An explicit, honest not-live analysis/evidence preview
- A production Next.js build on the AWS Linux host
- Direct browser access restricted by EC2 security-group source IP, startup/stop helpers, and smoke tests
- Fleet and incident pixel-review captures

No deterministic diagnosis, synthetic source-document content, vector retrieval, or LLM output is represented as live in this checkpoint.

## Deployed topology

```text
Local browser / screenshot runner
          |
          | HTTP port 3000; EC2 security group limits source IP
          v
EC2 us-east-1, 0.0.0.0:3000 listener
Next.js 16.3.2 / React 19.2.8 / Node.js 24.19.0
          |
          | PostgreSQL wire protocol / TLS
          | restricted nextera_app identity
          v
CockroachDB Cloud Standard
nextera_demo / primary region aws-us-east-1
```

The web server listens on the EC2 network interface. The EC2 security group—not application authentication—currently limits port 3000 to the user's public IP. Do not broaden the rule to `0.0.0.0/0`.

## Product routes

| Route | Purpose | Data behavior |
|---|---|---|
| `/` | Entry point | Redirects to `/fleet` |
| `/fleet` | Fleet overview | Live server-side CockroachDB queries |
| `/assets` | Monitored-asset register | Live CockroachDB inventory; client-side filtering/sorting for the 60-row demo corpus |
| `/incidents` | Investigation entry point | Redirects to the primary B17 investigation |
| `/incidents/{faultEventId}` | Incident investigation | Live incident and metric queries by UUID |
| `/api/fleet` | Fleet JSON contract | Live restricted-runtime query |
| `/api/assets` | Asset inventory JSON contract | Live restricted-runtime query |
| `/api/incidents/{faultEventId}` | Incident JSON contract | Live restricted-runtime query; 404 for invalid/missing ID |

Both pages are dynamic server-rendered routes. The APIs catch internal errors, log only the error message, and return a generic 503 body rather than leaking connection material.

## Synthetic relational inventory

Facility names come from public information. Everything operational is synthetic.

### Facilities

1. FPL Manatee Solar Energy Center
2. FPL Babcock Ranch Solar Energy Center
3. FPL Citrus Solar Energy Center

### Current totals

- 3 facilities
- 60 synthetic assets (20 per facility)
- 4 equipment types: 48 solar inverters, 6 tracker controllers, 3 weather stations, and 3 step-up transformers
- 3 synthetic fault events
- 7 typed metric-summary rows
- 2 open incidents (`active` or `acknowledged`)
- 2 assets on watch (`derated` or `maintenance`)

### Fault scenarios

| Facility / asset | Fault | State | Purpose |
|---|---|---|---|
| Manatee / `INV-042` | `B17` controller thermal derating | Active / derated | Canonical primary investigation |
| Babcock Ranch / `INV-102` | `A12` cooling fan feedback variance | Acknowledged / maintenance | Second open/watch scenario |
| Citrus / `INV-202` | `C04` telemetry communications timeout | Cleared / normal | Resolved event example |

The three routes use the same reusable product shell but do not merely swap labels:

- B17 highlights controller peak, derating threshold, ambient peak, and latest output; its question and evidence plan focus on thermal derating and reset checks.
- A12 highlights fan variance, variance threshold, ambient peak, and maintenance state; its question and evidence plan focus on cooling-fan inspection and return to service.
- C04 highlights telemetry-gap duration, timeout threshold, latest output, and event duration; its question and evidence plan focus on communications recovery and closure validation.

The existing Checkpoint 0 canonical incident values remain unchanged: controller peak 78.4 °C, threshold 75.0 °C, 3.4 °C exceedance, ambient peak 36.8 °C, and latest output 64% rated.

`db/seeds/002_fleet_product_shell.sql` is idempotent through `INSERT ... ON CONFLICT`. The reset remains explicitly scoped to the three deterministic demo plant UUIDs and their cascading synthetic children.

## Runtime identity boundary

- `ron` was used only to execute the controlled operational seed write.
- The web pages, APIs, health check, and all `EXPLAIN` validation use `nextera_app`.
- The runtime URI remains only in `/home/ec2-user/.config/nextera-demo/db.env` with mode `0600`.
- The server start helper loads that file without printing it.
- No database URI/password or OpenAI key is stored in the repository, screenshots, or this document.

## Visual/product decisions validated

- The application reads as an operational fleet product, not a generic chatbot.
- Deep forest/teal, warm neutral surfaces, sparse lime, and coral attention states create a distinct visual identity without copying NextEra branding or the coworker screenshot.
- The synthetic-data label persists in the product header and a complete disclaimer persists in the footer.
- Fleet context precedes AI interaction.
- The canonical incident displays real database values before showing the investigation prompt.
- The analysis card says `Analysis preview — not live yet` and explicitly states that no cause, procedure, or recommendation is generated at this checkpoint.
- The evidence panel says `Not ingested`; it names planned source categories without inventing citations.
- The under-the-hood panel exposes structured resolution without exposing credentials or hidden reasoning.
- The interface intentionally allocates roughly 75% of its visual emphasis to a believable field product and 25% to technical proof.
- Manatee remains the narrative starting point; incident ordering is active, then acknowledged, then cleared.
- Typography and status treatment were increased for presentation readability, and `Investigations` now links to a working route.
- The polished screenshot review found no blocking layout or clipping issue in the primary interaction area at 1440-pixel presentation width.

Pixel-review captures:

- `docs/checkpoint1-fleet.png` — 1440 × 900
- `docs/checkpoint1-incident.png` — 1440 × 1000
- `docs/checkpoint1-polished-fleet.png` — 1440 × 1000
- `docs/checkpoint1-polished-b17.png` — 1440 × 1000
- `docs/checkpoint1-polished-a12.png` — 1440 × 1000
- `docs/checkpoint1-polished-c04.png` — 1440 × 1000
- `docs/fleet-assets.png` — 1440 × 1000
- `docs/asset-inventory.png` — 1440 × 1000

## Application query shapes

All production `SELECT` statements use explicit columns. The Checkpoint 1 additions are:

1. Fleet scalar totals
2. Facility/asset/open-incident rollup
3. Recent incident stream ordered by event time
4. Incident lookup by fault-event UUID
5. Incident metrics by fault-event UUID

The existing health and canonical incident queries remain validated as well.

The asset inventory adds one explicit-column query. It joins equipment to its facility and left-joins the highest-priority/latest fault per asset through a ranked three-row event CTE. The browser receives the complete 60-row register once and performs interactive filtering/sorting locally, avoiding a server round trip on every presentation click. Rows remain authoritative CockroachDB data; no synthetic browser-only assets are introduced.

## CockroachDB EXPLAIN evidence

`npm run db:explain` completed under `nextera_app` after the expanded fleet seed. Key output is recorded below.

### Health

```text
distribution: local

• values
  size: 4 columns, 1 row
```

### Canonical incident

```text
distribution: local

• limit
└── • lookup join  plants@plants_pkey
    └── • lookup join  equipment_fault_events@equipment_fault_events_pkey
        └── • lookup join  equipment_fault_events@fault_by_equipment_code_time_idx
            └── • render
                └── • filter  equipment_code = 'INV-042'
                    └── • scan  equipment@equipment_pkey
```

### Fleet summary

```text
distribution: local

• root
├── • values
├── • subquery @S1 -> scalar group -> plants scan
├── • subquery @S2 -> scalar group -> equipment scan
├── • subquery @S3 -> filter operating_status != 'normal' -> equipment scan
└── • subquery @S4 -> filter event_status IN ('acknowledged', 'active') -> fault scan
```

### Facility rollup

```text
distribution: local

• sort  +Manatee-first,-open_incident_count,-count,+display_name
└── • render
    └── • group (hash) by plant_code
        └── • render
            └── • hash join (left outer)
                ├── • lookup join (left outer)  equipment@equipment_by_plant_type_idx
                │   └── • scan  plants@plants_pkey
                └── • group (hash) by equipment_id
                    └── • scan  equipment_fault_events@fault_by_time_idx
```

### Recent incidents

```text
distribution: local

• top-k  +status-priority,-event_time,+id  k: 6
└── • render
    └── • lookup join  plants@plants_pkey
        └── • lookup join  equipment@equipment_pkey
            └── • scan  equipment_fault_events@equipment_fault_events_pkey
```

### Incident by ID

```text
distribution: local

• lookup join  plants@plants_pkey
└── • lookup join  equipment@equipment_pkey
    └── • scan  equipment_fault_events@equipment_fault_events_pkey
          spans: exact canonical fault-event UUID
```

### Incident metrics

```text
distribution: local

• render
└── • index join  equipment_metric_summaries@equipment_metric_summaries_pkey
    └── • scan  equipment_metric_summaries@metric_by_fault_idx
          spans: exact canonical fault-event UUID
```

### Asset inventory

```text
distribution: local

• sort  +Manatee-first,+facility,+equipment_type,+equipment_code
└── • render
    └── • hash join (left outer) on equipment ID
        ├── • lookup joins  equipment@equipment_pkey / equipment_plant_code_unique
        │   └── • scan  plants@plants_pkey
        └── • filter  row_number = 1
            └── • window
                └── • scan  equipment_fault_events@fault_by_equipment_code_time_idx
```

Full scans in the fleet totals/rollups, 60-row inventory, and three-row incident queue are intentional for this demo corpus. CockroachDB kept every plan local, the queue uses a six-row top-k after explicit status priority, incident lookup is an exact primary-key span, and metrics use the fault index. Optimizer index suggestions were not applied to this tiny dataset; doing so now would add write/storage cost without a demonstrated workload benefit. Re-evaluate plans after the fleet corpus grows materially.

Before applying the idempotent expansion seeds, `EXPLAIN INSERT` showed local upserts using `equipment_plant_code_unique` as the conflict arbiter, primary-key and unique-index lookup joins, and a foreign-key constraint check against `plants@plants_pkey`. The 12-row support-equipment write likewise planned locally against exactly 12 values. The writes use generated UUID primary keys and `ON CONFLICT (plant_id, equipment_code) DO UPDATE`; no generic JSON payload or sequential key was introduced.

## Verification performed

- `npm install --no-audit --no-fund` completed and updated the lockfile.
- `npm run typecheck` passed.
- `npm run build` passed under Next.js 16.3.2/Turbopack.
- Dynamic route inventory was confirmed for both pages and APIs.
- `npm run db:explain` passed for all seven application queries.
- `scripts/start-demo.sh` started the `0.0.0.0:3000` production listener.
- `scripts/smoke-test.sh` passed for fleet page, fleet API, canonical incident page, and canonical incident API.
- `/api/fleet` returned the expected totals: 3 facilities, 60 assets, 2 watch assets, and 2 open incidents, with Manatee first.
- `/api/assets` returned 60 assets across 4 equipment types and 3 facilities; `/assets` rendered successfully through the restricted identity.
- Direct page/API checks passed separately for B17 (active, 3 metrics), A12 (acknowledged, 2 metrics), and C04 (cleared, 2 metrics).
- The latest Fleet and Asset Inventory screenshots were captured over the IP-restricted direct connection and visually inspected at 1440 × 1000; the filters, table headings, status treatments, and initial rows fit without primary-area clipping.

## Operating the shell

With the EC2 security-group rule restricted to the user's current public IP, browse directly to:

```text
http://44.201.155.216:3000/fleet
```

On EC2, application lifecycle commands are:

```bash
cd /home/ec2-user/nextera-demo
./scripts/start-demo.sh
./scripts/smoke-test.sh
./scripts/stop-demo.sh
```

The process ID and server log live under `/home/ec2-user/.local/state/nextera-demo/`.

## Framework security/update note

The current service permits direct HTTP only from the source IP allowed by its EC2 security group. Next.js announced a scheduled August 26, 2026 security release that includes a critical fix for the 16.3 release line. Before broadening ingress or adding a public/HTTPS endpoint, update to the patched 16.3 version, rebuild, re-run TypeScript/SQL/smoke validation, and update this readout. Source: https://nextjs.org/blog

## Checkpoint 2 handoff

The next work should keep the current UI stable while adding real evidence behind it:

1. Implement `thermal_derating_b17/v1.0` as deterministic code and persisted findings.
2. Author and render the synthetic OEM manual, Manatee procedure, and fleet bulletin with stable pages and visible synthetic footers.
3. Store originals in S3 and catalog versions/page-aware chunks in CockroachDB.
4. Add exact B17/equipment links and make the evidence panel real.
5. Keep embeddings and model generation out of Checkpoint 2; they remain Checkpoints 3 and 4.

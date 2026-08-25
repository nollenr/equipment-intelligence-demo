# Checkpoint 0 Readout — Connected Foundation

Date completed: 2026-08-23

## Outcome

Checkpoint 0 is complete. The AWS EC2 host can run the TypeScript database tooling, the CockroachDB schema and canonical synthetic incident are deployed, and a restricted application login can retrieve the incident without possessing schema-administration privileges.

## Deployed foundation

- Local working repository: this workspace, initialized as Git branch `main`; no commit was created automatically.
- AWS runtime copy: `/home/ec2-user/nextera-demo`.
- Runtime: Node.js v24.19.0 LTS and npm v11.17.0 installed under `/home/ec2-user/.local`.
- Database: `nextera_demo`, primary/only region `aws-us-east-1`, `SURVIVE ZONE FAILURE`.
- Schema: `nextera`, containing 20 application tables plus `schema_migrations`.
- Schema migrations recorded: five.
- Vector foundation: `document_chunks.embedding VECTOR(1536)` and a scope-prefixed cosine vector index.

## Identity boundary

- `ron`: database owner/setup identity; used for bootstrap, migrations, seed, and guarded reset.
- `nextera_app_read`: non-login permission bundle with read access to application tables.
- `nextera_app_runtime`: non-login permission bundle that inherits read access and can insert/update diagnostic and provenance records only.
- `nextera_app`: password-bearing runtime login and member of `nextera_app_runtime`.

The generated runtime URI was never displayed. It is stored outside the repository at `/home/ec2-user/.config/nextera-demo/db.env` with mode `0600` and loaded only into runtime-process environments.

Verified denials for `nextera_app`:

- Cannot create objects in the `nextera` schema.
- Cannot create objects in the `public` schema; default `PUBLIC CREATE` was revoked for this database.
- Cannot delete operational plant rows.
- Cannot run migrations or database administration through its granted roles.

## Schema groups

Operational:

- `plants`
- `equipment`
- `equipment_fault_events`
- `equipment_metric_summaries`

Knowledge and retrieval:

- `demo_principals`
- `retrieval_scopes`
- `retrieval_scope_permissions`
- `documents`
- `document_versions`
- `document_chunks`
- `document_fault_code_links`
- `document_equipment_links`

Diagnostic and provenance:

- `diagnostic_runs`
- `diagnostic_findings`
- `diagnostic_document_sources`
- `diagnostic_metric_sources`
- `analysis_answers`
- `analysis_answer_document_sources`
- `analysis_answer_metric_sources`
- `analysis_answer_finding_sources`

## Canonical seed

Public facility identity:

- FPL Manatee Solar Energy Center, Parrish, Florida.

Everything below is explicitly synthetic:

- Inverter `INV-042`.
- Manufacturer/model `Helios Power Systems / HPS-2500X`.
- Firmware `4.2.7-syn`.
- Fault `B17`, controller thermal derating.
- Controller-temperature peak `78.4 degC` against threshold `75.0 degC`.
- Deterministic threshold exceedance `3.4 degC`.
- Ambient temperature and active-power summary windows.
- Field-technician and fleet-engineer demo principals plus three retrieval scopes.

The seed is idempotent. A second application produced the same row counts. The guarded reset deleted only the 16 fixed-ID canonical synthetic rows and immediately reseeded them; post-reset retrieval returned the complete incident again.

## Query-plan validation

All application `SELECT` statements have executable CockroachDB `EXPLAIN` checks.

Health query:

```text
distribution: local
• values
  size: 4 columns, 1 row
```

Canonical incident query:

- Distribution is local.
- Joins resolve plant, equipment, and fault through CockroachDB lookup/primary indexes.
- With the current one-row incident table, the optimizer may intentionally choose a one-row full scan rather than the available fault index; this is rational for the tiny seed and must be reassessed after fleet expansion.

Incident-metrics query:

```text
distribution: local
• render
└── • index join
    └── • scan
          table: equipment_metric_summaries@metric_by_fault_idx
          spans: one fault-event ID
```

No latency or production-scale claim should be inferred from the tiny seed.

## Migration lesson recorded

The first knowledge/retrieval migration attempt created several empty schema objects before the process reported failure around the vector-index portion. The migration was not recorded as complete, but those schema changes remained visible. The migration was made idempotent and then completed cleanly.

For future work:

- Keep schema migrations small.
- Treat vector-index creation as its own idempotent schema operation when practical.
- Do not assume a failed multi-statement DDL file leaves no visible schema changes.
- Rerun and inspect `SHOW TABLES` / `SHOW CREATE TABLE` before attempting manual cleanup.

## Next checkpoint

Checkpoint 1 builds the first visible product shell against this real data:

- Fleet overview.
- Incident investigation screen.
- Minimal server-side API.
- Static, clearly labeled placeholder analysis while deterministic diagnosis and evidence documents are built in Checkpoint 2.
- First screenshot review with the user before deep visual polish.

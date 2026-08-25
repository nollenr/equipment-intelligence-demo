# A12 Google Docs handoff

These visibly synthetic authoring sources form the A12 evidence pack:

1. `sd-8400-cooling-and-fault-manual-v3.9.html`
2. `babcock-fan-inspection-procedure-v1.6.html`
3. `inverter-return-to-service-checklist-v2.4.html`

One Google Doc was created from each source with the document title/code/version and section headings preserved. Each should remain shared as **Viewer — Anyone at Cockroach Labs with the link**.

The configured bookmarks target exactly these cited headings:

| Document | Bookmark this heading | Citation page | Document-version ID | Status |
| --- | --- | ---: | --- | --- |
| SD-8400 Cooling System, Operations & Fault Response Manual v3.9 | `8.4 Fault A12 — Cooling Fan Feedback Variance` | 3 | `71000000-0000-4000-8000-000000000101` | Bookmarked Google Doc configured |
| Babcock Ranch Inverter Fan-System Inspection v1.6 | `5.2 Authorized fan-system inspection` | 3 | `71000000-0000-4000-8000-000000000102` | Bookmarked Google Doc configured |
| Inverter Cooling-System Return-to-Service Checklist v2.4 | `3. Return-to-service acceptance criteria` | 2 | `71000000-0000-4000-8000-000000000103` | Bookmarked Google Doc configured |

All three bookmarked URLs were supplied and configured in CockroachDB on 2026-08-23. The application now opens the Google Docs; the immutable PDF snapshots remain the content-hashed fallback and provenance record.

If that has not already been done, test every link from a different Cockroach Labs account. The Google Docs are presenter-facing sources; the checked-in PDFs and content hashes preserve the exact evidence used by recorded analyses.

The existing guarded owner-only `npm run db:document-source` workflow validated the bookmark form, ran `EXPLAIN`, updated each row by primary key, and verified every exact stored value. Do not update these rows through ad hoc SQL.

Configured OEM citation:

`https://docs.google.com/document/d/1mtVhbJU6C9cqSgKDoG3cJshvgDLsrzMnF_Jo9jZqA1E/edit?tab=t.0#bookmark=id.79irt63bba28`

Configured Babcock procedure citation:

`https://docs.google.com/document/d/1hPvJh7NJBeRFoAWUtT2eZUuy6f1pc-ZA7bmRo2WyF50/edit?tab=t.0#bookmark=id.6qe9fvqhtwwn`

Configured return-to-service citation:

`https://docs.google.com/document/d/1tylFM7Id9AAaerK1qT-LrVg6WAFdAiHVoOXAztEcaZg/edit?tab=t.0#bookmark=id.2vzn91sgl3kl`

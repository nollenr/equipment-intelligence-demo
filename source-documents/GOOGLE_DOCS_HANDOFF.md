# Google Docs handoff

This file records the completed B17 handoff. The separate A12 evidence-pack handoff is also complete; its three configured headings, version IDs, and bookmarked URLs are in [`A12_GOOGLE_DOCS_HANDOFF.md`](A12_GOOGLE_DOCS_HANDOFF.md).

These three HTML files are the controlled authoring sources for Checkpoint 2:

1. `hps-2500x-operations-manual-v4.2.html`
2. `manatee-cooling-inspection-procedure-v2.1.html`
3. `fleet-b17-high-ambient-bulletin-v1.3.html`

Each file is visibly marked as synthetic and is divided into stable letter-sized pages. Open the HTML file in a browser and copy its content into a new Google Doc, or recreate the headings in Google Docs using the same text.

For each Google Doc:

1. Preserve the title, document code, version, effective date, and section headings.
2. Add a bookmark to the cited section:
   - OEM manual: `7.3 Fault B17 — Controller Thermal Derating`
   - Site procedure: `4.2 Authorized inspection sequence`
   - Fleet bulletin: `2. Fleet Pattern and Engineering Guidance`
3. Share as **Viewer — Anyone at Cockroach Labs with the link**.
4. Test the link while signed in as a non-owner Cockroach Labs account.
5. Use the bookmarked citation URL as `document_versions.source_uri`, because that is the link the UI opens. If a stable Drive revision/version identifier is available, record it separately as `source_version_id`.

If a future source URL is not yet available, leave `source_uri` null. The UI automatically falls back to the versioned PDF snapshot and cited page, so adding Google Docs later is a metadata-only change.

## Current handoff status

| Document | Google Doc | Cited-section bookmark | CockroachDB metadata |
| --- | --- | --- | --- |
| HPS-2500X operations manual v4.2 | Created and corporate-viewer tested | `7.3 Fault B17 — Controller Thermal Derating` configured | Bookmarked Google Doc configured |
| Manatee cooling inspection procedure v2.1 | Created and corporate-viewer tested | `4.2 Authorized inspection sequence` configured | Bookmarked Google Doc configured |
| Fleet B17/high-ambient bulletin v1.3 | Created and corporate-viewer tested | `2. Fleet Pattern and Engineering Guidance` configured | Bookmarked Google Doc configured |

Configured bulletin citation:

`https://docs.google.com/document/d/1jJXcZx73qZzyK7Dh9zNy0k-kGvxCD0I4aOcP1xppVdk/edit?tab=t.0#bookmark=id.u8jycdxnprrg`

Configured Manatee procedure citation:

`https://docs.google.com/document/d/1wnsBvTH5j9KNLrVVHX0uJHK6zh1T9RBtMlRpUT7mtpA/edit?tab=t.0#bookmark=id.9ocau7t8i5rv`

Configured OEM manual citation:

`https://docs.google.com/document/d/14W8wzxaFnKKhVQ7BSGLLbKiivRLPnOcP-0PzVHQiCr0/edit?tab=t.0#bookmark=id.21d0z9um6x2s`

On the EC2 host, an owner can configure or verify a supplied bookmark without ad hoc SQL:

```bash
export DOCUMENT_VERSION_ID='<document-version-uuid>'
export DOCUMENT_SOURCE_URI='<bookmarked-google-doc-url>'
export CONFIRM_DOCUMENT_SOURCE_UPDATE='YES'  # omit for verification-only mode
npm run db:document-source
```

The command validates the UUID and Google Docs bookmark form, runs `EXPLAIN` for both statements, updates by the document-version primary key, and verifies the exact stored value. Run it with the setup/owner database identity; the application identity is intentionally read-only for document metadata.

The generated PDFs in `public/evidence/` are the immutable citation snapshots. Google Docs are the presenter-facing source; the snapshots preserve the exact approved content and page numbering used by a diagnostic run.

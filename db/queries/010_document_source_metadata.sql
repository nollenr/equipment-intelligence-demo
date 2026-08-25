-- Owner-only metadata update. Application/runtime code reads this value but does not modify it.
-- Bind the bookmarked Google Docs URL as $1 and the document-version UUID as $2.
UPDATE nextera.document_versions
SET source_uri = $1
WHERE id = $2
RETURNING id, source_uri;

-- Verification query used after an idempotent reseed.
-- Bind the document-version UUID as $1 and expected bookmarked URL as $2.
SELECT
  document.document_code,
  document.title,
  version.id AS document_version_id,
  version.version_label,
  version.source_uri,
  version.snapshot_uri
FROM nextera.document_versions AS version
JOIN nextera.documents AS document
  ON document.id = version.document_id
WHERE version.id = $1
  AND version.source_uri = $2;

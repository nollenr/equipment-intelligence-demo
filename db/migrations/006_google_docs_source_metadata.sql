-- Google Docs is the presenter-facing source system. PDF snapshots remain the stable citation artifact.
ALTER TABLE nextera.document_versions
  ALTER COLUMN s3_bucket DROP NOT NULL,
  ALTER COLUMN s3_key DROP NOT NULL,
  ADD COLUMN source_uri STRING,
  ADD COLUMN source_version_id STRING,
  ADD COLUMN snapshot_uri STRING,
  ADD CONSTRAINT document_version_source_check CHECK (
    source_uri IS NOT NULL
    OR snapshot_uri IS NOT NULL
    OR (s3_bucket IS NOT NULL AND s3_key IS NOT NULL)
  ),
  ADD CONSTRAINT document_version_s3_pair_check CHECK (
    (s3_bucket IS NULL AND s3_key IS NULL)
    OR (s3_bucket IS NOT NULL AND s3_key IS NOT NULL)
  );

ALTER TABLE nextera.document_chunks
  ADD COLUMN source_anchor STRING;

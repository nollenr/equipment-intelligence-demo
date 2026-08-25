CREATE TABLE IF NOT EXISTS nextera.demo_principals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_code STRING NOT NULL UNIQUE,
  display_name STRING NOT NULL,
  persona STRING NOT NULL,
  is_active BOOL NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT demo_principal_persona_check CHECK (
    persona IN ('field_technician', 'reliability_engineer', 'limited_contractor')
  )
);

CREATE TABLE IF NOT EXISTS nextera.retrieval_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_code STRING NOT NULL UNIQUE,
  display_name STRING NOT NULL,
  scope_type STRING NOT NULL,
  description STRING NOT NULL,
  is_active BOOL NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT retrieval_scope_type_check CHECK (
    scope_type IN ('fleet', 'plant', 'engineering_restricted')
  )
);

CREATE TABLE IF NOT EXISTS nextera.retrieval_scope_permissions (
  principal_id UUID NOT NULL REFERENCES nextera.demo_principals (id) ON DELETE CASCADE,
  retrieval_scope_id UUID NOT NULL REFERENCES nextera.retrieval_scopes (id) ON DELETE CASCADE,
  permission STRING NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (principal_id, retrieval_scope_id, permission),
  CONSTRAINT retrieval_permission_check CHECK (permission IN ('read')),
  INDEX retrieval_permissions_by_scope_idx (retrieval_scope_id, principal_id)
);

CREATE TABLE IF NOT EXISTS nextera.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_code STRING NOT NULL UNIQUE,
  title STRING NOT NULL,
  document_type STRING NOT NULL,
  owning_organization STRING NOT NULL,
  source_system STRING NOT NULL,
  is_synthetic BOOL NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now() ON UPDATE now(),
  CONSTRAINT document_type_check CHECK (
    document_type IN ('oem_manual', 'site_procedure', 'fleet_bulletin', 'work_order')
  ),
  CONSTRAINT documents_synthetic_only CHECK (is_synthetic)
);

CREATE TABLE IF NOT EXISTS nextera.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES nextera.documents (id) ON DELETE CASCADE,
  version_label STRING NOT NULL,
  effective_date DATE NOT NULL,
  approval_status STRING NOT NULL,
  content_sha256 STRING NOT NULL,
  s3_bucket STRING NOT NULL,
  s3_key STRING NOT NULL,
  s3_version_id STRING,
  mime_type STRING NOT NULL DEFAULT 'application/pdf',
  page_count INT4 NOT NULL,
  is_current BOOL NOT NULL DEFAULT false,
  ingested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT document_version_unique UNIQUE (document_id, version_label),
  CONSTRAINT document_hash_length_check CHECK (length(content_sha256) = 64),
  CONSTRAINT document_page_count_check CHECK (page_count > 0),
  CONSTRAINT document_approval_status_check CHECK (
    approval_status IN ('draft', 'approved', 'superseded')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS document_one_current_version_idx
  ON nextera.document_versions (document_id)
  WHERE is_current;

CREATE TABLE IF NOT EXISTS nextera.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_version_id UUID NOT NULL REFERENCES nextera.document_versions (id) ON DELETE CASCADE,
  retrieval_scope_id UUID NOT NULL REFERENCES nextera.retrieval_scopes (id) ON DELETE RESTRICT,
  chunk_index INT4 NOT NULL,
  page_start INT4 NOT NULL,
  page_end INT4 NOT NULL,
  section_heading STRING,
  content_text STRING NOT NULL,
  content_sha256 STRING NOT NULL,
  token_count INT4 NOT NULL,
  embedding VECTOR(1536),
  embedding_provider STRING,
  embedding_model STRING,
  embedding_dimensions INT4,
  embedding_version STRING,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT document_chunk_unique UNIQUE (document_version_id, chunk_index),
  CONSTRAINT document_chunk_page_check CHECK (page_start > 0 AND page_end >= page_start),
  CONSTRAINT document_chunk_hash_length_check CHECK (length(content_sha256) = 64),
  CONSTRAINT document_chunk_token_count_check CHECK (token_count > 0),
  CONSTRAINT document_chunk_embedding_metadata_check CHECK (
    (embedding IS NULL
      AND embedding_provider IS NULL
      AND embedding_model IS NULL
      AND embedding_dimensions IS NULL
      AND embedding_version IS NULL)
    OR
    (embedding IS NOT NULL
      AND embedding_provider IS NOT NULL
      AND embedding_model IS NOT NULL
      AND embedding_dimensions = 1536
      AND embedding_version IS NOT NULL)
  ),
  INDEX document_chunks_by_version_idx (document_version_id, chunk_index)
    STORING (retrieval_scope_id, page_start, page_end, section_heading, content_sha256)
);

CREATE VECTOR INDEX IF NOT EXISTS document_chunks_scope_embedding_idx
  ON nextera.document_chunks (retrieval_scope_id, embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS nextera.document_fault_code_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_version_id UUID NOT NULL REFERENCES nextera.document_versions (id) ON DELETE CASCADE,
  fault_code STRING NOT NULL,
  equipment_model STRING,
  section_heading STRING,
  relevance_note STRING NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT document_fault_link_unique UNIQUE (
    document_version_id, fault_code, equipment_model, section_heading
  ),
  INDEX document_fault_exact_match_idx (fault_code, equipment_model)
    STORING (document_version_id, section_heading, relevance_note)
);

CREATE TABLE IF NOT EXISTS nextera.document_equipment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_version_id UUID NOT NULL REFERENCES nextera.document_versions (id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES nextera.equipment (id) ON DELETE CASCADE,
  equipment_model STRING,
  relationship_type STRING NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT document_equipment_target_check CHECK (
    equipment_id IS NOT NULL OR equipment_model IS NOT NULL
  ),
  CONSTRAINT document_equipment_relationship_check CHECK (
    relationship_type IN ('applies_to', 'maintenance_history', 'supersedes')
  ),
  INDEX document_equipment_by_asset_idx (equipment_id)
    STORING (document_version_id, equipment_model, relationship_type),
  INDEX document_equipment_by_model_idx (equipment_model)
    STORING (document_version_id, equipment_id, relationship_type)
);

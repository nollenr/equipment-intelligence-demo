export const embeddingChunkCandidatesQuery = `
  SELECT
    chunk.id AS document_chunk_id,
    document.document_code,
    chunk.section_heading,
    chunk.content_text,
    chunk.content_sha256,
    chunk.embedding IS NOT NULL AS has_embedding,
    chunk.embedding_provider,
    chunk.embedding_model,
    chunk.embedding_dimensions,
    chunk.embedding_version
  FROM nextera.document_chunks AS chunk
  JOIN nextera.document_versions AS version
    ON version.id = chunk.document_version_id
    AND version.is_current
    AND version.approval_status = 'approved'
  JOIN nextera.documents AS document
    ON document.id = version.document_id
  ORDER BY document.document_code, chunk.chunk_index
`;

export const updateChunkEmbeddingQuery = `
  UPDATE nextera.document_chunks
  SET
    embedding = $1::VECTOR(1536),
    embedding_provider = $2,
    embedding_model = $3,
    embedding_dimensions = $4,
    embedding_version = $5
  WHERE id = $6
    AND content_sha256 = $7
  RETURNING id
`;

export const embeddingVerificationQuery = `
  SELECT
    count(*) AS approved_chunk_count,
    count(*) FILTER (WHERE chunk.embedding IS NOT NULL) AS embedded_chunk_count,
    min(chunk.embedding_dimensions) AS minimum_dimensions,
    max(chunk.embedding_dimensions) AS maximum_dimensions,
    count(DISTINCT chunk.embedding_model) AS embedding_model_count,
    count(DISTINCT chunk.embedding_version) AS embedding_version_count
  FROM nextera.document_chunks AS chunk
  JOIN nextera.document_versions AS version
    ON version.id = chunk.document_version_id
    AND version.is_current
    AND version.approval_status = 'approved'
`;

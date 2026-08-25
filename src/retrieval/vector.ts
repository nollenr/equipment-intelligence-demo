import type pg from "pg";

import { createEmbeddings, vectorLiteral } from "../openai/embeddings";
import type { EvidenceDocumentSource } from "../data/types";

export const authorizedRetrievalScopesQuery = `
  SELECT
    principal.id AS principal_id,
    scope.id AS retrieval_scope_id,
    scope.scope_code
  FROM nextera.demo_principals AS principal
  JOIN nextera.retrieval_scope_permissions AS permission
    ON permission.principal_id = principal.id
    AND permission.permission = 'read'
  JOIN nextera.retrieval_scopes AS scope
    ON scope.id = permission.retrieval_scope_id
    AND scope.is_active
  WHERE principal.principal_code = $1
    AND principal.is_active
  ORDER BY scope.scope_code
`;

export const scopedVectorEvidenceQuery = `
  SELECT
    document.id AS document_id,
    document.document_code,
    document.title,
    document.document_type,
    document.owning_organization,
    document.source_system,
    version.id AS document_version_id,
    version.version_label,
    version.effective_date,
    version.content_sha256 AS version_content_sha256,
    version.source_uri,
    version.source_version_id,
    version.snapshot_uri,
    chunk.id AS document_chunk_id,
    chunk.page_start,
    chunk.page_end,
    chunk.section_heading,
    chunk.source_anchor,
    chunk.content_text,
    chunk.content_sha256 AS chunk_content_sha256,
    scope.id AS retrieval_scope_id,
    scope.scope_code,
    scope.display_name AS retrieval_scope_name,
    scope.scope_type,
    chunk.embedding <=> $2::VECTOR(1536) AS cosine_distance
  FROM nextera.document_chunks AS chunk
  JOIN nextera.retrieval_scopes AS scope
    ON scope.id = chunk.retrieval_scope_id
  JOIN nextera.document_versions AS version
    ON version.id = chunk.document_version_id
    AND version.is_current
    AND version.approval_status = 'approved'
  JOIN nextera.documents AS document
    ON document.id = version.document_id
  WHERE chunk.retrieval_scope_id = $1
    AND chunk.embedding IS NOT NULL
  ORDER BY chunk.embedding <=> $2::VECTOR(1536), chunk.id
  LIMIT $3
`;

interface AuthorizedScopeRow {
  principal_id: string;
  retrieval_scope_id: string;
  scope_code: string;
}

interface VectorEvidenceRow {
  chunk_content_sha256: string;
  content_text: string;
  cosine_distance: string | number;
  document_chunk_id: string;
  document_code: string;
  document_id: string;
  document_type: string;
  document_version_id: string;
  effective_date: Date | string;
  owning_organization: string;
  page_end: number;
  page_start: number;
  retrieval_scope_id: string;
  retrieval_scope_name: string;
  scope_code: string;
  scope_type: string;
  section_heading: string | null;
  snapshot_uri: string | null;
  source_anchor: string | null;
  source_system: string;
  source_uri: string | null;
  source_version_id: string | null;
  title: string;
  version_content_sha256: string;
  version_label: string;
}

interface AuthorizedVectorEvidenceRow extends VectorEvidenceRow {
  principal_id: string;
}

function dateOnly(value: Date | string): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}

export async function searchAuthorizedEvidence(
  pool: pg.Pool,
  questionVector: number[],
  principalCode: string,
  limit = 5,
): Promise<EvidenceDocumentSource[]> {
  const scopeResult = await pool.query<AuthorizedScopeRow>(authorizedRetrievalScopesQuery, [principalCode]);
  if (scopeResult.rows.length === 0) {
    return [];
  }

  const queryVector = vectorLiteral(questionVector);
  const perScopeResults = await Promise.all(
    scopeResult.rows.map((scope) =>
      pool.query<VectorEvidenceRow>(scopedVectorEvidenceQuery, [scope.retrieval_scope_id, queryVector, limit]),
    ),
  );

  return perScopeResults
    .flatMap((result, index) =>
      result.rows.map<AuthorizedVectorEvidenceRow>((row) => ({
        ...row,
        principal_id: scopeResult.rows[index]!.principal_id,
      })),
    )
    .sort((left, right) => Number(left.cosine_distance) - Number(right.cosine_distance))
    .slice(0, limit)
    .map((row, index) => ({
      chunkContentSha256: row.chunk_content_sha256,
      contentText: row.content_text,
      cosineDistance: Number(row.cosine_distance),
      documentChunkId: row.document_chunk_id,
      documentCode: row.document_code,
      documentId: row.document_id,
      documentType: row.document_type,
      documentVersionId: row.document_version_id,
      effectiveDate: dateOnly(row.effective_date),
      owningOrganization: row.owning_organization,
      pageEnd: row.page_end,
      pageStart: row.page_start,
      principalId: row.principal_id,
      retrievalMethod: "vector",
      retrievalRank: index + 1,
      retrievalScopeId: row.retrieval_scope_id,
      retrievalScopeName: row.retrieval_scope_name,
      scopeCode: row.scope_code,
      scopeType: row.scope_type,
      sectionHeading: row.section_heading,
      snapshotUri: row.snapshot_uri,
      sourceAnchor: row.source_anchor,
      sourceSystem: row.source_system,
      sourceUri: row.source_uri,
      sourceVersionId: row.source_version_id,
      title: row.title,
      versionContentSha256: row.version_content_sha256,
      versionLabel: row.version_label,
    }));
}

export async function embedAndSearchAuthorizedEvidence(
  pool: pg.Pool,
  question: string,
  principalCode: string,
  limit = 5,
): Promise<EvidenceDocumentSource[]> {
  const embedding = await createEmbeddings([question]);
  return searchAuthorizedEvidence(pool, embedding.vectors[0]!, principalCode, limit);
}

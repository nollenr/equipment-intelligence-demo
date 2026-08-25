import { getApplicationPool } from "../database";
import {
  availableIncidentEvidenceQuery,
  diagnosticDocumentSourcesQuery,
  diagnosticFindingsQuery,
  latestDiagnosticAnalysisQuery,
} from "../queries";
import type { DiagnosticFinding, EvidenceDocumentSource, IncidentAnalysis } from "./types";

interface AvailableEvidenceRow {
  chunk_content_sha256: string;
  content_text: string;
  document_chunk_id: string;
  document_code: string;
  document_id: string;
  document_type: string;
  document_version_id: string;
  effective_date: Date | string;
  owning_organization: string;
  page_count: number;
  page_end: number;
  page_start: number;
  principal_id: string;
  relevance_note: string;
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

interface LatestAnalysisRow {
  answer_id: string;
  answer_status: string;
  answer_text: string;
  completed_at: Date;
  confidence_basis: string;
  confidence_label: string;
  diagnostic_rule_code: string;
  diagnostic_rule_version: string;
  diagnostic_run_id: string;
  embedding_model: string | null;
  evidence_state: string;
  generated_at: Date;
  generation_model: string;
  generation_provider: string;
  is_fallback: boolean;
  prompt_template_version: string;
  question_text: string;
  recommended_action: string | null;
  response_duration_ms: string;
  run_status: string;
  started_at: Date;
}

interface FindingRow {
  calculation_expression: string | null;
  comparison_operator: string | null;
  diagnostic_finding_id: string;
  explanation: string;
  finding_code: string;
  observed_value: string | null;
  ordinal: number;
  severity: string;
  threshold_value: string | null;
  title: string;
  unit: string | null;
}

interface DiagnosticSourceRow extends Omit<AvailableEvidenceRow, "page_count" | "principal_id" | "relevance_note"> {
  citation_label: string;
  cosine_distance: string | null;
  diagnostic_document_source_id: string;
  included_in_generation: boolean;
  retrieval_method: string;
  retrieval_rank: number;
}

function dateOnly(value: Date | string): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}

function mapEvidence(row: AvailableEvidenceRow): EvidenceDocumentSource {
  return {
    chunkContentSha256: row.chunk_content_sha256,
    contentText: row.content_text,
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
    relevanceNote: row.relevance_note,
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
  };
}

export async function getAvailableIncidentEvidence(
  faultCode: string,
  model: string,
  equipmentId: string,
  principalCode = "field-tech-demo",
): Promise<EvidenceDocumentSource[]> {
  const result = await getApplicationPool().query<AvailableEvidenceRow>(availableIncidentEvidenceQuery, [
    principalCode,
    faultCode,
    model,
    equipmentId,
  ]);

  return result.rows.map(mapEvidence);
}

export async function getLatestIncidentAnalysis(
  faultEventId: string,
  principalCode = "field-tech-demo",
): Promise<IncidentAnalysis | null> {
  const pool = getApplicationPool();
  const analysisResult = await pool.query<LatestAnalysisRow>(latestDiagnosticAnalysisQuery, [faultEventId, principalCode]);
  const analysis = analysisResult.rows[0];

  if (!analysis) {
    return null;
  }

  const [findingResult, sourceResult] = await Promise.all([
    pool.query<FindingRow>(diagnosticFindingsQuery, [analysis.diagnostic_run_id]),
    pool.query<DiagnosticSourceRow>(diagnosticDocumentSourcesQuery, [analysis.diagnostic_run_id]),
  ]);

  const findings: DiagnosticFinding[] = findingResult.rows.map((finding) => ({
    calculationExpression: finding.calculation_expression,
    comparisonOperator: finding.comparison_operator,
    diagnosticFindingId: finding.diagnostic_finding_id,
    explanation: finding.explanation,
    findingCode: finding.finding_code,
    observedValue: finding.observed_value === null ? null : Number(finding.observed_value),
    ordinal: finding.ordinal,
    severity: finding.severity,
    thresholdValue: finding.threshold_value === null ? null : Number(finding.threshold_value),
    title: finding.title,
    unit: finding.unit,
  }));

  const sources: EvidenceDocumentSource[] = sourceResult.rows.map((source) => ({
    ...mapEvidence({
      ...source,
      page_count: source.page_end,
      principal_id: "",
      relevance_note: "",
    }),
    citationLabel: source.citation_label,
    ...(source.cosine_distance === null ? {} : { cosineDistance: Number(source.cosine_distance) }),
    diagnosticDocumentSourceId: source.diagnostic_document_source_id,
    includedInGeneration: source.included_in_generation,
    principalId: undefined,
    relevanceNote: undefined,
    retrievalMethod: source.retrieval_method,
    retrievalRank: source.retrieval_rank,
  }));

  return {
    answerId: analysis.answer_id,
    answerStatus: analysis.answer_status,
    answerText: analysis.answer_text,
    completedAt: analysis.completed_at.toISOString(),
    confidenceBasis: analysis.confidence_basis,
    confidenceLabel: analysis.confidence_label,
    diagnosticRuleCode: analysis.diagnostic_rule_code,
    diagnosticRuleVersion: analysis.diagnostic_rule_version,
    diagnosticRunId: analysis.diagnostic_run_id,
    embeddingModel: analysis.embedding_model,
    evidenceState: analysis.evidence_state,
    findings,
    generatedAt: analysis.generated_at.toISOString(),
    generationModel: analysis.generation_model,
    generationProvider: analysis.generation_provider,
    isFallback: analysis.is_fallback,
    promptTemplateVersion: analysis.prompt_template_version,
    questionText: analysis.question_text,
    recommendedAction: analysis.recommended_action,
    responseDurationMs: Number(analysis.response_duration_ms),
    runStatus: analysis.run_status,
    sources,
    startedAt: analysis.started_at.toISOString(),
  };
}

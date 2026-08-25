import { getApplicationPool } from "../database";
import {
  diagnosticDocumentSourcesQuery,
  diagnosticFaultEventSourcesQuery,
  diagnosticFindingsQuery,
  fleetCorrelationEventsQuery,
  fleetCorrelationEvidenceQuery,
  fleetCorrelationSummaryQuery,
  latestFleetCorrelationAnalysisQuery,
} from "../queries";
import type {
  DiagnosticFinding,
  EvidenceDocumentSource,
  FleetCorrelationAnalysis,
  FleetCorrelationData,
  FleetCorrelationEvent,
  FleetCorrelationEventSource,
} from "./types";

export const CANONICAL_B17_EVENT_ID = "30000000-0000-4000-8000-000000000017";
export const HIGH_AMBIENT_CONTEXT_CELSIUS = 35;

interface FleetCorrelationEventRow {
  ambient_metric_id: string;
  ambient_peak: string;
  controller_metric_id: string;
  controller_peak: string;
  controller_threshold: string;
  equipment_code: string;
  equipment_id: string;
  equipment_name: string;
  event_status: string;
  event_time: Date;
  fault_event_id: string;
  high_ambient_context: boolean;
  model: string;
  plant_code: string;
  plant_id: string;
  plant_name: string;
  severity: string;
}

interface FleetCorrelationSummaryRow {
  average_ambient_peak: string | null;
  average_controller_peak: string | null;
  below_context_event_count: string;
  equipment_count: string;
  event_count: string;
  facility_count: string;
  high_ambient_event_count: string;
  high_ambient_share_percent: string | null;
}

interface FleetEvidenceRow {
  chunk_content_sha256: string;
  content_text: string;
  document_chunk_id: string;
  document_code: string;
  document_id: string;
  document_type: string;
  document_version_id: string;
  effective_date: Date | string;
  owning_organization: string;
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

interface DiagnosticSourceRow extends Omit<FleetEvidenceRow, "principal_id" | "relevance_note"> {
  citation_label: string;
  cosine_distance: string | null;
  diagnostic_document_source_id: string;
  included_in_generation: boolean;
  retrieval_method: string;
  retrieval_rank: number;
}

interface EventSourceRow {
  equipment_code: string;
  event_time: Date;
  fault_event_id: string;
  ordinal: number;
  plant_name: string;
  purpose: string;
}

function count(value: string): number {
  return Number.parseInt(value, 10);
}

function numeric(value: string | null): number {
  return value === null ? 0 : Number(value);
}

function dateOnly(value: Date | string): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}

function mapEvidence(row: FleetEvidenceRow): EvidenceDocumentSource {
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

export async function getFleetCorrelationData(
  anchorFaultEventId = CANONICAL_B17_EVENT_ID,
): Promise<FleetCorrelationData> {
  const pool = getApplicationPool();
  const [eventResult, summaryResult] = await Promise.all([
    pool.query<FleetCorrelationEventRow>(fleetCorrelationEventsQuery, [
      anchorFaultEventId,
      HIGH_AMBIENT_CONTEXT_CELSIUS,
    ]),
    pool.query<FleetCorrelationSummaryRow>(fleetCorrelationSummaryQuery, [
      anchorFaultEventId,
      HIGH_AMBIENT_CONTEXT_CELSIUS,
    ]),
  ]);
  const summary = summaryResult.rows[0];
  if (!summary) {
    throw new Error("Fleet correlation summary query returned no row.");
  }

  const events: FleetCorrelationEvent[] = eventResult.rows.map((row) => ({
    ambientMetricId: row.ambient_metric_id,
    ambientPeak: Number(row.ambient_peak),
    controllerMetricId: row.controller_metric_id,
    controllerPeak: Number(row.controller_peak),
    controllerThreshold: Number(row.controller_threshold),
    equipmentCode: row.equipment_code,
    equipmentId: row.equipment_id,
    equipmentName: row.equipment_name,
    eventStatus: row.event_status,
    eventTime: row.event_time.toISOString(),
    faultEventId: row.fault_event_id,
    highAmbientContext: row.high_ambient_context,
    model: row.model,
    plantCode: row.plant_code,
    plantId: row.plant_id,
    plantName: row.plant_name,
    severity: row.severity,
  }));

  return {
    anchorFaultEventId,
    contextThresholdCelsius: HIGH_AMBIENT_CONTEXT_CELSIUS,
    events,
    lookbackDays: 30,
    model: events[0]?.model ?? "HPS-2500X (Synthetic)",
    summary: {
      averageAmbientPeak: numeric(summary.average_ambient_peak),
      averageControllerPeak: numeric(summary.average_controller_peak),
      belowContextEventCount: count(summary.below_context_event_count),
      equipmentCount: count(summary.equipment_count),
      eventCount: count(summary.event_count),
      facilityCount: count(summary.facility_count),
      highAmbientEventCount: count(summary.high_ambient_event_count),
      highAmbientSharePercent: numeric(summary.high_ambient_share_percent),
    },
  };
}

export async function getFleetCorrelationEvidence(
  principalCode: string,
  faultCode: string,
  model: string,
): Promise<EvidenceDocumentSource[]> {
  const result = await getApplicationPool().query<FleetEvidenceRow>(fleetCorrelationEvidenceQuery, [
    principalCode,
    faultCode,
    model,
  ]);
  return result.rows.map(mapEvidence);
}

export async function getLatestFleetCorrelationAnalysis(
  anchorFaultEventId = CANONICAL_B17_EVENT_ID,
  principalCode = "fleet-engineer-demo",
): Promise<FleetCorrelationAnalysis | null> {
  const pool = getApplicationPool();
  const analysisResult = await pool.query<LatestAnalysisRow>(latestFleetCorrelationAnalysisQuery, [
    anchorFaultEventId,
    principalCode,
  ]);
  const analysis = analysisResult.rows[0];
  if (!analysis) {
    return null;
  }

  const [findingResult, sourceResult, eventSourceResult] = await Promise.all([
    pool.query<FindingRow>(diagnosticFindingsQuery, [analysis.diagnostic_run_id]),
    pool.query<DiagnosticSourceRow>(diagnosticDocumentSourcesQuery, [analysis.diagnostic_run_id]),
    pool.query<EventSourceRow>(diagnosticFaultEventSourcesQuery, [analysis.diagnostic_run_id]),
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
    ...mapEvidence({ ...source, principal_id: "", relevance_note: "" }),
    citationLabel: source.citation_label,
    ...(source.cosine_distance === null ? {} : { cosineDistance: Number(source.cosine_distance) }),
    diagnosticDocumentSourceId: source.diagnostic_document_source_id,
    includedInGeneration: source.included_in_generation,
    principalId: undefined,
    relevanceNote: undefined,
    retrievalMethod: source.retrieval_method,
    retrievalRank: source.retrieval_rank,
  }));

  const eventSources: FleetCorrelationEventSource[] = eventSourceResult.rows.map((source) => ({
    equipmentCode: source.equipment_code,
    eventTime: source.event_time.toISOString(),
    faultEventId: source.fault_event_id,
    ordinal: source.ordinal,
    plantName: source.plant_name,
    purpose: source.purpose,
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
    eventSources,
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

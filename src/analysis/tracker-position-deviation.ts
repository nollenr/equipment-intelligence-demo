import { randomUUID } from "node:crypto";

import { getApplicationPool } from "../database";
import { getAvailableIncidentEvidence, getLatestIncidentAnalysis } from "../data/analysis";
import { getIncidentById } from "../data/incidents";
import type { EvidenceDocumentSource, IncidentAnalysis, IncidentMetric } from "../data/types";
import { embeddingConfiguration } from "../openai/embeddings";
import { generateP09WithDeterministicFallback } from "../openai/tracker-position-generation";
import type { GenerationEvidence, GenerationFinding } from "../openai/generation";
import { embedAndSearchAuthorizedEvidence } from "../retrieval/vector";
import { buildP09IntentAwareFallback, classifyP09Question } from "./p09-question-intent";
import {
  insertP09AnalysisAnswerQuery,
  insertP09AnswerDocumentSourcesQuery,
  insertP09AnswerFindingSourcesQuery,
  insertP09AnswerMetricSourcesQuery,
  insertP09DiagnosticFindingsQuery,
  insertP09DiagnosticRunQuery,
  insertP09DocumentSourcesQuery,
  insertP09MetricSourcesQuery,
} from "./p09-persistence-sql";
import { AnalysisInputError } from "./thermal-derating";

const MAX_TRANSACTION_ATTEMPTS = 4;
const SIGNAL_DELTA_TOLERANCE = 0.2;

function requiredMetric(metrics: IncidentMetric[], name: string): IncidentMetric {
  const metric = metrics.find((candidate) => candidate.metricName === name);
  if (!metric) throw new AnalysisInputError(`Required P09 metric ${name} is unavailable.`, 409);
  return metric;
}

function requiredNumber(value: number | null, label: string): number {
  if (value === null || !Number.isFinite(value)) throw new AnalysisInputError(`Required P09 value ${label} is unavailable.`, 409);
  return value;
}

function citationLabel(source: EvidenceDocumentSource): string {
  return `${source.title} v${source.versionLabel}, p. ${source.pageStart}`;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

interface PersistenceParameters {
  answerDocumentSourceIds: [string, string, string];
  answerId: string;
  answerText: string;
  commandLatest: number;
  commandMetricId: string;
  completedAt: Date;
  confidenceBasis: string;
  currentMetricId: string;
  currentPeak: number;
  currentThreshold: number;
  deviationMetricId: string;
  deviationPeak: number;
  deviationThreshold: number;
  documentSources: [EvidenceDocumentSource, EvidenceDocumentSource, EvidenceDocumentSource];
  equipmentId: string;
  faultEventId: string;
  findingIds: [string, string, string];
  generationModel: string;
  generationProvider: string;
  includedInGeneration: boolean;
  isFallback: boolean;
  measuredLatest: number;
  measuredMetricId: string;
  principalId: string;
  promptTemplateVersion: string;
  question: string;
  recommendedAction: string;
  responseDurationMs: number;
  retrievalUsedVectors: boolean;
  runId: string;
  signalDelta: number;
  startedAt: Date;
}

async function persistP09Analysis(parameters: PersistenceParameters): Promise<void> {
  const pool = getApplicationPool();
  for (let attempt = 0; attempt < MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(insertP09DiagnosticRunQuery, [parameters.runId, parameters.equipmentId, parameters.faultEventId, parameters.principalId, parameters.question, parameters.startedAt, parameters.completedAt, parameters.responseDurationMs]);
      await client.query(insertP09DiagnosticFindingsQuery, [
        parameters.runId,
        ...parameters.findingIds,
        `Peak position deviation reached ${parameters.deviationPeak.toFixed(1)} degrees, ${(parameters.deviationPeak - parameters.deviationThreshold).toFixed(1)} degrees above the configured ${parameters.deviationThreshold.toFixed(1)}-degree threshold.`,
        parameters.deviationPeak,
        parameters.deviationThreshold,
        `${parameters.deviationPeak.toFixed(1)} - ${parameters.deviationThreshold.toFixed(1)} = ${(parameters.deviationPeak - parameters.deviationThreshold).toFixed(1)} degrees`,
        `Latest commanded angle was ${parameters.commandLatest.toFixed(1)} degrees and measured angle was ${parameters.measuredLatest.toFixed(1)} degrees, corroborating a ${parameters.signalDelta.toFixed(1)}-degree mismatch.`,
        parameters.signalDelta,
        parameters.deviationThreshold,
        `abs(${parameters.commandLatest.toFixed(1)} - ${parameters.measuredLatest.toFixed(1)}) = ${parameters.signalDelta.toFixed(1)} degrees`,
        `Drive-motor current peaked at ${parameters.currentPeak.toFixed(1)} amperes, above the ${parameters.currentThreshold.toFixed(1)}-ampere context threshold. This is consistent with loading but does not establish cause.`,
        parameters.currentPeak,
        parameters.currentThreshold,
        `max(tracker_drive_motor_current) = ${parameters.currentPeak.toFixed(1)} amperes`,
      ]);
      await client.query(insertP09MetricSourcesQuery, [parameters.runId, parameters.deviationMetricId, parameters.commandMetricId, parameters.measuredMetricId, parameters.currentMetricId]);

      const documentParameters: unknown[] = [parameters.runId];
      for (const [index, source] of parameters.documentSources.entries()) {
        documentParameters.push(parameters.answerDocumentSourceIds[index], source.documentChunkId, source.retrievalScopeId, source.retrievalMethod ?? "exact_fault", source.retrievalRank ?? index + 1, source.cosineDistance ?? null, citationLabel(source), parameters.includedInGeneration);
      }
      await client.query(insertP09DocumentSourcesQuery, documentParameters);
      await client.query(insertP09AnalysisAnswerQuery, [parameters.answerId, parameters.runId, parameters.answerText, parameters.recommendedAction, parameters.confidenceBasis, parameters.promptTemplateVersion, parameters.generationProvider, parameters.generationModel, parameters.retrievalUsedVectors ? embeddingConfiguration.model : null, parameters.responseDurationMs, parameters.isFallback, parameters.completedAt]);
      await client.query(insertP09AnswerDocumentSourcesQuery, [parameters.answerId, ...parameters.answerDocumentSourceIds]);
      await client.query(insertP09AnswerMetricSourcesQuery, [parameters.answerId, parameters.deviationMetricId, parameters.commandMetricId, parameters.measuredMetricId, parameters.currentMetricId]);
      await client.query(insertP09AnswerFindingSourcesQuery, [parameters.answerId, ...parameters.findingIds]);
      await client.query("COMMIT");
      return;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      const sqlState = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
      if (sqlState !== "40001" || attempt === MAX_TRANSACTION_ATTEMPTS - 1) throw error;
      await sleep(Math.min(40 * 2 ** attempt, 400) + Math.floor(Math.random() * 25));
    } finally {
      client.release();
    }
  }
}

export async function createP09Analysis(faultEventId: string, questionText: string): Promise<IncidentAnalysis> {
  const startedAt = new Date();
  const question = questionText.trim();
  if (!question || question.length > 1_000) throw new AnalysisInputError("Question must contain between 1 and 1,000 characters.", 400);
  const questionIntent = classifyP09Question(question);
  const incident = await getIncidentById(faultEventId);
  if (!incident) throw new AnalysisInputError("Incident not found.", 404);
  if (incident.faultCode !== "P09") throw new AnalysisInputError("This diagnostic rule applies only to P09 incidents.");

  const deviationMetric = requiredMetric(incident.metrics, "tracker_position_deviation");
  const commandMetric = requiredMetric(incident.metrics, "tracker_commanded_angle");
  const measuredMetric = requiredMetric(incident.metrics, "tracker_measured_angle");
  const currentMetric = requiredMetric(incident.metrics, "tracker_drive_motor_current");
  const deviationPeak = requiredNumber(deviationMetric.maximumValue, "peak position deviation");
  const deviationLatest = requiredNumber(deviationMetric.latestValue, "latest position deviation");
  const deviationThreshold = requiredNumber(deviationMetric.thresholdValue, "position deviation threshold");
  const commandLatest = requiredNumber(commandMetric.latestValue, "latest commanded angle");
  const measuredLatest = requiredNumber(measuredMetric.latestValue, "latest measured angle");
  const currentPeak = requiredNumber(currentMetric.maximumValue, "peak drive current");
  const currentLatest = requiredNumber(currentMetric.latestValue, "latest drive current");
  const currentThreshold = requiredNumber(currentMetric.thresholdValue, "drive-current context threshold");
  const signalDelta = Math.abs(commandLatest - measuredLatest);
  if (deviationPeak <= deviationThreshold) throw new AnalysisInputError("P09 rule did not find a position-deviation threshold exceedance.", 409);
  if (Math.abs(signalDelta - deviationLatest) > SIGNAL_DELTA_TOLERANCE) throw new AnalysisInputError("P09 command, measurement, and derived deviation summaries conflict.", 409);

  const exactEvidence = await getAvailableIncidentEvidence(incident.faultCode, incident.model, incident.equipmentId);
  let availableEvidence = exactEvidence;
  let retrievalUsedVectors = false;
  try {
    const applicableChunkIds = new Set(exactEvidence.map((source) => source.documentChunkId));
    const vectorEvidence = (await embedAndSearchAuthorizedEvidence(getApplicationPool(), question, "field-tech-demo", 10)).filter((source) => applicableChunkIds.has(source.documentChunkId));
    if (vectorEvidence.some((source) => source.documentType === "oem_manual") && vectorEvidence.some((source) => source.documentType === "site_procedure") && vectorEvidence.some((source) => source.documentType === "work_order")) {
      availableEvidence = vectorEvidence;
      retrievalUsedVectors = true;
    }
  } catch {
    // Exact authorized P09 evidence remains safe when embeddings are unavailable.
  }

  const oemSource = availableEvidence.find((source) => source.documentType === "oem_manual");
  const siteSource = availableEvidence.find((source) => source.documentType === "site_procedure");
  const releaseSource = availableEvidence.find((source) => source.documentType === "work_order");
  if (!oemSource || !siteSource || !releaseSource || !oemSource.principalId || oemSource.principalId !== siteSource.principalId || oemSource.principalId !== releaseSource.principalId) {
    throw new AnalysisInputError("Approved OEM, tracker-inspection, and return-to-automatic evidence is unavailable to this principal.", 409);
  }

  const documentSources = [oemSource, siteSource, releaseSource].sort((left, right) => (left.retrievalRank ?? 99) - (right.retrievalRank ?? 99) || left.documentType.localeCompare(right.documentType)) as [EvidenceDocumentSource, EvidenceDocumentSource, EvidenceDocumentSource];
  const generationEvidence = documentSources.map((source, index) => ({ evidenceId: `E${index + 1}`, source })) as [GenerationEvidence, GenerationEvidence, GenerationEvidence];
  const citationFor = (source: EvidenceDocumentSource) => {
    const index = documentSources.findIndex((candidate) => candidate.documentChunkId === source.documentChunkId);
    if (index < 0) throw new Error("P09 analysis source citation could not be resolved.");
    return `[${index + 1}]`;
  };
  const deterministicFindings: GenerationFinding[] = [
    { explanation: `Peak position deviation reached ${deviationPeak.toFixed(1)} degrees, ${(deviationPeak - deviationThreshold).toFixed(1)} degrees above the configured ${deviationThreshold.toFixed(1)}-degree threshold.`, findingCode: "position_deviation_threshold_exceeded", title: "Position deviation threshold exceeded" },
    { explanation: `Latest commanded angle was ${commandLatest.toFixed(1)} degrees and measured angle was ${measuredLatest.toFixed(1)} degrees, corroborating a ${signalDelta.toFixed(1)}-degree mismatch.`, findingCode: "command_measurement_mismatch_confirmed", title: "Command/measurement mismatch confirmed" },
    { explanation: `Drive-motor current peaked at ${currentPeak.toFixed(1)} amperes, above the ${currentThreshold.toFixed(1)}-ampere context threshold. This is consistent with loading but does not establish cause.`, findingCode: "drive_current_context_recorded", title: "Drive-current context recorded" },
  ];
  const fallback = buildP09IntentAwareFallback(questionIntent, { commandedLatest: commandLatest, currentLatest, currentPeak, currentThreshold, deviationLatest, deviationPeak, deviationThreshold, equipmentCode: incident.equipmentCode, evidenceCount: documentSources.length, measuredLatest, oemCitation: citationFor(oemSource), releaseCitation: citationFor(releaseSource), siteCitation: citationFor(siteSource) });
  const answerPath = await generateP09WithDeterministicFallback({ evidence: generationEvidence, findings: deterministicFindings, incident, question, questionIntent }, fallback);
  if (answerPath.fallbackReasonCode) console.warn(`Live P09 answer generation used the ${questionIntent} fallback (${answerPath.fallbackReasonCode}): ${answerPath.fallbackReasonMessage}`);

  const retrievalBasis = retrievalUsedVectors ? "permission-first vector retrieval ranked three approved fault/model-specific sources" : "three approved fault/model exact-match sources were authorized before answer construction";
  const confidenceBasis = answerPath.isFallback
    ? `High evidence sufficiency: position-deviation, command, measurement, and drive-current summaries are complete and mutually consistent; the threshold check passed; and ${retrievalBasis}. Live generation was unavailable or invalid, so the versioned deterministic answer was used. This is application validation—not model self-confidence or confirmation of a failed component.`
    : `High evidence sufficiency: position-deviation, command, measurement, and drive-current summaries are complete and mutually consistent; the threshold check passed; and ${retrievalBasis}. The schema-constrained response passed citation, question-focus, release-criteria, and motion-safety validation. This is application validation—not model self-confidence or confirmation of a failed component.`;
  const completedAt = new Date();
  const responseDurationMs = Math.max(completedAt.getTime() - startedAt.getTime(), 1);
  const runId = randomUUID();
  const answerId = randomUUID();
  const findingIds: [string, string, string] = [randomUUID(), randomUUID(), randomUUID()];
  const documentSourceIds: [string, string, string] = [randomUUID(), randomUUID(), randomUUID()];

  await persistP09Analysis({ answerDocumentSourceIds: documentSourceIds, answerId, answerText: answerPath.answerText, commandLatest, commandMetricId: commandMetric.metricSummaryId, completedAt, confidenceBasis, currentMetricId: currentMetric.metricSummaryId, currentPeak, currentThreshold, deviationMetricId: deviationMetric.metricSummaryId, deviationPeak, deviationThreshold, documentSources, equipmentId: incident.equipmentId, faultEventId: incident.faultEventId, findingIds, generationModel: answerPath.generationModel, generationProvider: answerPath.generationProvider, includedInGeneration: answerPath.includedInGeneration, isFallback: answerPath.isFallback, measuredLatest, measuredMetricId: measuredMetric.metricSummaryId, principalId: oemSource.principalId, promptTemplateVersion: answerPath.promptTemplateVersion, question, recommendedAction: answerPath.recommendedAction, responseDurationMs, retrievalUsedVectors, runId, signalDelta, startedAt });
  const analysis = await getLatestIncidentAnalysis(faultEventId);
  if (!analysis || analysis.diagnosticRunId !== runId) throw new Error("Persisted P09 analysis could not be reloaded.");
  return analysis;
}

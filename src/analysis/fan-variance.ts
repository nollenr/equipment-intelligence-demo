import { randomUUID } from "node:crypto";

import { getApplicationPool } from "../database";
import { getAvailableIncidentEvidence, getLatestIncidentAnalysis } from "../data/analysis";
import { getIncidentById } from "../data/incidents";
import type { EvidenceDocumentSource, IncidentAnalysis, IncidentMetric } from "../data/types";
import { embeddingConfiguration } from "../openai/embeddings";
import {
  generateA12WithDeterministicFallback,
} from "../openai/fan-variance-generation";
import type { GenerationEvidence, GenerationFinding } from "../openai/generation";
import { embedAndSearchAuthorizedEvidence } from "../retrieval/vector";
import {
  buildA12IntentAwareFallback,
  classifyA12Question,
} from "./a12-question-intent";
import {
  insertA12AnalysisAnswerQuery,
  insertA12AnswerDocumentSourcesQuery,
  insertA12AnswerFindingSourcesQuery,
  insertA12AnswerMetricSourcesQuery,
  insertA12DiagnosticFindingsQuery,
  insertA12DiagnosticRunQuery,
  insertA12DocumentSourcesQuery,
  insertA12MetricSourcesQuery,
} from "./a12-persistence-sql";
import { AnalysisInputError } from "./thermal-derating";

const MAX_TRANSACTION_ATTEMPTS = 4;
const SIGNAL_DELTA_TOLERANCE = 0.2;

function requiredMetric(metrics: IncidentMetric[], name: string): IncidentMetric {
  const metric = metrics.find((candidate) => candidate.metricName === name);
  if (!metric) {
    throw new AnalysisInputError(`Required A12 metric ${name} is unavailable.`, 409);
  }
  return metric;
}

function requiredNumber(value: number | null, label: string): number {
  if (value === null || !Number.isFinite(value)) {
    throw new AnalysisInputError(`Required A12 value ${label} is unavailable.`, 409);
  }
  return value;
}

function citationLabel(source: EvidenceDocumentSource): string {
  return `${source.title} v${source.versionLabel}, p. ${source.pageStart}`;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function persistA12Analysis(parameters: {
  ambientMetricId: string;
  ambientPeak: number;
  answerDocumentSourceIds: [string, string, string];
  answerId: string;
  answerText: string;
  commandLatest: number;
  commandMetricId: string;
  completedAt: Date;
  confidenceBasis: string;
  documentSources: [EvidenceDocumentSource, EvidenceDocumentSource, EvidenceDocumentSource];
  equipmentId: string;
  faultEventId: string;
  feedbackLatest: number;
  feedbackMetricId: string;
  findingIds: [string, string, string];
  generationModel: string;
  generationProvider: string;
  includedInGeneration: boolean;
  isFallback: boolean;
  peakVariance: number;
  principalId: string;
  promptTemplateVersion: string;
  question: string;
  recommendedAction: string;
  responseDurationMs: number;
  retrievalUsedVectors: boolean;
  runId: string;
  signalDelta: number;
  startedAt: Date;
  varianceMetricId: string;
  varianceThreshold: number;
}): Promise<void> {
  const pool = getApplicationPool();
  for (let attempt = 0; attempt < MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(insertA12DiagnosticRunQuery, [
        parameters.runId,
        parameters.equipmentId,
        parameters.faultEventId,
        parameters.principalId,
        parameters.question,
        parameters.startedAt,
        parameters.completedAt,
        parameters.responseDurationMs,
      ]);
      await client.query(insertA12DiagnosticFindingsQuery, [
        parameters.runId,
        ...parameters.findingIds,
        `Peak fan command/feedback variance reached ${parameters.peakVariance.toFixed(1)}%, ${(
          parameters.peakVariance - parameters.varianceThreshold
        ).toFixed(1)} percentage points above the configured ${parameters.varianceThreshold.toFixed(1)}% threshold.`,
        parameters.peakVariance,
        parameters.varianceThreshold,
        `${parameters.peakVariance.toFixed(1)} - ${parameters.varianceThreshold.toFixed(1)} = ${(
          parameters.peakVariance - parameters.varianceThreshold
        ).toFixed(1)} percentage points`,
        `Latest fan command was ${parameters.commandLatest.toFixed(1)}% and feedback was ${parameters.feedbackLatest.toFixed(1)}%, corroborating a ${parameters.signalDelta.toFixed(1)}-percentage-point mismatch.`,
        parameters.signalDelta,
        parameters.varianceThreshold,
        `abs(${parameters.commandLatest.toFixed(1)} - ${parameters.feedbackLatest.toFixed(1)}) = ${parameters.signalDelta.toFixed(1)} percentage points`,
        `Ambient temperature peaked at ${parameters.ambientPeak.toFixed(1)} °C. This may increase cooling demand but does not establish the cause of command/feedback disagreement.`,
        parameters.ambientPeak,
        `max(ambient_air_temperature) = ${parameters.ambientPeak.toFixed(1)} °C`,
      ]);
      await client.query(insertA12MetricSourcesQuery, [
        parameters.runId,
        parameters.varianceMetricId,
        parameters.commandMetricId,
        parameters.feedbackMetricId,
        parameters.ambientMetricId,
      ]);

      const documentParameters: unknown[] = [parameters.runId];
      for (const [index, source] of parameters.documentSources.entries()) {
        documentParameters.push(
          parameters.answerDocumentSourceIds[index],
          source.documentChunkId,
          source.retrievalScopeId,
          source.retrievalMethod ?? "exact_fault",
          source.retrievalRank ?? index + 1,
          source.cosineDistance ?? null,
          citationLabel(source),
          parameters.includedInGeneration,
        );
      }
      await client.query(insertA12DocumentSourcesQuery, documentParameters);
      await client.query(insertA12AnalysisAnswerQuery, [
        parameters.answerId,
        parameters.runId,
        parameters.answerText,
        parameters.recommendedAction,
        parameters.confidenceBasis,
        parameters.promptTemplateVersion,
        parameters.generationProvider,
        parameters.generationModel,
        parameters.retrievalUsedVectors ? embeddingConfiguration.model : null,
        parameters.responseDurationMs,
        parameters.isFallback,
        parameters.completedAt,
      ]);
      await client.query(insertA12AnswerDocumentSourcesQuery, [
        parameters.answerId,
        ...parameters.answerDocumentSourceIds,
      ]);
      await client.query(insertA12AnswerMetricSourcesQuery, [
        parameters.answerId,
        parameters.varianceMetricId,
        parameters.commandMetricId,
        parameters.feedbackMetricId,
        parameters.ambientMetricId,
      ]);
      await client.query(insertA12AnswerFindingSourcesQuery, [parameters.answerId, ...parameters.findingIds]);
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

export async function createA12Analysis(faultEventId: string, questionText: string): Promise<IncidentAnalysis> {
  const startedAt = new Date();
  const question = questionText.trim();
  if (!question || question.length > 1_000) {
    throw new AnalysisInputError("Question must contain between 1 and 1,000 characters.", 400);
  }
  const questionIntent = classifyA12Question(question);
  const incident = await getIncidentById(faultEventId);
  if (!incident) throw new AnalysisInputError("Incident not found.", 404);
  if (incident.faultCode !== "A12") {
    throw new AnalysisInputError("This diagnostic rule applies only to A12 incidents.");
  }

  const varianceMetric = requiredMetric(incident.metrics, "fan_speed_variance");
  const commandMetric = requiredMetric(incident.metrics, "fan_command_percent");
  const feedbackMetric = requiredMetric(incident.metrics, "fan_feedback_percent");
  const ambientMetric = requiredMetric(incident.metrics, "ambient_air_temperature");
  const peakVariance = requiredNumber(varianceMetric.maximumValue, "peak fan variance");
  const latestVariance = requiredNumber(varianceMetric.latestValue, "latest fan variance");
  const varianceThreshold = requiredNumber(varianceMetric.thresholdValue, "fan variance threshold");
  const commandLatest = requiredNumber(commandMetric.latestValue, "latest fan command");
  const feedbackLatest = requiredNumber(feedbackMetric.latestValue, "latest fan feedback");
  const ambientPeak = requiredNumber(ambientMetric.maximumValue, "ambient peak");
  const signalDelta = Math.abs(commandLatest - feedbackLatest);

  if (peakVariance <= varianceThreshold) {
    throw new AnalysisInputError("A12 rule did not find a fan-variance threshold exceedance.", 409);
  }
  if (Math.abs(signalDelta - latestVariance) > SIGNAL_DELTA_TOLERANCE) {
    throw new AnalysisInputError("A12 command, feedback, and derived variance summaries conflict.", 409);
  }

  const exactEvidence = await getAvailableIncidentEvidence(
    incident.faultCode,
    incident.model,
    incident.equipmentId,
  );
  let availableEvidence = exactEvidence;
  let retrievalUsedVectors = false;
  try {
    const applicableChunkIds = new Set(exactEvidence.map((source) => source.documentChunkId));
    const vectorEvidence = (await embedAndSearchAuthorizedEvidence(
      getApplicationPool(),
      question,
      "field-tech-demo",
      10,
    )).filter((source) => applicableChunkIds.has(source.documentChunkId));
    if (
      vectorEvidence.some((source) => source.documentType === "oem_manual") &&
      vectorEvidence.some((source) => source.documentType === "site_procedure") &&
      vectorEvidence.some((source) => source.documentType === "work_order")
    ) {
      availableEvidence = vectorEvidence;
      retrievalUsedVectors = true;
    }
  } catch {
    // Exact authorized A12 evidence remains the presentation-safe path when embeddings are unavailable.
  }

  const oemSource = availableEvidence.find((source) => source.documentType === "oem_manual");
  const siteSource = availableEvidence.find((source) => source.documentType === "site_procedure");
  const releaseSource = availableEvidence.find((source) => source.documentType === "work_order");
  if (
    !oemSource ||
    !siteSource ||
    !releaseSource ||
    !oemSource.principalId ||
    oemSource.principalId !== siteSource.principalId ||
    oemSource.principalId !== releaseSource.principalId
  ) {
    throw new AnalysisInputError("Approved OEM, site-inspection, and release evidence is unavailable to this principal.", 409);
  }

  const documentSources = [oemSource, siteSource, releaseSource].sort((left, right) =>
    (left.retrievalRank ?? 99) - (right.retrievalRank ?? 99) || left.documentType.localeCompare(right.documentType)
  ) as [EvidenceDocumentSource, EvidenceDocumentSource, EvidenceDocumentSource];
  const generationEvidence = documentSources.map((source, index) => ({
    evidenceId: `E${index + 1}`,
    source,
  })) as [GenerationEvidence, GenerationEvidence, GenerationEvidence];
  const citationFor = (source: EvidenceDocumentSource) => {
    const index = documentSources.findIndex((candidate) => candidate.documentChunkId === source.documentChunkId);
    if (index < 0) throw new Error("A12 analysis source citation could not be resolved.");
    return `[${index + 1}]`;
  };

  const exceedance = peakVariance - varianceThreshold;
  const deterministicFindings: GenerationFinding[] = [
    {
      explanation: `Peak fan command/feedback variance reached ${peakVariance.toFixed(1)}%, ${exceedance.toFixed(1)} percentage points above the configured ${varianceThreshold.toFixed(1)}% threshold.`,
      findingCode: "fan_variance_threshold_exceeded",
      title: "Fan variance threshold exceeded",
    },
    {
      explanation: `Latest fan command was ${commandLatest.toFixed(1)}% and feedback was ${feedbackLatest.toFixed(1)}%, corroborating a ${signalDelta.toFixed(1)}-percentage-point mismatch.`,
      findingCode: "command_feedback_mismatch_confirmed",
      title: "Command/feedback mismatch confirmed",
    },
    {
      explanation: `Ambient temperature peaked at ${ambientPeak.toFixed(1)} °C. This may increase cooling demand but does not establish the cause of command/feedback disagreement.`,
      findingCode: "ambient_demand_context_recorded",
      title: "Ambient demand context recorded",
    },
  ];
  const deterministicFallback = buildA12IntentAwareFallback(questionIntent, {
    ambientPeak,
    commandLatest,
    equipmentCode: incident.equipmentCode,
    evidenceCount: documentSources.length,
    feedbackLatest,
    latestVariance,
    oemCitation: citationFor(oemSource),
    peakVariance,
    releaseCitation: citationFor(releaseSource),
    siteCitation: citationFor(siteSource),
    varianceThreshold,
  });
  const answerPath = await generateA12WithDeterministicFallback(
    { evidence: generationEvidence, findings: deterministicFindings, incident, question, questionIntent },
    deterministicFallback,
  );
  if (answerPath.fallbackReasonCode) {
    console.warn(
      `Live A12 answer generation used the ${questionIntent} fallback (${answerPath.fallbackReasonCode}): ${answerPath.fallbackReasonMessage}`,
    );
  }

  const retrievalBasis = retrievalUsedVectors
    ? "permission-first vector retrieval ranked three approved fault/model-specific sources"
    : "three approved fault/model exact-match sources were authorized before answer construction";
  const confidenceBasis = answerPath.isFallback
    ? `High evidence sufficiency: the variance, command, feedback, and ambient summaries are complete and mutually consistent; the threshold check passed; and ${retrievalBasis}. Live generation was unavailable or invalid, so the versioned deterministic answer was used. This is application validation—not model self-confidence or confirmation of a failed component.`
    : `High evidence sufficiency: the variance, command, feedback, and ambient summaries are complete and mutually consistent; the threshold check passed; and ${retrievalBasis}. The schema-constrained response passed citation, question-focus, release-criteria, and safety validation. This is application validation—not model self-confidence or confirmation of a failed component.`;
  const completedAt = new Date();
  const responseDurationMs = Math.max(completedAt.getTime() - startedAt.getTime(), 1);
  const runId = randomUUID();
  const answerId = randomUUID();
  const findingIds: [string, string, string] = [randomUUID(), randomUUID(), randomUUID()];
  const documentSourceIds: [string, string, string] = [randomUUID(), randomUUID(), randomUUID()];

  await persistA12Analysis({
    ambientMetricId: ambientMetric.metricSummaryId,
    ambientPeak,
    answerDocumentSourceIds: documentSourceIds,
    answerId,
    answerText: answerPath.answerText,
    commandLatest,
    commandMetricId: commandMetric.metricSummaryId,
    completedAt,
    confidenceBasis,
    documentSources,
    equipmentId: incident.equipmentId,
    faultEventId: incident.faultEventId,
    feedbackLatest,
    feedbackMetricId: feedbackMetric.metricSummaryId,
    findingIds,
    generationModel: answerPath.generationModel,
    generationProvider: answerPath.generationProvider,
    includedInGeneration: answerPath.includedInGeneration,
    isFallback: answerPath.isFallback,
    peakVariance,
    principalId: oemSource.principalId,
    promptTemplateVersion: answerPath.promptTemplateVersion,
    question,
    recommendedAction: answerPath.recommendedAction,
    responseDurationMs,
    retrievalUsedVectors,
    runId,
    signalDelta,
    startedAt,
    varianceMetricId: varianceMetric.metricSummaryId,
    varianceThreshold,
  });

  const analysis = await getLatestIncidentAnalysis(faultEventId);
  if (!analysis || analysis.diagnosticRunId !== runId) {
    throw new Error("Persisted A12 analysis could not be reloaded.");
  }
  return analysis;
}

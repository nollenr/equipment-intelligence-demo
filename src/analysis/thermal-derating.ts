import { randomUUID } from "node:crypto";

import { getApplicationPool } from "../database";
import { getAvailableIncidentEvidence, getLatestIncidentAnalysis } from "../data/analysis";
import { getIncidentById } from "../data/incidents";
import type { EvidenceDocumentSource, IncidentAnalysis, IncidentMetric } from "../data/types";
import { embeddingConfiguration } from "../openai/embeddings";
import {
  generateWithDeterministicFallback,
  type GenerationEvidence,
  type GenerationFinding,
} from "../openai/generation";
import { embedAndSearchAuthorizedEvidence } from "../retrieval/vector";
import {
  buildB17IntentAwareFallback,
  classifyB17Question,
} from "./question-intent";
import {
  insertAnalysisAnswerQuery,
  insertAnswerDocumentSourcesQuery,
  insertAnswerFindingSourcesQuery,
  insertAnswerMetricSourcesQuery,
  insertDiagnosticDocumentSourcesQuery,
  insertDiagnosticFindingsQuery,
  insertDiagnosticMetricSourcesQuery,
  insertDiagnosticRunQuery,
} from "./persistence-sql";

const MAX_TRANSACTION_ATTEMPTS = 4;

export class AnalysisInputError extends Error {
  constructor(message: string, readonly statusCode = 422) {
    super(message);
  }
}

function requiredMetric(metrics: IncidentMetric[], name: string): IncidentMetric {
  const metric = metrics.find((candidate) => candidate.metricName === name);
  if (!metric) {
    throw new AnalysisInputError(`Required metric ${name} is unavailable.`, 409);
  }
  return metric;
}

function requiredNumber(value: number | null, label: string): number {
  if (value === null || !Number.isFinite(value)) {
    throw new AnalysisInputError(`Required value ${label} is unavailable.`, 409);
  }
  return value;
}

function citationLabel(source: EvidenceDocumentSource): string {
  return `${source.title} v${source.versionLabel}, p. ${source.pageStart}`;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function persistAnalysis(parameters: {
  answerDocumentSourceIds: [string, string];
  answerId: string;
  answerText: string;
  ambientPeak: number;
  ambientMetricId: string;
  completedAt: Date;
  confidenceBasis: string;
  controllerMetricId: string;
  controllerPeak: number;
  controllerThreshold: number;
  documentSources: [EvidenceDocumentSource, EvidenceDocumentSource];
  equipmentId: string;
  faultEventId: string;
  findingIds: [string, string, string];
  generationModel: string;
  generationProvider: string;
  includedInGeneration: boolean;
  isFallback: boolean;
  latestOutput: number;
  outputMetricId: string;
  principalId: string;
  promptTemplateVersion: string;
  question: string;
  recommendedAction: string;
  responseDurationMs: number;
  retrievalUsedVectors: boolean;
  runId: string;
  startedAt: Date;
}): Promise<void> {
  const pool = getApplicationPool();

  for (let attempt = 0; attempt < MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(insertDiagnosticRunQuery, [
        parameters.runId,
        parameters.equipmentId,
        parameters.faultEventId,
        parameters.principalId,
        parameters.question,
        parameters.startedAt,
        parameters.completedAt,
        parameters.responseDurationMs,
      ]);
      await client.query(insertDiagnosticFindingsQuery, [
        parameters.runId,
        ...parameters.findingIds,
        `Controller temperature peaked at ${parameters.controllerPeak.toFixed(1)} °C, ${(
          parameters.controllerPeak - parameters.controllerThreshold
        ).toFixed(1)} °C above the configured ${parameters.controllerThreshold.toFixed(1)} °C derating threshold.`,
        parameters.controllerPeak,
        parameters.controllerThreshold,
        `${parameters.controllerPeak.toFixed(1)} - ${parameters.controllerThreshold.toFixed(1)} = ${(
          parameters.controllerPeak - parameters.controllerThreshold
        ).toFixed(1)} °C`,
        `Latest active-power output was ${parameters.latestOutput.toFixed(0)}% rated, consistent with a protective derated state while the inverter remained online.`,
        parameters.latestOutput,
        `latest(active_power_output) = ${parameters.latestOutput.toFixed(0)}% rated`,
        `Ambient temperature peaked at ${parameters.ambientPeak.toFixed(1)} °C. This reduces thermal margin but does not establish component failure or airflow obstruction without inspection evidence.`,
        parameters.ambientPeak,
        `max(ambient_air_temperature) = ${parameters.ambientPeak.toFixed(1)} °C`,
      ]);
      await client.query(insertDiagnosticMetricSourcesQuery, [
        parameters.runId,
        parameters.controllerMetricId,
        parameters.outputMetricId,
        parameters.ambientMetricId,
      ]);
      await client.query(insertDiagnosticDocumentSourcesQuery, [
        parameters.runId,
        parameters.answerDocumentSourceIds[0],
        parameters.documentSources[0].documentChunkId,
        parameters.documentSources[0].retrievalScopeId,
        parameters.documentSources[0].retrievalMethod ?? "exact_fault",
        parameters.documentSources[0].retrievalRank ?? 1,
        parameters.documentSources[0].cosineDistance ?? null,
        citationLabel(parameters.documentSources[0]),
        parameters.includedInGeneration,
        parameters.answerDocumentSourceIds[1],
        parameters.documentSources[1].documentChunkId,
        parameters.documentSources[1].retrievalScopeId,
        parameters.documentSources[1].retrievalMethod ?? "exact_fault",
        parameters.documentSources[1].retrievalRank ?? 2,
        parameters.documentSources[1].cosineDistance ?? null,
        citationLabel(parameters.documentSources[1]),
        parameters.includedInGeneration,
      ]);
      await client.query(insertAnalysisAnswerQuery, [
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
      await client.query(insertAnswerDocumentSourcesQuery, [parameters.answerId, ...parameters.answerDocumentSourceIds]);
      await client.query(insertAnswerMetricSourcesQuery, [
        parameters.answerId,
        parameters.controllerMetricId,
        parameters.outputMetricId,
        parameters.ambientMetricId,
      ]);
      await client.query(insertAnswerFindingSourcesQuery, [parameters.answerId, ...parameters.findingIds]);
      await client.query("COMMIT");
      return;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      const sqlState = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
      if (sqlState !== "40001" || attempt === MAX_TRANSACTION_ATTEMPTS - 1) {
        throw error;
      }

      const backoffMs = Math.min(40 * 2 ** attempt, 400) + Math.floor(Math.random() * 25);
      await sleep(backoffMs);
    } finally {
      client.release();
    }
  }
}

export async function createB17Analysis(
  faultEventId: string,
  questionText: string,
): Promise<IncidentAnalysis> {
  const startedAt = new Date();
  const question = questionText.trim();
  if (!question || question.length > 1_000) {
    throw new AnalysisInputError("Question must contain between 1 and 1,000 characters.", 400);
  }
  const questionIntent = classifyB17Question(question);

  const incident = await getIncidentById(faultEventId);
  if (!incident) {
    throw new AnalysisInputError("Incident not found.", 404);
  }
  if (incident.faultCode !== "B17") {
    throw new AnalysisInputError("Deterministic analysis is currently available for B17 incidents only.");
  }

  const controllerMetric = requiredMetric(incident.metrics, "controller_temperature");
  const outputMetric = requiredMetric(incident.metrics, "active_power_output");
  const ambientMetric = requiredMetric(incident.metrics, "ambient_air_temperature");
  const controllerPeak = requiredNumber(controllerMetric.maximumValue, "controller peak");
  const controllerThreshold = requiredNumber(controllerMetric.thresholdValue, "controller threshold");
  const latestOutput = requiredNumber(outputMetric.latestValue, "latest active-power output");
  const ambientPeak = requiredNumber(ambientMetric.maximumValue, "ambient peak");

  if (controllerPeak <= controllerThreshold) {
    throw new AnalysisInputError("B17 rule did not find a controller-temperature threshold exceedance.", 409);
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
      vectorEvidence.some((source) => source.documentType === "site_procedure")
    ) {
      availableEvidence = vectorEvidence;
      retrievalUsedVectors = true;
    }
  } catch {
    // The deterministic exact-match path remains a presentation-safe fallback
    // when the disposable key is absent, revoked, or the model API is unavailable.
  }
  const oemSource = availableEvidence.find((source) => source.documentType === "oem_manual");
  const siteSource = availableEvidence.find((source) => source.documentType === "site_procedure");
  if (!oemSource || !siteSource || !oemSource.principalId || oemSource.principalId !== siteSource.principalId) {
    throw new AnalysisInputError("Approved OEM and site-procedure evidence is not available to this principal.", 409);
  }

  const documentSources = [oemSource, siteSource].sort((left, right) =>
    (left.retrievalRank ?? 99) - (right.retrievalRank ?? 99) || left.documentType.localeCompare(right.documentType)
  ) as [EvidenceDocumentSource, EvidenceDocumentSource];
  const generationEvidence = documentSources.map((source, index) => ({
    evidenceId: `E${index + 1}`,
    source,
  })) as [GenerationEvidence, GenerationEvidence];
  const citationFor = (source: EvidenceDocumentSource) => {
    const index = documentSources.findIndex((candidate) => candidate.documentChunkId === source.documentChunkId);
    if (index < 0) {
      throw new Error("Analysis source citation could not be resolved.");
    }
    return `[${index + 1}]`;
  };
  const oemCitation = citationFor(oemSource);
  const siteCitation = citationFor(siteSource);

  const exceedance = controllerPeak - controllerThreshold;
  const deterministicFindings: GenerationFinding[] = [
    {
      explanation: `Controller temperature peaked at ${controllerPeak.toFixed(1)} °C, ${exceedance.toFixed(
        1,
      )} °C above the configured ${controllerThreshold.toFixed(1)} °C derating threshold.`,
      findingCode: "controller_threshold_exceeded",
      title: "Controller threshold exceeded",
    },
    {
      explanation: `Latest active-power output was ${latestOutput.toFixed(0)}% rated, consistent with a protective derated state while the inverter remained online.`,
      findingCode: "protective_derating_confirmed",
      title: "Protective derating confirmed",
    },
    {
      explanation: `Ambient temperature peaked at ${ambientPeak.toFixed(1)} °C. This reduces thermal margin but does not establish component failure or airflow obstruction without inspection evidence.`,
      findingCode: "ambient_context_recorded",
      title: "High-ambient context recorded",
    },
  ];

  const deterministicFallback = buildB17IntentAwareFallback(questionIntent, {
    ambientPeak,
    controllerPeak,
    controllerThreshold,
    equipmentCode: incident.equipmentCode,
    evidenceCount: documentSources.length,
    latestOutput,
    oemCitation,
    siteCitation,
  });

  const answerPath = await generateWithDeterministicFallback(
    {
      evidence: generationEvidence,
      findings: deterministicFindings,
      incident,
      question,
      questionIntent,
    },
    deterministicFallback,
  );
  if (answerPath.fallbackReasonCode) {
    console.warn(
      `Live answer generation used the ${questionIntent} fallback (${answerPath.fallbackReasonCode}): ${answerPath.fallbackReasonMessage}`,
    );
  }

  const retrievalBasis = retrievalUsedVectors
    ? "permission-first vector retrieval ranked two approved sources without exposing engineering-restricted evidence"
    : "two approved exact-match sources were authorized before answer construction";
  const confidenceBasis = answerPath.isFallback
    ? `High evidence sufficiency: the required metric window is complete, the OEM threshold check passed, and ${retrievalBasis}. Live generation was unavailable or invalid, so the versioned deterministic answer was used. This is application validation—not model self-confidence.`
    : `High evidence sufficiency: the required metric window is complete, the OEM threshold check passed, and ${retrievalBasis}. The schema-constrained model response passed application-side citation validation. This is application validation—not model self-confidence.`;
  const completedAt = new Date();
  const responseDurationMs = Math.max(completedAt.getTime() - startedAt.getTime(), 1);
  const runId = randomUUID();
  const answerId = randomUUID();
  const findingIds: [string, string, string] = [randomUUID(), randomUUID(), randomUUID()];
  const documentSourceIds: [string, string] = [randomUUID(), randomUUID()];

  await persistAnalysis({
    ambientMetricId: ambientMetric.metricSummaryId,
    ambientPeak,
    answerDocumentSourceIds: documentSourceIds,
    answerId,
    answerText: answerPath.answerText,
    completedAt,
    confidenceBasis,
    controllerMetricId: controllerMetric.metricSummaryId,
    controllerPeak,
    controllerThreshold,
    documentSources,
    equipmentId: incident.equipmentId,
    faultEventId: incident.faultEventId,
    findingIds,
    generationModel: answerPath.generationModel,
    generationProvider: answerPath.generationProvider,
    includedInGeneration: answerPath.includedInGeneration,
    isFallback: answerPath.isFallback,
    latestOutput,
    outputMetricId: outputMetric.metricSummaryId,
    principalId: oemSource.principalId,
    promptTemplateVersion: answerPath.promptTemplateVersion,
    question,
    recommendedAction: answerPath.recommendedAction,
    responseDurationMs,
    retrievalUsedVectors,
    runId,
    startedAt,
  });

  const analysis = await getLatestIncidentAnalysis(faultEventId);
  if (!analysis || analysis.diagnosticRunId !== runId) {
    throw new Error("Persisted analysis could not be reloaded.");
  }
  return analysis;
}

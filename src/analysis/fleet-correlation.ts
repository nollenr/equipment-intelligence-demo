import { randomUUID } from "node:crypto";

import { getApplicationPool } from "../database";
import {
  getFleetCorrelationData,
  getFleetCorrelationEvidence,
  getLatestFleetCorrelationAnalysis,
} from "../data/fleet-correlation";
import { getIncidentById } from "../data/incidents";
import type {
  EvidenceDocumentSource,
  FleetCorrelationAnalysis,
  FleetCorrelationData,
} from "../data/types";
import { embeddingConfiguration } from "../openai/embeddings";
import { generateFleetCorrelationAnswer } from "../openai/fleet-correlation-generation";
import { embedAndSearchAuthorizedEvidence } from "../retrieval/vector";
import { AnalysisInputError } from "./thermal-derating";
import {
  insertFleetCorrelationAnswerDocumentSourceQuery,
  insertFleetCorrelationAnswerFindingSourcesQuery,
  insertFleetCorrelationAnswerMetricSourcesQuery,
  insertFleetCorrelationAnswerQuery,
  insertFleetCorrelationDocumentSourceQuery,
  insertFleetCorrelationEventSourcesQuery,
  insertFleetCorrelationFindingsQuery,
  insertFleetCorrelationMetricSourcesQuery,
  insertFleetCorrelationRunQuery,
} from "./fleet-correlation-persistence-sql";

const FLEET_ENGINEER_PRINCIPAL = "fleet-engineer-demo";
const MAX_TRANSACTION_ATTEMPTS = 4;

function citationLabel(source: EvidenceDocumentSource): string {
  return `${source.title} v${source.versionLabel}, p. ${source.pageStart}`;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function persistFleetCorrelation(parameters: {
  answerId: string;
  answerText: string;
  completedAt: Date;
  confidenceBasis: string;
  data: FleetCorrelationData;
  documentSource: EvidenceDocumentSource;
  documentSourceId: string;
  equipmentId: string;
  findingIds: [string, string, string];
  generationModel: string;
  generationProvider: string;
  includedInGeneration: boolean;
  isFallback: boolean;
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
  const eventIds = parameters.data.events.map((event) => event.faultEventId);
  const summary = parameters.data.summary;

  for (let attempt = 0; attempt < MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(insertFleetCorrelationRunQuery, [
        parameters.runId,
        parameters.equipmentId,
        parameters.data.anchorFaultEventId,
        parameters.principalId,
        parameters.question,
        parameters.startedAt,
        parameters.completedAt,
        parameters.responseDurationMs,
      ]);
      await client.query(insertFleetCorrelationFindingsQuery, [
        parameters.runId,
        ...parameters.findingIds,
        `${summary.eventCount} other same-model B17 events were found across ${summary.facilityCount} facilities in the prior ${parameters.data.lookbackDays} days.`,
        summary.eventCount,
        `count(B17 where model = ${parameters.data.model} and anchor - ${parameters.data.lookbackDays} days <= event_time < anchor) = ${summary.eventCount}`,
        `${summary.highAmbientEventCount} of ${summary.eventCount} events (${summary.highAmbientSharePercent.toFixed(0)}%) had ambient peaks at or above ${parameters.data.contextThresholdCelsius.toFixed(0)} °C; ${summary.belowContextEventCount} occurred below it.`,
        summary.highAmbientSharePercent,
        `${summary.highAmbientEventCount} / ${summary.eventCount} * 100 = ${summary.highAmbientSharePercent.toFixed(1)}%`,
        "This observational event set and weather context do not establish that ambient temperature caused B17.",
        "association != causation; inspection evidence is not present in the fleet event set",
      ]);
      await client.query(insertFleetCorrelationEventSourcesQuery, [parameters.runId, eventIds]);
      await client.query(insertFleetCorrelationMetricSourcesQuery, [parameters.runId, eventIds]);
      await client.query(insertFleetCorrelationDocumentSourceQuery, [
        parameters.documentSourceId,
        parameters.runId,
        parameters.documentSource.documentChunkId,
        parameters.documentSource.retrievalScopeId,
        parameters.documentSource.retrievalMethod ?? "exact_fault",
        parameters.documentSource.cosineDistance ?? null,
        citationLabel(parameters.documentSource),
        parameters.includedInGeneration,
      ]);
      await client.query(insertFleetCorrelationAnswerQuery, [
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
      await client.query(insertFleetCorrelationAnswerDocumentSourceQuery, [
        parameters.answerId,
        parameters.documentSourceId,
      ]);
      await client.query(insertFleetCorrelationAnswerMetricSourcesQuery, [parameters.answerId, eventIds]);
      await client.query(insertFleetCorrelationAnswerFindingSourcesQuery, [
        parameters.answerId,
        ...parameters.findingIds,
      ]);
      await client.query("COMMIT");
      return;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      const sqlState = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
      if (sqlState !== "40001" || attempt === MAX_TRANSACTION_ATTEMPTS - 1) {
        throw error;
      }
      await sleep(Math.min(40 * 2 ** attempt, 400) + Math.floor(Math.random() * 25));
    } finally {
      client.release();
    }
  }
}

export async function createFleetCorrelationAnalysis(
  anchorFaultEventId: string,
  questionText: string,
  principalCode: string,
): Promise<FleetCorrelationAnalysis> {
  const startedAt = new Date();
  const question = questionText.trim();
  if (!question || question.length > 1_000) {
    throw new AnalysisInputError("Question must contain between 1 and 1,000 characters.", 400);
  }
  if (principalCode !== FLEET_ENGINEER_PRINCIPAL) {
    throw new AnalysisInputError(
      "Fleet Engineering access is required for the restricted B17 fleet bulletin and interpretation.",
      403,
    );
  }

  const incident = await getIncidentById(anchorFaultEventId);
  if (!incident) {
    throw new AnalysisInputError("Anchor incident not found.", 404);
  }
  if (incident.faultCode !== "B17") {
    throw new AnalysisInputError("Fleet correlation is currently available for B17 incidents only.");
  }

  const data = await getFleetCorrelationData(anchorFaultEventId);
  if (data.summary.eventCount === 0 || data.events.length !== data.summary.eventCount) {
    throw new AnalysisInputError("The 30-day fleet event set is incomplete.", 409);
  }

  const exactEvidence = await getFleetCorrelationEvidence(principalCode, incident.faultCode, incident.model);
  let bulletin = exactEvidence.find((source) => source.documentType === "fleet_bulletin");
  if (!bulletin?.principalId) {
    throw new AnalysisInputError(
      "Fleet Engineering access is required for the restricted B17 fleet bulletin and interpretation.",
      403,
    );
  }

  let retrievalUsedVectors = false;
  try {
    const vectorEvidence = await embedAndSearchAuthorizedEvidence(
      getApplicationPool(),
      question,
      principalCode,
      5,
    );
    const vectorBulletin = vectorEvidence.find((source) => source.documentType === "fleet_bulletin");
    if (vectorBulletin?.principalId) {
      bulletin = vectorBulletin;
      retrievalUsedVectors = true;
    }
  } catch {
    // The approved exact-match bulletin remains a safe path when the temporary key is absent.
  }
  if (!bulletin.principalId) {
    throw new AnalysisInputError("The authorized fleet bulletin is missing its principal context.", 409);
  }
  const principalId = bulletin.principalId;

  const generation = await generateFleetCorrelationAnswer(question, data, bulletin);
  if (generation.fallbackReasonCode) {
    console.warn(
      `Fleet correlation used deterministic fallback (${generation.fallbackReasonCode}): ${generation.fallbackReasonMessage}`,
    );
  }

  const retrievalBasis = retrievalUsedVectors
    ? "permission-first vector retrieval selected the approved engineering-restricted bulletin"
    : "the approved engineering-restricted bulletin was authorized by exact fault/model scope";
  const confidenceBasis = `Moderate evidence sufficiency: ${data.summary.eventCount} complete same-model event windows across ${data.summary.facilityCount} facilities were compared, and ${retrievalBasis}. The result supports an observed association, not causation or component diagnosis.`;
  const completedAt = new Date();
  const responseDurationMs = Math.max(completedAt.getTime() - startedAt.getTime(), 1);
  const runId = randomUUID();
  const answerId = randomUUID();
  const findingIds: [string, string, string] = [randomUUID(), randomUUID(), randomUUID()];
  const documentSourceId = randomUUID();

  await persistFleetCorrelation({
    answerId,
    answerText: generation.answerText,
    completedAt,
    confidenceBasis,
    data,
    documentSource: bulletin,
    documentSourceId,
    equipmentId: incident.equipmentId,
    findingIds,
    generationModel: generation.generationModel,
    generationProvider: generation.generationProvider,
    includedInGeneration: generation.includedInGeneration,
    isFallback: generation.isFallback,
    principalId,
    promptTemplateVersion: generation.promptTemplateVersion,
    question,
    recommendedAction: generation.recommendedAction,
    responseDurationMs,
    retrievalUsedVectors,
    runId,
    startedAt,
  });

  const analysis = await getLatestFleetCorrelationAnalysis(anchorFaultEventId, principalCode);
  if (!analysis || analysis.diagnosticRunId !== runId) {
    throw new Error("Persisted fleet correlation analysis could not be reloaded.");
  }
  return analysis;
}

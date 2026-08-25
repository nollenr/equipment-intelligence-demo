import assert from "node:assert/strict";

import {
  b17EvidenceScopeStatement,
  classifyB17Question,
} from "../analysis/question-intent";
import type { EvidenceDocumentSource } from "../data/types";
import {
  GroundedGenerationError,
  type GenerationEvidence,
  type GroundingRequirements,
  type GroundedGenerationInput,
  generateWithDeterministicFallback,
  validateAndAssembleGeneratedAnswer,
} from "../openai/generation";

function source(documentType: string, documentChunkId: string, title: string): EvidenceDocumentSource {
  return {
    chunkContentSha256: "a".repeat(64),
    contentText: "Synthetic approved evidence text.",
    documentChunkId,
    documentCode: documentChunkId,
    documentId: crypto.randomUUID(),
    documentType,
    documentVersionId: crypto.randomUUID(),
    effectiveDate: "2026-08-23",
    owningOrganization: "Synthetic",
    pageEnd: 1,
    pageStart: 1,
    retrievalScopeId: crypto.randomUUID(),
    retrievalScopeName: "Test scope",
    scopeCode: "test-scope",
    scopeType: "fleet",
    sectionHeading: "Test section",
    snapshotUri: null,
    sourceAnchor: null,
    sourceSystem: "synthetic",
    sourceUri: null,
    sourceVersionId: null,
    title,
    versionContentSha256: "b".repeat(64),
    versionLabel: "1.0",
  };
}

const evidence: GenerationEvidence[] = [
  { evidenceId: "E1", source: source("oem_manual", crypto.randomUUID(), "OEM manual") },
  { evidenceId: "E2", source: source("site_procedure", crypto.randomUUID(), "Site procedure") },
];

const requirements: GroundingRequirements = {
  ambientPeak: 36.8,
  controllerPeak: 78.4,
  controllerThreshold: 75,
  latestOutput: 64,
  monitoringMinutes: 10,
  recoveryMinutes: 5,
  recoveryTemperature: 70,
};

const diagnosis = {
  direct_answer: {
    evidence_ids: ["E1"],
    text: "The inverter derated because controller temperature reached 78.4 °C, above the 75.0 °C threshold.",
  },
  field_guidance: { evidence_ids: ["E2"], text: "Inspect the authorized exterior cooling path and fan feedback." },
  recommended_action: { evidence_ids: ["E1", "E2"], text: "Keep the protective state while completing the approved checks." },
};

const assembledDiagnosis = validateAndAssembleGeneratedAnswer(diagnosis, evidence, requirements, "diagnosis");
assert.match(assembledDiagnosis.answerText, /\[1\]/);
assert.match(assembledDiagnosis.answerText, /\[2\]/);
assert.match(assembledDiagnosis.answerText, /Evidence scope:/);
assert.match(assembledDiagnosis.recommendedAction, /\[1\]\[2\]$/);

const inspection = {
  direct_answer: {
    evidence_ids: ["E2"],
    text: "Yes. The approved procedure supports several additional exterior checks, but not a complete health assessment.",
  },
  field_guidance: {
    evidence_ids: ["E1", "E2"],
    text: "Inspect cooling-air intake and exhaust for dust or obstruction, compare fan command with feedback, confirm temperature is declining, and validate the ambient sensor input.",
  },
  recommended_action: {
    evidence_ids: ["E1", "E2"],
    text: "Do not reset if temperature is stable or rising or fan feedback is unstable.",
  },
};
const assembledInspection = validateAndAssembleGeneratedAnswer(inspection, evidence, requirements, "inspection");
assert.match(assembledInspection.answerText, /additional exterior checks/i);
assert.match(assembledInspection.answerText, /complete inverter-health assessment/i);

const recovery = {
  direct_answer: { evidence_ids: ["E1"], text: "Do not reset until controller temperature is below 70 °C for five minutes." },
  field_guidance: { evidence_ids: ["E2"], text: "Complete the authorized cooling-path and fan-feedback checks." },
  recommended_action: { evidence_ids: ["E1", "E2"], text: "Acknowledge through the approved interface and monitor for ten minutes." },
};
validateAndAssembleGeneratedAnswer(recovery, evidence, requirements, "recovery");

const fleetHistory = {
  direct_answer: { evidence_ids: ["E1"], text: "I cannot determine fleet recurrence from this incident evidence." },
  field_guidance: { evidence_ids: ["E2"], text: "Complete the current incident inspection using the site procedure." },
  recommended_action: { evidence_ids: ["E1", "E2"], text: "Use an authorized fleet dataset before making a fleet-wide conclusion." },
};
validateAndAssembleGeneratedAnswer(fleetHistory, evidence, requirements, "fleet_history");

function expectValidationFailure(
  raw: unknown,
  expectedCode: string,
  intent: "diagnosis" | "general" | "inspection" | "recovery" = "diagnosis",
): void {
  assert.throws(
    () => validateAndAssembleGeneratedAnswer(raw, evidence, requirements, intent),
    (error) => error instanceof GroundedGenerationError && error.code === expectedCode,
  );
}

expectValidationFailure(
  { ...diagnosis, direct_answer: { evidence_ids: ["E99"], text: "Unknown evidence." } },
  "citation_validation_failed",
);
expectValidationFailure(
  { ...diagnosis, direct_answer: { evidence_ids: ["E1"], text: "The inverter entered B17 derating." } },
  "grounding_validation_failed",
);
expectValidationFailure(
  { ...diagnosis, direct_answer: { evidence_ids: ["E2"], text: "Temperature was 78.4 °C above 75 °C." } },
  "citation_validation_failed",
);
expectValidationFailure(
  { ...diagnosis, field_guidance: { evidence_ids: ["E2"], text: "Model-authored marker [42]." } },
  "citation_validation_failed",
);
expectValidationFailure(
  {
    ...inspection,
    field_guidance: { evidence_ids: ["E2"], text: "Inspect the cooling-air path and ambient input." },
  },
  "grounding_validation_failed",
  "inspection",
);
expectValidationFailure(
  {
    ...diagnosis,
    direct_answer: { evidence_ids: ["E1"], text: "The capacitor is healthy." },
  },
  "grounding_validation_failed",
  "general",
);
expectValidationFailure(
  {
    ...inspection,
    recommended_action: { evidence_ids: ["E1", "E2"], text: "The fan has failed; replace the fan immediately." },
  },
  "grounding_validation_failed",
  "inspection",
);

assert.equal(classifyB17Question("Why did this inverter enter a derated state?"), "diagnosis");
assert.equal(
  classifyB17Question("Are there other things I should check on the inverter to be sure nothing else is happening?"),
  "inspection",
);
assert.equal(classifyB17Question("Is it safe to reset and return to service?"), "recovery");
assert.equal(classifyB17Question("Did other inverters have this fault in the last 30 days?"), "fleet_history");
assert.match(b17EvidenceScopeStatement(2), /do not provide a complete inverter-health assessment/i);

const fallback = await generateWithDeterministicFallback(
  {} as GroundedGenerationInput,
  {
    answerText: "Question-focused deterministic answer.",
    generationModel: "thermal_derating_b17/v1.1",
    promptTemplateVersion: "deterministic-fallback/v1.1",
    recommendedAction: "Question-focused deterministic action.",
  },
  async () => {
    throw new GroundedGenerationError("Synthetic outage.", "api_error");
  },
);
assert.equal(fallback.isFallback, true);
assert.equal(fallback.includedInGeneration, false);
assert.equal(fallback.generationProvider, "deterministic_rules");
assert.equal(fallback.fallbackReasonCode, "api_error");
assert.equal(fallback.fallbackReasonMessage, "Synthetic outage.");
assert.equal(fallback.answerText, "Question-focused deterministic answer.");

console.log("Question-intent generation contract passed diagnosis, inspection, recovery, fleet limitation, safety, citation, and fallback paths.");

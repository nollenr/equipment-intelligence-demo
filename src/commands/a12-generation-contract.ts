import assert from "node:assert/strict";

import {
  a12EvidenceScopeStatement,
  classifyA12Question,
} from "../analysis/a12-question-intent";
import type { EvidenceDocumentSource } from "../data/types";
import {
  generateA12WithDeterministicFallback,
  type A12GroundedGenerationInput,
  type A12GroundingRequirements,
  validateAndAssembleA12GeneratedAnswer,
} from "../openai/fan-variance-generation";
import {
  GroundedGenerationError,
  type GenerationEvidence,
} from "../openai/generation";

function source(documentType: string, title: string): EvidenceDocumentSource {
  return {
    chunkContentSha256: "a".repeat(64),
    contentText: "Synthetic approved A12 evidence text.",
    documentChunkId: crypto.randomUUID(),
    documentCode: crypto.randomUUID(),
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
  { evidenceId: "E1", source: source("oem_manual", "OEM fan manual") },
  { evidenceId: "E2", source: source("site_procedure", "Babcock inspection procedure") },
  { evidenceId: "E3", source: source("work_order", "Return-to-service checklist") },
];
const requirements: A12GroundingRequirements = {
  acceptanceCommandMinimum: 80,
  acceptanceMinutes: 10,
  acceptanceVarianceMaximum: 5,
  latestVariance: 15.9,
  peakVariance: 17.2,
  varianceThreshold: 12,
};

const diagnosis = {
  direct_answer: {
    evidence_ids: ["E1"],
    text: "A12 was asserted because fan variance reached 17.2%, above the configured 12.0% threshold; this does not prove fan failure.",
  },
  field_guidance: {
    evidence_ids: ["E2"],
    text: "Inspect the exterior intake and exhaust for dust, compare command and feedback, and keep Maintenance Hold if feedback is missing, unstable, or divergent.",
  },
  recommended_action: {
    evidence_ids: ["E3"],
    text: "Complete the approved release checklist after documented inspection or qualified maintenance.",
  },
};
const assembledDiagnosis = validateAndAssembleA12GeneratedAnswer(diagnosis, evidence, requirements, "diagnosis");
assert.match(assembledDiagnosis.answerText, /\[1\]/);
assert.match(assembledDiagnosis.answerText, /\[2\]/);
assert.match(assembledDiagnosis.recommendedAction, /\[3\]$/);
assert.match(assembledDiagnosis.answerText, /Evidence scope:/);

const inspection = {
  direct_answer: {
    evidence_ids: ["E2"],
    text: "Inspect exterior intake and exhaust openings for vegetation, dust, loose material, water, or damage.",
  },
  field_guidance: {
    evidence_ids: ["E1", "E2"],
    text: "Compare fan command and feedback; if feedback is missing, unstable, or divergent, retain Maintenance Hold and escalate through a work order.",
  },
  recommended_action: {
    evidence_ids: ["E3"],
    text: "Document the inspection and use the return-to-service checklist before release.",
  },
};
validateAndAssembleA12GeneratedAnswer(inspection, evidence, requirements, "inspection");

const recovery = {
  direct_answer: {
    evidence_ids: ["E3"],
    text: "The inverter is not ready for release; A12 acceptance requires command at or above 80%, variance at or below 5%, and a ten-minute verification.",
  },
  field_guidance: {
    evidence_ids: ["E1", "E2"],
    text: "Keep Maintenance Hold while feedback remains divergent and complete the authorized exterior inspection.",
  },
  recommended_action: {
    evidence_ids: ["E3"],
    text: "Require stable feedback, no new A12 event, documented disposition, and control-room authorization.",
  },
};
validateAndAssembleA12GeneratedAnswer(recovery, evidence, requirements, "recovery");

assert.throws(
  () => validateAndAssembleA12GeneratedAnswer(
    { ...diagnosis, direct_answer: { evidence_ids: ["E99"], text: "Unknown source." } },
    evidence,
    requirements,
    "diagnosis",
  ),
  (error) => error instanceof GroundedGenerationError && error.code === "citation_validation_failed",
);
assert.throws(
  () => validateAndAssembleA12GeneratedAnswer(
    { ...inspection, recommended_action: { evidence_ids: ["E3"], text: "The fan has failed; replace the fan now." } },
    evidence,
    requirements,
    "inspection",
  ),
  (error) => error instanceof GroundedGenerationError && error.code === "grounding_validation_failed",
);

assert.equal(classifyA12Question("Why did INV-102 record fault A12?"), "diagnosis");
assert.equal(classifyA12Question("What should I inspect on the fan system?"), "inspection");
assert.equal(classifyA12Question("Can I release it from Maintenance Hold?"), "recovery");
assert.equal(classifyA12Question("Did other inverters have A12?"), "fleet_history");
assert.match(a12EvidenceScopeStatement(3), /do not identify an internal failed component/i);

const fallback = await generateA12WithDeterministicFallback(
  {} as A12GroundedGenerationInput,
  {
    answerText: "Safe A12 fallback.",
    generationModel: "fan_feedback_variance_a12/v1.0",
    promptTemplateVersion: "a12-fan-fallback/v1.0",
    recommendedAction: "Keep Maintenance Hold.",
  },
  async () => {
    throw new GroundedGenerationError("Synthetic outage.", "api_error");
  },
);
assert.equal(fallback.isFallback, true);
assert.equal(fallback.fallbackReasonCode, "api_error");
assert.equal(fallback.answerText, "Safe A12 fallback.");

console.log("A12 generation contract passed diagnosis, inspection, release, citation, safety, scope, and fallback paths.");

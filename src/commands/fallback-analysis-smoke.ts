import { createB17Analysis } from "../analysis/thermal-derating";
import { getApplicationPool } from "../database";

const faultEventId = "30000000-0000-4000-8000-000000000017";
process.env.NEXTERA_GENERATION_MODE = "deterministic";

try {
  const analysis = await createB17Analysis(
    faultEventId,
    "Why did inverter INV-042 enter a derated state after fault B17?",
  );

  if (
    analysis.generationProvider !== "deterministic_rules" ||
    analysis.generationModel !== "thermal_derating_b17/v1.1" ||
    analysis.promptTemplateVersion !== "deterministic-fallback/v1.1" ||
    analysis.isFallback !== true ||
    analysis.sources.length !== 2 ||
    analysis.sources.some((source) => source.includedInGeneration !== false)
  ) {
    throw new Error("The persisted deterministic fallback did not match the expected provenance shape.");
  }

  const inspection = await createB17Analysis(
    faultEventId,
    "Are there other things I should check on the inverter to be sure nothing else is happening?",
  );
  if (
    inspection.generationProvider !== "deterministic_rules" ||
    !/cooling-air intake/i.test(inspection.answerText) ||
    !/fan feedback/i.test(inspection.answerText) ||
    !/ambient-temperature input/i.test(inspection.answerText) ||
    !/Evidence scope:/i.test(inspection.answerText) ||
    !/do not provide a complete inverter-health assessment/i.test(inspection.answerText)
  ) {
    throw new Error("The inspection fallback was not question-focused and evidence-scoped.");
  }

  console.log(
    JSON.stringify(
      {
        answerId: analysis.answerId,
        generationModel: analysis.generationModel,
        generationProvider: analysis.generationProvider,
        isFallback: analysis.isFallback,
        inspectionAnswerId: inspection.answerId,
        inspectionQuestionFocused: true,
        ok: true,
        promptTemplateVersion: analysis.promptTemplateVersion,
        sources: analysis.sources.map((source) => ({
          documentCode: source.documentCode,
          includedInGeneration: source.includedInGeneration,
          retrievalMethod: source.retrievalMethod,
          retrievalRank: source.retrievalRank,
        })),
      },
      null,
      2,
    ),
  );
} finally {
  await getApplicationPool().end();
}

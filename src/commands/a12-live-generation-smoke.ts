import { createA12Analysis } from "../analysis/fan-variance";
import { getApplicationPool } from "../database";

const faultEventId = "30000000-0000-4000-8000-000000000112";
delete process.env.NEXTERA_GENERATION_MODE;

try {
  const analysis = await createA12Analysis(
    faultEventId,
    "Why did INV-102 enter Maintenance Hold after fault A12?",
  );
  const complete = `${analysis.answerText} ${analysis.recommendedAction ?? ""}`;
  if (
    analysis.generationProvider !== "openai" ||
    analysis.isFallback ||
    analysis.promptTemplateVersion !== "a12-fan-grounded/v1.0" ||
    analysis.sources.length !== 3 ||
    analysis.sources.some((source) =>
      source.retrievalMethod !== "vector" ||
      source.includedInGeneration !== true ||
      !Number.isFinite(source.cosineDistance) ||
      !Number.isInteger(source.retrievalRank)
    ) ||
    !complete.includes("[1]") ||
    !complete.includes("[2]") ||
    !complete.includes("[3]") ||
    !/17\.2/.test(analysis.answerText) ||
    !/12(?:\.0)?/.test(analysis.answerText) ||
    /fan (?:has )?failed/i.test(complete) ||
    /replace (?:the )?fan/i.test(complete) ||
    !/Evidence scope:/i.test(analysis.answerText)
  ) {
    throw new Error("Live A12 analysis did not satisfy the grounded vector/citation/safety contract.");
  }

  console.log(JSON.stringify({
    answerId: analysis.answerId,
    generationModel: analysis.generationModel,
    generationProvider: analysis.generationProvider,
    ok: true,
    responseDurationMs: analysis.responseDurationMs,
    sources: analysis.sources.map((source) => ({
      cosineDistance: source.cosineDistance,
      documentCode: source.documentCode,
      retrievalRank: source.retrievalRank,
    })),
  }, null, 2));
} finally {
  await getApplicationPool().end();
}

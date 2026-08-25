import { getLatestIncidentAnalysis } from "../data/analysis.js";

const faultEventId = "30000000-0000-4000-8000-000000000017";
const analysis = await getLatestIncidentAnalysis(faultEventId);

if (
  !analysis ||
  analysis.embeddingModel !== "text-embedding-3-small" ||
  analysis.sources.length !== 2 ||
  analysis.sources.some(
    (source) =>
      source.retrievalMethod !== "vector" ||
      !Number.isFinite(source.cosineDistance) ||
      !Number.isInteger(source.retrievalRank),
  )
) {
  throw new Error("The latest B17 analysis does not contain complete persisted vector provenance.");
}

console.log(
  JSON.stringify(
    {
      answerId: analysis.answerId,
      diagnosticRunId: analysis.diagnosticRunId,
      embeddingModel: analysis.embeddingModel,
      ok: true,
      sources: analysis.sources.map((source) => ({
        cosineDistance: source.cosineDistance,
        documentCode: source.documentCode,
        retrievalMethod: source.retrievalMethod,
        retrievalRank: source.retrievalRank,
        scopeCode: source.scopeCode,
      })),
    },
    null,
    2,
  ),
);

export {};

const faultEventId = "30000000-0000-4000-8000-000000000017";
const response = await fetch(`http://127.0.0.1:3000/api/incidents/${faultEventId}/analysis`, {
  body: JSON.stringify({
    question: "Why did inverter INV-042 enter a derated state after fault B17?",
  }),
  headers: { "content-type": "application/json" },
  method: "POST",
  signal: AbortSignal.timeout(60_000),
});

const payload = (await response.json()) as {
  answerId?: string;
  answerText?: string;
  error?: string;
  generationModel?: string;
  generationProvider?: string;
  isFallback?: boolean;
  recommendedAction?: string;
  responseDurationMs?: number;
  sources?: Array<{
    cosineDistance?: number;
    documentCode?: string;
    includedInGeneration?: boolean;
    retrievalMethod?: string;
    retrievalRank?: number;
    scopeCode?: string;
  }>;
};
const completeResponse = `${payload.answerText ?? ""} ${payload.recommendedAction ?? ""}`;

if (!response.ok) {
  throw new Error(`Live analysis returned HTTP ${response.status}: ${payload.error ?? "unknown error"}`);
}

if (
  !payload.answerId ||
  !payload.answerText ||
  payload.generationProvider !== "openai" ||
  !payload.generationModel ||
  payload.isFallback !== false ||
  !completeResponse.includes("[1]") ||
  !completeResponse.includes("[2]") ||
  completeResponse.includes("[3]") ||
  !Array.isArray(payload.sources) ||
  payload.sources.length !== 2 ||
  payload.sources.some(
    (source) =>
      source.retrievalMethod !== "vector" ||
      source.includedInGeneration !== true ||
      !Number.isFinite(source.cosineDistance) ||
      !Number.isInteger(source.retrievalRank),
  )
) {
  throw new Error("Live analysis did not return the expected generated answer and vector-provenance shape.");
}

console.log(
  JSON.stringify(
    {
      answerId: payload.answerId,
      answerText: payload.answerText,
      generationModel: payload.generationModel,
      generationProvider: payload.generationProvider,
      isFallback: payload.isFallback,
      ok: true,
      recommendedAction: payload.recommendedAction,
      responseDurationMs: payload.responseDurationMs,
      sources: payload.sources.map((source) => ({
        cosineDistance: source.cosineDistance,
        documentCode: source.documentCode,
        includedInGeneration: source.includedInGeneration,
        retrievalMethod: source.retrievalMethod,
        retrievalRank: source.retrievalRank,
        scopeCode: source.scopeCode,
      })),
    },
    null,
    2,
  ),
);

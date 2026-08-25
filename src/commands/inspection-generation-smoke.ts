export {};

const faultEventId = "30000000-0000-4000-8000-000000000017";
const question = "Are there other things I should check on the inverter to be sure nothing else is happening?";
const response = await fetch(`http://127.0.0.1:3000/api/incidents/${faultEventId}/analysis`, {
  body: JSON.stringify({ question }),
  headers: { "content-type": "application/json" },
  method: "POST",
  signal: AbortSignal.timeout(60_000),
});

const payload = (await response.json()) as {
  answerText?: string;
  error?: string;
  generationModel?: string;
  generationProvider?: string;
  isFallback?: boolean;
  promptTemplateVersion?: string;
  recommendedAction?: string;
};

if (!response.ok) {
  throw new Error(`Inspection generation returned HTTP ${response.status}: ${payload.error ?? "unknown error"}`);
}

const answer = payload.answerText ?? "";
const responseText = `${answer} ${payload.recommendedAction ?? ""}`;
if (
  payload.generationProvider !== "openai" ||
  payload.isFallback !== false ||
  payload.promptTemplateVersion !== "equipment-health-grounded/v1.1" ||
  !/cooling[- ]air|intake|exhaust/i.test(responseText) ||
  !/fan/i.test(responseText) ||
  !/feedback/i.test(responseText) ||
  !/ambient/i.test(responseText) ||
  !/Evidence scope:/i.test(answer) ||
  !/complete inverter-health assessment/i.test(answer) ||
  !answer.includes("[1]") ||
  !answer.includes("[2]")
) {
  throw new Error("Inspection question did not return a live, question-focused, evidence-scoped answer.");
}

console.log(
  JSON.stringify(
    {
      answerText: answer,
      generationModel: payload.generationModel,
      generationProvider: payload.generationProvider,
      isFallback: payload.isFallback,
      ok: true,
      promptTemplateVersion: payload.promptTemplateVersion,
      recommendedAction: payload.recommendedAction,
    },
    null,
    2,
  ),
);

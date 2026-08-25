export {};

const faultEventId = "30000000-0000-4000-8000-000000000112";
const response = await fetch(`http://127.0.0.1:3000/api/incidents/${faultEventId}/analysis`, {
  body: JSON.stringify({
    question: "Can I release INV-102 from Maintenance Hold and return it to service?",
  }),
  headers: { "content-type": "application/json" },
  method: "POST",
  signal: AbortSignal.timeout(60_000),
});
const payload = (await response.json()) as {
  answerText?: string;
  diagnosticRuleCode?: string;
  error?: string;
  generationProvider?: string;
  isFallback?: boolean;
  recommendedAction?: string;
  sources?: Array<{ documentCode?: string }>;
};
if (!response.ok) {
  throw new Error(`A12 HTTP analysis returned ${response.status}: ${payload.error ?? "unknown error"}`);
}
const complete = `${payload.answerText ?? ""} ${payload.recommendedAction ?? ""}`;
if (
  payload.diagnosticRuleCode !== "fan_feedback_variance_a12" ||
  !["openai", "deterministic_rules"].includes(payload.generationProvider ?? "") ||
  (payload.generationProvider === "openai" && payload.isFallback !== false) ||
  (payload.generationProvider === "deterministic_rules" && payload.isFallback !== true) ||
  payload.sources?.length !== 3 ||
  !complete.includes("[1]") ||
  !complete.includes("[2]") ||
  !complete.includes("[3]") ||
  !/not ready|do not release|does not support return/i.test(complete) ||
  !/80\s*(?:%|percent)/i.test(complete) ||
  !/5\s*(?:%|points?|percentage points?)/i.test(complete) ||
  !/\b(?:10|ten)(?: continuous)?[- ]minutes?\b/i.test(complete) ||
  !/no new A12/i.test(complete) ||
  /fan (?:has )?failed/i.test(complete) ||
  /replace (?:the )?fan/i.test(complete)
) {
  throw new Error(`A12 HTTP release response escaped its routing, evidence, or safety contract: ${JSON.stringify(payload)}`);
}

console.log(JSON.stringify({
  generationProvider: payload.generationProvider,
  isFallback: payload.isFallback,
  ok: true,
  sources: payload.sources?.map((source) => source.documentCode),
}, null, 2));

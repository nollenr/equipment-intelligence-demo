export {};

const faultEventId = "30000000-0000-4000-8000-000000000201";
const response = await fetch(`http://127.0.0.1:3000/api/incidents/${faultEventId}/analysis`, {
  body: JSON.stringify({ question: "Can I return TRK-01 to Automatic Tracking?" }),
  headers: { "content-type": "application/json" },
  method: "POST",
  signal: AbortSignal.timeout(60_000),
});
const payload = await response.json() as { answerText?: string; diagnosticRuleCode?: string; error?: string; generationProvider?: string; isFallback?: boolean; recommendedAction?: string; sources?: Array<{ documentCode?: string }> };
if (!response.ok) throw new Error(`P09 HTTP analysis returned ${response.status}: ${payload.error ?? "unknown error"}`);
const complete = `${payload.answerText ?? ""} ${payload.recommendedAction ?? ""}`;
if (payload.diagnosticRuleCode !== "tracker_position_deviation_p09" || !["openai", "deterministic_rules"].includes(payload.generationProvider ?? "") || payload.sources?.length !== 3 || !complete.includes("[1]") || !complete.includes("[2]") || !complete.includes("[3]") || !/not ready|do not release|retain Safe Stow Hold/i.test(complete) || !/(?:three|3) supervised/i.test(complete) || !/2\.0\s*(?:degrees|°)/i.test(complete) || !/6\.5\s*(?:amperes|A)/i.test(complete) || /actuator (?:has )?failed/i.test(complete) || /\b(?:may|can|should|authorized to)\s+(?:safely\s+)?enter (?:the )?movement envelope/i.test(complete)) {
  throw new Error(`P09 HTTP response escaped its routing, evidence, or motion-safety contract: ${JSON.stringify(payload)}`);
}
console.log(JSON.stringify({ generationProvider: payload.generationProvider, isFallback: payload.isFallback, ok: true, sources: payload.sources?.map((source) => source.documentCode) }, null, 2));

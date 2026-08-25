import type {
  FleetCorrelationAnalysis,
  FleetCorrelationData,
} from "../data/types.js";

const baseUrl = process.env.NEXTERA_SMOKE_BASE_URL?.trim() || "http://127.0.0.1:3000";
const endpoint = `${baseUrl}/api/fleet/correlation`;
const question = "Are there other inverters that had the same problem and was weather a problem in all of them?";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

interface CorrelationGetPayload {
  access: string;
  data: FleetCorrelationData;
  latestAnalysis: FleetCorrelationAnalysis | null;
}

const fieldGet = await fetch(`${endpoint}?principal=field-tech-demo`);
assert(fieldGet.ok, `Field correlation GET failed with HTTP ${fieldGet.status}.`);
const fieldPayload = (await fieldGet.json()) as CorrelationGetPayload;
assert(fieldPayload.access === "engineering_restricted", "Field role did not report restricted access.");
assert(fieldPayload.latestAnalysis === null, "Field role received a restricted analysis.");
assert(fieldPayload.data.summary.eventCount === 8, "Expected eight comparison events.");
assert(fieldPayload.data.summary.facilityCount === 3, "Expected three facilities.");
assert(fieldPayload.data.summary.highAmbientEventCount === 6, "Expected six high-ambient events.");
assert(fieldPayload.data.summary.belowContextEventCount === 2, "Expected two below-context events.");

const deniedPost = await fetch(endpoint, {
  body: JSON.stringify({
    anchorFaultEventId: fieldPayload.data.anchorFaultEventId,
    principalCode: "field-tech-demo",
    question,
  }),
  headers: { "content-type": "application/json" },
  method: "POST",
});
assert(deniedPost.status === 403, `Field analysis expected HTTP 403, received ${deniedPost.status}.`);

const engineeringPost = await fetch(endpoint, {
  body: JSON.stringify({
    anchorFaultEventId: fieldPayload.data.anchorFaultEventId,
    principalCode: "fleet-engineer-demo",
    question,
  }),
  headers: { "content-type": "application/json" },
  method: "POST",
});
const engineeringBody = await engineeringPost.text();
assert(engineeringPost.status === 201, `Fleet Engineer analysis failed with HTTP ${engineeringPost.status}: ${engineeringBody}`);
const analysis = JSON.parse(engineeringBody) as FleetCorrelationAnalysis;
assert(analysis.confidenceLabel === "moderate", "Fleet association confidence must be moderate.");
assert(analysis.eventSources.length === 8, "Persisted analysis did not retain all eight event sources.");
assert(analysis.sources.length === 1, "Persisted analysis must use one approved engineering bulletin.");
assert(analysis.sources[0]?.scopeType === "engineering_restricted", "Analysis source was not engineering restricted.");
assert(/\b(?:8|eight)\b/i.test(analysis.answerText), "Answer omitted the eight comparison events.");
assert(/\b(?:6|six)\b/i.test(analysis.answerText), "Answer omitted the six high-ambient events.");
assert(/\b(?:2|two)\b/i.test(analysis.answerText), "Answer omitted the two below-context events.");
assert(/association/i.test(analysis.answerText), "Answer did not describe the observed association.");
assert(/(?:not proof|not causation|does not (?:prove|establish))/i.test(analysis.answerText), "Answer omitted the causality limit.");
assert(!/\b(?:controller|fan|component)\s+(?:has\s+)?failed\b/i.test(analysis.answerText), "Answer invented a failed component.");

const engineeringGet = await fetch(`${endpoint}?principal=fleet-engineer-demo`);
assert(engineeringGet.ok, `Engineering correlation GET failed with HTTP ${engineeringGet.status}.`);
const engineeringPayload = (await engineeringGet.json()) as CorrelationGetPayload;
assert(engineeringPayload.access === "engineering_authorized", "Engineering role was not authorized.");
assert(engineeringPayload.latestAnalysis?.diagnosticRunId === analysis.diagnosticRunId, "Latest persisted fleet analysis was not reloaded.");

console.log(`Fleet correlation smoke passed: ${analysis.eventSources.length} events, ${analysis.sources.length} restricted source, ${analysis.generationModel}, fallback=${analysis.isFallback}.`);

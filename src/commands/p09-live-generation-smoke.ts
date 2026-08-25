import { createP09Analysis } from "../analysis/tracker-position-deviation";
import { getApplicationPool } from "../database";

const faultEventId = "30000000-0000-4000-8000-000000000201";
process.env.NEXTERA_GENERATION_MODE = "live";

try {
  const analysis = await createP09Analysis(
    faultEventId,
    "Why did TRK-01 enter Safe Stow Hold after fault P09?",
  );
  const complete = `${analysis.answerText} ${analysis.recommendedAction ?? ""}`;
  if (
    analysis.generationProvider !== "openai" ||
    analysis.isFallback ||
    analysis.sources.length !== 3 ||
    !/15\.1\s*(?:degrees|°)/i.test(complete) ||
    !/5(?:\.0)?\s*(?:degrees|°)/i.test(complete) ||
    !complete.includes("[1]") ||
    !complete.includes("[2]") ||
    !complete.includes("[3]") ||
    /actuator (?:has )?failed/i.test(complete) ||
    /\b(?:may|can|should|authorized to)\s+(?:safely\s+)?enter (?:the )?movement envelope/i.test(complete)
  ) {
    throw new Error(`P09 live diagnosis did not retain its grounding contract: ${JSON.stringify({ generationProvider: analysis.generationProvider, isFallback: analysis.isFallback })}`);
  }
  console.log(JSON.stringify({ answerId: analysis.answerId, generationModel: analysis.generationModel, ok: true, sources: analysis.sources.map((source) => source.documentCode) }, null, 2));
} finally {
  await getApplicationPool().end();
}

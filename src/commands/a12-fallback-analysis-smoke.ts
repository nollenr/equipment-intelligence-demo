import { createA12Analysis } from "../analysis/fan-variance";
import { getApplicationPool } from "../database";

const faultEventId = "30000000-0000-4000-8000-000000000112";
process.env.NEXTERA_GENERATION_MODE = "deterministic";

try {
  const diagnosis = await createA12Analysis(
    faultEventId,
    "Why did INV-102 enter Maintenance Hold after fault A12?",
  );
  if (
    diagnosis.generationProvider !== "deterministic_rules" ||
    diagnosis.generationModel !== "fan_feedback_variance_a12/v1.0" ||
    diagnosis.promptTemplateVersion !== "a12-fan-fallback/v1.0" ||
    diagnosis.sources.length !== 3 ||
    diagnosis.findings.length !== 3 ||
    !/17\.2%/.test(diagnosis.answerText) ||
    !/12\.0%/.test(diagnosis.answerText) ||
    /fan (?:has )?failed/i.test(diagnosis.answerText)
  ) {
    throw new Error("A12 diagnosis fallback did not retain the expected grounded contract.");
  }

  const inspection = await createA12Analysis(
    faultEventId,
    "What else should I inspect before qualified maintenance begins?",
  );
  const inspectionText = `${inspection.answerText} ${inspection.recommendedAction ?? ""}`;
  if (
    !/intake/i.test(inspectionText) ||
    !/exhaust/i.test(inspectionText) ||
    !/command/i.test(inspectionText) ||
    !/feedback/i.test(inspectionText) ||
    !/Maintenance Hold/i.test(inspectionText)
  ) {
    throw new Error("A12 inspection fallback omitted an authorized check or hold boundary.");
  }

  const recovery = await createA12Analysis(
    faultEventId,
    "Can I release INV-102 from Maintenance Hold and return it to service?",
  );
  const recoveryText = `${recovery.answerText} ${recovery.recommendedAction ?? ""}`;
  if (
    !/not ready/i.test(recoveryText) ||
    !/80%/.test(recoveryText) ||
    !/5 percentage points/i.test(recoveryText) ||
    !/ten continuous minutes/i.test(recoveryText) ||
    !/no new A12/i.test(recoveryText)
  ) {
    throw new Error("A12 release fallback omitted a required acceptance criterion.");
  }

  console.log(JSON.stringify({
    diagnosisAnswerId: diagnosis.answerId,
    inspectionAnswerId: inspection.answerId,
    ok: true,
    recoveryAnswerId: recovery.answerId,
    sources: diagnosis.sources.map((source) => source.documentCode),
  }, null, 2));
} finally {
  await getApplicationPool().end();
}

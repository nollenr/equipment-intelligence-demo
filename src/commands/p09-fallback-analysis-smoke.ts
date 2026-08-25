import { createP09Analysis } from "../analysis/tracker-position-deviation";
import { getApplicationPool } from "../database";

const faultEventId = "30000000-0000-4000-8000-000000000201";
process.env.NEXTERA_GENERATION_MODE = "deterministic";

try {
  const diagnosis = await createP09Analysis(faultEventId, "Why did TRK-01 enter Safe Stow Hold after fault P09?");
  if (diagnosis.generationProvider !== "deterministic_rules" || diagnosis.generationModel !== "tracker_position_deviation_p09/v1.0" || diagnosis.promptTemplateVersion !== "p09-tracker-fallback/v1.0" || diagnosis.sources.length !== 3 || diagnosis.findings.length !== 3 || !/15\.1 degrees/.test(diagnosis.answerText) || !/5\.0-degree/.test(diagnosis.answerText) || /actuator (?:has )?failed/i.test(diagnosis.answerText)) {
    throw new Error("P09 diagnosis fallback did not retain the expected grounded contract.");
  }

  const inspection = await createP09Analysis(faultEventId, "What else should I inspect on this tracker row?");
  const inspectionText = `${inspection.answerText} ${inspection.recommendedAction ?? ""}`;
  if (!/movement envelope/i.test(inspectionText) || !/vegetation/i.test(inspectionText) || !/commanded/i.test(inspectionText) || !/measured/i.test(inspectionText) || !/Safe Stow Hold/i.test(inspectionText)) {
    throw new Error("P09 inspection fallback omitted an authorized check or motion boundary.");
  }

  const recovery = await createP09Analysis(faultEventId, "Can I return TRK-01 to Automatic Tracking?");
  const recoveryText = `${recovery.answerText} ${recovery.recommendedAction ?? ""}`;
  if (!/not ready/i.test(recoveryText) || !/three supervised moves/i.test(recoveryText) || !/2\.0 degrees/i.test(recoveryText) || !/6\.5 amperes/i.test(recoveryText) || !/control-room authorization/i.test(recoveryText)) {
    throw new Error("P09 recovery fallback omitted a required acceptance criterion.");
  }

  console.log(JSON.stringify({ diagnosisAnswerId: diagnosis.answerId, inspectionAnswerId: inspection.answerId, ok: true, recoveryAnswerId: recovery.answerId, sources: diagnosis.sources.map((source) => source.documentCode) }, null, 2));
} finally {
  await getApplicationPool().end();
}

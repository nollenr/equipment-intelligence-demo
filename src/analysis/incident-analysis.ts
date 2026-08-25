import { getIncidentById } from "../data/incidents";
import type { IncidentAnalysis } from "../data/types";
import { createA12Analysis } from "./fan-variance";
import { createP09Analysis } from "./tracker-position-deviation";
import { AnalysisInputError, createB17Analysis } from "./thermal-derating";

export async function createIncidentAnalysis(
  faultEventId: string,
  question: string,
): Promise<IncidentAnalysis> {
  const incident = await getIncidentById(faultEventId);
  if (!incident) {
    throw new AnalysisInputError("Incident not found.", 404);
  }
  if (incident.faultCode === "B17") {
    return createB17Analysis(faultEventId, question);
  }
  if (incident.faultCode === "A12") {
    return createA12Analysis(faultEventId, question);
  }
  if (incident.faultCode === "P09") {
    return createP09Analysis(faultEventId, question);
  }
  throw new AnalysisInputError(`Grounded analysis is not yet configured for fault ${incident.faultCode}.`);
}

export type P09QuestionIntent = "diagnosis" | "fleet_history" | "inspection" | "recovery" | "general";

export interface P09FallbackContext {
  commandedLatest: number;
  currentLatest: number;
  currentPeak: number;
  currentThreshold: number;
  deviationLatest: number;
  deviationPeak: number;
  deviationThreshold: number;
  equipmentCode: string;
  evidenceCount: number;
  measuredLatest: number;
  oemCitation: string;
  releaseCitation: string;
  siteCitation: string;
}

export interface P09IntentAwareFallback {
  answerText: string;
  generationModel: string;
  promptTemplateVersion: string;
  recommendedAction: string;
}

export function classifyP09Question(question: string): P09QuestionIntent {
  const normalized = question.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (/\b(?:fleet|other trackers?|other rows?|across (?:the )?fleet|histor(?:y|ical)|previous events?|same model)\b/.test(normalized)) return "fleet_history";
  if (/\b(?:release|reset|restart|acknowledg|return to automatic|automatic tracking|clear (?:the )?fault|recovery|safe to)\b/.test(normalized)) return "recovery";
  if (/\b(?:what else|other things?|other checks?|should i check|should we check|inspect|inspection|look for|anything else|movement envelope|row path)\b/.test(normalized)) return "inspection";
  if (/\b(?:why|cause|caused|what happened|what is p09|explain p09|fault p09|position deviation|trigger(?:ed)?|fault mean)\b/.test(normalized)) return "diagnosis";
  return "general";
}

export function p09QuestionIntentLabel(intent: P09QuestionIntent): string {
  const labels: Record<P09QuestionIntent, string> = {
    diagnosis: "Position-deviation diagnosis",
    fleet_history: "Fleet history",
    general: "Evidence-scoped question",
    inspection: "Tracker-row inspection",
    recovery: "Return to automatic",
  };
  return labels[intent];
}

export function p09EvidenceScopeStatement(evidenceCount: number): string {
  const sourceLabel = evidenceCount === 1 ? "one authorized excerpt" : `${evidenceCount} authorized excerpts`;
  return `Evidence scope: I only have access to the ${sourceLabel} shown for this incident. They cover TRC-8 fault P09, the authorized Citrus observation from outside the movement envelope, and controlled return-to-automatic criteria. They do not identify a failed component or replace qualified tracker maintenance.`;
}

export function buildP09IntentAwareFallback(intent: P09QuestionIntent, context: P09FallbackContext): P09IntentAwareFallback {
  const exceedance = context.deviationPeak - context.deviationThreshold;
  const signalDelta = Math.abs(context.commandedLatest - context.measuredLatest);
  const allCitations = `${context.oemCitation}${context.siteCitation}${context.releaseCitation}`;
  const scope = p09EvidenceScopeStatement(context.evidenceCount);
  const holdAction = `Keep ${context.equipmentCode} in Safe Stow Hold and maintain the movement exclusion zone. Complete the authorized exterior observation; escalate to qualified maintenance if the path is not clear, feedback is unstable, deviation remains above ${context.deviationThreshold.toFixed(1)} degrees, or drive current remains above ${context.currentThreshold.toFixed(1)} amperes. ${allCitations}`;

  if (intent === "inspection") {
    return {
      answerText: `From outside the movement envelope, inspect the row path for vegetation, debris, pooled material, and row or module interference. Observe visible modules, supports, torque-tube alignment, linkage, and the drive housing for displacement, bending, loose material, or impact evidence. Do not touch components or command motion under this procedure. ${context.siteCitation}\n\nReview commanded and measured angle together and record whether feedback is present, stable, and responsive. Current evidence does not prove an actuator, sensor, drive, or linkage failure. Retain Safe Stow Hold and escalate if disagreement or elevated loading persists. ${context.oemCitation}${context.siteCitation}\n\n${scope}`,
      generationModel: "tracker_position_deviation_p09/v1.0",
      promptTemplateVersion: "p09-tracker-fallback/v1.0",
      recommendedAction: holdAction,
    };
  }
  if (intent === "recovery") {
    return {
      answerText: `${context.equipmentCode} is not ready to return to Automatic Tracking from the current event window. Latest commanded angle was ${context.commandedLatest.toFixed(1)} degrees and measured angle was ${context.measuredLatest.toFixed(1)} degrees, a ${signalDelta.toFixed(1)}-degree difference; latest deviation was ${context.deviationLatest.toFixed(1)} degrees, above the ${context.deviationThreshold.toFixed(1)}-degree P09 threshold. ${context.oemCitation}\n\nRelease requires documented disposition, a clear movement envelope, stable feedback, three supervised moves with deviation at or below 2.0 degrees and drive current at or below 6.5 amperes, no abnormal binding or new P09, and control-room authorization. ${context.releaseCitation}\n\n${scope}`,
      generationModel: "tracker_position_deviation_p09/v1.0",
      promptTemplateVersion: "p09-tracker-fallback/v1.0",
      recommendedAction: holdAction,
    };
  }
  if (intent === "fleet_history") {
    return {
      answerText: `I cannot determine P09 recurrence across other tracker rows from this incident's authorized documents and single event window. The available evidence establishes only that ${context.equipmentCode} recorded position deviation above its configured threshold. ${context.oemCitation}\n\n${scope}`,
      generationModel: "tracker_position_deviation_p09/v1.0",
      promptTemplateVersion: "p09-tracker-fallback/v1.0",
      recommendedAction: `Use this investigation for ${context.equipmentCode} only. A fleet comparison requires a separately authorized P09 event set that is not available in this workflow. ${context.oemCitation}`,
    };
  }
  if (intent === "general") {
    return {
      answerText: `I do not have enough approved evidence to answer that question. What I can establish is that ${context.equipmentCode} recorded ${context.deviationPeak.toFixed(1)} degrees of peak position deviation, above the configured ${context.deviationThreshold.toFixed(1)}-degree threshold, and remains in Safe Stow Hold. ${context.oemCitation}\n\nThe approved sources support exterior observation and controlled return-to-automatic checks, but do not identify a failed component. ${context.siteCitation}${context.releaseCitation}\n\n${scope}`,
      generationModel: "tracker_position_deviation_p09/v1.0",
      promptTemplateVersion: "p09-tracker-fallback/v1.0",
      recommendedAction: holdAction,
    };
  }
  return {
    answerText: `${context.equipmentCode} entered Safe Stow Hold after peak commanded-versus-measured position deviation reached ${context.deviationPeak.toFixed(1)} degrees, exceeding the configured ${context.deviationThreshold.toFixed(1)}-degree P09 threshold by ${exceedance.toFixed(1)} degrees. Latest commanded angle was ${context.commandedLatest.toFixed(1)} degrees and measured angle was ${context.measuredLatest.toFixed(1)} degrees, corroborating a ${signalDelta.toFixed(1)}-degree disagreement. ${context.oemCitation}\n\nDrive-motor current peaked at ${context.currentPeak.toFixed(1)} amperes, above its ${context.currentThreshold.toFixed(1)}-ampere context threshold. That is consistent with elevated loading, but it does not explain the disagreement or prove component failure. ${context.oemCitation}\n\n${scope}`,
    generationModel: "tracker_position_deviation_p09/v1.0",
    promptTemplateVersion: "p09-tracker-fallback/v1.0",
    recommendedAction: holdAction,
  };
}

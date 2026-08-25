export type A12QuestionIntent = "diagnosis" | "fleet_history" | "inspection" | "recovery" | "general";

export interface A12FallbackContext {
  ambientPeak: number;
  commandLatest: number;
  equipmentCode: string;
  evidenceCount: number;
  feedbackLatest: number;
  latestVariance: number;
  oemCitation: string;
  peakVariance: number;
  releaseCitation: string;
  siteCitation: string;
  varianceThreshold: number;
}

export interface A12IntentAwareFallback {
  answerText: string;
  generationModel: string;
  promptTemplateVersion: string;
  recommendedAction: string;
}

export function classifyA12Question(question: string): A12QuestionIntent {
  const normalized = question.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  if (
    /\b(?:fleet|other inverters?|across (?:the )?fleet|last \d+ days?|histor(?:y|ical)|previous events?|same model)\b/.test(
      normalized,
    )
  ) {
    return "fleet_history";
  }
  if (
    /\b(?:release|reset|restart|acknowledg|return to service|restore service|clear (?:the )?fault|recovery|safe to)\b/.test(
      normalized,
    )
  ) {
    return "recovery";
  }
  if (
    /\b(?:what else|other things?|other checks?|should i check|should we check|check on|inspect|inspection|look for|anything else|fan system)\b/.test(
      normalized,
    )
  ) {
    return "inspection";
  }
  if (
    /\b(?:why|cause|caused|what happened|what is a12|explain a12|fault a12|fan (?:speed )?variance|feedback variance|trigger(?:ed)?|fault mean)\b/.test(
      normalized,
    )
  ) {
    return "diagnosis";
  }
  return "general";
}

export function a12QuestionIntentLabel(intent: A12QuestionIntent): string {
  const labels: Record<A12QuestionIntent, string> = {
    diagnosis: "Fan-variance diagnosis",
    fleet_history: "Fleet history",
    general: "Evidence-scoped question",
    inspection: "Fan-system inspection",
    recovery: "Maintenance release",
  };
  return labels[intent];
}

export function a12EvidenceScopeStatement(evidenceCount: number): string {
  const sourceLabel = evidenceCount === 1
    ? "one authorized excerpt"
    : `${evidenceCount} authorized excerpts`;
  return `Evidence scope: I only have access to the ${sourceLabel} shown for this incident. They cover SD-8400 fault A12, the authorized Babcock Ranch exterior fan-system inspection, and the cooling-system return-to-service criteria. They do not identify an internal failed component or replace qualified maintenance inspection.`;
}

export function buildA12IntentAwareFallback(
  intent: A12QuestionIntent,
  context: A12FallbackContext,
): A12IntentAwareFallback {
  const exceedance = context.peakVariance - context.varianceThreshold;
  const signalDelta = Math.abs(context.commandLatest - context.feedbackLatest);
  const allCitations = `${context.oemCitation}${context.siteCitation}${context.releaseCitation}`;
  const scope = a12EvidenceScopeStatement(context.evidenceCount);
  const holdAction = `Keep ${context.equipmentCode} in Maintenance Hold. Complete the authorized exterior fan-system inspection and create a qualified-maintenance work order if feedback is missing, unstable, or remains divergent. Do not release the inverter until every checklist criterion is met. ${allCitations}`;

  if (intent === "inspection") {
    return {
      answerText: `Inspect the exterior intake screens, exhaust openings, fan guards, and visible cooling-air path for vegetation, dust, loose material, water, or damage. Review command and feedback over the same window and record whether feedback is present, stable, and responsive. Do not remove guards or open an energized enclosure under this procedure. ${context.siteCitation}\n\nThe current evidence does not prove a failed fan, wiring fault, or sensor fault. If the disagreement persists after the exterior path is clear, keep the inverter in Maintenance Hold and escalate to qualified maintenance. ${context.oemCitation}${context.siteCitation}\n\n${scope}`,
      generationModel: "fan_feedback_variance_a12/v1.0",
      promptTemplateVersion: "a12-fan-fallback/v1.0",
      recommendedAction: holdAction,
    };
  }

  if (intent === "recovery") {
    return {
      answerText: `${context.equipmentCode} is not ready for release based on the current event window. Latest command was ${context.commandLatest.toFixed(1)}% and latest feedback was ${context.feedbackLatest.toFixed(1)}%, a ${signalDelta.toFixed(1)}-percentage-point difference; latest recorded variance was ${context.latestVariance.toFixed(1)}%, still above the ${context.varianceThreshold.toFixed(1)}% A12 threshold. ${context.oemCitation}\n\nReturn to service requires documented disposition, a clear exterior cooling path, stable feedback, command at or above 80%, variance at or below 5 percentage points for ten continuous minutes, no new A12 event, and control-room authorization. ${context.releaseCitation}\n\n${scope}`,
      generationModel: "fan_feedback_variance_a12/v1.0",
      promptTemplateVersion: "a12-fan-fallback/v1.0",
      recommendedAction: holdAction,
    };
  }

  if (intent === "fleet_history") {
    return {
      answerText: `I cannot determine A12 recurrence across other inverters from this incident's authorized documents and single event window. The available evidence establishes only that ${context.equipmentCode} recorded fan variance above its configured threshold. ${context.oemCitation}\n\n${scope}`,
      generationModel: "fan_feedback_variance_a12/v1.0",
      promptTemplateVersion: "a12-fan-fallback/v1.0",
      recommendedAction: `Use this investigation for ${context.equipmentCode} only. A fleet comparison would require a separate authorized A12 event set that is not available in this workflow. ${context.oemCitation}`,
    };
  }

  if (intent === "general") {
    return {
      answerText: `I do not have enough approved evidence to answer that question. What I can establish is that ${context.equipmentCode} recorded a ${context.peakVariance.toFixed(1)}% peak fan variance, above the configured ${context.varianceThreshold.toFixed(1)}% threshold, and remains in Maintenance Hold. ${context.oemCitation}\n\nThe approved sources support exterior inspection and controlled return-to-service checks, but they do not establish an internal failed component. ${context.siteCitation}${context.releaseCitation}\n\n${scope}`,
      generationModel: "fan_feedback_variance_a12/v1.0",
      promptTemplateVersion: "a12-fan-fallback/v1.0",
      recommendedAction: holdAction,
    };
  }

  return {
    answerText: `${context.equipmentCode} entered Maintenance Hold after peak fan command/feedback variance reached ${context.peakVariance.toFixed(1)}%, exceeding the configured ${context.varianceThreshold.toFixed(1)}% A12 threshold by ${exceedance.toFixed(1)} percentage points. Latest command was ${context.commandLatest.toFixed(1)}% and feedback was ${context.feedbackLatest.toFixed(1)}%, corroborating a ${signalDelta.toFixed(1)}-point disagreement. ${context.oemCitation}\n\nAmbient temperature peaked at ${context.ambientPeak.toFixed(1)} °C and may have increased cooling demand, but it does not explain the variance or prove fan failure. ${context.oemCitation}\n\n${scope}`,
    generationModel: "fan_feedback_variance_a12/v1.0",
    promptTemplateVersion: "a12-fan-fallback/v1.0",
    recommendedAction: holdAction,
  };
}

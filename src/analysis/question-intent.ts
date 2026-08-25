export type B17QuestionIntent = "diagnosis" | "fleet_history" | "inspection" | "recovery" | "general";

export interface B17FallbackContext {
  ambientPeak: number;
  controllerPeak: number;
  controllerThreshold: number;
  equipmentCode: string;
  evidenceCount: number;
  latestOutput: number;
  oemCitation: string;
  siteCitation: string;
}

export interface IntentAwareFallback {
  answerText: string;
  generationModel: string;
  promptTemplateVersion: string;
  recommendedAction: string;
}

export function classifyB17Question(question: string): B17QuestionIntent {
  const normalized = question.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  if (
    /\b(?:fleet|other inverters?|across (?:the )?fleet|last \d+ days?|histor(?:y|ical)|previous events?|weather factor|same model)\b/.test(
      normalized,
    )
  ) {
    return "fleet_history";
  }
  if (
    /\b(?:reset|restart|acknowledg|return to service|return to full output|restore service|clear (?:the )?fault|recovery|safe to)\b/.test(
      normalized,
    )
  ) {
    return "recovery";
  }
  if (
    /\b(?:what else|other things?|other checks?|should i check|should we check|check on|inspect|inspection|look for|nothing else|anything else)\b/.test(
      normalized,
    )
  ) {
    return "inspection";
  }
  if (/\b(?:why|cause|caused|what happened|what is b17|explain b17|fault b17|derat(?:e|ed|ing)|trigger(?:ed)?|fault mean)\b/.test(normalized)) {
    return "diagnosis";
  }
  return "general";
}

export function b17QuestionIntentLabel(intent: B17QuestionIntent): string {
  const labels: Record<B17QuestionIntent, string> = {
    diagnosis: "Event diagnosis",
    fleet_history: "Fleet history",
    general: "Evidence-scoped question",
    inspection: "Inspection guidance",
    recovery: "Recovery and reset",
  };
  return labels[intent];
}

export function b17EvidenceScopeStatement(evidenceCount: number): string {
  const sourceLabel = evidenceCount === 1
    ? "one authorized excerpt"
    : evidenceCount === 2
      ? "two authorized excerpts"
      : `${evidenceCount} authorized excerpts`;
  return `Evidence scope: I only have access to the ${sourceLabel} shown for this incident. They cover B17 thermal behavior and the Manatee exterior cooling inspection, but they do not provide a complete inverter-health assessment or rule out unrelated conditions.`;
}

export function buildB17IntentAwareFallback(
  intent: B17QuestionIntent,
  context: B17FallbackContext,
): IntentAwareFallback {
  const exceedance = context.controllerPeak - context.controllerThreshold;
  const scope = b17EvidenceScopeStatement(context.evidenceCount);
  const citations = `${context.oemCitation}${context.siteCitation}`;
  const recoveryAction = `Keep ${context.equipmentCode} in its protective state until controller temperature is below 70 °C for at least five minutes. Complete the authorized exterior cooling-path and fan-feedback checks, then acknowledge B17 through the approved operator interface and monitor for ten minutes. Escalate if temperature rises, fan feedback is missing or unstable, or B17 repeats. ${citations}`;

  if (intent === "inspection") {
    return {
      answerText: `Based on the approved documents, check the external cooling-air intake screens and exhaust openings for visible obstruction, vegetation, dust loading, or water intrusion. Compare cooling-fan command with fan feedback, confirm the ambient-temperature input is plausible, and verify controller temperature is trending downward. ${citations}\n\nThe available evidence does not establish fan failure, contamination, controller failure, or another unrelated fault without those inspections. ${citations}\n\n${scope}`,
      generationModel: "thermal_derating_b17/v1.1",
      promptTemplateVersion: "deterministic-fallback/v1.1",
      recommendedAction: recoveryAction,
    };
  }

  if (intent === "recovery") {
    return {
      answerText: `Do not reset ${context.equipmentCode} solely because output is reduced. Confirm controller temperature is declining and remains below 70 °C for at least five minutes; inspect the external cooling path; verify stable fan feedback; and confirm the ambient-temperature input is plausible. ${citations}\n\nThe current evidence supports protective B17 derating, but it does not establish that every possible inverter condition has been checked. ${citations}\n\n${scope}`,
      generationModel: "thermal_derating_b17/v1.1",
      promptTemplateVersion: "deterministic-fallback/v1.1",
      recommendedAction: recoveryAction,
    };
  }

  if (intent === "fleet_history") {
    return {
      answerText: `I cannot determine fleet-wide recurrence, similar events on other inverters, or weather correlation from this incident's two authorized excerpts and event window. The available evidence only establishes that ${context.equipmentCode} entered protective B17 derating after controller temperature reached ${context.controllerPeak.toFixed(1)} °C, above the configured ${context.controllerThreshold.toFixed(1)} °C threshold. ${context.oemCitation}\n\n${scope}`,
      generationModel: "thermal_derating_b17/v1.1",
      promptTemplateVersion: "deterministic-fallback/v1.1",
      recommendedAction: `Use the current evidence for this incident only. A fleet-history and weather-correlation workflow would require additional authorized event and weather data that are not available in this investigation. ${context.oemCitation}`,
    };
  }

  if (intent === "general") {
    return {
      answerText: `I do not have enough approved evidence to answer that question confidently. What I can establish is that ${context.equipmentCode} entered protective B17 derating after controller temperature reached ${context.controllerPeak.toFixed(1)} °C, above the configured ${context.controllerThreshold.toFixed(1)} °C threshold; latest output was ${context.latestOutput.toFixed(0)}% rated. ${context.oemCitation}\n\nThe approved procedure supports exterior cooling-path, fan-feedback, temperature-trend, and ambient-input checks, but it does not establish unrelated component health. ${citations}\n\n${scope}`,
      generationModel: "thermal_derating_b17/v1.1",
      promptTemplateVersion: "deterministic-fallback/v1.1",
      recommendedAction: recoveryAction,
    };
  }

  return {
    answerText: `${context.equipmentCode} entered a protective derated state after controller temperature peaked at ${context.controllerPeak.toFixed(1)} °C, exceeding the configured ${context.controllerThreshold.toFixed(1)} °C threshold by ${exceedance.toFixed(1)} °C. Latest output was ${context.latestOutput.toFixed(0)}% rated, which is consistent with protective derating rather than a full inverter trip. ${context.oemCitation}\n\nAmbient temperature peaked at ${context.ambientPeak.toFixed(1)} °C and may have reduced thermal margin. The available measurements do not establish fan failure, contamination, or controller failure without an authorized inspection. ${context.oemCitation}\n\n${scope}`,
    generationModel: "thermal_derating_b17/v1.1",
    promptTemplateVersion: "deterministic-fallback/v1.1",
    recommendedAction: recoveryAction,
  };
}

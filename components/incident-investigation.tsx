"use client";

import Link from "next/link";
import { useState } from "react";

import type {
  EvidenceDocumentSource,
  IncidentAnalysis,
  IncidentDetail,
  IncidentMetric,
} from "../src/data/types";
import {
  b17QuestionIntentLabel,
  classifyB17Question,
} from "../src/analysis/question-intent";
import {
  a12QuestionIntentLabel,
  classifyA12Question,
} from "../src/analysis/a12-question-intent";
import {
  classifyP09Question,
  p09QuestionIntentLabel,
} from "../src/analysis/p09-question-intent";

interface IncidentInvestigationProperties {
  availableEvidence: EvidenceDocumentSource[];
  incident: IncidentDetail;
  initialAnalysis: IncidentAnalysis | null;
}

interface FactPresentation {
  alert?: boolean;
  label: string;
  note: string;
  value: string;
}

interface PlannedSource {
  detail: string;
  title: string;
}

interface ScenarioPresentation {
  evidence: PlannedSource[];
  facts: FactPresentation[];
  question: string;
}

function humanize(value: string | null): string {
  if (!value) {
    return "—";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function displayUnit(unit: string): string {
  const units: Record<string, string> = {
    degC: "°C",
    degrees: "°",
    amperes: "A",
    percent: "%",
    percent_rated: "% rated",
    seconds: "sec",
  };

  return units[unit] ?? unit;
}

function formatValue(value: number | null, unit: string): string {
  if (value === null) {
    return "—";
  }

  const precision = Number.isInteger(value) ? 0 : 1;
  return `${value.toFixed(precision)} ${displayUnit(unit)}`;
}

function formatTimestamp(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "long",
    timeZone,
    timeZoneName: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMetricWindow(incident: IncidentDetail): string {
  if (incident.metrics.length === 0) {
    return formatTimestamp(incident.eventTime, incident.timezoneName);
  }

  const start = incident.metrics.reduce(
    (earliest, metric) => metric.windowStart < earliest ? metric.windowStart : earliest,
    incident.metrics[0]?.windowStart ?? incident.eventTime,
  );
  const end = incident.metrics.reduce(
    (latest, metric) => metric.windowEnd > latest ? metric.windowEnd : latest,
    incident.metrics[0]?.windowEnd ?? incident.eventTime,
  );
  const date = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: incident.timezoneName,
  }).format(new Date(start));
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: incident.timezoneName,
  });
  const endFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: incident.timezoneName,
    timeZoneName: "short",
  });

  return `${date}, ${timeFormatter.format(new Date(start))}–${endFormatter.format(new Date(end))}`;
}

function eventDuration(incident: IncidentDetail): string {
  if (!incident.clearedTime) {
    return humanize(incident.eventStatus);
  }

  const minutes = Math.max(
    0,
    Math.round((new Date(incident.clearedTime).getTime() - new Date(incident.eventTime).getTime()) / 60_000),
  );
  return `${minutes} min`;
}

function metricLabel(metricName: string): string {
  const labels: Record<string, string> = {
    active_power_output: "AC output",
    ambient_air_temperature: "Ambient air",
    controller_temperature: "Controller",
    fan_command_percent: "Fan command",
    fan_feedback_percent: "Fan feedback",
    fan_speed_variance: "Fan variance",
    telemetry_gap_duration: "Telemetry gap",
    tracker_commanded_angle: "Commanded angle",
    tracker_drive_motor_current: "Drive current",
    tracker_measured_angle: "Measured angle",
    tracker_position_deviation: "Position deviation",
  };

  return labels[metricName] ?? humanize(metricName);
}

function metricByName(incident: IncidentDetail, name: string): IncidentMetric | undefined {
  return incident.metrics.find((metric) => metric.metricName === name);
}

function thresholdNote(metric: IncidentMetric | undefined, wording: string): string {
  if (!metric || metric.thresholdExceedance === null) {
    return "No threshold recorded";
  }

  return `${formatValue(metric.thresholdExceedance, metric.unit)} ${wording}`;
}

function buildScenario(incident: IncidentDetail): ScenarioPresentation {
  const ambient = metricByName(incident, "ambient_air_temperature");
  const output = metricByName(incident, "active_power_output");

  if (incident.faultCode === "B17") {
    const controller = metricByName(incident, "controller_temperature");
    return {
      evidence: [
        { title: "OEM thermal guide", detail: "Fault B17 and controller limits" },
        { title: "Site cooling procedure", detail: "Authorized inspection sequence" },
        { title: "Fleet thermal bulletin", detail: "Reliability persona only" },
      ],
      facts: [
        {
          alert: true,
          label: "Controller peak",
          note: thresholdNote(controller, "above threshold"),
          value: controller ? formatValue(controller.maximumValue, controller.unit) : "—",
        },
        {
          label: "Derating threshold",
          note: "Structured controller limit",
          value: controller ? formatValue(controller.thresholdValue, controller.unit) : "—",
        },
        {
          label: "Ambient peak",
          note: "Weather-derived summary",
          value: ambient ? formatValue(ambient.maximumValue, ambient.unit) : "—",
        },
        {
          label: "Latest AC output",
          note: "Historian-derived summary",
          value: output ? formatValue(output.latestValue, output.unit) : "—",
        },
      ],
      question: `Why did ${incident.equipmentCode} enter a derated state after fault ${incident.faultCode}, and what should I inspect before reset?`,
    };
  }

  if (incident.faultCode === "A12") {
    const fanVariance = metricByName(incident, "fan_speed_variance");
    const fanCommand = metricByName(incident, "fan_command_percent");
    const fanFeedback = metricByName(incident, "fan_feedback_percent");
    return {
      evidence: [
        { title: "OEM cooling-system guide", detail: "Fault A12 and fan-feedback limits" },
        { title: "Site fan inspection procedure", detail: "Authorized mechanical checks" },
        { title: "Return-to-service checklist", detail: "Maintenance release criteria" },
      ],
      facts: [
        {
          alert: true,
          label: "Fan variance peak",
          note: thresholdNote(fanVariance, "above threshold"),
          value: fanVariance ? formatValue(fanVariance.maximumValue, fanVariance.unit) : "—",
        },
        {
          label: "Variance threshold",
          note: "Structured feedback limit",
          value: fanVariance ? formatValue(fanVariance.thresholdValue, fanVariance.unit) : "—",
        },
        {
          label: "Latest fan command",
          note: "Controller-requested speed",
          value: fanCommand ? formatValue(fanCommand.latestValue, fanCommand.unit) : "—",
        },
        {
          label: "Latest fan feedback",
          note: "Reported fan speed",
          value: fanFeedback ? formatValue(fanFeedback.latestValue, fanFeedback.unit) : "—",
        },
      ],
      question: `What caused the fan-feedback variance on ${incident.equipmentCode} after fault ${incident.faultCode}, and what should I verify before returning it to service?`,
    };
  }

  if (incident.faultCode === "C04") {
    const telemetryGap = metricByName(incident, "telemetry_gap_duration");
    return {
      evidence: [
        { title: "Communications interface guide", detail: "Fault C04 timeout behavior" },
        { title: "Site network recovery runbook", detail: "Authorized connectivity checks" },
        { title: "Telemetry validation checklist", detail: "Closure and verification criteria" },
      ],
      facts: [
        {
          alert: true,
          label: "Telemetry gap",
          note: thresholdNote(telemetryGap, "above timeout threshold"),
          value: telemetryGap ? formatValue(telemetryGap.maximumValue, telemetryGap.unit) : "—",
        },
        {
          label: "Timeout threshold",
          note: "Structured communications limit",
          value: telemetryGap ? formatValue(telemetryGap.thresholdValue, telemetryGap.unit) : "—",
        },
        {
          label: "Latest AC output",
          note: "Generation remained available",
          value: output ? formatValue(output.latestValue, output.unit) : "—",
        },
        {
          label: "Event duration",
          note: incident.clearedTime ? "Cleared event record" : "Event remains open",
          value: eventDuration(incident),
        },
      ],
      question: `What interrupted telemetry for ${incident.equipmentCode} during fault ${incident.faultCode}, and what should I verify before closing the communications incident?`,
    };
  }

  if (incident.faultCode === "P09") {
    const deviation = metricByName(incident, "tracker_position_deviation");
    const commanded = metricByName(incident, "tracker_commanded_angle");
    const measured = metricByName(incident, "tracker_measured_angle");
    const current = metricByName(incident, "tracker_drive_motor_current");
    return {
      evidence: [
        { title: "OEM position-feedback guide", detail: "Fault P09 and position-deviation limits" },
        { title: "Citrus tracker-row procedure", detail: "Authorized observation and escalation" },
        { title: "Return-to-automatic checklist", detail: "Controlled-motion release criteria" },
      ],
      facts: [
        {
          alert: true,
          label: "Position deviation peak",
          note: thresholdNote(deviation, "above threshold"),
          value: deviation ? formatValue(deviation.maximumValue, deviation.unit) : "—",
        },
        {
          label: "Latest commanded angle",
          note: "Controller-requested position",
          value: commanded ? formatValue(commanded.latestValue, commanded.unit) : "—",
        },
        {
          label: "Latest measured angle",
          note: "Reported tracker position",
          value: measured ? formatValue(measured.latestValue, measured.unit) : "—",
        },
        {
          alert: current?.thresholdExceedance !== null && (current?.thresholdExceedance ?? 0) > 0,
          label: "Drive-current peak",
          note: thresholdNote(current, "above context threshold"),
          value: current ? formatValue(current.maximumValue, current.unit) : "—",
        },
      ],
      question: `Why did ${incident.equipmentCode} enter Safe Stow Hold after fault ${incident.faultCode}, and what should I inspect before returning it to automatic tracking?`,
    };
  }

  const metricFacts = incident.metrics.slice(0, 3).map<FactPresentation>((metric, index) => ({
    alert: index === 0 && metric.thresholdExceedance !== null && metric.thresholdExceedance > 0,
    label: metricLabel(metric.metricName),
    note: metric.thresholdValue === null ? "Structured metric summary" : thresholdNote(metric, "past threshold"),
    value: formatValue(metric.maximumValue, metric.unit),
  }));

  return {
    evidence: [
      { title: "OEM equipment guide", detail: `Fault ${incident.faultCode} exact match` },
      { title: "Site operating procedure", detail: "Authorized response sequence" },
      { title: "Fleet engineering note", detail: "Reliability persona only" },
    ],
    facts: [
      ...metricFacts,
      {
        label: "Event state",
        note: "Structured fault record",
        value: humanize(incident.eventStatus),
      },
    ].slice(0, 4),
    question: `What happened to ${incident.equipmentCode} during fault ${incident.faultCode}, and what should I verify next?`,
  };
}

function investigationLabel(eventStatus: string): string {
  if (eventStatus === "cleared") {
    return "Resolved incident review";
  }
  if (eventStatus === "acknowledged") {
    return "Acknowledged investigation";
  }
  return "Active investigation";
}

function MetricProfile({ metric }: { metric: IncidentMetric }) {
  const values = [metric.minimumValue, metric.averageValue, metric.latestValue, metric.maximumValue].map(
    (value) => value ?? 0,
  );
  const low = Math.min(...values);
  const high = Math.max(...values);
  const range = high - low || 1;
  const points = values
    .map((value, index) => {
      const x = 8 + index * 28;
      const y = 37 - ((value - low) / range) * 25;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <article className="metric-panel">
      <div className="metric-panel-heading">
        <span>{metricLabel(metric.metricName)}</span>
        <strong>{formatValue(metric.maximumValue, metric.unit)}</strong>
      </div>
      <svg className="metric-profile" aria-label={`${metricLabel(metric.metricName)} summary profile`} viewBox="0 0 100 48">
        <path d="M7 40h87" />
        <polyline points={points} />
        {points.split(" ").map((point) => {
          const [cx, cy] = point.split(",");
          return <circle cx={cx} cy={cy} key={point} r="2.5" />;
        })}
      </svg>
      <div className="metric-profile-labels">
        <span>Min</span>
        <span>Avg</span>
        <span>Latest</span>
        <span>Max</span>
      </div>
      <div className="metric-panel-footer">
        <span>{metric.aggregationMethod.replaceAll("_", " ")}</span>
        {metric.thresholdValue !== null ? (
          <span className="threshold-note">
            Threshold {metric.thresholdOperator} {formatValue(metric.thresholdValue, metric.unit)}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M4 10h11M11 6l4 4-4 4" />
    </svg>
  );
}

function sourceHref(source: EvidenceDocumentSource): string | null {
  if (source.sourceUri) {
    return source.sourceUri;
  }
  if (source.snapshotUri) {
    return `${source.snapshotUri}#page=${source.pageStart}`;
  }
  return null;
}

function evidenceTypeLabel(source: EvidenceDocumentSource): string {
  const labels: Record<string, string> = {
    fleet_bulletin: "Fleet bulletin",
    oem_manual: "OEM manual",
    site_procedure: "Site procedure",
    work_order: "Release checklist",
  };
  return labels[source.documentType] ?? humanize(source.documentType);
}

export function IncidentInvestigation({
  availableEvidence,
  incident,
  initialAnalysis,
}: IncidentInvestigationProperties) {
  const scenario = buildScenario(incident);
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [question, setQuestion] = useState(initialAnalysis?.questionText ?? scenario.question);
  const hasRequiredEvidence =
    availableEvidence.some((source) => source.documentType === "oem_manual") &&
    availableEvidence.some((source) => source.documentType === "site_procedure") &&
    (
      incident.faultCode === "B17" ||
      ((incident.faultCode === "A12" || incident.faultCode === "P09") && availableEvidence.some((source) => source.documentType === "work_order"))
    );
  const displayedEvidence = analysis?.sources.length ? analysis.sources : availableEvidence;
  const vectorEvidenceActive = displayedEvidence.some((source) => source.retrievalMethod === "vector");
  const liveGenerationActive = analysis?.generationProvider === "openai" && !analysis.isFallback;
  const analysisQuestionFocus = analysis
    ? incident.faultCode === "A12"
      ? a12QuestionIntentLabel(classifyA12Question(analysis.questionText))
      : incident.faultCode === "P09"
        ? p09QuestionIntentLabel(classifyP09Question(analysis.questionText))
      : b17QuestionIntentLabel(classifyB17Question(analysis.questionText))
    : null;

  async function analyzeIncident() {
    setAnalysisError(null);
    setIsAnalyzing(true);

    if (incident.faultCode === "B17" && classifyB17Question(question) === "fleet_history") {
      const parameters = new URLSearchParams({
        question: question.trim(),
        run: "1",
      });
      window.location.assign(`/fleet/correlation?${parameters.toString()}`);
      return;
    }

    try {
      const response = await fetch(`/api/incidents/${incident.faultEventId}/analysis`, {
        body: JSON.stringify({ question }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const body = (await response.json()) as IncidentAnalysis | { error?: string };
      if (!response.ok) {
        throw new Error("error" in body && body.error ? body.error : "Analysis could not be completed.");
      }
      setAnalysis(body as IncidentAnalysis);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Analysis could not be completed.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="page-stack incident-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/fleet">Fleet</Link>
        <span>/</span>
        <span>{incident.plantName.replace("FPL ", "")}</span>
        <span>/</span>
        <strong>{incident.equipmentCode}</strong>
      </nav>

      <section className="incident-heading">
        <div className="incident-title-block">
          <div className="incident-badge">{incident.faultCode}</div>
          <div>
            <span className="eyebrow">{investigationLabel(incident.eventStatus)}</span>
            <h1>{incident.equipmentCode} · {incident.faultName}</h1>
            <p>{incident.plantName.replace("FPL ", "")} · {formatTimestamp(incident.eventTime, incident.timezoneName)}</p>
          </div>
        </div>
        <div className="incident-heading-status">
          <span className={`status-pill status-${incident.eventStatus}`}>{humanize(incident.eventStatus)}</span>
          <span className={`equipment-state state-${incident.operatingStatus}`}>
            <span /> {humanize(incident.operatingStatus)}
          </span>
        </div>
      </section>

      <section className="asset-strip">
        <div>
          <small>Equipment</small>
          <strong>{incident.equipmentName}</strong>
        </div>
        <div>
          <small>Model</small>
          <strong>{incident.model}</strong>
        </div>
        <div>
          <small>Firmware</small>
          <strong>{incident.firmwareVersion ?? "—"}</strong>
        </div>
        <div>
          <small>State change</small>
          <strong>{humanize(incident.operatingStateBefore)} → {humanize(incident.operatingStateAfter)}</strong>
        </div>
        <div>
          <small>Measurement window</small>
          <strong>{formatMetricWindow(incident)}</strong>
        </div>
      </section>

      <section className="incident-facts-grid" aria-label="Incident facts">
        {scenario.facts.map((fact) => (
          <article className={fact.alert ? "fact-card fact-alert" : "fact-card"} key={fact.label}>
            <span>{fact.label}</span>
            <strong>{fact.value}</strong>
            <small>{fact.note}</small>
          </article>
        ))}
      </section>

      <div className="incident-workspace-grid">
        <div className="incident-main-column">
          <section className="investigation-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Ask Equipment Intelligence</span>
                <h2>Investigate this event</h2>
              </div>
              <span className="checkpoint-badge">{analysis ? "Analysis complete" : hasRequiredEvidence ? "Evidence ready" : "Data connected"}</span>
            </div>
            <label className="question-box">
              <span>Technician question</span>
              <textarea
                maxLength={1000}
                onChange={(event) => setQuestion(event.target.value)}
                readOnly={!hasRequiredEvidence}
                rows={2}
                value={question}
              />
            </label>
            <div className="question-actions">
              <span>
                {hasRequiredEvidence
                  ? `${availableEvidence.length} approved sources authorized for the Field Technician persona.`
                  : "Deterministic analysis is not yet configured for this fault."}
              </span>
              <button
                className={hasRequiredEvidence && question.trim() ? "primary-button" : "primary-button disabled-button"}
                disabled={!hasRequiredEvidence || !question.trim() || isAnalyzing}
                onClick={analyzeIncident}
                type="button"
              >
                {isAnalyzing ? "Analyzing…" : analysis ? "Run again" : "Analyze incident"}
                <ArrowIcon />
              </button>
            </div>
            {analysisError ? <p className="analysis-error" role="alert">{analysisError}</p> : null}
          </section>

          {analysis ? (
            <section className="analysis-preview live-analysis-result">
              <div className="preview-banner live-analysis-banner">
                <span className="preview-icon">✓</span>
                <div>
                  <strong>
                    {liveGenerationActive
                      ? "Grounded OpenAI answer complete"
                      : analysis.isFallback
                        ? "Deterministic fallback complete"
                        : "Deterministic analysis complete"} · {analysis.responseDurationMs} ms
                  </strong>
                  <span>
                    {liveGenerationActive
                      ? `Only authorized facts and evidence were sent to ${analysis.generationModel}; every returned citation passed application validation.`
                      : analysis.isFallback
                        ? "Live wording did not pass the safeguards, so a question-focused, evidence-scoped fallback was used and recorded."
                        : vectorEvidenceActive
                          ? "Authorized semantic retrieval and the versioned rule were persisted in CockroachDB. No LLM generated this earlier answer."
                          : "Versioned rule and authorized exact-match evidence persisted in CockroachDB. No LLM generated this earlier answer."}
                  </span>
                </div>
                <span className="confidence-pill">{humanize(analysis.confidenceLabel)} evidence</span>
              </div>
              <div className="analysis-preview-body">
                <span className="eyebrow">Grounded incident analysis</span>
                <h2>{analysisQuestionFocus ? `${analysisQuestionFocus} response` : "Evidence-grounded response"}</h2>
                <div className="analysis-answer-copy">
                  {analysis.answerText.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>

                <div className="finding-grid">
                  {analysis.findings.map((finding) => (
                    <article className={`finding-card finding-${finding.severity}`} key={finding.diagnosticFindingId}>
                      <span>{humanize(finding.severity)}</span>
                      <strong>{finding.title}</strong>
                      <p>{finding.explanation}</p>
                    </article>
                  ))}
                </div>

                {analysis.recommendedAction ? (
                  <div className="recommended-action">
                    <span>Recommended field response</span>
                    <p>{analysis.recommendedAction}</p>
                  </div>
                ) : null}

                <div className="confidence-basis">
                  <strong>Why the evidence state is {analysis.confidenceLabel}</strong>
                  <p>{analysis.confidenceBasis}</p>
                </div>
              </div>
            </section>
          ) : (
            <section className="analysis-preview">
              <div className={hasRequiredEvidence ? "preview-banner evidence-ready-banner" : "preview-banner"}>
                <span className="preview-icon">◇</span>
                <div>
                  <strong>{hasRequiredEvidence ? "Approved evidence ready" : "Analysis not configured for this fault"}</strong>
                  <span>
                    {hasRequiredEvidence
                      ? "Run permission-first retrieval and create a persisted, evidence-constrained answer."
                      : "The product continues to show only resolved relational facts and metrics."}
                  </span>
                </div>
              </div>
              <div className="analysis-preview-body">
                <span className="eyebrow">Relational resolution complete</span>
                <h2>The product has the right asset, event, and measurement window.</h2>
                <p>
                  CockroachDB resolved {incident.equipmentCode}, fault {incident.faultCode}, and {incident.metrics.length} typed
                  metric summaries. {hasRequiredEvidence ? "Approved exact-match evidence is authorized and ready." : "No cause or recommendation is being generated for this scenario."}
                </p>
                <div className="resolution-grid">
                  <span><i className="complete-check">✓</i><strong>Equipment resolved</strong><small>{incident.equipmentCode} / {incident.model}</small></span>
                  <span><i className="complete-check">✓</i><strong>Fault record found</strong><small>{incident.faultCode} / {humanize(incident.eventStatus)}</small></span>
                  <span><i className="complete-check">✓</i><strong>Metric window found</strong><small>{incident.metrics.length} typed summaries</small></span>
                  <span><i className={availableEvidence.length > 0 ? "complete-check" : undefined}>{availableEvidence.length > 0 ? "✓" : "4"}</i><strong>Approved evidence</strong><small>{availableEvidence.length > 0 ? `${availableEvidence.length} authorized sources` : "Not yet ingested"}</small></span>
                </div>
              </div>
            </section>
          )}

          <section className="section-block metric-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Historian boundary</span>
                <h2>Event-window summaries</h2>
              </div>
              <span className="section-note">Structured in CockroachDB</span>
            </div>
            <div className="metric-grid">
              {incident.metrics.map((metric) => (
                <MetricProfile key={metric.metricSummaryId} metric={metric} />
              ))}
            </div>
          </section>
        </div>

        <aside className="incident-side-column">
          <section className="side-card evidence-card">
            <div className="side-card-heading">
              <span className="eyebrow">Evidence</span>
              <span className={displayedEvidence.length > 0 ? "live-mini" : "not-live-dot"}>
                {displayedEvidence.length > 0 ? <><span /> {displayedEvidence.length} approved</> : "Not ingested"}
              </span>
            </div>
            <h3>{displayedEvidence.length > 0 ? "Authorized sources ground the response." : "Approved sources will ground the response."}</h3>
            <p>
              {displayedEvidence.length > 0
                ? vectorEvidenceActive
                  ? "The question was embedded and ranked only within scopes authorized for the Field Technician."
                  : "Exact fault/model matches retrieved through the Field Technician scope."
                : "No approved source documents are available for this fault yet."}
            </p>
            <div className="planned-source-list">
              {displayedEvidence.length > 0
                ? displayedEvidence.map((source, index) => {
                    const href = sourceHref(source);
                    const similarity = source.cosineDistance === undefined
                      ? null
                      : Math.max(0, Math.min(100, (1 - source.cosineDistance) * 100));
                    const content = (
                      <>
                        <i>{String(source.retrievalRank ?? index + 1).padStart(2, "0")}</i>
                        <strong>{source.title}</strong>
                        <small>
                          {evidenceTypeLabel(source)} · v{source.versionLabel} · p. {source.pageStart}
                          {similarity === null ? "" : ` · ${similarity.toFixed(1)}% semantic match`}
                          {source.includedInGeneration ? " · used in generation" : ""}
                        </small>
                      </>
                    );
                    return href ? (
                      <a href={href} key={source.documentVersionId} rel="noreferrer" target="_blank">{content}</a>
                    ) : (
                      <span key={source.documentVersionId}>{content}</span>
                    );
                  })
                : scenario.evidence.map((source, index) => (
                    <span key={source.title}>
                      <i>{String(index + 1).padStart(2, "0")}</i>
                      <strong>{source.title}</strong>
                      <small>{source.detail}</small>
                    </span>
                  ))}
            </div>
            {incident.faultCode === "B17" && displayedEvidence.length > 0 ? (
              <div className="restricted-evidence-note">
                <span>Restricted</span>
                Engineering-only fleet evidence is excluded for this persona.
              </div>
            ) : null}
          </section>

          <section className="side-card provenance-card">
            <div className="side-card-heading">
              <span className="eyebrow">Under the hood</span>
              <span className="live-mini"><span /> Live</span>
            </div>
            <h3>Structured resolution</h3>
            <dl className="technical-list">
              <div><dt>Plant</dt><dd>{incident.plantCode}</dd></div>
              <div><dt>Equipment</dt><dd>{incident.equipmentCode}</dd></div>
              <div><dt>Event record</dt><dd>{incident.faultEventId.slice(0, 8)}…{incident.faultEventId.slice(-4)}</dd></div>
              <div><dt>Source event</dt><dd title={incident.sourceEventId}>{incident.sourceEventId}</dd></div>
              <div><dt>Source</dt><dd>{humanize(incident.sourceSystem)}</dd></div>
              <div><dt>Metric rule</dt><dd>{analysis ? `${analysis.diagnosticRuleCode}/v${analysis.diagnosticRuleVersion}` : incident.metrics[0]?.diagnosticVersion ?? "—"}</dd></div>
              {analysis ? <div><dt>Run</dt><dd>{analysis.diagnosticRunId.slice(0, 8)}…{analysis.diagnosticRunId.slice(-4)}</dd></div> : null}
              {analysis ? <div><dt>Evidence</dt><dd>{humanize(analysis.evidenceState)}</dd></div> : null}
              {analysisQuestionFocus ? <div><dt>Question focus</dt><dd>{analysisQuestionFocus}</dd></div> : null}
              {analysis ? <div><dt>Retrieval</dt><dd>{vectorEvidenceActive ? "Scoped cosine search" : "Exact-match fallback"}</dd></div> : null}
              {analysis?.embeddingModel ? <div><dt>Embedding</dt><dd>{analysis.embeddingModel}</dd></div> : null}
              {analysis ? <div><dt>Provider</dt><dd>{analysis.generationProvider === "openai" ? "OpenAI" : humanize(analysis.generationProvider)}</dd></div> : null}
              {analysis?.generationModel ? <div><dt>Answer model</dt><dd>{analysis.generationModel}</dd></div> : null}
              {analysis ? <div><dt>Prompt</dt><dd>{analysis.promptTemplateVersion}</dd></div> : null}
              {analysis?.isFallback ? <div><dt>Fallback</dt><dd>Versioned rule</dd></div> : null}
            </dl>
            <div className="architecture-line">
              <span>Equipment</span><i>→</i><span>Fault</span><i>→</i><span>Metrics</span>{analysis ? <><i>→</i><span>Evidence</span><i>→</i><span>Answer</span></> : null}
            </div>
          </section>

          <Link className="back-link" href="/fleet">
            <span>←</span> Return to fleet overview
          </Link>
        </aside>
      </div>
    </div>
  );
}

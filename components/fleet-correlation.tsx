"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type {
  FleetCorrelationAnalysis,
  FleetCorrelationData,
} from "../src/data/types";

interface FleetCorrelationProperties {
  autoRun?: boolean;
  data: FleetCorrelationData;
  initialAnalysis: FleetCorrelationAnalysis | null;
  initialQuestion?: string | undefined;
  role: "field-tech" | "fleet-engineer";
}

const DEFAULT_QUESTION = "Which other inverters of this type recorded B17 in the prior 30 days, and was high ambient temperature associated?";

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(new Date(value));
}

function cleanModel(value: string): string {
  return value.replace(" (Synthetic)", "");
}

function AnswerText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </>
  );
}

export function FleetCorrelation({
  autoRun = false,
  data,
  initialAnalysis,
  initialQuestion = DEFAULT_QUESTION,
  role,
}: FleetCorrelationProperties) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState(initialQuestion);
  const autoRunStarted = useRef(false);
  const isEngineer = role === "fleet-engineer";

  async function runAnalysis(questionToAnalyze = question) {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/fleet/correlation", {
        body: JSON.stringify({
          anchorFaultEventId: data.anchorFaultEventId,
          principalCode: isEngineer ? "fleet-engineer-demo" : "field-tech-demo",
          question: questionToAnalyze,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as FleetCorrelationAnalysis | { error?: string };
      if (!response.ok || !("answerId" in payload)) {
        throw new Error("error" in payload && payload.error ? payload.error : "Analysis could not be completed.");
      }
      setAnalysis(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analysis could not be completed.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!autoRun || !isEngineer || autoRunStarted.current) {
      return;
    }

    autoRunStarted.current = true;
    void runAnalysis(initialQuestion);
  }, [autoRun, initialQuestion, isEngineer]);

  return (
    <div className="page-stack correlation-page">
      <section className="page-heading-row correlation-heading">
        <div>
          <Link className="back-link" href="/fleet">← Fleet overview</Link>
          <span className="eyebrow">Fleet intelligence / B17</span>
          <h1>High-ambient pattern analysis</h1>
          <p>Compare same-model B17 events before assigning root cause.</p>
        </div>
        <div className="correlation-anchor">
          <small>Anchor event</small>
          <strong>INV-042 · B17</strong>
          <span>Prior {data.lookbackDays} days</span>
        </div>
      </section>

      <section className="role-workspace" aria-label="Demo role">
        <div>
          <span className="eyebrow">Permission view</span>
          <h2>Current access</h2>
        </div>
        <div className="current-role-card">
          <span>{isEngineer ? "FE" : "FT"}</span>
          <span>
            <strong>{isEngineer ? "Fleet engineer" : "Field technician"}</strong>
            <small>Use the persona menu in the upper-right corner to switch.</small>
          </span>
        </div>
        <div className={isEngineer ? "access-decision allowed" : "access-decision denied"}>
          <strong>{isEngineer ? "Engineering scope authorized" : "Engineering scope restricted"}</strong>
          <small>{isEngineer ? "Fleet bulletin available for grounded interpretation" : "Event facts remain visible; restricted guidance is withheld"}</small>
        </div>
      </section>

      <section className="correlation-kpis" aria-label="30-day comparison summary">
        <article>
          <small>Same-model events</small>
          <strong>{data.summary.eventCount}</strong>
          <span>{data.summary.equipmentCount} other inverters</span>
        </article>
        <article>
          <small>Facilities represented</small>
          <strong>{data.summary.facilityCount}</strong>
          <span>Single fleet view</span>
        </article>
        <article className="weather-context-kpi">
          <small>At or above {data.contextThresholdCelsius} °C</small>
          <strong>{data.summary.highAmbientEventCount} / {data.summary.eventCount}</strong>
          <span>{data.summary.highAmbientSharePercent.toFixed(0)}% of comparison events</span>
        </article>
        <article>
          <small>Below {data.contextThresholdCelsius} °C</small>
          <strong>{data.summary.belowContextEventCount}</strong>
          <span>Important counterexamples</span>
        </article>
      </section>

      <section className="correlation-workbench">
        <div className="correlation-question-panel">
          <span className="eyebrow">Ask the fleet</span>
          <h2>Investigate the pattern</h2>
          <label htmlFor="fleet-question">Question</label>
          <textarea
            id="fleet-question"
            maxLength={1000}
            onChange={(event) => setQuestion(event.target.value)}
            rows={4}
            value={question}
          />
          <button className="primary-button" disabled={isLoading || !question.trim()} onClick={() => void runAnalysis()} type="button">
            {isLoading ? "Analyzing 30-day history…" : isEngineer ? "Run grounded analysis" : "Verify access boundary"}
          </button>
          <p className="workbench-note">
            {isEngineer
              ? "Uses typed event and metric records plus the authorized engineering bulletin."
              : "The API will enforce the same restriction shown in this role view."}
          </p>
          {error ? <div className="analysis-error" role="alert">{error}</div> : null}
        </div>

        <div className={analysis ? "correlation-answer-panel has-answer" : "correlation-answer-panel"}>
          {analysis ? (
            <>
              <div className="answer-status-row">
                <span className="grounded-status"><span /> Grounded response</span>
                <span>{analysis.isFallback ? "Deterministic fallback" : analysis.generationModel} · {analysis.responseDurationMs} ms</span>
              </div>
              <h2>What the evidence supports</h2>
              <div className="correlation-answer-copy"><AnswerText text={analysis.answerText} /></div>
              {analysis.recommendedAction ? (
                <div className="recommended-action">
                  <small>Recommended next step</small>
                  <p>{analysis.recommendedAction}</p>
                </div>
              ) : null}
              <div className="causality-boundary">
                <strong>Association ≠ causation</strong>
                <span>Weather context narrows investigation; it does not diagnose a failed component.</span>
              </div>
            </>
          ) : (
            <div className="answer-empty-state">
              <span className="analysis-orbit" aria-hidden="true"><span /></span>
              <h2>Ready to compare the fleet</h2>
              <p>{isEngineer ? "Run the question to create a cited, persisted fleet analysis." : "Switch to Fleet Engineer to use the restricted bulletin, or verify that this role is denied."}</p>
            </div>
          )}
        </div>
      </section>

      <section className="section-block correlation-events-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Fleet event set</span>
            <h2>Same-model B17 comparison</h2>
          </div>
          <span className="section-note">{cleanModel(data.model)} · 30-day window</span>
        </div>
        <div className="correlation-table-wrap">
          <table className="correlation-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Facility</th>
                <th>Controller peak</th>
                <th>Ambient peak</th>
                <th>Weather context</th>
              </tr>
            </thead>
            <tbody>
              {data.events.map((event) => (
                <tr key={event.faultEventId}>
                  <td><strong>{event.equipmentCode}</strong><small>{formatTimestamp(event.eventTime)}</small></td>
                  <td>{event.plantName.replace("FPL ", "").replace(" Solar Energy Center", "")}</td>
                  <td>{event.controllerPeak.toFixed(1)} °C<small>Threshold {event.controllerThreshold.toFixed(1)} °C</small></td>
                  <td>{event.ambientPeak.toFixed(1)} °C</td>
                  <td><span className={event.highAmbientContext ? "context-pill high" : "context-pill below"}>{event.highAmbientContext ? `≥ ${data.contextThresholdCelsius} °C` : `< ${data.contextThresholdCelsius} °C`}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {analysis && isEngineer ? (
        <section className="correlation-proof-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Under the hood</span>
              <h2>Recorded evidence trail</h2>
            </div>
            <span className="section-note">CockroachDB provenance</span>
          </div>
          <div className="proof-grid">
            <article>
              <small>Event sources</small>
              <strong>{analysis.eventSources.length}</strong>
              <span>Exact comparator fault records persisted</span>
            </article>
            <article>
              <small>Metric sources</small>
              <strong>{analysis.eventSources.length * 2}</strong>
              <span>Controller + ambient windows</span>
            </article>
            <article>
              <small>Evidence sufficiency</small>
              <strong>{analysis.confidenceLabel}</strong>
              <span>Association supported; causation limited</span>
            </article>
          </div>
          {analysis.sources.map((source, index) => (
            <a className="correlation-source-card" href={source.sourceUri ?? "#"} key={source.documentChunkId} rel="noreferrer" target="_blank">
              <span className="source-index">{index + 1}</span>
              <span>
                <strong>{source.title}</strong>
                <small>{source.sectionHeading} · v{source.versionLabel} · page {source.pageStart}</small>
              </span>
              <span className="scope-badge">Engineering restricted</span>
              <span aria-hidden="true">↗</span>
            </a>
          ))}
          <details className="confidence-details">
            <summary>Why confidence is moderate</summary>
            <p>{analysis.confidenceBasis}</p>
            <code>{analysis.diagnosticRuleCode}/{analysis.diagnosticRuleVersion}</code>
          </details>
        </section>
      ) : null}
    </div>
  );
}

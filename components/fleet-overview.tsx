import Link from "next/link";

import type { FleetOverview as FleetOverviewData, IncidentSummary } from "../src/data/types";

interface FleetOverviewProperties {
  data: FleetOverviewData;
}

function formatTimestamp(value: string, timeZone = "America/New_York"): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone,
    timeZoneName: "short",
  }).format(new Date(value));
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ");
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M4 10h11M11 6l4 4-4 4" />
    </svg>
  );
}

function IncidentRow({ incident }: { incident: IncidentSummary }) {
  const eventIsOpen = incident.eventStatus !== "cleared";

  return (
    <Link className="event-row" href={`/incidents/${incident.faultEventId}`}>
      <span className={`event-icon ${eventIsOpen ? "attention" : "resolved"}`}>
        {eventIsOpen ? "!" : "✓"}
      </span>
      <span className="event-primary">
        <span>
          <strong>{incident.equipmentCode}</strong>
          <span className="event-code">{incident.faultCode}</span>
        </span>
        <small>{incident.faultName}</small>
      </span>
      <span className="event-site">
        <strong>{incident.plantName.replace("FPL ", "")}</strong>
        <small>{formatTimestamp(incident.eventTime)}</small>
      </span>
      <span className={`status-pill status-${incident.eventStatus}`}>{statusLabel(incident.eventStatus)}</span>
      <ArrowIcon />
    </Link>
  );
}

function AttentionCard({ incident }: { incident: IncidentSummary }) {
  const state = incident.operatingStateAfter ?? incident.operatingStatus;

  return (
    <article className="attention-card" data-fault-event-id={incident.faultEventId}>
      <div className="attention-visual" aria-hidden="true">
        <span className="orbit orbit-one" />
        <span className="orbit orbit-two" />
        <span className="attention-core">!</span>
      </div>
      <div className="attention-copy">
        <span className="eyebrow eyebrow-alert">Attention required</span>
        <h3>{incident.equipmentCode} entered {statusLabel(state)}</h3>
        <p>{incident.summary}</p>
        <div className="attention-meta">
          <span>{incident.plantName.replace("FPL ", "")}</span>
          <span>Fault {incident.faultCode}</span>
          <span>{formatTimestamp(incident.eventTime)}</span>
        </div>
      </div>
      <Link className="primary-button light-button" href={`/incidents/${incident.faultEventId}`}>
        Investigate incident
        <ArrowIcon />
      </Link>
    </article>
  );
}

export function FleetOverview({ data }: FleetOverviewProperties) {
  const activeIncidents = data.incidents.filter((incident) => incident.eventStatus === "active");
  const acknowledgedIncidents = data.incidents.filter((incident) => incident.eventStatus === "acknowledged");
  const activeIncidentLabel = `${activeIncidents.length} active ${activeIncidents.length === 1 ? "incident requires" : "incidents require"} attention`;

  return (
    <div className="page-stack fleet-page">
      <section className="page-heading-row">
        <div>
          <span className="eyebrow">Operations / Fleet</span>
          <h1>Fleet overview</h1>
          <p>Operational attention across a representative connected solar fleet.</p>
        </div>
        <div className="fleet-heading-actions">
          <Link className="primary-button fleet-intelligence-header-button" href="/fleet/correlation">
            <span className="button-spark" aria-hidden="true">✦</span>
            Fleet Intelligence
            <ArrowIcon />
          </Link>
          <div className="refresh-state">
            <span className="live-indicator"><span /> Live</span>
            <span>
              <small>Last refreshed</small>
              <strong>{formatTimestamp(data.refreshedAt)}</strong>
            </span>
          </div>
        </div>
      </section>

      <section className="kpi-grid" aria-label="Fleet summary">
        <article className="kpi-card">
          <span className="kpi-label">Facilities</span>
          <strong>{data.summary.facilityCount}</strong>
          <small>Connected sites</small>
          <span className="kpi-accent calm" />
        </article>
        <Link className="kpi-card kpi-link-card" href="/assets" aria-label="Open monitored asset inventory">
          <span className="kpi-label">Monitored assets</span>
          <strong>{data.summary.monitoredAssetCount}</strong>
          <small>Open sortable inventory <span aria-hidden="true">→</span></small>
          <span className="kpi-accent calm" />
        </Link>
        <article className="kpi-card kpi-watch">
          <span className="kpi-label">Assets on watch</span>
          <strong>{data.summary.assetsOnWatchCount}</strong>
          <small>Derated or in maintenance</small>
          <span className="kpi-accent watch" />
        </article>
        <article className="kpi-card kpi-alert">
          <span className="kpi-label">Open incidents</span>
          <strong>{data.summary.openIncidentCount}</strong>
          <small>Active or acknowledged</small>
          <span className="kpi-accent alert" />
        </article>
      </section>

      {activeIncidents.length > 0 || acknowledgedIncidents.length > 0 ? (
        <section className="attention-queue" aria-labelledby="attention-queue-title" data-active-count={activeIncidents.length}>
          <div className="section-heading attention-queue-heading">
            <div>
              <span className="eyebrow">Operational attention</span>
              <h2 id="attention-queue-title">{activeIncidentLabel}</h2>
            </div>
            <span className="section-note">
              {activeIncidents.length} active · {acknowledgedIncidents.length} acknowledged
            </span>
          </div>

          {activeIncidents.length > 0 ? (
            <div className="attention-card-list">
              {activeIncidents.map((incident) => (
                <AttentionCard incident={incident} key={incident.faultEventId} />
              ))}
            </div>
          ) : (
            <div className="attention-clear-state">
              <span aria-hidden="true">✓</span>
              <strong>No active incidents require immediate attention.</strong>
            </div>
          )}

          {acknowledgedIncidents.length > 0 ? (
            <div className="acknowledged-queue">
              <div className="acknowledged-queue-heading">
                <span>
                  <small>Investigation underway</small>
                  <strong>
                    {acknowledgedIncidents.length} acknowledged {acknowledgedIncidents.length === 1 ? "incident" : "incidents"}
                  </strong>
                </span>
                <small>Tracked separately from immediate attention</small>
              </div>
              <div className="event-list acknowledged-event-list">
                {acknowledgedIncidents.map((incident) => (
                  <IncidentRow incident={incident} key={incident.faultEventId} />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <Link className="fleet-intelligence-card" href="/fleet/correlation">
        <span className="fleet-intelligence-icon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="fleet-intelligence-copy">
          <span className="eyebrow"><i>New</i> Fleet intelligence</span>
          <strong>Explore the 30-day B17 pattern</strong>
          <small>Compare same-model events with weather context and role-bound engineering guidance.</small>
        </span>
        <span className="fleet-intelligence-meta">
          <strong>8 events</strong>
          <small>3 facilities · synthetic</small>
        </span>
        <ArrowIcon />
      </Link>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Connected facilities</span>
            <h2>Fleet health</h2>
          </div>
          <span className="section-note">Live from CockroachDB</span>
        </div>

        <div className="facility-grid">
          {data.facilities.map((facility) => {
            const healthPercent = facility.assetCount === 0 ? 0 : (facility.normalAssetCount / facility.assetCount) * 100;
            const needsAttention = facility.openIncidentCount > 0;

            return (
              <article className="facility-card" key={facility.plantId}>
                <div className="facility-card-top">
                  <span className={`facility-status ${needsAttention ? "watch" : "normal"}`}>
                    <span />
                    {needsAttention ? "Attention" : "Nominal"}
                  </span>
                  <span className="facility-code">{facility.plantCode.replace("FPL-", "")}</span>
                </div>
                <h3>{facility.plantName.replace("FPL ", "")}</h3>
                <p>Florida · Solar energy center</p>
                <div className="asset-health-line">
                  <span style={{ width: `${healthPercent}%` }} />
                </div>
                <div className="facility-stats">
                  <span>
                    <strong>{facility.assetCount}</strong>
                    <small>Assets</small>
                  </span>
                  <span>
                    <strong>{facility.normalAssetCount}</strong>
                    <small>Normal</small>
                  </span>
                  <span>
                    <strong className={needsAttention ? "alert-text" : undefined}>{facility.openIncidentCount}</strong>
                    <small>Open</small>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section-block recent-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Operational queue</span>
            <h2>Incident queue</h2>
          </div>
          <span className="section-note">Open first · resolved retained</span>
        </div>
        <div className="event-list">
          {data.incidents.map((incident) => (
            <IncidentRow incident={incident} key={incident.faultEventId} />
          ))}
        </div>
      </section>
    </div>
  );
}

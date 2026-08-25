import { getApplicationPool } from "../database";
import {
  fleetFacilitiesQuery,
  fleetSummaryQuery,
  recentIncidentsQuery,
} from "../queries";
import type {
  FacilitySummary,
  FleetOverview,
  FleetSummary,
  IncidentSummary,
} from "./types";

interface FleetSummaryRow {
  assets_on_watch_count: string;
  facility_count: string;
  monitored_asset_count: string;
  open_incident_count: string;
}

interface FacilityRow {
  asset_count: string;
  latest_event_time: Date | null;
  normal_asset_count: string;
  open_incident_count: string;
  plant_code: string;
  plant_id: string;
  plant_name: string;
  state_code: string | null;
  timezone_name: string;
  watch_asset_count: string;
}

interface IncidentRow {
  equipment_code: string;
  equipment_id: string;
  equipment_name: string;
  event_status: string;
  event_time: Date;
  fault_code: string;
  fault_event_id: string;
  fault_name: string;
  operating_state_after: string | null;
  operating_status: string;
  plant_code: string;
  plant_id: string;
  plant_name: string;
  severity: string;
  summary: string;
}

function toCount(value: string): number {
  return Number.parseInt(value, 10);
}

export async function getFleetOverview(): Promise<FleetOverview> {
  const pool = getApplicationPool();
  const [summaryResult, facilityResult, incidentResult] = await Promise.all([
    pool.query<FleetSummaryRow>(fleetSummaryQuery),
    pool.query<FacilityRow>(fleetFacilitiesQuery),
    pool.query<IncidentRow>(recentIncidentsQuery),
  ]);

  const row = summaryResult.rows[0];
  if (!row) {
    throw new Error("Fleet summary query returned no row.");
  }

  const summary: FleetSummary = {
    assetsOnWatchCount: toCount(row.assets_on_watch_count),
    facilityCount: toCount(row.facility_count),
    monitoredAssetCount: toCount(row.monitored_asset_count),
    openIncidentCount: toCount(row.open_incident_count),
  };

  const facilities: FacilitySummary[] = facilityResult.rows.map((facility) => ({
    assetCount: toCount(facility.asset_count),
    latestEventTime: facility.latest_event_time?.toISOString() ?? null,
    normalAssetCount: toCount(facility.normal_asset_count),
    openIncidentCount: toCount(facility.open_incident_count),
    plantCode: facility.plant_code,
    plantId: facility.plant_id,
    plantName: facility.plant_name,
    stateCode: facility.state_code,
    timezoneName: facility.timezone_name,
    watchAssetCount: toCount(facility.watch_asset_count),
  }));

  const incidents: IncidentSummary[] = incidentResult.rows.map((incident) => ({
    equipmentCode: incident.equipment_code,
    equipmentId: incident.equipment_id,
    equipmentName: incident.equipment_name,
    eventStatus: incident.event_status,
    eventTime: incident.event_time.toISOString(),
    faultCode: incident.fault_code,
    faultEventId: incident.fault_event_id,
    faultName: incident.fault_name,
    operatingStateAfter: incident.operating_state_after,
    operatingStatus: incident.operating_status,
    plantCode: incident.plant_code,
    plantId: incident.plant_id,
    plantName: incident.plant_name,
    severity: incident.severity,
    summary: incident.summary,
  }));

  return {
    facilities,
    incidents,
    refreshedAt: new Date().toISOString(),
    summary,
  };
}

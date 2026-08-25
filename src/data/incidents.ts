import { getApplicationPool } from "../database";
import { incidentByIdQuery, incidentMetricsQuery } from "../queries";
import type { IncidentDetail, IncidentMetric } from "./types";

interface IncidentRow {
  cleared_time: Date | null;
  commissioned_on: string | null;
  equipment_code: string;
  equipment_id: string;
  equipment_name: string;
  equipment_type: string;
  event_status: string;
  event_time: Date;
  fault_code: string;
  fault_event_id: string;
  fault_name: string;
  firmware_version: string | null;
  manufacturer: string;
  model: string;
  operating_state_after: string | null;
  operating_state_before: string | null;
  operating_status: string;
  operator_name: string;
  plant_code: string;
  plant_id: string;
  plant_name: string;
  severity: string;
  serial_number: string;
  source_event_id: string;
  source_system: string;
  state_code: string | null;
  summary: string;
  timezone_name: string;
}

interface MetricRow {
  aggregation_method: string;
  average_value: string | null;
  diagnostic_version: string;
  latest_value: string | null;
  maximum_value: string | null;
  metric_name: string;
  metric_summary_id: string;
  minimum_value: string | null;
  source_system: string;
  threshold_exceedance: string | null;
  threshold_operator: string | null;
  threshold_value: string | null;
  unit: string;
  window_end: Date;
  window_start: Date;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toNumber(value: string | null): number | null {
  return value === null ? null : Number.parseFloat(value);
}

export function isIncidentId(value: string): boolean {
  return uuidPattern.test(value);
}

export async function getIncidentById(id: string): Promise<IncidentDetail | null> {
  if (!isIncidentId(id)) {
    return null;
  }

  const pool = getApplicationPool();
  const incidentResult = await pool.query<IncidentRow>(incidentByIdQuery, [id]);
  const incident = incidentResult.rows[0];

  if (!incident) {
    return null;
  }

  const metricResult = await pool.query<MetricRow>(incidentMetricsQuery, [id]);
  const metrics: IncidentMetric[] = metricResult.rows.map((metric) => ({
    aggregationMethod: metric.aggregation_method,
    averageValue: toNumber(metric.average_value),
    diagnosticVersion: metric.diagnostic_version,
    latestValue: toNumber(metric.latest_value),
    maximumValue: toNumber(metric.maximum_value),
    metricName: metric.metric_name,
    metricSummaryId: metric.metric_summary_id,
    minimumValue: toNumber(metric.minimum_value),
    sourceSystem: metric.source_system,
    thresholdExceedance: toNumber(metric.threshold_exceedance),
    thresholdOperator: metric.threshold_operator,
    thresholdValue: toNumber(metric.threshold_value),
    unit: metric.unit,
    windowEnd: metric.window_end.toISOString(),
    windowStart: metric.window_start.toISOString(),
  }));

  return {
    clearedTime: incident.cleared_time?.toISOString() ?? null,
    commissionedOn: incident.commissioned_on,
    equipmentCode: incident.equipment_code,
    equipmentId: incident.equipment_id,
    equipmentName: incident.equipment_name,
    equipmentType: incident.equipment_type,
    eventStatus: incident.event_status,
    eventTime: incident.event_time.toISOString(),
    faultCode: incident.fault_code,
    faultEventId: incident.fault_event_id,
    faultName: incident.fault_name,
    firmwareVersion: incident.firmware_version,
    manufacturer: incident.manufacturer,
    metrics,
    model: incident.model,
    operatingStateAfter: incident.operating_state_after,
    operatingStateBefore: incident.operating_state_before,
    operatingStatus: incident.operating_status,
    operatorName: incident.operator_name,
    plantCode: incident.plant_code,
    plantId: incident.plant_id,
    plantName: incident.plant_name,
    severity: incident.severity,
    serialNumber: incident.serial_number,
    sourceEventId: incident.source_event_id,
    sourceSystem: incident.source_system,
    stateCode: incident.state_code,
    summary: incident.summary,
    timezoneName: incident.timezone_name,
  };
}

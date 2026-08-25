import { createPool } from "../database.js";
import { canonicalIncidentQuery, incidentMetricsQuery } from "../queries.js";

const plantCode = process.argv[2] ?? "FPL-MANATEE-SOLAR";
const equipmentCode = process.argv[3] ?? "INV-042";
const faultCode = process.argv[4] ?? "B17";

const pool = createPool("nextera-checkpoint0-incident");

try {
  const incidentResult = await pool.query(canonicalIncidentQuery, [
    plantCode,
    equipmentCode,
    faultCode,
  ]);

  if (incidentResult.rowCount !== 1) {
    throw new Error(
      `Expected one canonical incident for ${plantCode}/${equipmentCode}/${faultCode}; found ${incidentResult.rowCount ?? 0}.`,
    );
  }

  const incident = incidentResult.rows[0] as { fault_event_id: string };
  const metricsResult = await pool.query(incidentMetricsQuery, [incident.fault_event_id]);

  console.log(
    JSON.stringify(
      {
        incident,
        metrics: metricsResult.rows,
        synthetic: true,
      },
      null,
      2,
    ),
  );
} finally {
  await pool.end();
}

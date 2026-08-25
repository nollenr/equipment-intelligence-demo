import { createPool } from "../database.js";
import { healthQuery } from "../queries.js";

const pool = createPool("nextera-checkpoint0-health");

try {
  const result = await pool.query(healthQuery);
  console.log(JSON.stringify({ ok: true, ...result.rows[0] }, null, 2));
} finally {
  await pool.end();
}

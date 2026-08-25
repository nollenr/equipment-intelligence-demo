import { join } from "node:path";

import { projectRoot } from "../config.js";
import { createPool } from "../database.js";
import { loadSqlFiles } from "../lib/sql-files.js";

const pool = createPool("nextera-checkpoint0-seed");

try {
  const files = await loadSqlFiles(join(projectRoot, "db", "seeds"));

  for (const file of files) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(file.sql);
      await client.query("COMMIT");
      console.log(`Applied seed ${file.name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
} finally {
  await pool.end();
}

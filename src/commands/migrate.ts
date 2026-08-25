import { join } from "node:path";

import { projectRoot } from "../config.js";
import { createPool } from "../database.js";
import { loadSqlFiles } from "../lib/sql-files.js";

const pool = createPool("nextera-checkpoint0-migrate");

try {
  await pool.query("CREATE SCHEMA IF NOT EXISTS nextera");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nextera.schema_migrations (
      version STRING PRIMARY KEY,
      checksum STRING NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = await loadSqlFiles(join(projectRoot, "db", "migrations"));

  for (const file of files) {
    const existing = await pool.query<{ checksum: string }>(
      "SELECT checksum FROM nextera.schema_migrations WHERE version = $1",
      [file.name],
    );

    if (existing.rowCount === 1) {
      if (existing.rows[0]?.checksum !== file.checksum) {
        throw new Error(
          `Migration ${file.name} changed after application; create a new migration instead.`,
        );
      }

      console.log(`Migration ${file.name} already applied`);
      continue;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(file.sql);
      await client.query(
        "INSERT INTO nextera.schema_migrations (version, checksum) VALUES ($1, $2)",
        [file.name, file.checksum],
      );
      await client.query("COMMIT");
      console.log(`Applied migration ${file.name}`);
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

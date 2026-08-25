import { join } from "node:path";

import { projectRoot } from "../config.js";
import { createPool } from "../database.js";
import { loadSqlFiles } from "../lib/sql-files.js";

const pool = createPool("nextera-checkpoint0-bootstrap");

try {
  const files = await loadSqlFiles(join(projectRoot, "db", "bootstrap"));

  for (const file of files) {
    await pool.query(file.sql);
    console.log(`Applied bootstrap file ${file.name}`);
  }
} finally {
  await pool.end();
}

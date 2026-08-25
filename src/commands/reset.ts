import { join } from "node:path";

import { projectRoot } from "../config.js";
import { createPool } from "../database.js";
import { loadSqlFiles } from "../lib/sql-files.js";

if (process.env.CONFIRM_DEMO_RESET !== "YES") {
  throw new Error("Set CONFIRM_DEMO_RESET=YES to reset only the canonical synthetic scenario.");
}

const pool = createPool("nextera-checkpoint0-reset");

try {
  const files = await loadSqlFiles(join(projectRoot, "db", "reset"));

  for (const file of files.reverse()) {
    await pool.query(file.sql);
    console.log(`Applied reset ${file.name}`);
  }
} finally {
  await pool.end();
}

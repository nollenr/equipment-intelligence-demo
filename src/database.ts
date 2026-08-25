import pg from "pg";

import { requireDatabaseUrl } from "./config";

const { Pool } = pg;

const globalDatabase = globalThis as typeof globalThis & {
  nexteraApplicationPool?: pg.Pool;
};

export function createPool(applicationName: string): pg.Pool {
  const pool = new Pool({
    application_name: applicationName,
    connectionString: requireDatabaseUrl(),
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 10_000,
    max: 5,
    statement_timeout: 30_000,
  });

  pool.on("error", (error) => {
    console.error("Unexpected idle CockroachDB connection error:", error.message);
  });

  return pool;
}

export function getApplicationPool(): pg.Pool {
  if (!globalDatabase.nexteraApplicationPool) {
    globalDatabase.nexteraApplicationPool = createPool("nextera-equipment-intelligence-web");
  }

  return globalDatabase.nexteraApplicationPool;
}

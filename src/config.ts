import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceDirectory = dirname(fileURLToPath(import.meta.url));

export const projectRoot = resolve(sourceDirectory, "..");

export function requireDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required. Load it into the process environment without echoing or committing it.",
    );
  }

  return databaseUrl;
}

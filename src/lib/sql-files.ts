import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export interface SqlFile {
  checksum: string;
  name: string;
  path: string;
  sql: string;
}

export async function loadSqlFiles(directory: string): Promise<SqlFile[]> {
  const names = (await readdir(directory))
    .filter((name) => name.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));

  return Promise.all(
    names.map(async (name) => {
      const path = join(directory, name);
      const sql = await readFile(path, "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");

      return { checksum, name, path, sql };
    }),
  );
}

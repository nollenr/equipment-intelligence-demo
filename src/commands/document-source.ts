import { createPool } from "../database.js";

const documentVersionId = process.env.DOCUMENT_VERSION_ID?.trim() ?? "";
const documentSourceUri = process.env.DOCUMENT_SOURCE_URI?.trim() ?? "";
const confirmUpdate = process.env.CONFIRM_DOCUMENT_SOURCE_UPDATE === "YES";

if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(documentVersionId)) {
  throw new Error("DOCUMENT_VERSION_ID must be a valid UUID.");
}

let parsedSourceUri: URL;
try {
  parsedSourceUri = new URL(documentSourceUri);
} catch {
  throw new Error("DOCUMENT_SOURCE_URI must be a valid URL.");
}

if (
  parsedSourceUri.protocol !== "https:" ||
  parsedSourceUri.hostname !== "docs.google.com" ||
  !/^\/document\/d\/[^/]+\/edit$/.test(parsedSourceUri.pathname) ||
  !parsedSourceUri.hash.startsWith("#bookmark=id.")
) {
  throw new Error("DOCUMENT_SOURCE_URI must be an HTTPS Google Docs edit URL with a #bookmark=id... target.");
}

const updateQuery = `
  UPDATE nextera.document_versions
  SET source_uri = $1
  WHERE id = $2
  RETURNING id, source_uri
`;

const verifyQuery = `
  SELECT
    document.document_code,
    document.title,
    version.id AS document_version_id,
    version.version_label,
    version.source_uri,
    version.snapshot_uri
  FROM nextera.document_versions AS version
  JOIN nextera.documents AS document
    ON document.id = version.document_id
  WHERE version.id = $1
    AND version.source_uri = $2
`;

const pool = createPool("nextera-document-source-metadata");

try {
  const updatePlan = await pool.query<{ info: string }>(`EXPLAIN ${updateQuery}`, [
    documentSourceUri,
    documentVersionId,
  ]);
  console.log("=== DOCUMENT SOURCE UPDATE PLAN ===");
  console.log(updatePlan.rows.map((row) => row.info).join("\n"));

  if (confirmUpdate) {
    const updateResult = await pool.query(updateQuery, [documentSourceUri, documentVersionId]);
    if (updateResult.rowCount !== 1) {
      throw new Error(`Document version ${documentVersionId} was not found.`);
    }
    console.log("Document source metadata updated.");
  } else {
    console.log("Verification-only mode; no update was executed.");
  }

  const verifyPlan = await pool.query<{ info: string }>(`EXPLAIN ${verifyQuery}`, [
    documentVersionId,
    documentSourceUri,
  ]);
  console.log("\n=== DOCUMENT SOURCE VERIFICATION PLAN ===");
  console.log(verifyPlan.rows.map((row) => row.info).join("\n"));

  const verification = await pool.query(verifyQuery, [documentVersionId, documentSourceUri]);
  if (verification.rowCount !== 1) {
    throw new Error("The expected bookmarked source URL is not stored for this document version.");
  }

  console.log("\n=== VERIFIED DOCUMENT SOURCE ===");
  console.log(JSON.stringify(verification.rows[0], null, 2));
} finally {
  await pool.end();
}

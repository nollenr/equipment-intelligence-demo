import { createPool } from "../database.js";
import {
  embeddingChunkCandidatesQuery,
  embeddingVerificationQuery,
  updateChunkEmbeddingQuery,
} from "../embedding/sql.js";

const zeroVector = `[${Array.from({ length: 1536 }, () => "0").join(",")}]`;
const checks = [
  {
    name: "embedding chunk candidates",
    parameters: [],
    query: embeddingChunkCandidatesQuery,
  },
  {
    name: "update chunk embedding",
    parameters: [
      zeroVector,
      "openai",
      "text-embedding-3-small",
      1536,
      "checkpoint3-content-v1:773204ed2c4cc9478150daaab395d39e9aae564cdaab3de117ab0037e69a123f",
      "72000000-0000-4000-8000-000000000001",
      "773204ed2c4cc9478150daaab395d39e9aae564cdaab3de117ab0037e69a123f",
    ],
    query: updateChunkEmbeddingQuery,
  },
  {
    name: "embedding verification",
    parameters: [],
    query: embeddingVerificationQuery,
  },
];

const pool = createPool("nextera-checkpoint3-embedding-explain");

try {
  for (const check of checks) {
    const result = await pool.query<{ info: string }>(`EXPLAIN ${check.query}`, check.parameters);
    console.log(`\n=== ${check.name.toUpperCase()} ===`);
    console.log(result.rows.map((row) => row.info).join("\n"));
  }
} finally {
  await pool.end();
}

import type pg from "pg";

import { createPool } from "../database.js";
import {
  embeddingChunkCandidatesQuery,
  embeddingVerificationQuery,
  updateChunkEmbeddingQuery,
} from "../embedding/sql.js";
import { createEmbeddings, embeddingConfiguration, vectorLiteral } from "../openai/embeddings.js";

const MAX_TRANSACTION_ATTEMPTS = 4;
const EMBEDDING_CORPUS_VERSION = "checkpoint3-content-v1";

interface ChunkRow {
  content_sha256: string;
  content_text: string;
  document_chunk_id: string;
  document_code: string;
  embedding_dimensions: number | null;
  embedding_model: string | null;
  embedding_provider: string | null;
  embedding_version: string | null;
  has_embedding: boolean;
  section_heading: string | null;
}

function embeddingVersion(chunk: ChunkRow): string {
  return `${EMBEDDING_CORPUS_VERSION}:${chunk.content_sha256}`;
}

function isCurrent(chunk: ChunkRow): boolean {
  return (
    chunk.has_embedding &&
    chunk.embedding_provider === embeddingConfiguration.provider &&
    chunk.embedding_model === embeddingConfiguration.model &&
    chunk.embedding_dimensions === embeddingConfiguration.dimensions &&
    chunk.embedding_version === embeddingVersion(chunk)
  );
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function persistEmbeddings(pool: pg.Pool, chunks: ChunkRow[], vectors: number[][]): Promise<void> {
  for (let attempt = 0; attempt < MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const [index, chunk] of chunks.entries()) {
        const result = await client.query(updateChunkEmbeddingQuery, [
          vectorLiteral(vectors[index]!),
          embeddingConfiguration.provider,
          embeddingConfiguration.model,
          embeddingConfiguration.dimensions,
          embeddingVersion(chunk),
          chunk.document_chunk_id,
          chunk.content_sha256,
        ]);
        if (result.rowCount !== 1) {
          throw new Error(`Chunk ${chunk.document_chunk_id} changed while its embedding was being generated.`);
        }
      }
      await client.query("COMMIT");
      return;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      const sqlState = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
      if (sqlState !== "40001" || attempt === MAX_TRANSACTION_ATTEMPTS - 1) {
        throw error;
      }
      await sleep(Math.min(40 * 2 ** attempt, 400) + Math.floor(Math.random() * 25));
    } finally {
      client.release();
    }
  }
}

const pool = createPool("nextera-checkpoint3-embedding-worker");

try {
  const candidateResult = await pool.query<ChunkRow>(embeddingChunkCandidatesQuery);
  const pending = candidateResult.rows.filter((chunk) => !isCurrent(chunk));

  if (pending.length === 0) {
    console.log(`All ${candidateResult.rows.length} approved chunks already have current embeddings.`);
  } else {
    const batch = await createEmbeddings(pending.map((chunk) => chunk.content_text));
    await persistEmbeddings(pool, pending, batch.vectors);
    console.log(
      `Embedded ${pending.length} approved chunks with ${batch.model} (${embeddingConfiguration.dimensions} dimensions, ${batch.totalTokens} tokens).`,
    );
  }

  const verification = await pool.query(embeddingVerificationQuery);
  console.log(JSON.stringify({ ok: true, ...verification.rows[0] }, null, 2));
} finally {
  await pool.end();
}

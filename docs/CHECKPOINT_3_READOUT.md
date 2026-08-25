# Checkpoint 3 Readout — Real Embeddings and Authorized Retrieval

Date completed: 2026-08-23

## Outcome

Checkpoint 3 is complete for the canonical B17 vertical slice. The three approved document chunks have real OpenAI `text-embedding-3-small` vectors stored in CockroachDB, incoming questions use the same 1,536-dimensional configuration, retrieval is constrained to scopes authorized for the requesting demo principal, and the live B17 analysis persists the vector ranks, cosine distances, embedding model, citations, findings, metrics, and answer provenance.

The answer remains deterministic in this checkpoint. No LLM generates the diagnosis or field recommendation yet; evidence-constrained answer generation is Checkpoint 4.

## Deployed implementation

- Migration `007_embedding_worker_privileges.sql` adds a least-privilege `nextera_embedding_worker` permission bundle.
- Login `nextera_embedder` has a generated password and a mode-0600 URI at `/home/ec2-user/.config/nextera-demo/worker.env`.
- The worker can read the document/retrieval catalog and update document chunks; it does not run as `ron` or the web application's `nextera_app` login.
- `scripts/run-with-openai-env.sh` reads a disposable OpenAI key with terminal echo disabled.
- `scripts/activate-checkpoint3.sh` prompts once, embeds the corpus idempotently, runs golden retrieval tests, starts the server with the same ephemeral key, and runs the general smoke suite.
- `src/openai/embeddings.ts` calls the OpenAI embeddings endpoint from EC2 and validates the returned vector count, order, dimensions, and numeric values without logging inputs, vectors, or the key.
- Each stored embedding records provider, model, dimensions, a content-addressed embedding version, and the already-cataloged chunk content hash.
- The application first resolves the principal's readable scopes, then performs one prefix-scoped cosine query per authorized scope and merges only those authorized results.
- The deterministic B17 flow uses the ranked OEM and site-procedure chunks and persists `retrieval_method = 'vector'`, the real retrieval rank, cosine distance, and `text-embedding-3-small` model.
- If the disposable key is absent/revoked or the model API is unavailable, the prior authorized exact-fault/model path remains a presentation-safe deterministic fallback.

## Corpus verification

The idempotent worker readback reported:

```text
approved chunks: 3
embedded chunks: 3
minimum dimensions: 1536
maximum dimensions: 1536
embedding models represented: 1
```

Re-running the worker without a key is safe when everything is current; it reported that all three approved chunks already had current content-addressed embeddings and made no API call or database write.

## Golden retrieval results

All four tests passed using live OpenAI question embeddings and CockroachDB cosine distance:

| Test | Principal | Expected/observed first result | Permission proof |
|---|---|---|---|
| B17 root-cause question | Field Technician | OEM manual | Restricted bulletin absent |
| Pre-reset inspection question | Field Technician | Manatee procedure | Restricted bulletin absent |
| Fleet/high-ambient question | Fleet Engineer | Engineering bulletin | Engineer scope admits bulletin |
| Same fleet question | Field Technician | OEM manual among authorized results | Engineering bulletin absent before ranking |

The four-question batch consumed 65 embedding input tokens. That is an observed test value, not a forecast or spending guarantee.

## Live vertical-slice proof

A browser-equivalent `POST` to the deployed B17 analysis endpoint completed successfully and the subsequent restricted database readback returned:

```text
embedding model: text-embedding-3-small
rank 1: OEM-HPS-2500X-OM
  retrieval method: vector
  scope: fleet-general
  observed cosine distance: 0.280379724894
rank 2: SITE-MAN-COOLING-INSPECTION
  retrieval method: vector
  scope: manatee-site
  observed cosine distance: 0.356055857581
```

Distances are observations from one live request, not fixed thresholds. The product presents the corresponding semantic-match percentages for readability while preserving the exact distances in CockroachDB.

## Query-plan validation

Every new SQL statement was validated with CockroachDB `EXPLAIN` under the identity that executes it:

- Authorized-scope lookup uses indexed principal lookup followed by permission and scope lookup joins.
- Scoped cosine retrieval applies an equality predicate to the vector index's `retrieval_scope_id` prefix, orders by `embedding <=> $query_vector`, and limits the result.
- With only one chunk per current scope, the optimizer rationally chose a small `top-k`/lookup plan instead of an approximate vector-index scan. This is appropriate for the three-row demo corpus and must be reassessed after corpus expansion.
- Embedding updates use the chunk UUID primary key plus content-hash guard. The plan includes CockroachDB vector mutation searches for deleting the prior index entry and inserting the new one.
- All related diagnostic/provenance inserts remain in the existing short serializable transaction with bounded retry handling.

CockroachDB-specific features exercised include `VECTOR(1536)`, cosine distance (`<=>`), a prefix vector index on `(retrieval_scope_id, embedding vector_cosine_ops)`, UUID keys, typed foreign keys, `STORING` indexes, and serializable transaction retries.

## Validation completed

- TypeScript type check: passed
- Next.js production build: passed
- Three-document embedding worker: passed
- Idempotent embedding rerun: passed
- Four golden retrieval/authorization cases: passed
- Live vector analysis request: passed
- Persisted vector provenance readback: passed
- Fleet/assets/three-incident/incident-browser-assets/evidence/API/unsupported-analysis smoke suite: passed
- Server-side `OPENAI_API_KEY` presence check: passed without reading or displaying the value

## Security and credential handling

- The OpenAI key was entered only through the no-echo EC2 prompt and inherited by the worker/server process tree.
- It is not stored in the repository, shell history, logs, a persistent environment file, or AWS Secrets Manager.
- The temporary mode-0600 copy of the owner environment used to create the worker role/login was deleted immediately after provisioning and its absence was verified.
- The generated worker URI is stored separately from the web runtime URI and is mode `0600`.
- Root or an equivalent same-host administrator could still inspect a live process environment; SSH and instance administration remain the practical security boundary.

## Post-deployment browser repair

After the final production build was written while the prior Next.js process was still running, server-rendered incident HTML returned `200` but one incident-specific JavaScript chunk referenced by that old process no longer existed in the new `.next` directory. Browser navigation therefore showed “This page couldn't load” even though the original URL-only smoke test passed.

The server was replaced onto the completed build without displaying or persisting the live disposable key. `scripts/restart-demo-from-running-env.sh` now provides that controlled same-host transition, and `scripts/smoke-test.sh` now discovers and requests every Next.js asset referenced by the canonical incident page. The repaired listener started as PID `55525`, and the expanded smoke suite passed. Future deployments must treat build plus restart as one operation.

## Checkpoint 4 handoff

Implement evidence-constrained generation without weakening the current deterministic safety boundary:

1. Select a configurable OpenAI generation model.
2. Give the model only structured incident facts, deterministic findings, and the two authorized ranked chunks.
3. Require structured output with evidence identifiers rather than accepting invented citations.
4. Validate every cited identifier against the supplied evidence set before persistence/display.
5. Persist provider/model, prompt-template version, timings, exact evidence links, and whether deterministic fallback was used.
6. Preserve the current deterministic answer whenever model generation is unavailable or invalid.

Official OpenAI embedding behavior used here is documented at <https://developers.openai.com/api/docs/guides/embeddings#how-to-get-embeddings>. CockroachDB vector behavior is documented at <https://www.cockroachlabs.com/docs/v26.2/vector> and <https://www.cockroachlabs.com/docs/v26.2/vector-indexes>.

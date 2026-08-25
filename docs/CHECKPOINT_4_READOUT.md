# Checkpoint 4 Readout — Evidence-Constrained Generation and Provenance

Date: 2026-08-23

## Outcome

Checkpoint 4 is complete for the canonical Manatee `INV-042 / B17` vertical slice. The normal analysis path now performs permission-first CockroachDB retrieval, calculates the versioned deterministic findings, sends only those structured facts and the two authorized evidence chunks to the OpenAI Responses API, validates the schema and every returned evidence identifier, constructs the visible citations in application code, and persists the complete answer/evidence trail in CockroachDB. The 2026-08-23 question-aware refinement replaced the original one-size-fits-all answer contract with prompt/validator version `equipment-health-grounded/v1.1`.

The configured default generation model is `gpt-5.6-luna` with low reasoning effort. `OPENAI_GENERATION_MODEL` can override the model independently from the fixed `text-embedding-3-small` embedding configuration. `NEXTERA_GENERATION_MODE=deterministic` explicitly forces the presentation-safe fallback.

## Live answer path

```text
Question
  → field-tech-demo readable scopes
  → text-embedding-3-small question vector
  → scoped CockroachDB cosine retrieval
  → typed incident metrics + thermal_derating_b17/v1.0 findings
  → exactly two authorized chunks labeled E1/E2
  → OpenAI Responses API / strict JSON Schema
  → application schema, citation, and critical-fact validation
  → application-rendered [1]/[2] markers
  → one retry-safe CockroachDB provenance transaction
```

The model does not query CockroachDB, fetch documents, call tools, or select permissions. The question and evidence text are explicitly treated as data rather than instructions.

## Output and validation contract

The model must return three fixed objects:

- `direct_answer`
- `field_guidance`
- `recommended_action`

Each object contains only `text` and `evidence_ids`. The strict schema allows only the evidence IDs supplied for the current authorized run. Application validation then enforces:

- no unknown or duplicate evidence IDs;
- no model-authored citation markers;
- both authorized evidence types are used across the complete response;
- the direct answer addresses the deterministic question intent: diagnosis, inspection, recovery, fleet history, or general/unsupported;
- diagnosis retains the controller peak and configured threshold;
- inspection retains the authorized exterior cooling-path, visible-obstruction, fan-feedback, temperature-trend, and ambient-input checks;
- recovery retains the 70 °C/five-minute recovery criterion and ten-minute monitoring interval;
- fleet/history questions explicitly disclose that fleet and weather evidence is unavailable;
- general/unsupported questions explicitly disclose their evidence limit;
- unsupported component-failure, replacement, protection-bypass, or immediate-reset claims are rejected.

Only after all checks pass does application code convert `E1`/`E2` into visible `[1]`/`[2]` markers. It then adds a deterministic evidence-scope statement explaining that the two displayed excerpts do not constitute a complete inverter-health assessment or rule out unrelated conditions. A refusal, timeout, API error, incomplete response, malformed schema, bad citation, omitted question-specific requirement, or unsupported claim selects an intent-aware deterministic fallback instead.

## Persisted provenance

The existing Checkpoint 2/3 schema already held every required field, so no Checkpoint 4 schema migration was needed. Each successful live run persists:

- `generation_provider = 'openai'`;
- the actual returned generation model;
- `prompt_template_version = 'equipment-health-grounded/v1.1'`;
- `is_fallback = false`;
- actual end-to-end response duration;
- the embedding model when vector retrieval was used;
- both document chunks, retrieval scopes, vector ranks/distances, citation labels, and `included_in_generation = true`;
- all three deterministic findings and all three metric-summary links.

Fallback runs persist `generation_provider = 'deterministic_rules'`, `generation_model = 'thermal_derating_b17/v1.1'`, `prompt_template_version = 'deterministic-fallback/v1.1'`, `is_fallback = true`, and `included_in_generation = false`. The fallback wording is selected by the same deterministic question intent, so an inspection question receives authorized checks rather than the canonical diagnosis paragraph.

All related rows remain part of the existing short serializable transaction with bounded retry handling.

## Validation results

- TypeScript type check: passed
- Next.js production build: passed
- Structured-output assembly contract: passed
- Unknown evidence ID rejection: passed
- Missing required citation rejection: passed
- Model-authored citation-marker rejection: passed
- Critical-field-detail omission rejection: passed
- Injected generator failure selecting deterministic fallback: passed
- Persisted deterministic fallback integration test: passed
- Live `gpt-5.6-luna` generation with persisted vector provenance: passed
- Adversarial question asking the model to ignore evidence, claim controller failure, recommend replacement, and cite `E99`: passed without escaping the grounding/citation boundary
- Exact diagnosis question “Why did this inverter enter a derated state?”: passed live without fallback
- Exact inspection question “Are there other things I should check…”: passed live with specific checks and the evidence-scope statement
- Persisted intent-aware diagnosis and inspection fallbacks: passed
- Fleet-history/weather question: passed by explicitly disclosing unavailable evidence
- Unsupported capacitor-failure/replacement question: passed by refusing to infer and using the safe fallback
- Recovery/reset question: passed with the 70 °C/five-minute and ten-minute boundaries
- Fleet/assets/three-incident/incident-browser-assets/evidence/API/unsupported-analysis smoke suite: passed

The post-refinement canonical diagnosis run persisted answer `e458d90e-1f7e-48e4-b264-931c60f8307d` with an observed end-to-end duration of 3,046 ms. The final browser-visible exact inspection question persisted answer `742484f4-4535-4a3d-8461-466707a8d1ad` live through `gpt-5.6-luna` in 3,217 ms. These are observed demo runs, not benchmarks or SLAs.

## CockroachDB EXPLAIN result

Every application SQL statement, including the revised document-source and answer inserts, passed `EXPLAIN` against the target CockroachDB Standard cluster.

- The answer insert uses the insert fast path with the diagnostic-run foreign-key check.
- The two document-source rows are inserted together and use indexed foreign-key checks for run, chunk, and retrieval scope.
- Answer-to-document, metric, and finding links retain batched multi-row inserts.
- The latest-answer read uses the fault-event index, the unique run-to-answer index, and a top-k of one.
- Permission resolution remains before retrieval; the tiny three-chunk corpus appropriately uses scoped lookup/top-k processing rather than forcing an approximate vector-index scan.

No optimizer-suggested index was added for the synthetic 60-asset/three-document corpus. The current scans are bounded and rational at this scale; premature indexes would add more demo complexity than value.

CockroachDB rules applied: explicit UUID keys and foreign keys, typed columns, batched inserts, short serializable transactions, bounded retry handling, parameterized SQL, permission-first retrieval, and no generic answer/evidence JSON blobs.

## UI result

The B17 investigation now distinguishes three answer modes:

- live OpenAI answer;
- deterministic Checkpoint 4 fallback;
- earlier deterministic historical answer.

The live page displays actual duration, evidence sufficiency, semantic match percentages, `used in generation` labels, provider, generation model, embedding model, prompt version, and the exact Google Docs citations without turning the primary experience into a database console.

The response heading is now derived from the question focus (for example, “Inspection guidance response”) instead of always displaying “Protective thermal derating confirmed.” The fallback banner describes the result as question-focused and evidence-scoped.

## Security and deployment

- The disposable OpenAI key remains only in the server process environment.
- It was not displayed, copied back to the laptop, persisted, logged, or placed in a command.
- Controlled production replacements use `build-and-restart-from-running-env.sh`, which builds and immediately invokes `restart-demo-from-running-env.sh`; the latter transfers only the current key to the replacement process inside the same EC2-user security boundary.
- `store: false` is set on Responses API requests.
- Production build and restart are treated as one deployment operation; the enhanced smoke suite requests every browser asset referenced by the canonical incident page.

## Checkpoint 5 handoff

The strongest next expansion is the fleet-wide question already identified in the customer story:

> Which other inverters of this type tripped on B17 in the last 30 days, and was weather a factor?

Checkpoint 5 should add a small synthetic fleet-correlation dataset and a second evidence-constrained workflow while preserving the same permission, grounding, citation, and fallback contracts. Presentation rehearsal, an optional model-mode switch, and final visual polish should follow only after that second story is reliable.

Official OpenAI Structured Outputs guidance used for this implementation: <https://developers.openai.com/api/docs/guides/structured-outputs>. Current model-family guidance: <https://developers.openai.com/api/docs/guides/latest-model>. CockroachDB vector guidance: <https://www.cockroachlabs.com/docs/v26.2/vector> and <https://www.cockroachlabs.com/docs/v26.2/vector-indexes>.

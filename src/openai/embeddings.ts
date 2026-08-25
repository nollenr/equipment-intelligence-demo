const EMBEDDINGS_ENDPOINT = "https://api.openai.com/v1/embeddings";

export const embeddingConfiguration = {
  dimensions: 1536,
  model: "text-embedding-3-small",
  provider: "openai",
} as const;

interface EmbeddingResponse {
  data?: Array<{
    embedding?: number[];
    index?: number;
  }>;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    total_tokens?: number;
  };
}

export interface EmbeddingBatch {
  model: string;
  promptTokens: number;
  totalTokens: number;
  vectors: number[][];
}

function requireOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY is required in the process environment.");
  }
  return key;
}

function validateVector(vector: unknown, index: number): number[] {
  if (
    !Array.isArray(vector) ||
    vector.length !== embeddingConfiguration.dimensions ||
    !vector.every((value) => typeof value === "number" && Number.isFinite(value))
  ) {
    throw new Error(`Embedding ${index} did not contain ${embeddingConfiguration.dimensions} finite values.`);
  }
  return vector;
}

export async function createEmbeddings(inputs: string[]): Promise<EmbeddingBatch> {
  if (inputs.length === 0 || inputs.some((input) => !input.trim())) {
    throw new Error("At least one non-empty embedding input is required.");
  }

  const response = await fetch(EMBEDDINGS_ENDPOINT, {
    body: JSON.stringify({
      dimensions: embeddingConfiguration.dimensions,
      encoding_format: "float",
      input: inputs,
      model: embeddingConfiguration.model,
    }),
    headers: {
      authorization: `Bearer ${requireOpenAIKey()}`,
      "content-type": "application/json",
    },
    method: "POST",
    signal: AbortSignal.timeout(30_000),
  });

  const requestId = response.headers.get("x-request-id");
  if (!response.ok) {
    throw new Error(
      `OpenAI embeddings request failed with HTTP ${response.status}${requestId ? ` (request ${requestId})` : ""}.`,
    );
  }

  const payload = (await response.json()) as EmbeddingResponse;
  if (!Array.isArray(payload.data) || payload.data.length !== inputs.length) {
    throw new Error("OpenAI returned an unexpected number of embeddings.");
  }

  const ordered = [...payload.data].sort((left, right) => (left.index ?? -1) - (right.index ?? -1));
  const vectors = ordered.map((item, index) => validateVector(item.embedding, index));

  return {
    model: payload.model ?? embeddingConfiguration.model,
    promptTokens: payload.usage?.prompt_tokens ?? 0,
    totalTokens: payload.usage?.total_tokens ?? 0,
    vectors,
  };
}

export function vectorLiteral(vector: number[]): string {
  return `[${validateVector(vector, 0).join(",")}]`;
}

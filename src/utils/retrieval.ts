// src/utils/retrieval.ts
// Retrieval helper: hybrid dense + sparse fusion, chunking support.
// Replace embed/vector/bm25 client calls with your implementations.

// Local type definitions to avoid external type resolution issues
interface EmbeddingClient {
  embed(text: string): Promise<number[]>;
}
interface VectorDBClient {
  search(
    embedding: number[],
    opts: { topK: number },
  ): Promise<
    Array<{ id: string; score: number; source?: string; chunk_index?: number }>
  >;
}
interface BM25Client {
  search(
    query: string,
    topK: number,
  ): Promise<
    Array<{ id: string; score: number; source?: string; chunk_index?: number }>
  >;
}

// TODO: wire real clients
const vectorDB: VectorDBClient = null as any;
const bm25: BM25Client = null as any;
const embedClient: EmbeddingClient = null as any;

export async function retrieve(query: string, topK = 10) {
  const qEmb = await embedClient.embed(query);
  const dense = await vectorDB.search(qEmb, { topK: topK * 2 });
  const sparse = await bm25.search(query, topK * 2);

  const fused = fuseScores(dense, sparse, { alpha: 0.7, beta: 0.3 });
  return fused
    .slice(0, topK)
    .map((i) => ({
      id: i.id,
      score: i.score,
      source: i.source,
      chunk_index: i.chunk_index,
    }));
}

type DenseHit = {
  id: string;
  score: number;
  source?: string;
  chunk_index?: number;
};
type SparseHit = {
  id: string;
  score: number;
  source?: string;
  chunk_index?: number;
};

function fuseScores(
  dense: DenseHit[],
  sparse: SparseHit[],
  weights: { alpha: number; beta: number },
) {
  const map = new Map<
    string,
    { id: string; score: number; source?: string; chunk_index?: number }
  >();

  dense.forEach((d) =>
    map.set(d.id, {
      ...d,
      score: (map.get(d.id)?.score || 0) + weights.alpha * d.score,
    }),
  );
  sparse.forEach((s) => {
    const existing = map.get(s.id);
    if (existing) existing.score += weights.beta * s.score;
    else map.set(s.id, { ...s, score: weights.beta * s.score });
  });

  return Array.from(map.values()).sort((a, b) => b.score - a.score);
}

/*
Recommended usage:
1. Call retrieve() to get top chunks.
2. Build prompt with chunk summaries + optional full chunks if model requests.
3. Emit provenance envelope (retrieved ids, model used).
*/

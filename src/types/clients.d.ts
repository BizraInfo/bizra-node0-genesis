export interface EmbeddingClient {
  embed(text: string): Promise<number[]>;
}

export interface VectorDBClient {
  search(
    embedding: number[],
    opts: { topK: number },
  ): Promise<
    Array<{ id: string; score: number; source?: string; chunk_index?: number }>
  >;
}

export interface BM25Client {
  search(
    query: string,
    topK: number,
  ): Promise<
    Array<{ id: string; score: number; source?: string; chunk_index?: number }>
  >;
}

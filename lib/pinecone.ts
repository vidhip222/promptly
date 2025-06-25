/**
 * Stubbed Pinecone helper.
 *
 * The real Pinecone integration was removed from the project.  This file
 * merely satisfies legacy imports so the project can build and deploy.
 * All functions return empty results or no-ops.
 */

export interface QueryMatch {
  id: string
  score: number
  metadata?: Record<string, unknown>
}

/**
 * Dummy vector search – always returns an empty array.
 * @param _embedding vector you would search for
 * @param _topK      how many nearest neighbours to return (ignored)
 */
export async function queryVectors(_embedding: number[], _topK = 5): Promise<QueryMatch[]> {
  return []
}

/* ------------------------------------------------------------------ */
/*  Add any other previously-imported stubs here so the build succeeds */
/* ------------------------------------------------------------------ */

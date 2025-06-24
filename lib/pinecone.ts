import { Pinecone } from "@pinecone-database/pinecone"

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})
export { pinecone }

export const pineconeIndex = pinecone.index("promptly-embeddings")

export interface VectorMetadata {
  documentId: string
  botId: string
  userId: string
  fileName: string
  chunkIndex: number
  text: string
}

export async function upsertVectors(
  vectors: Array<{
    id: string
    values: number[]
    metadata: VectorMetadata
  }>,
) {
  try {
    await pineconeIndex.upsert(vectors)
    return { success: true }
  } catch (error) {
    console.error("Pinecone upsert error:", error)
    throw error
  }
}

export async function queryVectors(vector: number[], filter: Record<string, any>, topK = 5) {
  try {
    const queryResponse = await pineconeIndex.query({
      vector,
      filter,
      topK,
      includeMetadata: true,
    })
    return queryResponse.matches || []
  } catch (error) {
    console.error("Pinecone query error:", error)
    throw error
  }
}

export async function deleteVectors(filter: Record<string, any>) {
  try {
    await pineconeIndex.deleteMany(filter)
    return { success: true }
  } catch (error) {
    console.error("Pinecone delete error:", error)
    throw error
  }
}

/**
 * SochDB Vector Store for LangChain
 * Stores document embeddings in SochDB for semantic search
 */

import { Database } from '@sochdb/sochdb';
import { Embeddings } from '@langchain/core/embeddings';
import { Document } from '@langchain/core/documents';

export interface SochDBVectorStoreConfig {
  dbPath: string;
  namespace: string;
  embeddings: Embeddings;
}

export class SochDBVectorStore {
  private db: Database;
  private namespace: any;
  private embeddings: Embeddings;
  private dimension: number = 1536; // text-embedding-3-small dimension

  constructor(config: SochDBVectorStoreConfig) {
    this.db = Database.open(config.dbPath);
    this.namespace = this.db.namespace(config.namespace);
    this.embeddings = config.embeddings;
  }

  /**
   * Add documents to the vector store
   */
  async addDocuments(documents: Document[]): Promise<void> {
    console.log(`Adding ${documents.length} documents to SochDB...`);

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      
      // Generate embedding for document
      const embedding = await this.embeddings.embedQuery(doc.pageContent);
      
      // Create document ID
      const docId = `doc_${Date.now()}_${i}`;
      
      // Store document metadata
      const metadata = {
        content: doc.pageContent,
        ...doc.metadata,
        timestamp: Date.now(),
      };
      
      await this.namespace.put(
        Buffer.from(docId),
        Buffer.from(JSON.stringify(metadata))
      );
      
      // Store embedding (we'll use a separate key for vectors)
      await this.namespace.put(
        Buffer.from(`${docId}_vector`),
        Buffer.from(JSON.stringify(embedding))
      );
      
      if ((i + 1) % 10 === 0) {
        console.log(`  Processed ${i + 1}/${documents.length} documents`);
      }
    }
    
    console.log(`✅ Added ${documents.length} documents successfully`);
  }

  /**
   * Similarity search - find most relevant documents
   */
  async similaritySearch(
    query: string,
    k: number = 5,
    threshold: number = 0.7
  ): Promise<Document[]> {
    // Generate query embedding
    const queryEmbedding = await this.embeddings.embedQuery(query);
    
    // Scan all documents and compute similarity
    const results: Array<{ doc: Document; score: number }> = [];
    
    for await (const [key, value] of this.namespace.scanPrefix(Buffer.from('doc_'))) {
      const keyStr = key.toString();
      
      // Skip vector keys, only process document metadata
      if (keyStr.endsWith('_vector')) continue;
      
      // Get document metadata
      const metadata = JSON.parse(value.toString());
      
      // Get corresponding vector
      const vectorKey = Buffer.from(`${keyStr}_vector`);
      const vectorData = await this.namespace.get(vectorKey);
      
      if (!vectorData) continue;
      
      const docEmbedding = JSON.parse(vectorData.toString());
      
      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
      
      if (similarity >= threshold) {
        results.push({
          doc: new Document({
            pageContent: metadata.content,
            metadata: {
              ...metadata,
              score: similarity,
            },
          }),
          score: similarity,
        });
      }
    }
    
    // Sort by similarity (highest first) and return top k
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k).map(r => r.doc);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Delete all documents
   */
  async clear(): Promise<void> {
    // Note: In production, you'd want a more efficient way to clear
    const keys: Buffer[] = [];
    
    for await (const [key] of this.namespace.scanPrefix(Buffer.from('doc_'))) {
      keys.push(key);
    }
    
    for (const key of keys) {
      await this.namespace.delete(key);
    }
    
    console.log(`✅ Cleared ${keys.length} entries from vector store`);
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{ documentCount: number }> {
    let count = 0;
    
    for await (const [key] of this.namespace.scanPrefix(Buffer.from('doc_'))) {
      if (!key.toString().endsWith('_vector')) {
        count++;
      }
    }
    
    return { documentCount: count };
  }
}

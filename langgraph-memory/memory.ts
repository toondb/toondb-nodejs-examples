
import { Database } from "@sochdb/sochdb";
import { AzureOpenAIEmbeddings } from "@langchain/openai";
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from "dotenv";
import { sharedDb } from "./shared_db";

dotenv.config();

export class SochDBMemory {
    private embeddings: AzureOpenAIEmbeddings;

    constructor() {
        // Initialize Azure OpenAI Embeddings
        this.embeddings = new AzureOpenAIEmbeddings({
            azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
            azureOpenAIApiInstanceName: "susha-m9k30wc7-eastus2", // Extracted from endpoint
            azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || "text-embedding-3-small",
            azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
        });
    }

    async init() {
        await sharedDb.init();
    }

    async close() {
        // We don't close here anymore, let the main process close sharedDb
    }

    async addEpisode(content: string): Promise<string> {
        await this.init();

        // Generate embedding
        const vector = await this.embeddings.embedQuery(content);
        const id = uuidv4();
        const timestamp = Date.now();

        // Create memory object
        const memory = {
            id,
            content,
            vector,
            timestamp,
            type: "episodic"
        };

        // Store in SochDB (using JSON for simplicity in this demo)
        // Key format: memories/{id}
        const key = `memories/${id}`;
        const value = JSON.stringify(memory);

        await sharedDb.execute(async (db) => {
            await db.put(Buffer.from(key), Buffer.from(value));
            console.log(`[Memory] Stored: ${content.substring(0, 50)}...`);
        });

        return id;
    }

    private searchStats = {
        count: 0,
        totalTimeMs: 0,
        minTimeMs: Number.MAX_VALUE,
        maxTimeMs: 0
    };

    /**
     * Get memory search performance statistics
     */
    getStats() {
        return {
            ...this.searchStats,
            avgTimeMs: this.searchStats.count > 0
                ? this.searchStats.totalTimeMs / this.searchStats.count
                : 0
        };
    }

    async searchMemories(query: string, k: number = 5): Promise<string[]> {
        const start = performance.now();

        try {
            await this.init();

            // Generate query embedding
            const queryVector = await this.embeddings.embedQuery(query);

            // Brute-force cosine similarity for now (since we don't have the vector index extension loaded in this simple binding yet
            // or we want to keep it simple without managing a separate vector index)
            // NOTE: The python sdk used a vector index, but for this node implementation 
            // we will implement a simple scan-and-rank since the vector index API might be different inside the package.
            // The package definition shows "VectorIndex" export, let's try to use it if we can, but fallback to scan.

            // Let's do a linear scan for simplicity and robustness in this test
            const results: { content: string; score: number }[] = [];

            await sharedDb.execute(async (db) => {
                // Scan all memories
                const memories = await db.scan("memories/");

                for (const { value } of memories) {
                    try {
                        const memory = JSON.parse(value.toString());
                        if (memory.vector && Array.isArray(memory.vector)) {
                            const score = this.cosineSimilarity(queryVector, memory.vector);
                            results.push({ content: memory.content, score });
                        }
                    } catch (e) {
                        // Ignore parsing errors
                    }
                }
            });

            // Sort by score descending
            results.sort((a, b) => b.score - a.score);

            // Return top k
            return results.slice(0, k).map(r => r.content);
        } finally {
            const duration = performance.now() - start;
            this.searchStats.count++;
            this.searchStats.totalTimeMs += duration;
            this.searchStats.minTimeMs = Math.min(this.searchStats.minTimeMs, duration);
            this.searchStats.maxTimeMs = Math.max(this.searchStats.maxTimeMs, duration);
        }
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}


export const memoryStore = new SochDBMemory();

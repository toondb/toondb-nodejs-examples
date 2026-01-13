/**
 * ToonDB RAG System - Vector Store using ToonDB
 */
const { Database } = require('@sochdb/sochdb');
const { Chunk } = require('./documents');
const config = require('./config');

/**
 * Search result from vector store
 */
class SearchResult {
    constructor(chunk, score) {
        this.chunk = chunk;
        this.score = score;
    }
}

/**
 * Vector Store implementation using ToonDB
 */
class ToonDBVectorStore {
    constructor(dbPath = null) {
        this.dbPath = dbPath || config.toondb.path;
        this._db = null;
        this._chunksCache = new Map();
        this._vectorsCache = new Map();
    }

    async open() {
        if (!this._db) {
            this._db = Database.open(this.dbPath);
        }
        return this._db;
    }

    /**
     * Insert or update chunks with their embeddings
     */
    async upsert(chunks, embeddings) {
        if (chunks.length !== embeddings.length) {
            throw new Error('Chunks and embeddings must have same length');
        }

        const db = await this.open();

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const chunkId = chunk.id;

            // Store chunk metadata
            const chunkData = JSON.stringify({
                content: chunk.content,
                metadata: chunk.metadata,
                startIndex: chunk.startIndex,
                endIndex: chunk.endIndex
            });

            await db.put(Buffer.from(`chunks/${chunkId}`), Buffer.from(chunkData));

            // Store embedding as base64
            const embedding = embeddings[i];
            const buffer = Buffer.alloc(embedding.length * 4);
            for (let j = 0; j < embedding.length; j++) {
                buffer.writeFloatLE(embedding[j], j * 4);
            }
            await db.put(Buffer.from(`vectors/${chunkId}`), Buffer.from(buffer.toString('base64')));

            // Update cache
            this._chunksCache.set(chunkId, chunk);
            this._vectorsCache.set(chunkId, embedding);
        }

        console.log(`✅ Upserted ${chunks.length} chunks to ToonDB`);
    }

    /**
     * Search for similar chunks using cosine similarity
     */
    async search(queryEmbedding, topK = 5) {
        // Load all vectors if cache is empty
        if (this._vectorsCache.size === 0) {
            await this._loadAll();
        }

        if (this._vectorsCache.size === 0) {
            return [];
        }

        // Calculate cosine similarities
        const queryNorm = this._normalize(queryEmbedding);

        const scores = [];
        for (const [chunkId, vector] of this._vectorsCache) {
            const vectorNorm = this._normalize(vector);
            const similarity = this._dot(queryNorm, vectorNorm);
            scores.push({ chunkId, similarity });
        }

        // Sort by similarity (descending)
        scores.sort((a, b) => b.similarity - a.similarity);

        // Return top-k results
        const results = [];
        for (const { chunkId, similarity } of scores.slice(0, topK)) {
            const chunk = this._chunksCache.get(chunkId);
            if (chunk) {
                results.push(new SearchResult(chunk, similarity));
            }
        }

        return results;
    }

    _normalize(vector) {
        const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
        return vector.map(v => v / norm);
    }

    _dot(a, b) {
        return a.reduce((sum, v, i) => sum + v * b[i], 0);
    }

    async _loadAll() {
        try {
            const db = await this.open();

            // Scan for chunks - scanPrefix returns async generator
            for await (const [key, value] of db.scanPrefix(Buffer.from('chunks/'))) {
                const keyStr = key.toString();
                const chunkId = keyStr.replace('chunks/', '');
                const valueStr = value.toString();
                const data = JSON.parse(valueStr);

                const chunk = new Chunk(
                    data.content,
                    data.metadata,
                    data.startIndex,
                    data.endIndex
                );
                chunk.id = chunkId;
                this._chunksCache.set(chunkId, chunk);
            }

            // Scan for vectors
            for await (const [key, value] of db.scanPrefix(Buffer.from('vectors/'))) {
                const keyStr = key.toString();
                const chunkId = keyStr.replace('vectors/', '');
                const valueStr = value.toString();

                // Decode base64 to float array
                const buffer = Buffer.from(valueStr, 'base64');
                const vector = [];
                for (let i = 0; i < buffer.length; i += 4) {
                    vector.push(buffer.readFloatLE(i));
                }
                this._vectorsCache.set(chunkId, vector);
            }
        } catch (e) {
            console.log(`Warning: Could not load from database: ${e.message}`);
        }
    }

    async clear() {
        const chunkIds = Array.from(this._chunksCache.keys());
        const db = await this.open();

        for (const chunkId of chunkIds) {
            try {
                await db.delete(Buffer.from(`chunks/${chunkId}`));
                await db.delete(Buffer.from(`vectors/${chunkId}`));
            } catch (e) {
                // Ignore
            }
        }

        this._chunksCache.clear();
        this._vectorsCache.clear();
    }

    count() {
        return this._chunksCache.size;
    }

    async close() {
        if (this._db) {
            await this._db.close();
            this._db = null;
        }
    }
}

module.exports = {
    ToonDBVectorStore,
    SearchResult
};

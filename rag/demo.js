/**
 * ToonDB RAG System - Demo Script
 */
const fs = require('fs');
const path = require('path');
const { ToonDBRAG } = require('./src/rag');

const SAMPLE_CONTENT = `
# ToonDB Documentation

## Overview

ToonDB is a high-performance embedded database designed for AI applications.
It provides key-value storage, vector search, and SQL capabilities.

## Features

### Key-Value Store
ToonDB offers simple get/put/delete operations for key-value data.
Keys can be hierarchical paths like "users/alice/email".

### Vector Search
ToonDB includes HNSW (Hierarchical Navigable Small World) index for 
fast approximate nearest neighbor search. This is ideal for RAG applications.

### SQL Support
ToonDB supports basic SQL operations including:
- CREATE TABLE
- INSERT INTO
- SELECT with WHERE, ORDER BY, LIMIT
- UPDATE and DELETE

### Transactions
All operations support ACID transactions with snapshot isolation.

## Installation

Node.js:
\`\`\`
npm install @sochdb/sochdb
\`\`\`

Python:
\`\`\`
pip install sochdb
\`\`\`

## Quick Start

\`\`\`javascript
const { Database } = require('@sochdb/sochdb');

const db = Database.open('./my_db');
await db.put(Buffer.from('key'), Buffer.from('value'));
const value = await db.get(Buffer.from('key'));
console.log(value.toString()); // 'value'
db.close();
\`\`\`

## Performance

ToonDB is optimized for:
- Low latency reads (sub-millisecond)
- High throughput writes
- Efficient vector search with HNSW

## Use Cases

1. RAG (Retrieval-Augmented Generation)
2. Semantic search applications
3. LLM context retrieval
4. Multi-tenant data storage
5. Embedded databases for desktop apps
`;

async function createSampleDocument() {
    const docsDir = path.join(__dirname, 'documents');
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }

    const samplePath = path.join(docsDir, 'sample_toondb_docs.md');
    fs.writeFileSync(samplePath, SAMPLE_CONTENT);
    console.log(`📄 Created sample document: ${samplePath}`);
    return samplePath;
}

async function runDemo() {
    console.log('='.repeat(60));
    console.log('🚀 ToonDB RAG System Demo (Node.js)');
    console.log('='.repeat(60));

    // Create sample document
    const samplePath = await createSampleDocument();

    // Initialize RAG with fallback to mock if Azure fails
    console.log('\n📦 Initializing RAG system...');

    let rag;
    let useMock = false;

    try {
        rag = new ToonDBRAG({ dbPath: './demo_toondb_data' });
        // Test connection
        console.log('   🔄 Verifying Azure OpenAI connection...');
        await rag.embedder.embedQuery('test');
        console.log('   ✅ Connected to Azure OpenAI');
    } catch (e) {
        console.log(`   ⚠️ Could not connect to Azure: ${e.message}`);
        console.log('   🔄 Falling back to Mock Mode');
        useMock = true;
        rag = new ToonDBRAG({ dbPath: './demo_toondb_data', useMock: true });
    }

    try {
        // Clear previous data
        await rag.clear();

        // Ingest document
        console.log('\n📥 Ingesting document...');
        const count = await rag.ingestFile(samplePath);
        console.log(`   ✅ Created ${count} chunks`);

        // Show stats
        const stats = rag.getStats();
        console.log(`\n📊 Stats: ${stats.totalChunks} chunks from ${stats.ingestedDocuments} documents`);

        // Test queries
        const testQuestions = [
            'What is ToonDB?',
            'How do I install ToonDB in Node.js?',
            'What are the main features of ToonDB?',
            'Does ToonDB support SQL?',
            'What is HNSW in ToonDB?'
        ];

        console.log('\n' + '='.repeat(60));
        console.log('🔍 Running Test Queries');
        console.log('='.repeat(60));

        for (const question of testQuestions) {
            console.log(`\n❓ Question: ${question}`);
            console.log('-'.repeat(40));

            const response = await rag.query(question);

            console.log(`📊 Confidence: ${response.confidence}`);
            console.log(`💬 Answer: ${response.answer.slice(0, 300)}...`);

            if (response.sources && response.sources.length > 0) {
                console.log(`📚 Top source score: ${response.sources[0].score.toFixed(3)}`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Demo completed!');
        console.log('='.repeat(60));

    } finally {
        await rag.close();
    }
}

runDemo().catch(console.error);

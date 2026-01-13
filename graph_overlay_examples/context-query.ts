/**
 * ToonDB Context Query Example (Node.js/TypeScript)
 *
 * Demonstrates the Context Query Engine for token-aware retrieval
 * in LLM applications.
 */

import {
  Database,
  ContextQuery,
  ContextResult,
  DeduplicationStrategy,
  TokenEstimator,
  FusionStrategy,
} from '@sochdb/sochdb';

async function main() {
  console.log('=== ToonDB Context Query Example (Node.js) ===\n');

  // Open database
  const db = await Database.open('./context_example_db');

  // -------------------------------------------------------
  // 1. Store documents for retrieval
  // -------------------------------------------------------
  console.log('1. Storing documents...');

  const documents = [
    {
      id: 'doc1',
      text: 'ToonDB is an AI-native database designed for LLM applications. It features token-optimized output, O(|path|) lookups, built-in vector search, and durable transactions.',
      category: 'overview',
    },
    {
      id: 'doc2',
      text: 'Vector search in ToonDB uses HNSW indexes for fast approximate nearest neighbor search. The index supports both cosine and euclidean distance metrics.',
      category: 'features',
    },
    {
      id: 'doc3',
      text: 'The Graph Overlay feature allows building lightweight graph structures on top of ToonDB\'s key-value storage. It supports typed edges, BFS/DFS traversal, and property storage.',
      category: 'features',
    },
    {
      id: 'doc4',
      text: 'Policy hooks provide trigger-based guardrails for agent operations. Use beforeWrite, afterRead, and beforeDelete hooks to implement validation, redaction, and access control.',
      category: 'security',
    },
  ];

  for (const doc of documents) {
    await db.put(
      Buffer.from(`docs/${doc.id}`),
      Buffer.from(JSON.stringify(doc))
    );
  }
  console.log(`   Stored ${documents.length} documents`);

  // -------------------------------------------------------
  // 2. Basic context query with token budget
  // -------------------------------------------------------
  console.log('\n2. Basic context query with token budget...');

  const query = new ContextQuery(db, 'docs')
    .withTokenBudget(500)
    .withQuery('How does vector search work?')
    .withTopK(3);

  const result = await query.execute();

  console.log("   Query: 'How does vector search work?'");
  console.log('   Token budget: 500');
  console.log(`   Results: ${result.chunks.length} chunks`);
  console.log(`   Total tokens used: ${result.totalTokens}`);

  for (const chunk of result.chunks) {
    const text = chunk.text.length > 60 ? chunk.text.slice(0, 60) + '...' : chunk.text;
    console.log(`   - [${chunk.score.toFixed(2)}] ${text}`);
  }

  // -------------------------------------------------------
  // 3. Token estimator configuration
  // -------------------------------------------------------
  console.log('\n3. Token estimator configuration...');

  const sampleText = 'This is a sample text to demonstrate token counting differences.';

  const estimators: Record<string, TokenEstimator> = {
    gpt4: TokenEstimator.gpt4(),
    claude: TokenEstimator.claude(),
    simple: TokenEstimator.simple(),
  };

  for (const [name, estimator] of Object.entries(estimators)) {
    const tokens = estimator.estimate(sampleText);
    console.log(`   ${name}: ${tokens} tokens`);
  }

  // -------------------------------------------------------
  // 4. Semantic deduplication
  // -------------------------------------------------------
  console.log('\n4. Semantic deduplication...');

  // Store similar documents
  const similarDocs = [
    { id: 'dup1', text: 'ToonDB supports vector search using HNSW indexes.' },
    { id: 'dup2', text: 'Vector search in ToonDB uses HNSW indexes.' },
    { id: 'dup3', text: "HNSW indexes power ToonDB's vector search." },
    { id: 'unique', text: 'Policy hooks enable validation and access control.' },
  ];

  for (const doc of similarDocs) {
    await db.put(
      Buffer.from(`similar/${doc.id}`),
      Buffer.from(doc.text)
    );
  }

  // Without deduplication
  const queryNoDedup = new ContextQuery(db, 'similar')
    .withQuery('vector search')
    .withDeduplication(DeduplicationStrategy.NONE)
    .withTopK(10);
  const result1 = await queryNoDedup.execute();
  console.log(`   Without dedup: ${result1.chunks.length} chunks`);

  // With semantic deduplication
  const queryWithDedup = new ContextQuery(db, 'similar')
    .withQuery('vector search')
    .withDeduplication(DeduplicationStrategy.SEMANTIC)
    .withTopK(10);
  const result2 = await queryWithDedup.execute();
  console.log(`   With semantic dedup: ${result2.chunks.length} chunks`);

  // -------------------------------------------------------
  // 5. Provenance tracking
  // -------------------------------------------------------
  console.log('\n5. Provenance tracking...');

  const provenanceQuery = new ContextQuery(db, 'docs')
    .withQuery('deployment options')
    .withProvenance(true)
    .withTopK(2);

  const provenanceResult = await provenanceQuery.execute();
  for (const chunk of provenanceResult.chunks) {
    console.log(`   Chunk: ${chunk.id}`);
    console.log(`   - Source: ${chunk.provenance?.source || 'unknown'}`);
    console.log(`   - Category: ${chunk.provenance?.category || 'unknown'}`);
  }

  // -------------------------------------------------------
  // 6. Hybrid search (vector + keyword)
  // -------------------------------------------------------
  console.log('\n6. Hybrid search (vector + keyword)...');

  const hybridQuery = new ContextQuery(db, 'docs')
    .withQuery('graph traversal BFS DFS')
    .withVectorSearch(true, 0.7)
    .withKeywordSearch(true, 0.3)
    .withFusion(FusionStrategy.RRF, 60)
    .withTopK(3);

  const hybridResult = await hybridQuery.execute();
  console.log("   Hybrid query: 'graph traversal BFS DFS'");
  console.log('   Vector weight: 0.7, Keyword weight: 0.3');
  console.log(`   Results: ${hybridResult.chunks.length} chunks`);

  // -------------------------------------------------------
  // 7. Context for different LLM windows
  // -------------------------------------------------------
  console.log('\n7. Context for different LLM windows...');

  const windows: Record<string, number> = {
    'GPT-3.5': 4096,
    'GPT-4': 8192,
    'GPT-4-Turbo': 128000,
    'Claude-3': 200000,
  };

  for (const [model, maxTokens] of Object.entries(windows)) {
    const available = maxTokens - 1500; // Reserve for response + system

    const windowQuery = new ContextQuery(db, 'docs')
      .withTokenBudget(available)
      .withQuery('all features')
      .withTopK(20);

    const windowResult = await windowQuery.execute();
    console.log(
      `   ${model} (${maxTokens} tokens): ${windowResult.chunks.length} chunks, ${windowResult.totalTokens} tokens used`
    );
  }

  // -------------------------------------------------------
  // 8. Building context string
  // -------------------------------------------------------
  console.log('\n8. Building context string...');

  const contextQuery = new ContextQuery(db, 'docs')
    .withTokenBudget(300)
    .withQuery('ToonDB features')
    .withTopK(2);

  const contextResult = await contextQuery.execute();
  const contextStr = contextResult.toContextString({
    format: 'markdown',
    includeMetadata: true,
    separator: '\n---\n',
  });

  const truncated = contextStr.length > 200 ? contextStr.slice(0, 200) + '...' : contextStr;
  console.log(`   Generated context:\n   ${truncated}`);

  await db.close();
  console.log('\n=== Context Query Example Complete ===');
}

main().catch(console.error);

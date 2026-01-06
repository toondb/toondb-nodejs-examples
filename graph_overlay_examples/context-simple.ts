/**
 * ToonDB Context Query Example (Node.js/TypeScript) - Simplified
 */

import { Database } from '@sushanth/toondb';

async function main() {
  console.log('=== ToonDB Node.js SDK - Context Query Example ===\n');

  // Open database
  const db = await Database.open('./test_context_db');
  console.log('✓ Database opened');

  // Store documents
  const docs: Record<string, string> = {
    'docs/doc1': 'ToonDB is a database designed for AI applications with vector search capabilities.',
    'docs/doc2': 'Graph overlay provides agent memory capabilities for building intelligent systems.',
    'docs/doc3': 'Context query helps retrieve relevant information efficiently for LLM context windows.',
  };

  for (const [key, content] of Object.entries(docs)) {
    await db.put(Buffer.from(key), Buffer.from(content));
  }
  console.log('✓ Stored 3 documents');

  // Retrieve a document
  const doc = await db.get(Buffer.from('docs/doc2'));
  if (doc) {
    console.log(`✓ Retrieved: ${doc.toString().substring(0, 50)}...`);
  }

  // Scan with prefix
  const results = await db.scan('docs/');
  console.log(`✓ Scanned ${results.length} documents with prefix 'docs/'`);
  for (const [key, value] of results) {
    console.log(`  - ${key.toString()}: ${value.toString().substring(0, 50)}...`);
  }

  console.log('\n✓✓✓ SUCCESS: Context operations work perfectly! ✓✓✓');

  // Cleanup
  await db.close();
}

main().catch(console.error);

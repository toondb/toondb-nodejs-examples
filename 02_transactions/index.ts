/**
 * Transactions Example - SochDB Node.js SDK
 * 
 * Demonstrates:
 * - Beginning transactions
 * - Batch operations
 * - Commit and rollback
 * - ACID properties
 */

import { Database } from '@sochdb/sochdb';

async function main() {
  console.log('=== SochDB Node.js SDK - Transactions ===\n');

  const db = Database.open('./data/transactions_db');
  console.log('✅ Database opened successfully\n');

  try {
    // Example 1: Successful transaction (commit)
    console.log('1. Successful Transaction');
    console.log('-------------------------');
    
    await db.withTransaction(async (txn) => {
      await txn.put(Buffer.from('account:alice'), Buffer.from('1000'));
      await txn.put(Buffer.from('account:bob'), Buffer.from('500'));
      await txn.put(Buffer.from('account:charlie'), Buffer.from('750'));
      console.log('  Staged 3 account updates');
    });
    console.log('✅ Transaction committed\n');

    // Verify data persisted
    const alice = await db.get(Buffer.from('account:alice'));
    console.log(`Verified: account:alice = ${alice?.toString()}\n`);

    // Example 2: Atomic transfer
    console.log('2. Atomic Transfer');
    console.log('------------------');
    
    const before = await db.get(Buffer.from('account:alice'));
    console.log(`Before: Alice = ${before?.toString()}`);

    await db.withTransaction(async (txn) => {
      await txn.put(Buffer.from('account:alice'), Buffer.from('800'));
      await txn.put(Buffer.from('account:bob'), Buffer.from('700'));
      await txn.put(Buffer.from('transfer:001'), Buffer.from('{"from":"alice","to":"bob","amount":200}'));
    });

    const after = await db.get(Buffer.from('account:alice'));
    console.log(`After:  Alice = ${after?.toString()}`);
    console.log('✅ Atomic transfer complete\n');

    // Example 3: Transaction with scan
    console.log('3. Scan within Transaction');
    console.log('--------------------------');
    
    await db.withTransaction(async (txn) => {
      let count = 0;
      for await (const [key, value] of txn.scanPrefix(Buffer.from('account:'))) {
        console.log(`  ${key.toString()} = ${value.toString()}`);
        count++;
      }
      console.log(`✅ Scanned ${count} accounts in transaction\n`);
    });

    console.log('=== Example Complete ===');

  } finally {
    db.close();
  }
}

main().catch(console.error);

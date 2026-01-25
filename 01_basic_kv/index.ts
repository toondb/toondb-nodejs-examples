/**
 * Basic Key-Value Operations with SochDB Node.js SDK
 * 
 * Demonstrates:
 * - Opening a database
 * - Put/Get/Delete operations
 * - Scanning with prefix
 * - Database statistics
 */

import { Database } from '@sochdb/sochdb';

async function main() {
  console.log('=== SochDB Node.js SDK - Basic Key-Value Operations ===\n');

  // Open database in embedded mode
  const db = Database.open('./data/basic_kv_db');
  console.log('✅ Database opened successfully\n');

  try {
    // Example 1: PUT operations
    console.log('1. PUT Operations');
    console.log('-----------------');
    
    await db.put(Buffer.from('user:1001'), Buffer.from(JSON.stringify({ name: 'Alice', email: 'alice@example.com' })));
    console.log('Stored: user:1001');

    // Store multiple keys
    const users = {
      'user:1002': { name: 'Bob', email: 'bob@example.com' },
      'user:1003': { name: 'Charlie', email: 'charlie@example.com' },
      'product:2001': { name: 'Laptop', price: 999 },
      'product:2002': { name: 'Mouse', price: 25 },
    };

    for (const [key, value] of Object.entries(users)) {
      await db.put(Buffer.from(key), Buffer.from(JSON.stringify(value)));
    }
    console.log('✅ Stored multiple key-value pairs\n');

    // Example 2: GET operations
    console.log('2. GET Operations');
    console.log('-----------------');
    
    const user = await db.get(Buffer.from('user:1001'));
    console.log(`Retrieved: user:1001 = ${user?.toString()}`);

    // Get non-existent key
    const missing = await db.get(Buffer.from('user:9999'));
    if (!missing) {
      console.log('Key not found: user:9999 (expected)\n');
    }

    // Example 3: SCAN operations
    console.log('3. SCAN Operations');
    console.log('------------------');
    console.log('Scanning keys with prefix "user:"');
    
    let count = 0;
    for await (const [key, value] of db.scanPrefix(Buffer.from('user:'))) {
      console.log(`  ${key.toString()} = ${value.toString()}`);
      count++;
    }
    console.log(`✅ Scanned ${count} keys\n`);

    // Example 4: DELETE operations
    console.log('4. DELETE Operations');
    console.log('--------------------');
    
    await db.delete(Buffer.from('user:1001'));
    console.log('Deleted: user:1001');

    // Verify deletion
    const deleted = await db.get(Buffer.from('user:1001'));
    if (!deleted) {
      console.log('✅ Key successfully deleted\n');
    }

    // Example 5: Database statistics
    console.log('5. Database Statistics');
    console.log('----------------------');
    
    const stats = await db.stats();
    console.log(`Active transactions: ${stats.activeTransactions}`);
    console.log(`Memtable size: ${stats.memtableSizeBytes} bytes`);

    console.log('\n=== Example Complete ===');

  } finally {
    db.close();
  }
}

main().catch(console.error);

/**
 * Namespace Example - SochDB Node.js SDK
 */

import { Database } from '@sochdb/sochdb';

async function main() {
  console.log('=== SochDB Node.js SDK - Namespaces ===\n');

  const db = Database.open('./data/namespace_db');
  console.log('✅ Database opened\n');

  try {
    // Create and use namespaces
    console.log('1. Create Namespaces');
    console.log('--------------------');
    
    const ns1 = db.namespace('tenant_acme');
    const ns2 = db.namespace('tenant_globex');
    
    await ns1.put(Buffer.from('company'), Buffer.from('Acme Corporation'));
    await ns1.put(Buffer.from('users'), Buffer.from('150'));
    
    await ns2.put(Buffer.from('company'), Buffer.from('Globex Corporation'));
    await ns2.put(Buffer.from('users'), Buffer.from('500'));
    
    console.log('✅ Stored data in 2 namespaces\n');

    // Data isolation
    console.log('2. Data Isolation');
    console.log('-----------------');
    
    const acme = await ns1.get(Buffer.from('company'));
    const globex = await ns2.get(Buffer.from('company'));
    
    console.log(`Acme:   ${acme?.toString()}`);
    console.log(`Globex: ${globex?.toString()}`);
    console.log('✅ Data properly isolated\n');

    console.log('=== Example Complete ===');
  } finally {
    db.close();
  }
}

main().catch(console.error);

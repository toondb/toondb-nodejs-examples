const { Database } = require('@sochdb/sochdb');

const db = Database.open('./test_simple_db');
console.log('✅ Database opened');

(async () => {
  await db.put(Buffer.from('key1'), Buffer.from('value1'));
  console.log('✅ Put key1');
  
  const value = await db.get(Buffer.from('key1'));
  console.log('✅ Get key1 =', value?.toString());
  
  await db.putPath('users/alice', Buffer.from('Alice'));
  const alice = await db.getPath('users/alice');
  console.log('✅ Path users/alice =', alice?.toString());
  
  db.close();
  console.log('✅ Database closed');
})();

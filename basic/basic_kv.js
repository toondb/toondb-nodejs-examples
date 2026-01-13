const { Database } = require('@sochdb/sochdb');

async function main() {
    console.log('Node.js SDK Test');
    console.log('================');

    try {
        // Use Database.open() for embedded mode (synchronous open)
        const db = Database.open('./test_node_db');
        console.log('✅ Database opened');

        // Test put
        await db.put(Buffer.from('test_key'), Buffer.from('test_value'));
        console.log('✅ Put: test_key -> test_value');

        // Test get
        const value = await db.get(Buffer.from('test_key'));
        console.log(`✅ Get: test_key = ${value?.toString()}`);

        // Test path operations
        await db.putPath('users/alice/email', Buffer.from('alice@example.com'));
        const email = await db.getPath('users/alice/email');
        console.log(`✅ Path: users/alice/email = ${email?.toString()}`);

        // Test scanPrefix
        await db.put(Buffer.from('tenants/acme/user1'), Buffer.from('{"name":"Alice"}'));
        await db.put(Buffer.from('tenants/acme/user2'), Buffer.from('{"name":"Bob"}'));
        let count = 0;
        for await (const [key, value] of db.scanPrefix(Buffer.from('tenants/acme/'))) {
            count++;
        }
        console.log(`✅ Scan: Found ${count} items with prefix 'tenants/acme/'`);

        db.close();
        console.log('✅ Database closed');
        console.log('\n🎉 All Node.js SDK tests passed!');
    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

main();

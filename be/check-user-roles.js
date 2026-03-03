const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '1',
    database: 'hrmsystem',
});

async function run() {
    await client.connect();
    const res = await client.query('SELECT id, first_name, last_name, "roleItemId" FROM users');
    console.log('--- USERS ROLES ---');
    console.log(JSON.stringify(res.rows, null, 2));
    console.log('--- END USERS ROLES ---');
    await client.end();
}

run().catch(console.error);

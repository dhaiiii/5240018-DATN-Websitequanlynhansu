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
    const res = await client.query('SELECT id, email, first_name, last_name FROM "users" ORDER BY id DESC LIMIT 30');
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
}
run().catch(console.error);

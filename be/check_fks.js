const { Client } = require('pg');
const fs = require('fs');
const client = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: '1', database: 'hrmsystem' });

async function run() {
    await client.connect();
    const res = await client.query(`SELECT tc.table_name, kcu.column_name FROM information_schema.table_constraints AS tc JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name='users';`);
    fs.writeFileSync('out.json', JSON.stringify(res.rows, null, 2));
    await client.end();
}
run();

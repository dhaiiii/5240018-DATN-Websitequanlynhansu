const { Client } = require('pg');

async function clean() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'hrmsystem',
        password: '1',
        port: 5432,
    });

    await client.connect();

    console.log('Connected to DB and cleaning orphaned data...');

    const res1 = await client.query(`DELETE FROM timekeeping WHERE email NOT IN (SELECT email FROM users)`);
    console.log(`Deleted ${res1.rowCount} rows from timekeeping`);

    const res2 = await client.query(`DELETE FROM requests WHERE email NOT IN (SELECT email FROM users)`);
    console.log(`Deleted ${res2.rowCount} rows from requests`);

    await client.end();
}

clean().catch(console.error);

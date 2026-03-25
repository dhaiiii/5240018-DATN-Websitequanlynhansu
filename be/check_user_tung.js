const { Client } = require('pg');

async function checkUserTung() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '1',
        database: 'hrmsystem',
    });

    try {
        await client.connect();
        const res = await client.query('SELECT email, first_name, last_name, "roleItemId" FROM users WHERE email ILIKE \'%tung%\'');
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (err) {
        console.error('Error checking user:', err);
    } finally {
        await client.end();
    }
}

checkUserTung();

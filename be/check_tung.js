const { Client } = require('pg');

async function check() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '1',
        database: 'hrmsystem',
    });

    try {
        await client.connect();
        const res = await client.query(`
      SELECT u.email, u.role, r.role_name, r.permission_level, u."roleItemId"
      FROM users u
      LEFT JOIN roles r ON u."roleItemId" = r.id
      WHERE u.email ILIKE '%tung%'
    `);
        console.log('Users containing tung:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

check();

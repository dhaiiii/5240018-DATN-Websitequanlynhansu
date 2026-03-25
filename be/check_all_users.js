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
        const all = await client.query(`
      SELECT u.id, u.email, u.role, u."roleItemId", r.role_name, r.permission_level
      FROM users u
      LEFT JOIN roles r ON u."roleItemId" = r.id
      ORDER BY u.id
    `);
        console.log('All users:');
        all.rows.forEach(r => {
            console.log(`${r.id}: ${r.email} | legacy=${r.role} | role_name=${r.role_name} | perm=${r.permission_level}`);
        });
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

check();

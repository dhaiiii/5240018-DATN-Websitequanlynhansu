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

    // Check if roles exist
    const roles = ['MANAGER', 'USER'];
    for (const roleName of roles) {
        const res = await client.query('SELECT * FROM roles WHERE role_name = $1', [roleName]);
        if (res.rows.length === 0) {
            const level = roleName.toLowerCase();
            await client.query(
                'INSERT INTO roles (role_name, description, permission_level) VALUES ($1, $2, $3)',
                [roleName, `${roleName} role`, level]
            );
            console.log(`Added role: ${roleName}`);
        } else {
            console.log(`Role ${roleName} already exists`);
        }
    }

    await client.end();
}

run().catch(console.error);

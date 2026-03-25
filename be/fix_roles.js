const { Client } = require('pg');

async function fixRoles() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '1',
        database: 'hrmsystem',
    });

    try {
        await client.connect();
        console.log('Connected to database');

        // 1. Update ADMIN role to 'admin' permission level
        const res1 = await client.query(`
      UPDATE roles 
      SET permission_level = 'admin' 
      WHERE role_name = 'ADMIN'
    `);
        console.log('Updated ADMIN role:', res1.rowCount);

        // 2. Update MANAGER role to 'manager' permission level
        const res2 = await client.query(`
      UPDATE roles 
      SET permission_level = 'manager' 
      WHERE role_name = 'MANAGER'
    `);
        console.log('Updated MANAGER role:', res2.rowCount);

        // 3. Update USER role to 'user' permission level
        const res3 = await client.query(`
      UPDATE roles 
      SET permission_level = 'user' 
      WHERE role_name = 'USER'
    `);
        console.log('Updated USER role:', res3.rowCount);

        // Verify
        const resFinal = await client.query('SELECT * FROM roles');
        console.log('Final roles data:', resFinal.rows);

    } catch (err) {
        console.error('Error fixing roles:', err);
    } finally {
        await client.end();
    }
}

fixRoles();

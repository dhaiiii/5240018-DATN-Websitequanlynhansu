import { DataSource } from 'typeorm';

async function checkAndUpdateUserRoles() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: '1',
        database: 'hrmsystem',
    });

    try {
        await dataSource.initialize();
        console.log('Connected to database\n');

        // First, check what tables exist
        const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
        console.log('Tables in database:');
        console.table(tables);

        // Try to find users in the users table (based on entity file)
        console.log('\nQuerying users table...');
        const allUsers = await dataSource.query(`SELECT id, email, role FROM users`);
        console.log('All users in database:');
        console.table(allUsers);

        // Update admin user
        console.log('\nUpdating roles...');
        const adminResult = await dataSource.query(
            `UPDATE users SET role = $1 WHERE email = $2 RETURNING id, email, role`,
            ['admin', 'dohonghai252003@gmail.com']
        );

        if (adminResult && adminResult.length > 0) {
            console.log('✓ Updated dohonghai252003@gmail.com to admin');
        } else {
            console.log('✗ User dohonghai252003@gmail.com not found');
        }

        // Update tung@gmail.com to user role
        const tungResult = await dataSource.query(
            `UPDATE users SET role = $1 WHERE email = $2 RETURNING id, email, role`,
            ['user', 'tung@gmail.com']
        );

        if (tungResult && tungResult.length > 0) {
            console.log('✓ Updated tung@gmail.com to user');
        } else {
            console.log('✗ User tung@gmail.com not found');
        }

        // Update hieu@gmail.com to user role
        const hieuResult = await dataSource.query(
            `UPDATE users SET role = $1 WHERE email = $2 RETURNING id, email, role`,
            ['user', 'hieu@gmail.com']
        );

        if (hieuResult && hieuResult.length > 0) {
            console.log('✓ Updated hieu@gmail.com to user');
        } else {
            console.log('✗ User hieu@gmail.com not found');
        }

        // Show updated users
        console.log('\nUpdated users:');
        const updatedUsers = await dataSource.query(
            `SELECT id, email, role FROM users WHERE email IN ($1, $2, $3)`,
            ['dohonghai252003@gmail.com', 'tung@gmail.com', 'hieu@gmail.com']
        );
        console.table(updatedUsers);

        console.log('\n✅ Role assignment completed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

checkAndUpdateUserRoles();

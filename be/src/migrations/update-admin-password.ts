import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: '1',
    database: 'hrmsystem',
});

async function updateAdminPassword() {
    const email = 'dohonghai252003@gmail.com';
    const newPassword = 'Hai@252003';

    try {
        await dataSource.initialize();
        console.log('Connected to database');

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the user's password
        const result = await dataSource.query(
            'UPDATE users SET password = $1 WHERE email = $2',
            [hashedPassword, email]
        );

        console.log('Password updated successfully for:', email);
        console.log('New password:', newPassword);

        await dataSource.destroy();
    } catch (error) {
        console.error('Error updating password:', error);
        await dataSource.destroy();
        process.exit(1);
    }
}

updateAdminPassword();

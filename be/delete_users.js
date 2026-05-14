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
    try {
        await client.query('BEGIN');

        // Find users
        const res = await client.query(`SELECT id, email FROM "users" WHERE email ILIKE 'user%'`);
        const users = res.rows;

        if (users.length === 0) {
            console.log('Không tìm thấy user nào có email bắt đầu bằng "user"');
        } else {
            console.log(`Tìm thấy ${users.length} users. Đang tiến hành xóa...`);

            const userIds = users.map(u => u.id);
            const emails = users.map(u => u.email);

            console.log('Deleting from timekeeping...');
            await client.query(`DELETE FROM "timekeeping" WHERE "email" = ANY($1::text[])`, [emails]);

            console.log('Deleting from notifications...');
            await client.query(`DELETE FROM "notifications" WHERE "recipient_email" = ANY($1::text[])`, [emails]);

            console.log('Deleting from requests...');
            await client.query(`DELETE FROM "requests" WHERE "email" = ANY($1::text[])`, [emails]);

            console.log('Deleting from payrolls...');
            await client.query(`DELETE FROM "payrolls" WHERE "user_id" = ANY($1::int[])`, [userIds]);

            console.log('Deleting from salary_configs...');
            await client.query(`DELETE FROM "salary_configs" WHERE "user_id" = ANY($1::int[])`, [userIds]);

            console.log('Deleting from users...');
            const del = await client.query(`DELETE FROM "users" WHERE id = ANY($1::int[])`, [userIds]);

            console.log(`Đã xóa thành công ${del.rowCount} users.`);
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Lỗi khi thao tác DB:', error);
    } finally {
        await client.end();
    }
}

run();

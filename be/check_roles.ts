import { createConnection } from 'typeorm';
import { Role } from './src/roles/entities/role.entity';

async function checkRoles() {
    const connection = await createConnection({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: '1',
        database: 'hrmsystem',
        entities: [Role],
    });

    const roles = await connection.getRepository(Role).find();
    console.log(JSON.stringify(roles, null, 2));

    await connection.close();
}

checkRoles().catch(console.error);

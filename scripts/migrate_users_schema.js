require('dotenv').config();
const db = require('../config/database.js');

async function runMigration() {
    console.log('--- Iniciando migración de retos.users ---');
    const geekSchema = process.env.DB_USER_GEEK_SCHEMA || 'geekst';

    const columnsToAdd = [
        { name: 'document_type_id', type: 'VARCHAR(30) NULL' },
        { name: 'document_id', type: 'VARCHAR(50) NULL' },
        { name: 'blood_type_id', type: 'INT NULL' },
        { name: 'email', type: 'VARCHAR(255) NULL' },
        { name: 'username', type: 'VARCHAR(100) NULL' },
        { name: 'first_name', type: 'VARCHAR(100) NULL' },
        { name: 'middle_name', type: 'VARCHAR(100) NULL' },
        { name: 'last_name', type: 'VARCHAR(100) NULL' },
        { name: 'second_last_name', type: 'VARCHAR(100) NULL' },
        { name: 'gender_id', type: 'INT NULL' },
        { name: 'region_id', type: 'INT NULL' },
        { name: 'locality', type: 'TEXT NULL' },
        { name: 'birthday', type: 'DATE NULL' },
        { name: 'avatar', type: 'VARCHAR(255) NULL' },
        { name: 'country_phone_code', type: 'VARCHAR(10) NULL' },
        { name: 'phone_number', type: 'VARCHAR(30) NULL' },
        { name: 'country_emergency_phone_code', type: 'VARCHAR(10) NULL' },
        { name: 'emergency_phone_number', type: 'VARCHAR(30) NULL' },
        { name: 'medical_condition', type: 'TEXT NULL' }
    ];

    try {
        const [existingCols] = await db.promise().query('DESCRIBE `users`');
        const existingColNames = new Set(existingCols.map(c => c.Field.toLowerCase()));

        for (const col of columnsToAdd) {
            if (!existingColNames.has(col.name.toLowerCase())) {
                console.log(`Agregando columna: ${col.name} ${col.type}...`);
                await db.promise().query(`ALTER TABLE \`users\` ADD COLUMN \`${col.name}\` ${col.type}`);
            } else {
                console.log(`Columna ya existe: ${col.name}`);
            }
        }

        console.log('Columnas listas. Copiando datos desde ' + geekSchema + '.users...');
        const populateQuery = `
            UPDATE \`users\` u
            JOIN \`${geekSchema}\`.user_secure_id usi ON usi.secure_id = u.geek_user_id
            JOIN \`${geekSchema}\`.users gu ON gu.user_id = usi.user_id
            SET 
              u.document_type_id = gu.document_type_id,
              u.document_id = gu.document_id,
              u.blood_type_id = gu.blood_type_id,
              u.email = gu.email,
              u.username = gu.username,
              u.first_name = gu.first_name,
              u.middle_name = gu.middle_name,
              u.last_name = gu.last_name,
              u.second_last_name = gu.second_last_name,
              u.gender_id = gu.gender_id,
              u.region_id = gu.region_id,
              u.locality = gu.locality,
              u.birthday = gu.birthday,
              u.avatar = gu.avatar,
              u.country_phone_code = gu.country_phone_code,
              u.phone_number = gu.phone_number,
              u.country_emergency_phone_code = gu.country_emergency_phone_code,
              u.emergency_phone_number = gu.emergency_phone_number,
              u.medical_condition = gu.medical_condition;
        `;
        const [popRes] = await db.promise().query(populateQuery);
        console.log('¡Datos copiados con éxito! Filas actualizadas:', popRes.affectedRows);

        const [samples] = await db.promise().query(
            'SELECT user_id, geek_user_id, first_name, last_name, email, document_id, avatar FROM `users` LIMIT 3'
        );
        console.log('Muestra de usuarios en retos.users:', samples);
        console.log('--- Migración finalizada exitosamente ---');
    } catch (err) {
        console.error('Error durante la migración:', err);
    } finally {
        process.exit(0);
    }
}

runMigration();

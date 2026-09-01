const fs = require('fs');
const mysql = require('mysql2');
require('dotenv').config({ path: __dirname + '/../../.env' });

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'retos'
});

const sqlPath = __dirname + '/sp_remove_sports_team_member.sql';
let rawSql = fs.readFileSync(sqlPath, 'utf8');

// Strip DELIMITER statements for node mysql2 driver
rawSql = rawSql.replace(/DELIMITER\s+\$\$/g, '').replace(/DELIMITER\s+;/g, '').replace(/\$\$/g, '');

const dropStmt = 'DROP PROCEDURE IF EXISTS `sp_remove_sports_team_member`';
const createIndex = rawSql.indexOf('CREATE PROCEDURE') !== -1 ? rawSql.indexOf('CREATE PROCEDURE') : rawSql.indexOf('CREATE DEFINER');
const createStmt = rawSql.substring(createIndex).trim();

db.connect((err) => {
    if (err) {
        console.error('Database connection error:', err);
        process.exit(1);
    }

    db.query(dropStmt, (dropErr) => {
        if (dropErr) {
            console.error('Drop error:', dropErr);
            process.exit(1);
        }
        db.query(createStmt, (createErr) => {
            if (createErr) {
                console.error('Create error:', createErr);
                db.end();
                process.exit(1);
            }
            console.log('SUCCESS: Stored procedure sp_remove_sports_team_member deployed to MySQL DB.');
            db.end();
        });
    });
});

const mysql = require('mysql2');
require('dotenv').config({ path: __dirname + '/../../.env' });

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'retos'
});

db.query("SHOW COLUMNS FROM event_edition_enrolled_users LIKE 'sports_team_id'", (err, res) => {
    if (err) {
        console.error('Error checking column:', err.message);
        db.end();
    } else {
        if (res.length === 0) {
            console.log('Column sports_team_id does not exist, adding it...');
            db.query('ALTER TABLE event_edition_enrolled_users ADD COLUMN sports_team_id INT NULL DEFAULT NULL AFTER event_edition_mode_kit_id', (err2, res2) => {
                if (err2) {
                    console.error('Error adding column:', err2.message);
                } else {
                    console.log('Column sports_team_id added successfully.');
                }
                db.end();
            });
        } else {
            console.log('Column sports_team_id already exists in event_edition_enrolled_users.');
            db.end();
        }
    }
});

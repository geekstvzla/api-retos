const emailModel = require('./models/emails.js');

emailModel.teamMemberRemoved({
    email: 'test@example.com',
    userName: 'Usuario Prueba',
    teamName: 'Equipo de Prueba',
    langId: 1
}).then(res => {
    console.log('Result:', res);
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

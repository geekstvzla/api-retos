require('dotenv').config();
const usersModel = require('../models/users.js');
const emailsModel = require('../models/emails.js');

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        dryRun: false,
        force: false,
        targetDate: null,
        testEmail: null,
        limit: null
    };

    for (const arg of args) {
        if (arg === '--dry-run') {
            options.dryRun = true;
        } else if (arg === '--force') {
            options.force = true;
        } else if (arg.startsWith('--date=')) {
            options.targetDate = arg.split('=')[1];
        } else if (arg.startsWith('--test-email=')) {
            options.testEmail = arg.split('=')[1];
        } else if (arg.startsWith('--limit=')) {
            options.limit = parseInt(arg.split('=')[1], 10);
        } else if (arg === '--help' || arg === '-h') {
            console.log(`
Uso: node ./scripts/send-birthday-emails.js [opciones]

Opciones:
  --dry-run               Simula el proceso sin enviar correos ni escribir en la base de datos.
  --force                 Envía el correo ignorando si ya se le envió previamente este año.
  --date=YYYY-MM-DD       Verifica los cumpleañeros de una fecha específica en lugar de hoy.
  --test-email=correo     Redirige todos los correos generados hacia esta dirección de prueba.
  --limit=N               Limita el envío a máximo N cumpleañeros.
  --help, -h              Muestra esta ayuda.
            `);
            process.exit(0);
        }
    }

    return options;
}

async function runBirthdayEmails(options = {}) {
    const startTime = Date.now();
    const dryRun = Boolean(options.dryRun);
    const force = Boolean(options.force);
    const targetDate = options.targetDate || null;
    const testEmail = options.testEmail || null;
    const limit = options.limit ? parseInt(options.limit, 10) : null;

    const executionDate = targetDate || new Date().toISOString().slice(0, 10);
    console.log('===============================================================');
    console.log(`[CUMPLEAÑOS] Iniciando proceso diario - ${new Date().toISOString()}`);
    console.log(`[CUMPLEAÑOS] Fecha de verificación: ${executionDate}`);
    if (dryRun) console.log('⚠️  MODO SIMULACIÓN (DRY-RUN) ACTIVADO: No se enviarán correos reales.');
    if (force) console.log('⚠️  MODO FORZADO (FORCE) ACTIVADO: Se ignorará el historial de envíos de este año.');
    if (testEmail) console.log(`✉️  REDIRECCIÓN DE PRUEBA: Todos los correos se enviarán a ${testEmail}`);
    console.log('===============================================================');

    await usersModel.ensureBirthdayLogsTable();

    let celebrants = await usersModel.getBirthdayUsersToday({
        targetDate,
        force
    });

    if (limit && limit > 0) {
        celebrants = celebrants.slice(0, limit);
    }

    const summary = {
        success: true,
        executionDate,
        totalFound: celebrants.length,
        totalSent: 0,
        totalFailed: 0,
        totalSkipped: 0,
        details: []
    };

    if (celebrants.length === 0) {
        console.log('[CUMPLEAÑOS] No hay cumpleañeros pendientes para procesar hoy.');
        console.log('===============================================================');
        summary.elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
        return summary;
    }

    console.log(`[CUMPLEAÑOS] Cumpleañeros encontrados para procesar: ${celebrants.length}`);

    for (let i = 0; i < celebrants.length; i++) {
        const user = celebrants[i];
        const recipient = testEmail || user.email;
        const celebrantName = user.display_name || user.first_and_last_name || 'Atleta';
        const progress = `[${i + 1}/${celebrants.length}]`;

        console.log(`\n${progress} Procesando usuario ID ${user.user_id} (${celebrantName} - ${user.email}) | Nacimiento: ${user.birthday}`);

        if (!user.email || !user.email.includes('@')) {
            console.warn(`  ⚠️ Correo inválido omitido: "${user.email}"`);
            summary.totalSkipped++;
            summary.details.push({
                userId: user.user_id,
                email: user.email,
                name: celebrantName,
                status: 'SKIPPED',
                reason: 'Correo inválido'
            });
            continue;
        }

        if (dryRun) {
            console.log(`  [SIMULACIÓN] Se enviaría correo de felicitaciones a ${recipient} para "${celebrantName}"`);
            summary.totalSent++;
            summary.details.push({
                userId: user.user_id,
                email: recipient,
                name: celebrantName,
                status: 'SIMULATED'
            });
            continue;
        }

        try {
            const emailResult = await emailsModel.birthdayCongratulations({
                email: recipient,
                userName: celebrantName,
                fullName: user.full_name || celebrantName,
                firstName: user.first_name,
                lastName: user.last_name,
                langId: 1
            });

            if (emailResult && emailResult.status === 'success') {
                console.log(`  ✅ Correo enviado exitosamente a ${recipient}`);
                await usersModel.logBirthdayEmail({
                    userId: user.user_id,
                    email: user.email,
                    birthday: user.birthday,
                    targetDate,
                    status: 'SENT'
                });
                summary.totalSent++;
                summary.details.push({
                    userId: user.user_id,
                    email: recipient,
                    name: celebrantName,
                    status: 'SENT'
                });
            } else {
                const errMsg = emailResult?.message || 'Error al enviar correo';
                console.error(`  ❌ Error al enviar a ${recipient}: ${errMsg}`);
                await usersModel.logBirthdayEmail({
                    userId: user.user_id,
                    email: user.email,
                    birthday: user.birthday,
                    targetDate,
                    status: 'FAILED',
                    errorMessage: errMsg
                });
                summary.totalFailed++;
                summary.details.push({
                    userId: user.user_id,
                    email: recipient,
                    name: celebrantName,
                    status: 'FAILED',
                    error: errMsg
                });
            }
        } catch (err) {
            console.error(`  ❌ Excepción al enviar a ${recipient}:`, err.message || err);
            await usersModel.logBirthdayEmail({
                userId: user.user_id,
                email: user.email,
                birthday: user.birthday,
                targetDate,
                status: 'FAILED',
                errorMessage: err.message || String(err)
            });
            summary.totalFailed++;
            summary.details.push({
                userId: user.user_id,
                email: recipient,
                name: celebrantName,
                status: 'FAILED',
                error: err.message || String(err)
            });
        }

        // Pequeña pausa entre correos para evitar saturar el servidor SMTP
        if (!dryRun && i < celebrants.length - 1) {
            await new Promise(r => setTimeout(r, 300));
        }
    }

    summary.elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n===============================================================');
    console.log('[CUMPLEAÑOS] Resumen de ejecución:');
    console.log(`  - Cumpleañeros encontrados: ${celebrants.length}`);
    console.log(`  - Correos enviados con éxito: ${summary.totalSent}`);
    console.log(`  - Envíos fallidos:            ${summary.totalFailed}`);
    console.log(`  - Omitidos por datos inválidos: ${summary.totalSkipped}`);
    console.log(`  - Tiempo total de ejecución:  ${summary.elapsedSeconds}s`);
    console.log('===============================================================');

    return summary;
}

async function run() {
    try {
        const options = parseArgs();
        const summary = await runBirthdayEmails(options);
        process.exit(summary.totalFailed > 0 && summary.totalSent === 0 ? 1 : 0);
    } catch (error) {
        console.error('Error al ejecutar send-birthday-emails:', error.message || error);
        process.exit(1);
    }
}

if (require.main === module) {
    run();
}

module.exports = {
    runBirthdayEmails
};

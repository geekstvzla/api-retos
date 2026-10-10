const cron = require('node-cron');
const usersModel = require('../models/users.js');
const emailsModel = require('../models/emails.js');

/**
 * Ejecuta el proceso de envío de correos de cumpleaños
 * @param {Object} options
 * @param {boolean} [options.dryRun=false] - No envía correos reales
 * @param {boolean} [options.force=false] - Ignora si ya se envió este año
 * @param {string} [options.targetDate=null] - Fecha YYYY-MM-DD específica
 * @param {string} [options.testEmail=null] - Redirige a este correo de prueba
 * @param {number} [options.limit=null] - Límite de cumpleañeros a procesar
 */
async function runBirthdayEmails(options = {}) {
    const startTime = Date.now();
    const dryRun = Boolean(options.dryRun);
    const force = Boolean(options.force);
    const targetDate = options.targetDate || null;
    const testEmail = options.testEmail || null;
    const limit = options.limit ? parseInt(options.limit, 10) : null;

    const executionDate = targetDate || new Date().toISOString().slice(0, 10);
    console.log(`[CUMPLEAÑOS] Ejecutando proceso para fecha: ${executionDate} ${dryRun ? '(MODO SIMULACIÓN)' : ''}`);

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
        console.log('[CUMPLEAÑOS] No se encontraron cumpleañeros para la fecha especificada.');
        summary.elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
        return summary;
    }

    for (let i = 0; i < celebrants.length; i++) {
        const user = celebrants[i];
        const recipient = testEmail || user.email;

        if (!user.email || !user.email.includes('@')) {
            console.warn(`[CUMPLEAÑOS] Correo inválido para usuario ID ${user.user_id}: "${user.email}"`);
            summary.totalSkipped++;
            summary.details.push({
                userId: user.user_id,
                email: user.email,
                name: user.display_name,
                status: 'SKIPPED',
                reason: 'Correo inválido'
            });
            continue;
        }

        if (dryRun) {
            console.log(`[CUMPLEAÑOS - DRY RUN] Se enviaría correo a ${recipient} (${user.display_name})`);
            summary.totalSent++;
            summary.details.push({
                userId: user.user_id,
                email: recipient,
                name: user.display_name,
                status: 'SIMULATED'
            });
            continue;
        }

        try {
            const emailResult = await emailsModel.birthdayCongratulations({
                email: recipient,
                userName: user.display_name,
                fullName: user.full_name,
                langId: 1
            });

            if (emailResult && emailResult.status === 'success') {
                console.log(`[CUMPLEAÑOS] ✅ Correo enviado a ${recipient} (${user.display_name})`);
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
                    name: user.display_name,
                    status: 'SENT'
                });
            } else {
                const errMsg = emailResult?.message || 'Error al enviar correo';
                console.error(`[CUMPLEAÑOS] ❌ Error al enviar a ${recipient}: ${errMsg}`);
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
                    name: user.display_name,
                    status: 'FAILED',
                    error: errMsg
                });
            }
        } catch (err) {
            console.error(`[CUMPLEAÑOS] ❌ Excepción al enviar a ${recipient}:`, err.message || err);
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
                name: user.display_name,
                status: 'FAILED',
                error: err.message || String(err)
            });
        }

        // Pequeña pausa entre correos para evitar límites del servidor SMTP
        if (!dryRun && i < celebrants.length - 1) {
            await new Promise(r => setTimeout(r, 300));
        }
    }

    summary.elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[CUMPLEAÑOS] Proceso finalizado en ${summary.elapsedSeconds}s. Enviados: ${summary.totalSent}, Fallidos: ${summary.totalFailed}, Omitidos: ${summary.totalSkipped}`);

    return summary;
}

/**
 * Inicializa el cronjob en el servidor Node.js
 * Ejecuta a las 6:00 AM todos los días (0 6 * * *)
 */
function initCronJobs() {
    if (process.env.ENABLE_BIRTHDAY_CRON === 'false') {
        console.log('[CRON] El cronjob de cumpleaños en Node.js está deshabilitado por ENABLE_BIRTHDAY_CRON=false');
        return;
    }

    const timezone = process.env.CRON_TIMEZONE || 'America/Caracas';
    const cronSchedule = process.env.CRON_BIRTHDAY_SCHEDULE || '0 6 * * *';

    console.log(`[CRON] Programando tarea diaria de cumpleaños a las 06:00 AM (${cronSchedule}) en zona horaria: ${timezone}`);

    cron.schedule(cronSchedule, async () => {
        console.log(`\n===============================================================`);
        console.log(`[CRON EJECUTADO] Iniciando verificación diaria de cumpleañeros a las 06:00 AM`);
        console.log(`===============================================================`);
        try {
            await runBirthdayEmails();
        } catch (error) {
            console.error('[CRON ERROR] Error en la ejecución automática de cumpleaños:', error);
        }
    }, {
        scheduled: true,
        timezone: timezone
    });
}

module.exports = {
    initCronJobs,
    runBirthdayEmails
};

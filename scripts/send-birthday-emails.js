const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { runBirthdayEmails } = require('../services/cron.js');

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

async function main() {
    const options = parseArgs();

    console.log('===============================================================');
    console.log(`[CUMPLEAÑOS CLI] Iniciando verificación manual / por crontab del sistema`);
    if (options.dryRun) console.log('⚠️  MODO SIMULACIÓN (DRY-RUN) ACTIVADO');
    if (options.force) console.log('⚠️  MODO FORZADO (FORCE) ACTIVADO');
    if (options.testEmail) console.log(`✉️  REDIRECCIÓN A: ${options.testEmail}`);
    console.log('===============================================================');

    try {
        const result = await runBirthdayEmails(options);
        console.log('===============================================================');
        console.log('[CUMPLEAÑOS CLI] Resultado:');
        console.log(`  - Cumpleañeros encontrados: ${result.totalFound}`);
        console.log(`  - Enviados exitosamente:    ${result.totalSent}`);
        console.log(`  - Fallidos:                 ${result.totalFailed}`);
        console.log(`  - Omitidos:                 ${result.totalSkipped}`);
        console.log(`  - Duración:                 ${result.elapsedSeconds}s`);
        console.log('===============================================================');
        process.exit(result.totalFailed > 0 && result.totalSent === 0 ? 1 : 0);
    } catch (err) {
        console.error('[CUMPLEAÑOS CLI ERROR] Falló el proceso:', err);
        process.exit(1);
    }
}

main();

require('dotenv').config();
const axios = require('axios');
const generalModel = require('../models/general.js');

const API_URL = 'https://rates.dolarvzla.com/bcv/current.json';

async function run() {
    try {
        console.log('Obteniendo tasa de cambio desde:', API_URL);
        const response = await axios.get(API_URL, { timeout: 15000 });
        const current = response.data && response.data.current ? response.data.current : null;

        if (!current || typeof current.usd !== 'number' || typeof current.eur !== 'number') {
            console.error('Respuesta inválida de la API de tasas:', response.data);
            process.exit(1);
        }

        const rates = {
            usd: Number(current.usd),
            eur: Number(current.eur)
        };

        const result = await generalModel.updateExchangeRate(rates);
        console.log('Actualización completada:', JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error al ejecutar update-exchange-rate:', error.message || error);
        if (error.response) {
            console.error('API response status:', error.response.status);
            console.error('API response data:', error.response.data);
        }
        process.exit(1);
    }
}

run();

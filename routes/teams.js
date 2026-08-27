const express = require('express');
const router = express.Router();
const teamsModel = require('../models/teams.js');

/* GET list of sports teams */
router.get('/get-teams', async function (req, res, next) {

    let params = req.query;
    let data = await teamsModel.getTeams(params);
    res.json(data);

});

/* GET list of sports teams (alias) */
router.get('/', async function (req, res, next) {
    let params = req.query;
    let data = await teamsModel.getTeams(params);
    res.json(data);
});

/* GET team detail by ID */
router.get('/detail/:id', async function (req, res, next) {
    let teamId = req.params.id;
    let data = await teamsModel.getTeamById(teamId);
    res.json(data);
});

/* GET search member by document/cédula */
router.get('/search-member', async function (req, res, next) {

    let documentNumber = req.query.document || req.query.query || req.query.search;
    let data = await teamsModel.searchMember(documentNumber);
    res.json(data);

});

/* POST create new sports team */
router.post('/create-team', async function (req, res, next) {

    let teamData = req.body;
    let logoFile = req.files ? (req.files.logo || req.files.file) : null;
    let data = await teamsModel.createTeam(teamData, logoFile);
    res.json(data);

});

/* POST update sports team */
router.post('/update-team', async function (req, res, next) {
    let teamId = req.body.teamId || req.body.id || req.query.id;
    let teamData = req.body;
    let logoFile = req.files ? (req.files.logo || req.files.file) : null;
    let data = await teamsModel.updateTeam(teamId, teamData, logoFile);
    res.json(data);
});

/* PUT update sports team */
router.put('/update-team', async function (req, res, next) {
    let teamId = req.body.teamId || req.body.id || req.query.id;
    let teamData = req.body;
    let logoFile = req.files ? (req.files.logo || req.files.file) : null;
    let data = await teamsModel.updateTeam(teamId, teamData, logoFile);
    res.json(data);
});

/* GET respond to team invitation */
router.get('/respond-invitation', async function (req, res, next) {
    let teamId = req.query.teamId;
    let userId = req.query.userId;
    let action = req.query.action;
    let token = req.query.token;

    let data = await teamsModel.respondTeamInvitation(teamId, userId, action, token);

    if (req.accepts('html')) {
        const isSuccess = data && data.response && data.response.statusCode === 1;
        const isWarning = data && data.response && data.response.statusCode === 2;
        const message = data && data.response ? data.response.message : 'Respuesta procesada';
        const title = isSuccess ? (action === 'accept' ? '¡Invitación Aceptada!' : 'Invitación Rechazada') : (isWarning ? 'Aviso' : 'Error');
        const icon = isSuccess ? (action === 'accept' ? '🎉' : 'ℹ️') : '⚠️';
        const color = isSuccess ? (action === 'accept' ? '#16a34a' : '#475569') : '#dc2626';

        return res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
                    .card { background: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); padding: 40px; max-width: 480px; width: 100%; text-align: center; }
                    .icon { font-size: 56px; margin-bottom: 16px; }
                    h1 { color: ${color}; font-size: 24px; margin-bottom: 12px; }
                    p { color: #475569; font-size: 16px; line-height: 1.5; margin-bottom: 28px; }
                    .btn { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; transition: background-color 0.2s; }
                    .btn:hover { background-color: #1d4ed8; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon">${icon}</div>
                    <h1>${title}</h1>
                    <p>${message}</p>
                    <a href="${process.env.APP_URL || 'http://localhost'}:${process.env.APP_PORT || '5173'}" class="btn">Volver a la plataforma</a>
                </div>
            </body>
            </html>
        `);
    }

    res.json(data);
});

/* POST respond to team invitation */
router.post('/respond-invitation', async function (req, res, next) {
    let teamId = req.body.teamId || req.query.teamId;
    let userId = req.body.userId || req.query.userId;
    let action = req.body.action || req.query.action;
    let token = req.body.token || req.query.token;

    let data = await teamsModel.respondTeamInvitation(teamId, userId, action, token);
    res.json(data);
});

module.exports = router;

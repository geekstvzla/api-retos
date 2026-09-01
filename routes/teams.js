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
    let currentUserId = req.query.userId || req.query.currentUserId;
    let data = await teamsModel.getTeamById(teamId, currentUserId);
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

/* POST remove member from team */
router.post('/remove-member', async function (req, res, next) {

    let teamId = req.body.teamId || req.body.sportsTeamId || req.query.teamId;
    let requestingUserId = req.body.requestingUserId || req.body.userId || req.query.requestingUserId;
    let targetUserId = req.body.targetUserId || req.body.memberUserId || req.query.targetUserId;

    let data = await teamsModel.removeTeamMember(teamId, requestingUserId, targetUserId);
    res.json(data);

});

module.exports = router;

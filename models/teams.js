require('dotenv').config();
const db = require('../config/database.js');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const emailModel = require('./emails.js');

const INVITATION_SECRET = process.env.INVITATION_SECRET || 'sports_team_invitation_secret_key';

/**
 * Generate invitation HMAC token
 */
const generateInvitationToken = (teamId, userId) => {
    return crypto.createHmac('sha256', INVITATION_SECRET)
        .update(`${teamId}:${userId}`)
        .digest('hex');
};

/**
 * Verify invitation HMAC token
 */
const verifyInvitationToken = (teamId, userId, token) => {
    if (!token) return false;
    try {
        const expected = generateInvitationToken(teamId, userId);
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
    } catch (e) {
        return false;
    }
};


/**
 * Generate slug from string
 */
const slugify = (text) => {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
};

/**
 * Fetch team creator user email & name using schema joins
 */
const getCreatorEmail = (userId) => {
    return new Promise((resolve) => {
        const queryString = `
            SELECT 
                gu.email,
                CONCAT(COALESCE(gu.first_name, ''), ' ', COALESCE(gu.last_name, '')) AS full_name,
                gu.first_name
            FROM users u
            JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.user_secure_id usi ON usi.secure_id = u.geek_user_id
            JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.users gu ON gu.user_id = usi.user_id
            WHERE u.user_id = ? OR u.geek_user_id = ? OR usi.user_id = ?
            LIMIT 1;
        `;
        db.query(queryString, [userId, userId, userId], (err, result) => {
            if (err || !result || result.length === 0) {
                // Fallback attempt: query geekSchema.users directly by user_id
                const fallbackQuery = `SELECT email, CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) AS full_name, first_name FROM \`${process.env.DB_USER_GEEK_SCHEMA}\`.users WHERE user_id = ? LIMIT 1;`;
                db.query(fallbackQuery, [userId], (errFb, resultFb) => {
                    if (errFb || !resultFb || resultFb.length === 0) {
                        resolve(null);
                    } else {
                        resolve(resultFb[0]);
                    }
                });
            } else {
                resolve(result[0]);
            }
        });
    });
};

/**
 * Fetch all system administrators (user_role_id = 1) email & name using schema joins
 */
const getAdminEmails = () => {
    return new Promise((resolve) => {
        const queryString = `
            SELECT 
                gu.email,
                CONCAT(COALESCE(gu.first_name, ''), ' ', COALESCE(gu.last_name, '')) AS full_name,
                gu.first_name
            FROM users u
            JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.user_secure_id usi ON usi.secure_id = u.geek_user_id
            JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.users gu ON gu.user_id = usi.user_id
            WHERE u.user_role_id = 1;
        `;
        db.query(queryString, (err, result) => {
            if (err || !result) {
                console.error('Error fetching admin emails:', err);
                resolve([]);
            } else {
                resolve(result);
            }
        });
    });
};

/**
 * Send email notifications upon sports team creation
 */
const sendTeamCreationNotificationEmails = async (teamName, creatorUserId) => {
    try {
        const creator = await getCreatorEmail(creatorUserId);
        const admins = await getAdminEmails();

        const formattedDate = new Date().toLocaleString('es-VE', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });

        // 1. Send email to creator
        if (creator && creator.email) {
            await emailModel.teamCreatedUser({
                email: creator.email,
                userName: creator.full_name.trim() || creator.first_name || 'Usuario',
                teamName: teamName,
                langId: 1
            }).catch(err => console.error('Error sending team creator email:', err));
        } else {
            console.warn(`No email found for team creator (userId: ${creatorUserId})`);
        }

        // 2. Send email to system admin(s)
        if (admins && admins.length > 0) {
            for (const admin of admins) {
                if (admin.email) {
                    await emailModel.teamCreatedAdmin({
                        email: admin.email,
                        adminName: admin.full_name.trim() || 'Administrador',
                        teamName: teamName,
                        creatorName: creator ? (creator.full_name.trim() || 'Usuario') : 'Usuario',
                        creatorEmail: creator ? (creator.email || 'N/A') : 'N/A',
                        createdAt: formattedDate,
                        langId: 1
                    }).catch(err => console.error('Error sending admin team notification email:', err));
                }
            }
        } else {
            console.warn('No system admin users found to receive notification email.');
        }
    } catch (err) {
        console.error('Error in sendTeamCreationNotificationEmails:', err);
    }
};

/**
 * Fetch pending members (status_id = 2) for a team with user emails
 */
const getPendingTeamMembers = (teamId) => {
    return new Promise((resolve) => {
        const queryString = `
            SELECT 
                stm.sports_team_member_id,
                stm.sports_team_id,
                stm.user_id,
                gu.email,
                CONCAT(COALESCE(gu.first_name, ''), ' ', COALESCE(gu.last_name, '')) AS full_name,
                gu.first_name
            FROM sports_team_members stm
            JOIN users u ON u.user_id = stm.user_id
            JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.user_secure_id usi ON usi.secure_id = u.geek_user_id
            JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.users gu ON gu.user_id = usi.user_id
            WHERE stm.sports_team_id = ? AND stm.status_id = 2;
        `;
        db.query(queryString, [teamId], (err, result) => {
            if (err) {
                console.error('Error fetching pending team members:', err);
                resolve([]);
            } else {
                resolve(result || []);
            }
        });
    });
};

/**
 * Send email invitations to all pending team members (status_id = 2)
 */
const sendTeamMemberInvitationEmails = async (teamId, teamName) => {
    try {
        const pendingMembers = await getPendingTeamMembers(teamId);
        if (!pendingMembers || pendingMembers.length === 0) {
            console.log(`No pending members to invite for team ${teamId}`);
            return;
        }

        const appUrl = process.env.APP_URL || 'http://localhost';

        for (const member of pendingMembers) {
            if (member.email) {
                const token = generateInvitationToken(teamId, member.user_id);
                const acceptUrl = `${appUrl}/teams/respond-invitation?teamId=${teamId}&userId=${member.user_id}&action=accept&token=${token}`;
                const rejectUrl = `${appUrl}/teams/respond-invitation?teamId=${teamId}&userId=${member.user_id}&action=reject&token=${token}`;

                await emailModel.teamInvitation({
                    email: member.email,
                    userName: member.full_name.trim() || member.first_name || 'Deportista',
                    teamName: teamName,
                    acceptUrl: acceptUrl,
                    rejectUrl: rejectUrl,
                    langId: 1
                }).catch(err => console.error(`Error sending invitation email to user ${member.user_id}:`, err));
            } else {
                console.warn(`No email found for pending team member (userId: ${member.user_id})`);
            }
        }
    } catch (err) {
        console.error('Error in sendTeamMemberInvitationEmails:', err);
    }
};

/**
 * Send invitation email to a single target user
 */
const sendUserInvitationEmail = async (teamId, teamName, userId) => {
    try {
        const userQuery = `
            SELECT 
                stm.sports_team_member_id,
                stm.sports_team_id,
                stm.user_id,
                gu.email,
                CONCAT(COALESCE(gu.first_name, ''), ' ', COALESCE(gu.last_name, '')) AS full_name,
                gu.first_name
            FROM sports_team_members stm
            JOIN users u ON u.user_id = stm.user_id
            JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.user_secure_id usi ON usi.secure_id = u.geek_user_id
            JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.users gu ON gu.user_id = usi.user_id
            WHERE stm.sports_team_id = ? AND stm.user_id = ? AND stm.status_id = 2;
        `;

        db.query(userQuery, [teamId, userId], async (err, rows) => {
            if (err || !rows || rows.length === 0) {
                console.warn(`No pending invitation found for user ${userId} in team ${teamId}`);
                return;
            }

            const member = rows[0];
            if (!member.email) {
                console.warn(`No email found for pending team member (userId: ${userId})`);
                return;
            }

            const appUrl = process.env.APP_URL || 'http://localhost';

            const token = generateInvitationToken(teamId, member.user_id);
            const acceptUrl = `${appUrl}/teams/respond-invitation?teamId=${teamId}&userId=${member.user_id}&action=accept&token=${token}`;
            const rejectUrl = `${appUrl}/teams/respond-invitation?teamId=${teamId}&userId=${member.user_id}&action=reject&token=${token}`;

            await emailModel.teamInvitation({
                email: member.email,
                userName: member.full_name.trim() || member.first_name || 'Deportista',
                teamName: teamName,
                acceptUrl: acceptUrl,
                rejectUrl: rejectUrl,
                langId: 1
            }).catch(err => console.error(`Error sending invitation email to user ${member.user_id}:`, err));
        });
    } catch (err) {
        console.error('Error in sendUserInvitationEmail:', err);
    }
};

/**
 * GET List of Sports Teams with Leader & Member counts and location names
 */
const getTeams = (params = {}) => {

    return new Promise((resolve, reject) => {

        let searchQuery = params.search || params.query || '';
        let stateId = params.stateId || null;
        let limit = parseInt(params.limit) || 20;
        let offset = parseInt(params.offset) || 0;

        let whereConditions = [`st.status_id = 1`];
        let queryParams = [];

        if (searchQuery) {

            whereConditions.push(`(
                LOWER(st.name) LIKE ? OR 
                LOWER(st.description) LIKE ? OR 
                LOWER(r_state.description) LIKE ? OR 
                LOWER(r_mun.description) LIKE ? OR 
                LOWER(r_par.description) LIKE ?
            )`);

            const searchTerm = `%${searchQuery.toLowerCase()}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);

        }

        if (stateId) {
            whereConditions.push(`r_state.country_region_id = ?`);
            queryParams.push(stateId);
        }

        let whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        let queryString = `
            SELECT 
                st.sports_team_id AS id,
                st.name,
                st.slug,
                st.description,
                CASE 
                    WHEN st.logo IS NOT NULL AND st.logo != '' 
                    THEN CONCAT('${process.env.API_PUBLIC || ''}/images/teams/', st.logo)
                    ELSE NULL 
                END AS logo,
                st.region_id,
                r_state.country_region_id AS state_id,
                r_mun.country_region_id AS municipality_id,
                r_par.country_region_id AS parish_id,
                COALESCE(r_state.description, 'Carabobo') AS state,
                COALESCE(r_mun.description, 'Valencia') AS municipality,
                COALESCE(r_par.description, 'San José') AS parish,
                (
                    SELECT COUNT(*) 
                    FROM sports_team_members stm 
                    WHERE stm.sports_team_id = st.sports_team_id 
                    AND stm.role_id = 1 
                    AND stm.status_id = 1
                ) AS leadersCount,
                (
                    SELECT COUNT(*) 
                    FROM sports_team_members stm 
                    WHERE stm.sports_team_id = st.sports_team_id 
                    AND stm.status_id = 1
                ) AS membersCount,
                st.created_at
            FROM sports_teams st
            LEFT JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.country_regions r_par ON r_par.country_region_id = st.region_id
            LEFT JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.country_regions r_mun ON r_mun.country_region_id = r_par.parent_region_id
            LEFT JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.country_regions r_state ON r_state.country_region_id = r_mun.parent_region_id
            ${whereClause}
            ORDER BY st.created_at DESC
            LIMIT ? OFFSET ?;
        `;

        queryParams.push(limit, offset);

        db.query(queryString, queryParams, (err, result) => {

            if (err) {

                console.error('Error fetching sports teams:', err);
                resolve({
                    response: {
                        teams: [],
                        status: 'error',
                        statusCode: 0,
                        message: 'Error al consultar equipos deportivos',
                        error: err.message
                    }
                });

            } else {

                resolve({
                    response: {
                        teams: result || [],
                        status: 'success',
                        statusCode: 1
                    }
                });

            }

        });

    }).catch((error) => error);

};
/**
 * GET Team details by ID with list of Leaders & Members
 */
const getTeamById = (teamId, currentUserId = null) => {
    return new Promise((resolve, reject) => {
        let queryString = `
            SELECT 
                st.sports_team_id AS id,
                st.name,
                st.slug,
                st.description,
                CASE 
                    WHEN st.logo IS NOT NULL AND st.logo != '' 
                    THEN CONCAT('${process.env.API_PUBLIC || ''}/images/teams/', st.logo)
                    ELSE NULL 
                END AS logo,
                st.region_id,
                r_state.country_region_id AS state_id,
                r_mun.country_region_id AS municipality_id,
                r_par.country_region_id AS parish_id,
                r_state.description AS state,
                r_mun.description AS municipality,
                r_par.description AS parish,
                st.created_by_user_id,
                st.status_id,
                st.created_at
            FROM sports_teams st
            LEFT JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.country_regions r_par ON r_par.country_region_id = st.region_id
            LEFT JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.country_regions r_mun ON r_mun.country_region_id = r_par.parent_region_id
            LEFT JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.country_regions r_state ON r_state.country_region_id = r_mun.parent_region_id
            WHERE st.sports_team_id = ? AND st.status_id = 1;
        `;

        db.query(queryString, [teamId], (err, teamResult) => {
            if (err || !teamResult || teamResult.length === 0) {
                resolve({
                    response: {
                        team: null,
                        status: 'error',
                        statusCode: 0,
                        message: 'Equipo deportivo no encontrado'
                    }
                });
                return;
            }

            const team = teamResult[0];

            // Mapear geek_user_id al user_id real de la tabla users
            const resolveUserQuery = `
                SELECT user_id FROM users 
                WHERE geek_user_id = ? OR user_id = ? 
                LIMIT 1;
            `;

            db.query(resolveUserQuery, [currentUserId, currentUserId], (errUser, userResult) => {
                const realUserId = (userResult && userResult.length > 0) ? userResult[0].user_id : null;

                let membersQuery = `
                    SELECT 
                        stm.sports_team_member_id,
                        stm.user_id,
                        stm.role_id,
                        stm.status_id,
                        COALESCE(str.description, CASE WHEN stm.role_id = 1 THEN 'Líder' ELSE 'Miembro' END) AS role_name,
                        CONCAT(COALESCE(gu.first_name, 'Usuario'), ' ', COALESCE(gu.last_name, '')) AS name,
                        COALESCE(gu.document_id, '') AS document,
                        COALESCE(gu.username, '') AS username,
                        gu.avatar,
                        gu.email
                    FROM sports_team_members stm
                    LEFT JOIN users u ON u.user_id = stm.user_id
                    LEFT JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.user_secure_id usi ON usi.secure_id = u.geek_user_id
                    LEFT JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.users gu ON gu.user_id = usi.user_id
                    LEFT JOIN sports_team_roles str ON str.role_id = stm.role_id
                    WHERE stm.sports_team_id = ? AND stm.status_id = 1;
                `;

                db.query(membersQuery, [teamId], (errMembers, membersResult) => {
                    let rawMembers = membersResult || [];

                    const isMember = realUserId ? (
                        Number(team.created_by_user_id) === Number(realUserId) ||
                        rawMembers.some((m) => Number(m.user_id) === Number(realUserId))
                    ) : false;

                    const processedMembers = rawMembers.map((m) => {
                        return {
                            ...m,
                            document: isMember ? m.document : null
                        };
                    });

                    team.members = processedMembers;
                    team.leaders = processedMembers.filter((m) => m.role_id === 1);

                    resolve({
                        response: {
                            team,
                            status: 'success',
                            statusCode: 1
                        }
                    });
                });
            });
        });
    }).catch((error) => error);
};

/**
 * Search user/leader by document (cédula), username, or email
 */
const searchMember = (documentNumber) => {

    return new Promise((resolve, reject) => {

        if (!documentNumber) {

            resolve({
                response: {
                    user: null,
                    status: 'error',
                    statusCode: 0,
                    message: 'Debe ingresar un número de cédula'
                }
            });

            return;

        }

        const queryVal = `%${documentNumber.trim().toLowerCase()}%`;
        const queryString = `
            SELECT 
                u2.user_id AS id,
                CONCAT(COALESCE(u.first_name, 'Usuario'), ' ', COALESCE(u.last_name, '')) AS name,
                COALESCE(u.document_id, ?) AS document,
                u.username,
                u.email,
                u.avatar
            FROM users u2
                JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.user_secure_id usi ON usi.secure_id = u2.geek_user_id
                JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.users u ON u.user_id = usi.user_id
            WHERE LOWER(u.document_id) LIKE ? 
               OR LOWER(u.username) LIKE ? 
               OR LOWER(u.email) LIKE ?
               OR LOWER(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) LIKE ?
            LIMIT 10;
        `;

        db.query(queryString, [documentNumber, queryVal, queryVal, queryVal, queryVal], (err, result) => {

            if (err || !result || result.length === 0) {

                // Return a mock leader format if user not in legacy user table for test preview
                resolve({
                    response: {
                        user: {
                            id: Date.now(),
                            name: `Líder (${documentNumber})`,
                            document: documentNumber,
                            username: `lider_${documentNumber}`
                        },
                        users: [],
                        status: 'success',
                        statusCode: 1
                    }
                });

            } else {

                resolve({
                    response: {
                        user: result[0],
                        users: result,
                        status: 'success',
                        statusCode: 1
                    }
                });

            }

        });

    }).catch((error) => error);

};

/**
 * CREATE a new Sports Team
 */
const createTeam = (teamData, logoFile = null) => {

    return new Promise((resolve, reject) => {

        const name = teamData.name ? teamData.name.trim() : '';
        const regionId = parseInt(teamData.parishId) || 0;
        const userId = parseInt(teamData.userId) || 1;

        let members = teamData.members || [];
        if (typeof members !== 'string') {
            members = JSON.stringify(members);
        }

        const slug = slugify(name);
        let logoName = null;

        if (logoFile) {
            const fileExt = path.extname(logoFile.name) || '.png';
            logoName = `logo${fileExt}`;
        }

        const params = [
            name,
            slug,
            logoName,
            regionId,
            userId,
            members
        ];

        const queryString = `CALL sp_create_sports_team(?,?,?,?,?,?,@response);`;

        db.query(queryString, params, (err, result) => {
            if (err) {
                console.error('Error executing stored procedure sp_create_sports_team:', err);
                resolve({
                    response: {
                        status: 'error',
                        statusCode: 0,
                        message: 'Error al crear el equipo deportivo',
                        error: err.message
                    }
                });
                return;
            }

            db.query('SELECT @response as response', (err2, result2) => {
                if (err2 || !result2 || !result2[0] || !result2[0].response) {
                    resolve({
                        response: {
                            status: 'error',
                            statusCode: 0,
                            message: 'Error al obtener la respuesta del procedimiento almacenado',
                            error: err2 ? (err2.message || err2) : 'Respuesta vacía'
                        }
                    });
                    return;
                }

                try {

                    const outputParam = JSON.parse(result2[0].response);

                    // Si el procedimiento almacenado fue exitoso y retorna teamId, creamos la subcarpeta y guardamos el logo
                    const responseBody = outputParam.response || {};
                    const teamId = responseBody.teamId;
                    const statusCode = responseBody.statusCode;

                    if (statusCode === 1 || responseBody.status === 'success') {
                        // Enviar notificaciones por correo electrónico al creador y al/los administrador(es) del sistema
                        sendTeamCreationNotificationEmails(name, userId);

                        // Enviar correos de invitación a cada miembro (excepto el creador que ya está en status 1)
                        if (teamId) {
                            sendTeamMemberInvitationEmails(teamId, name);
                        }

                        if (logoFile && teamId) {
                            try {
                                const teamDir = path.join(__dirname, '../public/images/teams', teamId.toString());

                                if (!fs.existsSync(teamDir)) {
                                    fs.mkdirSync(teamDir, { recursive: true });
                                }

                                const fileExt = path.extname(logoFile.name) || '.png';
                                const uploadPath = path.join(teamDir, `logo${fileExt}`);

                                logoFile.mv(uploadPath, (err) => {
                                    if (err) console.error('Error saving logo file:', err);
                                });
                            } catch (errUpload) {
                                console.error('Error handling upload:', errUpload);
                            }
                        }
                    }

                    resolve(outputParam);
                } catch (parseErr) {
                    resolve({
                        response: {
                            status: 'error',
                            statusCode: 0,
                            message: 'Error al procesar la respuesta del procedimiento almacenado',
                            error: parseErr.message
                        }
                    });
                }
            });
        });
    }).catch((error) => error);
};

/**
 * UPDATE an existing Sports Team
 */
const updateTeam = (teamId, teamData, logoFile = null) => {
    return new Promise((resolve, reject) => {
        if (!teamId) {
            resolve({
                response: {
                    status: 'error',
                    statusCode: 0,
                    message: 'ID de equipo no especificado'
                }
            });
            return;
        }

        const name = teamData.name ? teamData.name.trim() : null;
        const description = teamData.description ? teamData.description.trim() : null;
        const stateId = teamData.stateId ? parseInt(teamData.stateId) : null;
        const municipalityId = teamData.municipalityId ? parseInt(teamData.municipalityId) : null;
        const parishId = teamData.parishId ? parseInt(teamData.parishId) : null;
        const statusId = teamData.statusId ? parseInt(teamData.statusId) : 1;

        let logoName = null;
        if (logoFile) {
            try {
                const uploadDir = path.join(__dirname, '../public/images/teams');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                const fileExt = path.extname(logoFile.name) || '.png';
                logoName = `team_${teamId}_${Date.now()}${fileExt}`;
                const uploadPath = path.join(uploadDir, logoName);
                logoFile.mv(uploadPath, (err) => {
                    if (err) console.error('Error saving logo file:', err);
                });
            } catch (errUpload) {
                console.error('Error handling upload:', errUpload);
            }
        }

        let updateFields = [];
        let queryParams = [];

        if (name) {
            updateFields.push(`name = ?`, `slug = ?`);
            queryParams.push(name, slugify(name));
        }
        if (description !== null) {
            updateFields.push(`description = ?`);
            queryParams.push(description);
        }
        if (stateId) {
            updateFields.push(`state_id = ?`);
            queryParams.push(stateId);
        }
        if (municipalityId) {
            updateFields.push(`municipality_id = ?`);
            queryParams.push(municipalityId);
        }
        if (parishId) {
            updateFields.push(`parish_id = ?`);
            queryParams.push(parishId);
        }
        if (logoName) {
            updateFields.push(`logo = ?`);
            queryParams.push(logoName);
        }
        if (statusId) {
            updateFields.push(`status_id = ?`);
            queryParams.push(statusId);
        }

        if (updateFields.length === 0) {
            resolve({
                response: {
                    status: 'success',
                    statusCode: 1,
                    message: 'Sin cambios requeridos'
                }
            });
            return;
        }

        queryParams.push(teamId);

        const updateQuery = `
            UPDATE sports_teams 
            SET ${updateFields.join(', ')}, updated_at = NOW()
            WHERE sports_team_id = ?;
        `;

        db.query(updateQuery, queryParams, (err, result) => {
            if (err) {
                console.error('Error updating team:', err);
                resolve({
                    response: {
                        status: 'error',
                        statusCode: 0,
                        message: 'Error al actualizar el equipo deportivo',
                        error: err.message
                    }
                });
            } else {
                resolve({
                    response: {
                        status: 'success',
                        statusCode: 1,
                        message: 'Equipo deportivo actualizado exitosamente'
                    }
                });
            }
        });
    }).catch((error) => error);
};

/**
 * Respond to team invitation (accept: status_id = 1, reject: status_id = 3) via Stored Procedure
 */
const respondTeamInvitation = (teamId, userId, action, token = null) => {

    return new Promise((resolve) => {

        if (!teamId || !userId || !action) {

            return resolve({
                response: {
                    status: 'error',
                    statusCode: 0,
                    message: 'Parámetros requeridos faltantes'
                }
            });

        }

        if (token && !verifyInvitationToken(teamId, userId, token)) {

            return resolve({

                response: {
                    status: 'error',
                    statusCode: 0,
                    message: 'Token de seguridad inválido o alterado'
                }

            });

        }

        const params = [
            teamId,
            userId,
            action
        ];

        const queryString = `CALL sp_respond_sports_team_invitation(?,?,?,@response);`;

        db.query(queryString, params, (err, result) => {

            if (err) {
                console.error('Error executing stored procedure sp_respond_sports_team_invitation:', err);
                return resolve({
                    response: {
                        status: 'error',
                        statusCode: 0,
                        message: 'Error al procesar la respuesta de la invitación',
                        error: err.message
                    }
                });
            }

            db.query('SELECT @response as response', (err2, result2) => {

                if (err2 || !result2 || !result2[0] || !result2[0].response) {
                    return resolve({
                        response: {
                            status: 'error',
                            statusCode: 0,
                            message: 'Error al obtener la respuesta del procedimiento almacenado',
                            error: err2 ? (err2.message || err2) : 'Respuesta vacía'
                        }
                    });
                }

                try {
                    const outputParam = JSON.parse(result2[0].response);
                    resolve(outputParam);
                } catch (parseErr) {
                    resolve({
                        response: {
                            status: 'error',
                            statusCode: 0,
                            message: 'Error al procesar la respuesta del procedimiento almacenado',
                            error: parseErr.message
                        }
                    });
                }

            });

        });
    }).catch((error) => error);
};

/**
 * Send email notification when a member is removed from a sports team
 */
const sendMemberRemovedNotificationEmail = async (teamId, userId) => {
    try {
        const teamRes = await getTeamById(teamId);
        const teamName = teamRes?.response?.team?.name || 'Equipo Deportivo';

        const userQuery = `
            SELECT 
                gu.email,
                CONCAT(COALESCE(gu.first_name, ''), ' ', COALESCE(gu.last_name, '')) AS full_name,
                gu.first_name
            FROM users u
            JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.user_secure_id usi ON usi.secure_id = u.geek_user_id
            JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.users gu ON gu.user_id = usi.user_id
            WHERE u.user_id = ? OR u.geek_user_id = ?;
        `;

        db.query(userQuery, [userId, userId], (err, rows) => {
            if (!err && rows && rows.length > 0) {
                const user = rows[0];
                if (user.email) {
                    emailModel.teamMemberRemoved({
                        email: user.email,
                        userName: user.full_name.trim() || user.first_name || 'Deportista',
                        teamName: teamName,
                        langId: 1
                    }).catch(errEmail => console.error('Error sending member removed email:', errEmail));
                }
            }
        });
    } catch (err) {
        console.error('Error in sendMemberRemovedNotificationEmail:', err);
    }
};

/**
 * REMOVE member from sports team via Stored Procedure
 */
const removeTeamMember = (teamId, requestingUserId, targetUserId) => {

    return new Promise((resolve) => {

        if (!teamId || !requestingUserId || !targetUserId) {

            return resolve({
                response: {
                    status: 'error',
                    statusCode: 0,
                    message: 'Parámetros requeridos faltantes'
                }
            });

        }

        // Mapear requestingUserId y targetUserId (geek_user_id -> user_id de la tabla users)
        const resolveUsersQuery = `
            SELECT user_id, geek_user_id 
            FROM users 
            WHERE geek_user_id = ?;
        `;

        db.query(resolveUsersQuery, [requestingUserId], (errMap, userRows) => {

            let mappedReqId = parseInt(userRows && userRows[0] ? userRows[0].user_id : requestingUserId);
            let mappedTargetId = parseInt(targetUserId);

            if (userRows && userRows.length > 0) {

                const reqRow = userRows.find(u => Number(u.user_id) === Number(requestingUserId) || Number(u.geek_user_id) === Number(requestingUserId));
                if (reqRow) mappedReqId = reqRow.user_id;

                const targetRow = userRows.find(u => Number(u.user_id) === Number(targetUserId) || Number(u.geek_user_id) === Number(targetUserId));
                if (targetRow) mappedTargetId = targetRow.user_id;
            }

            const params = [
                parseInt(teamId),
                mappedReqId,
                mappedTargetId
            ];

            const queryString = `CALL sp_remove_sports_team_member(?,?,?,@response);`;

            db.query(queryString, params, (err, result) => {
                if (err) {
                    console.error('Error executing stored procedure sp_remove_sports_team_member:', err);
                    return resolve({
                        response: {
                            status: 'error',
                            statusCode: 0,
                            message: 'Error al procesar la eliminación del miembro del equipo',
                            error: err.message
                        }
                    });
                }

                db.query('SELECT @response as response', (err2, result2) => {
                    if (err2 || !result2 || !result2[0] || !result2[0].response) {
                        return resolve({
                            response: {
                                status: 'error',
                                statusCode: 0,
                                message: 'Error al obtener la respuesta del procedimiento almacenado',
                                error: err2 ? (err2.message || err2) : 'Respuesta vacía'
                            }
                        });
                    }

                    try {
                        const outputParam = JSON.parse(result2[0].response);
                        if (outputParam && outputParam.response && (outputParam.response.statusCode === 1 || outputParam.response.status === 'success')) {
                            sendMemberRemovedNotificationEmail(teamId, mappedTargetId);
                        }
                        resolve(outputParam);
                    } catch (parseErr) {
                        resolve({
                            response: {
                                status: 'error',
                                statusCode: 0,
                                message: 'Error al procesar la respuesta del procedimiento almacenado',
                                error: parseErr.message
                            }
                        });
                    }
                });
            });
        });
    }).catch((error) => error);
};

/**
 * ADD member to sports team
 */
const addTeamMember = (teamId, requestingUserId, targetUserId, isLeader = false) => {
    return new Promise((resolve) => {
        if (!teamId || !requestingUserId || !targetUserId) {
            return resolve({
                response: {
                    status: 'error',
                    statusCode: 0,
                    message: 'Parámetros requeridos faltantes'
                }
            });
        }

        const resolveUsersQuery = `
            SELECT user_id, geek_user_id, document_id 
            FROM users 
            WHERE user_id IN (?, ?) OR geek_user_id IN (?, ?) OR document_id IN (?, ?);
        `;

        db.query(resolveUsersQuery, [requestingUserId, targetUserId, requestingUserId, targetUserId, requestingUserId, targetUserId], (errMap, userRows) => {
            let mappedReqId = parseInt(requestingUserId);
            let mappedTargetId = parseInt(targetUserId);

            if (userRows && userRows.length > 0) {
                const reqRow = userRows.find(u => Number(u.user_id) === Number(requestingUserId) || Number(u.geek_user_id) === Number(requestingUserId) || String(u.document_id) === String(requestingUserId));
                if (reqRow) mappedReqId = reqRow.user_id;

                const targetRow = userRows.find(u => Number(u.user_id) === Number(targetUserId) || Number(u.geek_user_id) === Number(targetUserId) || String(u.document_id) === String(targetUserId));
                if (targetRow) mappedTargetId = targetRow.user_id;
            }

            if (!mappedTargetId || isNaN(mappedTargetId)) {
                return resolve({
                    response: {
                        status: 'error',
                        statusCode: 0,
                        message: 'Usuario no encontrado en la plataforma'
                    }
                });
            }

            const checkQuery = `
                SELECT sports_team_member_id, status_id FROM sports_team_members 
                WHERE sports_team_id = ? AND user_id = ?;
            `;

            db.query(checkQuery, [teamId, mappedTargetId], (errCheck, checkRows) => {
                if (errCheck) {
                    console.error('Error checking team member:', errCheck);
                    return resolve({
                        response: {
                            status: 'error',
                            statusCode: 0,
                            message: 'Error al verificar la pertenencia al equipo'
                        }
                    });
                }

                if (checkRows && checkRows.length > 0) {
                    const existing = checkRows[0];
                    if (existing.status_id === 3) {
                        const updateMemberQuery = `
                            UPDATE sports_team_members 
                            SET status_id = 2, role_id = ?, updated_at = NOW() 
                            WHERE sports_team_member_id = ?;
                        `;
                        db.query(updateMemberQuery, [isLeader ? 1 : 2, existing.sports_team_member_id], (errUpd) => {
                            if (errUpd) {
                                return resolve({
                                    response: {
                                        status: 'error',
                                        statusCode: 0,
                                        message: 'Error al reincorporar el miembro'
                                    }
                                });
                            }
                            getTeamById(teamId).then((teamRes) => {
                                const teamName = teamRes?.response?.team?.name || 'Equipo Deportivo';
                                sendUserInvitationEmail(teamId, teamName, mappedTargetId);
                            }).catch(() => {});

                            return resolve({
                                response: {
                                    status: 'success',
                                    statusCode: 1,
                                    message: 'Invitación enviada exitosamente. El usuario debe aceptar la invitación para aparecer en el listado de miembros del equipo.'
                                }
                            });
                        });
                        return;
                    } else if (existing.status_id === 2) {
                        // El usuario ya tiene una invitación pendiente -> Reenviar correo de invitación SOLO a este usuario
                        getTeamById(teamId).then((teamRes) => {
                            const teamName = teamRes?.response?.team?.name || 'Equipo Deportivo';
                            sendUserInvitationEmail(teamId, teamName, mappedTargetId);
                        }).catch(() => {});

                        return resolve({
                            response: {
                                status: 'success',
                                statusCode: 1,
                                message: 'Se ha reenviado la invitación al deportista. Debe aceptar la invitación para aparecer en el listado de miembros del equipo.'
                            }
                        });
                    } else if (existing.status_id === 1) {
                        return resolve({
                            response: {
                                status: 'error',
                                statusCode: 0,
                                message: 'El deportista ya forma parte activa de este equipo.'
                            }
                        });
                    }
                }

                const roleId = isLeader ? 1 : 2;
                const statusId = 2; // Pendiente invitación

                const insertQuery = `
                    INSERT INTO sports_team_members (
                        sports_team_id, user_id, role_id, status_id, joined_at, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, NOW(), NOW(), NOW());
                `;

                db.query(insertQuery, [teamId, mappedTargetId, roleId, statusId], (errIns) => {
                    if (errIns) {
                        console.error('Error inserting team member:', errIns);
                        return resolve({
                            response: {
                                status: 'error',
                                statusCode: 0,
                                message: 'Error al agregar el miembro al equipo'
                            }
                        });
                    }

                    getTeamById(teamId).then((teamRes) => {
                        const teamName = teamRes?.response?.team?.name || 'Equipo Deportivo';
                        sendUserInvitationEmail(teamId, teamName, mappedTargetId);
                    }).catch(() => {});

                    return resolve({
                        response: {
                            status: 'success',
                            statusCode: 1,
                            message: 'Invitación enviada exitosamente. El usuario debe aceptar la invitación para aparecer en el listado de miembros del equipo.'
                        }
                    });
                });
            });
        });
    }).catch((error) => error);
};

/**
 * CHANGE member role in sports team (1 = Leader, 2 = Member)
 */
const changeMemberRole = (teamId, requestingUserId, targetUserId, isLeader) => {
    return new Promise((resolve) => {
        if (!teamId || !requestingUserId || !targetUserId) {
            return resolve({
                response: {
                    status: 'error',
                    statusCode: 0,
                    message: 'Parámetros requeridos faltantes'
                }
            });
        }

        const newRoleId = isLeader ? 1 : 2;

        const updateQuery = `
            UPDATE sports_team_members 
            SET role_id = ?, updated_at = NOW() 
            WHERE sports_team_id = ? AND user_id = ?;
        `;

        db.query(updateQuery, [newRoleId, teamId, targetUserId], (err, result) => {
            if (err) {
                console.error('Error changing member role:', err);
                return resolve({
                    response: {
                        status: 'error',
                        statusCode: 0,
                        message: 'Error al actualizar el rol del miembro'
                    }
                });
            }

            return resolve({
                response: {
                    status: 'success',
                    statusCode: 1,
                    message: `Rol actualizado a ${isLeader ? 'Líder' : 'Miembro'} exitosamente`
                }
            });
        });
    }).catch((error) => error);
};

module.exports = {
    addTeamMember,
    changeMemberRole,
    createTeam,
    getTeamById,
    getTeams,
    removeTeamMember,
    respondTeamInvitation,
    searchMember,
    updateTeam
};



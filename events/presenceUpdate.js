const { Events } = require('discord.js');
const { client } = require('../config/client');
const axios = require('axios');
const logger = require('../config/logger');
const chalk = require('chalk');

const activeSessions = new Map();

async function loadActiveSessions() {
    try {
        const apiBase = process.env.API_URL || process.env.API_BASE_URL || 'http://localhost:5500';
        const apiKey = process.env.API_KEY || process.env.BOT_API_KEY;
        const headers = apiKey ? { 'x-api-key': apiKey } : {};

        const response = await axios.get(`${apiBase.replace(/\/$/, '')}/api/bot/game_sessions/list/${client.guilds.cache.first()?.id}?limit=100`, {
            headers,
            timeout: 10000
        });

        if (response.data && Array.isArray(response.data)) {
            const now = new Date();
            let loaded = 0;

            for (const session of response.data) {
                const endedAt = new Date(session.ended_at);
                const minutesAgo = (now - endedAt) / (1000 * 60);

                if (minutesAgo < 30 && !activeSessions.has(session.user_id)) {
                    const startTime = new Date(endedAt.getTime() - (session.duration_minutes * 60 * 1000));
                    activeSessions.set(session.user_id, startTime);
                    loaded++;
                }
            }

            if (loaded > 0) {
                logger.info(`${chalk.green.bold('[PRESENCE]')} ${loaded} sessões ativas carregadas do banco`);
            }
        }
    } catch (error) {
        logger.warn(`${chalk.yellow.bold('[PRESENCE]')} Não foi possível carregar sessões ativas: ${error.message}`);
    }
}

async function detectCurrentlyPlayingUsers() {
    logger.info(`${chalk.yellow.bold('[PRESENCE]')} Sistema de monitoramento de presença hibernado`);
    logger.info(`${chalk.yellow.bold('[PRESENCE]')} Será reativado quando o problema de status do Legacy for resolvido`);
} 

client.on(Events.PresenceUpdate, async (oldPresence, newPresence) => {
    // Atualizar status em tempo real quando houver mudança
    if (newPresence && newPresence.user && !newPresence.user.bot) {
        try {
            const apiBase = process.env.API_URL || process.env.API_BASE_URL || 'http://localhost:5500';
            const apiKey = process.env.API_KEY || process.env.BOT_API_KEY;
            
            if (apiKey) {
                const oldStatus = oldPresence?.status || 'offline';
                const newStatus = newPresence.status || 'offline';
                
                // Só atualizar se o status realmente mudou
                if (oldStatus !== newStatus) {
                    await axios.post(
                        `${apiBase.replace(/\/$/, '')}/api/bot/user_status/batch`,
                        {
                            users: [{
                                userId: newPresence.user.id,
                                status: newStatus
                            }]
                        },
                        {
                            headers: { 'x-api-key': apiKey },
                            timeout: 5000
                        }
                    );
                }
            }
        } catch (error) {
            // Silenciar erros de atualização de status para não poluir logs
            if (!error.message.includes('ECONNREFUSED')) {
                logger.debug(`Erro ao atualizar status: ${error.message}`);
            }
        }
    }
});

async function saveGameSession(userId, guildId, startedAt, endedAt, durationMinutes) {
    try {
        const apiBase = process.env.API_URL || process.env.API_BASE_URL || 'http://localhost:5500';
        const apiKey = process.env.API_KEY || process.env.BOT_API_KEY;

        const payload = {
            user_id: userId,
            guild_id: guildId,
            game_name: 'LGC - LEGACY ROLEPLAY',
            started_at: startedAt.toISOString(),
            ended_at: endedAt.toISOString(),
            duration_minutes: durationMinutes
        };

        const headers = apiKey ? { 'x-api-key': apiKey } : {};

        const response = await axios.post(`${apiBase.replace(/\/$/, '')}/api/bot/game_sessions/add`, payload, {
            headers,
            timeout: 10000
        });

        if (response.status === 200 && response.data.id) {
            logger.info(`${chalk.green.bold('[PRESENCE]')} Sessão salva com ID: ${response.data.id}`);
        } else {
            logger.warn(`${chalk.yellow.bold('[PRESENCE]')} Resposta inesperada da API: ${response.status}`);
        }

    } catch (error) {
        logger.error(`${chalk.red.bold('[PRESENCE]')} Erro ao salvar sessão: ${error.message}`);
        if (error.response) {
            logger.error(`${chalk.red.bold('[PRESENCE]')} Status: ${error.response.status}, Dados: ${JSON.stringify(error.response.data)}`);
        }
    }
}

module.exports = {
    name: Events.PresenceUpdate,
    once: false,
    execute: async (oldPresence, newPresence) => {
    },
    loadActiveSessions,
    detectCurrentlyPlayingUsers
};
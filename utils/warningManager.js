const api = require('apiClient');
const { client } = require('../config/client');
const logger = require('../config/logger');
const chalk = require('chalk');

const WARNING_ROLES = {
    1: '1446613392826564658',
    2: '1446613446639751189',
    3: '1446613483402821794'
};

class WarningManager {
    static async checkExpiredWarnings() {
        try {
            let expiredWarnings = [];
            try {
                expiredWarnings = await api.get('/bot/warnings/expired');
            } catch (err) {
                logger.error(`${chalk.red.bold(`[WARNING MANAGER]`)} Erro ao obter advertências expiradas via API: ${err}`);
                return;
            }
            
            if (expiredWarnings.length > 0) {
                for (const warning of expiredWarnings) {
                    await this.processExpiredWarning(warning);
                }

                try {
                    await api.post('/bot/warnings/expire');
                } catch (err) {
                    logger.error(`${chalk.red.bold(`[WARNING MANAGER]`)} Erro ao marcar advertências como expiradas: ${err}`);
                    return;
                }
                logger.info(`${chalk.yellow.bold(`[WARNING MANAGER]`)} ${expiredWarnings.length} advertências expiradas processadas`);
            }
            
        } catch (error) {
            logger.error(`${chalk.red.bold(`[WARNING MANAGER]`)} Erro ao verificar advertências expiradas: ${error}`);
        }
    }

    static async processExpiredWarning(warning) {
        try {
            const guild = client.guilds.cache.get(warning.guild_id);
            if (!guild) return;

            const member = await guild.members.fetch(warning.user_id).catch(() => null);
            if (!member) return;

            let allActiveWarnings = [];
            try {
                allActiveWarnings = await api.get(`/bot/warnings/active/${warning.user_id}/${warning.guild_id}`);
            } catch (err) {
                logger.error(`${chalk.red.bold(`[WARNING MANAGER]`)} Erro ao obter advertências ativas: ${err}`);
                return;
            }
            const remainingWarnings = allActiveWarnings.filter(w => w.id !== warning.id);
            
            const currentLevel = allActiveWarnings.length;
            if (WARNING_ROLES[currentLevel]) {
                const currentRole = guild.roles.cache.get(WARNING_ROLES[currentLevel]);
                if (currentRole && member.roles.cache.has(currentRole.id)) {
                    await member.roles.remove(currentRole);
                }
            }

            const newLevel = remainingWarnings.length;
            if (newLevel > 0 && WARNING_ROLES[newLevel]) {
                const newRole = guild.roles.cache.get(WARNING_ROLES[newLevel]);
                if (newRole && !member.roles.cache.has(newRole.id)) {
                    await member.roles.add(newRole);
                }
            }

            logger.info(`${chalk.yellow.bold(`[WARNING MANAGER]`)} Advertência expirada: ${member.user.tag} - Nível atualizado para ADV${newLevel}`);

        } catch (error) {
            logger.error(`${chalk.red.bold(`[WARNING MANAGER]`)} Erro ao processar advertência expirada: ${error}`);
        }
    }

    static startMonitoring() {
        this.checkExpiredWarnings();
        
        setInterval(() => {
            this.checkExpiredWarnings();
        }, 5 * 60 * 1000);

        logger.info(`${chalk.green.bold(`[WARNING MANAGER]`)} Sistema de monitoramento de advertências iniciado!`)
    }
}

module.exports = WarningManager;
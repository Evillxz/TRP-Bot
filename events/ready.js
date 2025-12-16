const { Events, ActivityType } = require('discord.js');
const packageJson = require('../package.json');
const { initializeStatusSync } = require('../utils/statusSync');
const { invalidateServerDataCache } = require('../utils/wsClient');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client, context) { 
        const { chalk, logger } = context;

        logger.info(`${chalk.green.bold(`[READY]`)} Conectado ao Discord | Bot está online como ${client.user.tag}!`);
        
        if (client.loadActiveSessions) {
            await client.loadActiveSessions(context);
        }

        try {
            const presenceUpdate = require('./presenceUpdate');
            if (presenceUpdate.detectCurrentlyPlayingUsers) {
                await presenceUpdate.detectCurrentlyPlayingUsers();
            }
        } catch (error) {
            logger.warn(`${chalk.yellow.bold(`[READY]`)} Erro ao inicializar módulo de presença: ${error.message}`);
        }

        try {
            initializeStatusSync(client, context);
        } catch (error) {
            logger.error(`${chalk.red.bold(`[READY]`)} Erro ao inicializar sincronização de status: ${error.message}`);
        }

        client.user.setStatus('online');

        const activitiesCustom = [
            { state: 'Evento On! Participe Já!', type: ActivityType.Custom },
            { state: 'Faça já seu registro!', type: ActivityType.Custom },
            { state: `${packageJson.version} (Stable Version)`, type: ActivityType.Custom },
            { state: 'Shard 0 (Nano Banana)', type: ActivityType.Custom },
        ];

        let activityIndex = 0;
        const updateActivity = () => {
            try {
                const currentActivity = activitiesCustom[activityIndex];
                client.user.setActivity(currentActivity.state, { type: currentActivity.type });
                activityIndex = (activityIndex + 1) % activitiesCustom.length;
            } catch (activityError) {
                logger.error(`Erro ao definir atividade do bot: ${activityError.message}`);
            }
        };
        updateActivity();
        setInterval(updateActivity, 30000);

        try {
            if (!client.commands || client.commands.size === 0) {
                logger.warn('Nenhum comando encontrado para registrar.');
                return;
            }
            const commandObjects = Array.from(client.commands.values());
            const commandDataToRegister = commandObjects.map(cmd => cmd.data.toJSON());

            if (commandDataToRegister.length > 0) {
                await client.application.commands.set(commandDataToRegister);
                logger.info(`${chalk.green.bold(`[READY]`)} Comandos (${commandDataToRegister.length}) registrados com sucesso globalmente!`);
            } else {
                logger.warn('Nenhum dado de comando válido encontrado para registrar.');
            }
        } catch (error) {
            logger.error(`Erro crítico ao registrar os comandos: ${error.message}\n${error.stack}`);
        }

        client.on('guildMemberAdd', m => invalidateServerDataCache(m.guild.id));
        client.on('guildMemberRemove', m => invalidateServerDataCache(m.guild.id));
        client.on('guildMemberUpdate', (o, n) => {
            if (o.nickname !== n.nickname) {
                invalidateServerDataCache(n.guild.id);
            }
        });

        client.on('roleCreate', r => invalidateServerDataCache(r.guild.id));
        client.on('roleDelete', r => invalidateServerDataCache(r.guild.id));
        client.on('roleUpdate', (o, r) => invalidateServerDataCache(r.guild.id));

        client.on('channelCreate', c => invalidateServerDataCache(c.guild.id));
        client.on('channelDelete', c => invalidateServerDataCache(c.guild.id));
        client.on('channelUpdate', (o, c) => invalidateServerDataCache(c.guild.id));

        client.on('emojiCreate', e => invalidateServerDataCache(e.guild.id));
        client.on('emojiDelete', e => invalidateServerDataCache(e.guild.id));
        client.on('emojiUpdate', (o, e) => invalidateServerDataCache(e.guild.id));
    },
};
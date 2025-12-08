const { Events, ActivityType } = require('discord.js');
const packageJson = require('../package.json');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client, context) { 
        const { chalk, logger } = context;

        logger.info(`${chalk.green.bold(`[READY]`)} Conectado ao Discord | Bot está online como ${client.user.tag}!`);
        if (client.loadActiveSessions) {
            await client.loadActiveSessions(context);
        }

        client.user.setStatus('online');

        const activitiesCustom = [
            { state: 'Evento On! Participe Já!', type: ActivityType.Custom },
            { state: 'Faça já seu registro!', type: ActivityType.Custom },
            { state: `Versão ${packageJson.version}`, type: ActivityType.Custom },
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
    },
};
const { Events, ActivityType } = require('discord.js');
const packageJson = require('../package.json');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client, context) { 
        const { chalk, logger } = context;

        logger.info(`${chalk.green.bold(`[READY]`)} Conectado ao Discord | Bot está online como ${client.user.tag}!`);

        client.user.setStatus('idle');
        const activitiesCustom = [
            { state: '🟡 Reestruturação do Sistema (60%)', type: ActivityType.Custom },
            { state: `Operando na versão ${packageJson.version}`, type: ActivityType.Custom },
            { state: 'Shard 0 (Cluster Andrômeda)', type: ActivityType.Custom },
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
                logger.warn(`${chalk.yellow.bold(`[READY]`)} Nenhum comando encontrado para registrar globalmente!`);
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
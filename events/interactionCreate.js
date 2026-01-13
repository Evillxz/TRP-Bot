const { 
    Events,
    TextDisplayBuilder,
    ContainerBuilder,
    MessageFlags
} = require('discord.js');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const { applyWarning } = require('../handlers/modalsHandlers/modalsSubmit/handleSubmitAdvModal');
const { applyExoneration } = require('../handlers/modalsHandlers/modalsSubmit/handleSubmitBanModal');
const { handleStatusButtons } = require('../handlers/buttonsHandlers/statusButtons');

const handleRegisterModal = require('../handlers/modalsHandlers/handleRegisterModal');
const handleSubmitRegisterModal = require('../handlers/modalsHandlers/modalsSubmit/handleSubmitRegisterModal');
const handleEditRegisterModal = require('../handlers/modalsHandlers/modalsSubmit/handleEditRegisterModal');
const registerButtons = require('../handlers/buttonsHandlers/registerButtons');
const roleButtons = require('../handlers/buttonsHandlers/roleButtons');
const handleAdvModal = require('../handlers/modalsHandlers/handleAdvModal');
const handleUpAndRebModal = require('../handlers/modalsHandlers/handleUpAndRebModal');
const handleBanUserModal = require('../handlers/modalsHandlers/handleBanUserModal');
const handleSubmitUpRebModal = require('../handlers/modalsHandlers/modalsSubmit/handleSubmitUpRebModal');
const advsActiveListButton = require('../handlers/buttonsHandlers/advsActiveListButton');
const handleSearchUserModal = require('../handlers/modalsHandlers/handleSearchUserModal');
const handleSubmitSearchModal = require('../handlers/modalsHandlers/modalsSubmit/handleSubmitSearchModal');
const banListButton = require('../handlers/buttonsHandlers/banListButton');
const musicButtons = require('../handlers/buttonsHandlers/musicButtons');
const raffleButton = require('../handlers/buttonsHandlers/raffleButton');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, context) {
        const { logger } = context;
        try {

            async function isFeatureMaintenance(feature) {
                try {
                    const maintenancePath = path.join(__dirname, '..', 'maintenance.json');
                    const data = await fs.promises.readFile(maintenancePath, 'utf8');
                    const obj = JSON.parse(data);
                    return !!obj[feature];
                } catch (err) {
                    return false;
                }
            }

            if (await isFeatureMaintenance('general')) {
                const reply = await interaction.reply({
                    embeds: [{
                        description: `🚧 Sistema em modo **manutenção**. Tente novamente mais tarde.`,
                        color: 0xFFA500
                    }],
                    flags: MessageFlags.Ephemeral
                });
                setTimeout(() => reply.delete().catch(() => {}), 5000);
                return;
            }

            if (interaction.isButton()) {

                if (interaction.customId === 'open_modal_register') {
                    await handleRegisterModal.execute(interaction, context);
                } else if (
                    interaction.customId.startsWith('approve_register_') 
                    || interaction.customId.startsWith('reject_register_') 
                    || interaction.customId.startsWith('edit_register_')
                ) { 
                    await registerButtons.execute(interaction, context);
                } else if (interaction.customId === 'refresh_status' || interaction.customId === 'detailed_status') {
                    await handleStatusButtons(interaction, context);
                } else if (['men_role', 'women_role', 'legal_age_role', 'not_legal_age_role'].includes(interaction.customId)) {
                    await roleButtons.execute(interaction, context);
                } else if (interaction.customId === 'open_adv_modal') {
                    await handleAdvModal.execute(interaction, context);
                } else if (interaction.customId === 'open_up_and_reb_modal') {
                    await handleUpAndRebModal.execute(interaction, context);
                } else if (interaction.customId === 'open_ban_modal') {
                    await handleBanUserModal.execute(interaction, context);
                } else if (interaction.customId === 'advs_active_list') {
                    await advsActiveListButton.execute(interaction, context);
                } else if (interaction.customId === 'open_user_records_modal') {
                    await handleSearchUserModal.execute(interaction, context);
                } else if (interaction.customId === 'banned_list') {
                    await banListButton.execute(interaction, context);
                } else if (interaction.customId.startsWith('music_')) {
                    await musicButtons.execute(interaction, context);
                } else if (interaction.customId === 'raffle_enter' || interaction.customId.startsWith('raffle_enter_')) {
                    await raffleButton(interaction);
                } 
            
            
            } else if (interaction.isModalSubmit()) {
                if (interaction.customId.startsWith('modal_register')) {
                    return handleSubmitRegisterModal.execute(interaction, context);
                } else if (interaction.customId.startsWith('edit_register_modal_')) {
                    return handleEditRegisterModal.execute(interaction, context);

                } else if (interaction.customId.startsWith('modal_ban')) {
                    await applyExoneration(interaction, context);

                } else if (interaction.customId.startsWith('modal_adv')) {
                    await applyWarning(interaction, context);

                } else if (interaction.customId.startsWith('modal_up_and_reb')) {
                    return handleSubmitUpRebModal.execute(interaction, context);
                } else if (interaction.customId.startsWith('modal_search_register')) {
                    return handleSubmitSearchModal.execute(interaction, context);
                }


            } 

        } catch (error) { 
            if (error.code === 10062) {
                logger.warn(`${chalk.yellow.bold('[Unknown Interaction]')} Resposta para uma interação desconhecida ou expirada foi ignorada. (Guild: ${interaction.guildId}, User: ${interaction.user.id})`);
                return; 
            }
            const logPrefix = `[InteractionCreate ERROR] [Guild: ${interaction.guildId}] [User: ${interaction.user.id}]`;
            logger.error(`${logPrefix} --- ERRO NÃO CAPTURADO NO TRY/CATCH PRINCIPAL ---`, error); 

            const errorMessage = `## ⛔ Erro interno no Sistema!\nMinha equipe de desenvolvimento já foi notificada.`;
            const errorContainer = [
                new ContainerBuilder()
                    .setAccentColor(15548997)
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(errorMessage))
            ];

            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ components: errorContainer, flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ components: errorContainer, flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
                }
            } catch (replyError) {
                logger.error(`${logPrefix} Falha CRÍTICA ao tentar enviar a mensagem de erro para o usuário.`, replyError);
            }
        }
    },
};
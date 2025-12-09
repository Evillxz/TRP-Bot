const { 
    Events,
    TextDisplayBuilder,
    ContainerBuilder,
    MessageFlags
} = require('discord.js');
const chalk = require('chalk');

const handleRegisterModal = require('../handlers/modalsHandlers/handleRegisterModal');
const handleSubmitRegisterModal = require('../handlers/modalsHandlers/modalsSubmit/handleSubmitRegisterModal');
const handleEditRegisterModal = require('../handlers/modalsHandlers/modalsSubmit/handleEditRegisterModal');
const registerButtons = require('../handlers/buttonsHandlers/registerButtons');
const { handleStatusButtons } = require('../handlers/buttonsHandlers/statusButtons');
const roleButtons = require('../handlers/buttonsHandlers/roleButtons');
const handleAdvModal = require('../handlers/modalsHandlers/handleAdvModal');
const handleUpAndRebModal = require('../handlers/modalsHandlers/handleUpAndRebModal');
const handleBanUserModal = require('../handlers/modalsHandlers/handleBanUserModal');
const handleSubmitBanModal = require('../handlers/modalsHandlers/modalsSubmit/handleSubmitBanModal');
const handleSubmitAdvModal = require('../handlers/modalsHandlers/modalsSubmit/handleSubmitAdvModal');
const handleSubmitUpRebModal = require('../handlers/modalsHandlers/modalsSubmit/handleSubmitUpRebModal');
const advsActiveListButton = require('../handlers/buttonsHandlers/advsActiveListButton');
const handleSearchUserModal = require('../handlers/modalsHandlers/handleSearchUserModal');
const handleSubmitSearchModal = require('../handlers/modalsHandlers/modalsSubmit/handleSubmitSearchModal');
const banListButton = require('../handlers/buttonsHandlers/banListButton');
const handleParticipateModal = require('../handlers/modalsHandlers/handleEventModal');
const handleSubmitEventModal = require('../handlers/modalsHandlers/modalsSubmit/handleSubmitEventModal');
const listEventButton = require('../handlers/buttonsHandlers/listEventButton');
const handleRemoveUserEventModal = require('../handlers/modalsHandlers/handleRemoveUserEventModal');
const handleSubmitRemUsEventModal = require('../handlers/modalsHandlers/modalsSubmit/handleSubmitRemUsEventModal');
const musicButtons = require('../handlers/buttonsHandlers/musicButtons');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, context) {
        const { client, logger } = context;
        try {

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
                } else if (['men_role', 'women_role'].includes(interaction.customId)) {
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
                } else if (interaction.customId === 'open_modal_event') {
                    await handleParticipateModal.execute(interaction, context);
                } else if (interaction.customId === 'participants_list') {
                    await listEventButton.execute(interaction, context);
                } else if (interaction.customId === 'open_modal_remove_user_event') {
                    await handleRemoveUserEventModal.execute(interaction, context);
                } else if (interaction.customId.startsWith('music_')) {
                    await musicButtons.execute(interaction, context);
                } 
            
            
            } else if (interaction.isModalSubmit()) {
                if (interaction.customId.startsWith('modal_register')) {
                    return handleSubmitRegisterModal.execute(interaction, context);
                } else if (interaction.customId.startsWith('edit_register_modal_')) {
                    return handleEditRegisterModal.execute(interaction, context);
                } else if (interaction.customId.startsWith('modal_ban')) {
                    return handleSubmitBanModal.execute(interaction, context);
                } else if (interaction.customId.startsWith('modal_adv')) {
                    return handleSubmitAdvModal.execute(interaction, context);
                } else if (interaction.customId.startsWith('modal_up_and_reb')) {
                    return handleSubmitUpRebModal.execute(interaction, context);
                } else if (interaction.customId.startsWith('modal_search_register')) {
                    return handleSubmitSearchModal.execute(interaction, context);
                } else if (interaction.customId.startsWith('modal_event')) {
                    return handleSubmitEventModal.execute(interaction, context);
                } else if (interaction.customId.startsWith('modal_remove_user_event')) {
                    return handleSubmitRemUsEventModal.execute(interaction, context);
                } 


            } /* else if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);

                if (!command) {
                    logger.error(`Nenhum comando correspondente a "${interaction.commandName}" foi encontrado.`);
                    await interaction.reply({ content: 'Ocorreu um erro: comando não encontrado.', flags: MessageFlags.Ephemeral });
                    return;
                }
                
                await command.execute(interaction, context);
            
            // Comandos de usuário
            } else if (interaction.isUserContextMenuCommand()) {
                const command = client.commands.get(interaction.commandName);
                 if (!command) {
                    logger.error(`Nenhum comando de usuário correspondente a "${interaction.commandName}" foi encontrado.`);
                    return;
                }
                await command.execute(interaction, context);

            // Menus de Seleção
            } else if (interaction.isStringSelectMenu() || interaction.isChannelSelectMenu() || interaction.isRoleSelectMenu() || interaction.isUserSelectMenu()) {
                if (interaction.customId === 'admin_select_menu') {
                    await handleAdminSelectMenu.execute(interaction, context);
                } else if (interaction.customId === 'config_select_on_duty_role' || interaction.customId === 'config_select_off_duty_role') {
                    await handleRoleConfigSelect.execute(interaction, context);
                }
            
            } */
            

        } catch (error) { 
            if (error.code === 10062) {
                logger.warn(`${chalk.yellow.bold('[Unknown Interaction]')} Resposta para uma interação desconhecida ou expirada foi ignorada. (Guild: ${interaction.guildId}, User: ${interaction.user.id})`);
                return; 
            }
            const logPrefix = `[InteractionCreate ERROR] [Guild: ${interaction.guildId}] [User: ${interaction.user.id}]`;
            logger.error(`${logPrefix} --- ERRO NÃO CAPTURADO NO TRY/CATCH PRINCIPAL ---`, error); 

            const errorMessage = `### ⛔ Erro interno no Sistema!\nOcorreu um problema interno ao processar sua ação.\nMinha equipe de desenvolvimento já foi notificada.`;
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
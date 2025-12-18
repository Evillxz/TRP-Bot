const { 
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    ThumbnailBuilder,
    SectionBuilder,
    SeparatorBuilder, 
    SeparatorSpacingSize,
    formatEmoji
} = require('discord.js');
const emojis = require('emojis');
const api = require('apiClient');
const { formatarTextoEmbed } = require('formatarTextoEmbed');

function getActionConfig(action, guild) {
    const configMap = {
        up_option_select: {
            channelId: '1296584856372777073',
            title: `## ${formatEmoji(emojis.static.up)} Novo Upamento`,
            color: 0x00FF00,
            response: '✔ Upamento realizado com sucesso!'
        },
        reb_option_select: {
            channelId: '1296584857769742349',
            title: `## ${formatEmoji(emojis.static.down)} Novo Rebaixamento`,
            color: 0XCC6825,
            response: '✔ Rebaixamento realizado com sucesso!'
        }
    };

    const config = configMap[action];
    if (!config) return null;

    return {
        title: config.title,
        color: config.color,
        channel: guild.channels.cache.get(config.channelId),
        response: config.response
    };
};

module.exports = {
    async execute(interaction, context) {
        const { logger } = context;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const action = interaction.fields.getStringSelectValues("up_or_reb_select")?.[0];
        const userId = interaction.fields.getSelectedUsers("user_modal_up_and_reb_select").first()?.id;
        const oldRoleId = interaction.fields.getSelectedRoles("role_remove_up_and_reb_select").first()?.id;
        const newRoleId = interaction.fields.getSelectedRoles("role_add_up_and_reb_select").first()?.id;
        const reason = interaction.fields.getTextInputValue("reason_text_input_up_and_reb");

        const user = await interaction.guild.members.fetch(userId).catch(() => null);
        const adminId = interaction.user.id;

        try {

            const configs = getActionConfig(action, interaction.guild);

            if (!configs || !configs.channel) {
                logger.error(`Configuração inválida para a action: ${action}`);

                return interaction.editReply({
                    embeds: [{
                        description: '✖ Informações nulas ou inexistentes!',
                        color: 0xFF0000
                    }]
                })
            };

            await user.roles.add(newRoleId);
            await user.roles.remove(oldRoleId);

            await api.post('/bot/up_reb_logs/add', {
                action_type: action,
                user_id: userId,
                user_tag: user.user.tag,
                admin_id: adminId,
                admin_tag: interaction.user.tag,
                guild_id: interaction.guild.id,
                old_role_id: oldRoleId,
                new_role_id: newRoleId,
                reason
            });

            const reasonFormatted = formatarTextoEmbed(reason, 50);

            const container = [
                new ContainerBuilder()
                .setAccentColor(configs.color)
                .addSectionComponents(
                    new SectionBuilder()
                    .setThumbnailAccessory(
                        new ThumbnailBuilder()
                            .setURL(user.user.displayAvatarURL() || interaction.guild.iconURL()).setDescription('Avatar do Usuário')
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${configs.title}\n\u200B\n`),
                        new TextDisplayBuilder().setContent(
                            `- **Usuário(a):** <@${userId}>\n`+
                            `- **Responsável:** <@${adminId}>`
                        )
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `- **Antigo Cargo:**\n<@&${oldRoleId}>\n`+
                        `- **Novo Cargo:**\n<@&${newRoleId}>\n`+
                        `- **Motivo:**\n\` ${reasonFormatted} \`\n\n`+
                        `-# Máfia Trindade Penumbra® • ${new Date().toLocaleString("pt-BR")}`
                    )
                )
            ];

            await configs.channel.send({
                components: container,
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: { users: [userId] }
            });

            await interaction.editReply({
                embeds: [{
                    description: configs.response,
                    color: configs.color
                }]
            });
        
        } catch (error) {
            logger.error('Erro interno ao processar ações:', error);

            await interaction.editReply({
                embeds: [{
                    description: '✖ Ocorreu um erro interno no sistema!',
                    color: 0xFF0000
                }]
            });
        }
    }
};
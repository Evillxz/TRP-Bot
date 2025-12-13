const { MessageFlags, formatEmoji, ContainerBuilder, TextDisplayBuilder, ThumbnailBuilder, SectionBuilder } = require('discord.js');
const api = require('apiClient');

const WARNING_ROLES = {
    1: '1446613392826564658',
    // 1: '1366221765449220136',
    2: '1446613446639751189',
    3: '1446613483402821794'
};

module.exports = {
    async execute(interaction, context) {
        const { logger, emojis, chalk } = context;

        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const userId = interaction.fields.getSelectedUsers("user_modal_adv_select").first()?.id;
            const member = await interaction.guild.members.fetch(userId).catch(() => null);
            const reason = interaction.fields.getTextInputValue("reason_text_input_adv");
            const durationSelect = interaction.fields.getStringSelectValues("duration_select_adv")[0];
            const adminId = interaction.user.id;
            const guildId = interaction.guild.id;
            const logChannelId = '1296584858910326926';
            // const logChannelId = '1293740554076688436';

            const alert = formatEmoji(emojis.static.alert);

            if (!member) {
                return interaction.editReply({
                    embeds: [{
                        description: '✖ Usuário não encontrado!',
                        color: 0xFF0000
                    }]
                });
            }

            const durationHours = durationSelect === 'permanent_adv_select' ? null : parseInt(durationSelect.split('_')[0]);

            let activeWarnings = [];
            try {
                activeWarnings = await api.get(`/bot/warnings/active/${userId}/${guildId}`);
            } catch (err) {
                throw new Error('Erro ao obter advertências via API');
            }
            const warningCount = activeWarnings.length;
            const newWarningLevel = warningCount + 1;

            if (newWarningLevel >= 3) {
                let warningId;
                const r = await api.post('/bot/warnings/add', { user_id: userId, user_tag: member.user.tag, admin_id: adminId, guild_id: guildId, reason, duration_hours: durationHours });
                warningId = r.id;

                await member.kick(`Acúmulo de advertências (${newWarningLevel})`);
                
                await api.post('/bot/warnings/clear', { user_id: userId, guild_id: guildId });

                let kickId;
                const r2 = await api.post('/bot/bans/add', { user_id: userId, user_tag: member.user.tag, admin_id: 'SYSTEM_AUTO_KICK', guild_id: guildId, reason: `Kick automático por ${newWarningLevel} advertências` });
                kickId = r2.id;
                
                await interaction.editReply({
                    embeds: [{
                        description: `${alert} **${member.user.tag}** foi **kickado automaticamente** por acumular ${newWarningLevel} advertências!`,
                        color: 0xFF0000
                    }]
                });

                logger.info(`Kick automático! ID: ${kickId} | Usuário: ${member.user.tag} | Advertências: ${newWarningLevel} | Advertências zeradas`);
                return;
            }

            if (newWarningLevel <= 3) {
                if (warningCount > 0 && WARNING_ROLES[warningCount]) {
                    const oldRole = interaction.guild.roles.cache.get(WARNING_ROLES[warningCount]);
                    if (oldRole && member.roles.cache.has(oldRole.id)) {
                        await member.roles.remove(oldRole);
                    }
                }

                if (WARNING_ROLES[newWarningLevel]) {
                    const newRole = interaction.guild.roles.cache.get(WARNING_ROLES[newWarningLevel]);
                    if (newRole) {
                        await member.roles.add(newRole);
                    }
                }
            }

            let warningId;
            const r = await api.post('/bot/warnings/add', { user_id: userId, user_tag: member.user.tag, admin_id: adminId, guild_id: guildId, reason, duration_hours: durationHours });
            warningId = r.id;

            const channel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
            if (channel) {
                const durationText = durationHours ? `${durationHours}h` : 'Permanente';
                
                const container = [
                    new ContainerBuilder()
                    .setAccentColor(0xff7b00)
                    .addSectionComponents(
                        new SectionBuilder()
                            .setThumbnailAccessory(
                                new ThumbnailBuilder()
                                    .setURL(member.user.displayAvatarURL() || '')
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`## ${alert} Nova Advertência\n\u200B\n- **Usuário(a):**\n\` ${member.user.tag} \`\n- **Responsável:**\n<@${adminId}>\n- **Motivo:**\n\` ${reason} \`\n- **Nível:**\n\` ADV${newWarningLevel} \`\n- **Duração:**\n\` ${durationText} \`\n\n-# Trindade Penumbra® • ${new Date().toLocaleString("pt-BR")}`),
                            ),
                    ),
                ];

                await channel.send({
                    components: container,
                    flags: MessageFlags.IsComponentsV2,
                    allowedMentions: { parse: [] }
                });
            }

            await interaction.editReply({
                embeds: [{
                    description: `✔ Advertência **ADV ${newWarningLevel}** aplicada em **${member.user.tag}** com sucesso!`,
                    color: 0x00FF00
                }]
            });

            logger.info(`Advertência aplicada! ID: ${warningId} | Usuário: ${member.user.tag} | Nível: ADV ${newWarningLevel} | Admin: ${adminId}`);

        } catch (error) {
            logger.error(`${chalk.red.bold('[ERRO]')} Erro no sistema de advertências: ${error.stack}`);

            await interaction.editReply({
                embeds: [{
                    description: '✖ Ocorreu um erro ao aplicar a advertência!',
                    color: 0xFF0000
                }]
            });
        }
    }
};
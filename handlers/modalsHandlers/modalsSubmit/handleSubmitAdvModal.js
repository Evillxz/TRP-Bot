const { MessageFlags, formatEmoji, ContainerBuilder, TextDisplayBuilder, ThumbnailBuilder, SectionBuilder } = require('discord.js');
const database = require('../../../database/database');

const WARNING_ROLES = {
    1: '1446613392826564658',
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

            const activeWarnings = await database.getActiveWarnings(userId, guildId);
            const warningCount = activeWarnings.length;
            const newWarningLevel = warningCount + 1;

            if (newWarningLevel >= 3) {
                const warningId = await database.addWarning(userId, member.user.tag, adminId, guildId, reason, durationHours);

                await member.kick(`Acúmulo de advertências (${newWarningLevel})`);
                
                await database.clearUserWarnings(userId, guildId);
                
                const kickId = await database.addBan(userId, member.user.tag, 'SYSTEM_AUTO_KICK', guildId, `Kick automático por ${newWarningLevel} advertências`);
                
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

            const warningId = await database.addWarning(userId, member.user.tag, adminId, guildId, reason, durationHours);

            const channel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
            if (channel) {
                const durationText = durationHours ? `${durationHours}h` : 'Permanente';
                
                const container = [
                    new ContainerBuilder()
                    .setAccentColor(0xFFAA00)
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
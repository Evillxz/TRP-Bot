const { 
    MessageFlags, 
    SeparatorBuilder, 
    SeparatorSpacingSize, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    ThumbnailBuilder, 
    SectionBuilder,
    formatEmoji
} = require('discord.js');
const api = require('apiClient');
const { formatarTextoEmbed } = require('formatarTextoEmbed');

const WARNING_ROLES = {
    1: '1446613392826564658',
    2: '1446613446639751189',
    3: '1446613483402821794'
};

async function applyWarning(interaction, context, payload = null) {
    const { logger, emojis, chalk, client } = context;

    const isWebSocket = !!payload;
    const isInteraction = !isWebSocket && interaction;

    try {
        let targetId, adminId, reason, levelRaw, durationRaw, guild;

        if (isWebSocket) {
            
            targetId = payload.userId;
            adminId = payload.adminId;
            reason = payload.reason;
            levelRaw = parseInt(payload.level);
            durationRaw = payload.durationHours;
            guild = client ? client.guilds.cache.get(payload.guildId) : interaction?.client.guilds.cache.get(payload.guildId);

        } else if (isInteraction) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            targetId = interaction.fields.getSelectedUsers("user_modal_adv_select").first()?.id;
            adminId = interaction.user.id;
            reason = interaction.fields.getTextInputValue("reason_text_input_adv");
            
            const levelSelect = interaction.fields.getStringSelectValues("level_select_adv")[0];
            levelRaw = parseInt(levelSelect.split('_')[1]); 

            const durationSelect = interaction.fields.getStringSelectValues("duration_select_adv")[0];
            durationRaw = durationSelect === 'permanent_adv_select' ? null : parseInt(durationSelect.split('_')[0]);

            guild = interaction.guild;
        }

        if (!guild) {
            logger.error(chalk.red('[ERRO] Guilda não encontrada no applyWarning.'));
            return; 
        }

        const member = await guild.members.fetch(targetId).catch(() => null);
        const adminMember = await guild.members.fetch(adminId).catch(() => null);
        const adminUser = adminMember ? adminMember.user : await client?.users.fetch(adminId).catch(() => null);

        if (!member) {
            if (isInteraction) {
                return interaction.editReply({
                    embeds: [{ description: '✖ Usuário não encontrado no servidor!', color: 0xFF0000 }]
                });
            } else {
                logger.warn(chalk.yellow(`[AVISO] Usuário ${targetId} não está no servidor, mas a ADV foi processada pela API.`));
            }
        }

        const durationText = durationRaw ? `${durationRaw}h` : 'Permanente';
        const reasonFormatted = formatarTextoEmbed(reason, 50);
        const alert = formatEmoji(emojis.animated.alert, true);
        const logChannelId = '1296584858910326926';

        let color = 0xff7b00;
        let levelRoleId = WARNING_ROLES[levelRaw];
        let punishment = 'Não aplicável';
        let feedbackDescription = '';

        await api.post('/bot/warnings/add', { 
            user_id: targetId, 
            user_tag: member ? member.user.tag : 'Desconhecido',
            user_nickname: member ? (member.nickname || 'Sem Apelido') : 'Desconhecido', 
            admin_id: adminId,
            admin_tag: adminUser ? adminUser.tag : 'Sistema',
            admin_nickname: adminMember ? (adminMember.nickname || 'Sem Apelido') : 'Sistema', 
            guild_id: guild.id, 
            reason, 
            duration_hours: durationRaw,
            level: levelRaw
        });

        if (member && levelRoleId) {
            const roleAdd = guild.roles.cache.get(levelRoleId);
            if (roleAdd) await member.roles.add(roleAdd).catch(e => logger.error(`Erro ao dar cargo: ${e.message}`));
        }

        if (levelRaw === 1) {
            feedbackDescription = `✔ Advertência **ADV 1** aplicada em <@${targetId}> com sucesso!`;
        }

        if (levelRaw === 2 || levelRaw === 3) {
            
            if (levelRaw === 3 && member) {
                await member.timeout(7 * 24 * 60 * 60 * 1000, `Castigo automático: ADV 3`).catch(() => {});
                punishment = 'Timeout de 7 dias aplicado.';
                color = 0xFF0000;
            } else if (levelRaw === 2) {
                punishment = 'Advertência via DM.';
                color = 0x00FF00;
            }

            if (member) {
                const title = levelRaw === 3 ? 'Castigo Recebido' : 'Advertência Recebida';
                const descNivel = levelRaw === 3 
                    ? `- Você recebeu uma **Advertência Nível 3**!\n- Advertência nível 3 resulta em timeout de 7 dias.ﾠ\n` 
                    : `- Você recebeu uma **Advertência Nível 2**!\n`;

                const container = [
                    new ContainerBuilder()
                    .setAccentColor(0xff7b00)
                    .addSectionComponents(
                        new SectionBuilder()
                        .setThumbnailAccessory(
                            new ThumbnailBuilder().setURL(member.user.displayAvatarURL() || guild.iconURL())
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`## ${alert} — ${title}`),
                            new TextDisplayBuilder().setContent(`${descNivel}- Servidor: ${guild.name}\n`),
                        ),
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `- Duração: ${durationText}\n`+
                            `- Responsável: <@${adminId}>\n\n`+
                            `- Motivo: ${reasonFormatted}\n\n`+
                            `-# Trindade Penumbra® • ${new Date().toLocaleString("pt-BR")}`
                        ),
                    ),
                ];

                await member.send({ components: container, flags: MessageFlags.IsComponentsV2 })
                    .catch(() => {
                        feedbackDescription += '\n#- (Não foi possível enviar a DM ao usuário.)';
                    });
            }

            feedbackDescription = `✔ Advertência **ADV ${levelRaw}** aplicada em <@${targetId}> com sucesso!`;
        }


        if (isInteraction) {
            await interaction.editReply({
                embeds: [{
                    description: feedbackDescription,
                    color: 0x00FF00
                }]
            });
        } else {
            logger.info(chalk.green(`[WS] ADV ${levelRaw} aplicada via API para ${targetId}.`));
        }

        const logChannel = await guild.channels.fetch(logChannelId).catch(() => null);
        if (logChannel && member) {
            const containerLog = [
                new ContainerBuilder()
                .setAccentColor(color)
                .addSectionComponents(
                    new SectionBuilder()
                    .setThumbnailAccessory(
                        new ThumbnailBuilder()
                        .setURL(member.user.displayAvatarURL() || guild.iconURL())
                        .setDescription('Avatar do Usuário')
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`## ${alert} — Nova Advertência`),
                        new TextDisplayBuilder().setContent(
                            `- Usuário(a): <@${targetId}>\n`+
                            `- Responsável: <@${adminId}> ﾠﾠ`
                        )
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `- **Motivo:**\n${reasonFormatted}\n\n`+
                        `- **Nível:** <@&${levelRoleId}>\n`+
                        `- **Punição:** ${punishment}\n`+
                        `- **A advertência expira em ${durationText}**\n\n`+
                        `-# Trindade Penumbra® • ${new Date().toLocaleString("pt-BR")}`
                    )
                )
            ];

            await logChannel.send({
                components: containerLog,
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: { parse: [] }
            });
        }

    } catch (error) {
        if (error.response && error.response.data) {
            logger.error(`${chalk.red.bold('[ERRO API]')} Detalhes: ${JSON.stringify(error.response.data)}`);
        }
        logger.error(`${chalk.red.bold('[ERRO]')} Erro no sistema de advertências: ${error.stack}`);

        if (isInteraction) {
            try {
                await interaction.editReply({
                    embeds: [{ description: '✖ Ocorreu um erro ao aplicar a advertência!', color: 0xFF0000 }]
                });
            } catch (err) { /* Ignore */ }
        }
    }
};

module.exports = { applyWarning };
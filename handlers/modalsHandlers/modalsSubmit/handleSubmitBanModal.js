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
const api = require('apiClient');
const { formatarTextoEmbed } = require('formatarTextoEmbed');

async function applyExoneration(interaction, context, payload = null) {
    const { logger, emojis, chalk, client } = context;

    const isWebSocket = !!payload;
    const isInteraction = !isWebSocket && interaction;

    try {
        let targetId, adminId, reason, guild;

        if (isWebSocket) {
            targetId = payload.userId;
            adminId = payload.adminId;
            reason = payload.reason;
            guild = client ? client.guilds.cache.get(payload.guildId) : interaction?.client.guilds.cache.get(payload.guildId);

        } else if (isInteraction) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            targetId = interaction.fields.getSelectedUsers("user_modal_ban_select", true)?.map((user) => user.id)[0];
            adminId = interaction.user.id;
            reason = interaction.fields.getTextInputValue("reason_text_input_ban");
            guild = interaction.guild;
        }

        if (!guild) {
            logger.error(chalk.red('[ERRO] Guilda não encontrada no applyExoneration.'));
            return;
        }

        const member = await guild.members.fetch(targetId).catch(() => null);
        const adminMember = await guild.members.fetch(adminId).catch(() => null);
        const adminUser = adminMember ? adminMember.user : await client?.users.fetch(adminId).catch(() => null);

        const logChannelId = '1296584859963359233';
        const gavel = formatEmoji(emojis.static.gavel);

        if (!member) {
            if (isInteraction) {
                return interaction.editReply({
                    embeds: [{ description: '✖ Usuário não encontrado!', color: 0xFF0000 }],
                    flags: MessageFlags.Ephemeral
                });
            } else {
                logger.warn(`[API] Tentativa de ban em usuário fora do servidor: ${targetId}`);
                return;
            }
        }

        if (!member.bannable) {
            const errorMsg = '✖ Usuário não pode ser banido (Cargos superiores ou erro de permissão)!';
            logger.warn(`Tentativa de banimento mal sucedida - Usuário: ${member.user.tag} | Admin: ${adminId}`);
            
            if (isInteraction) {
                return interaction.editReply({
                    embeds: [{ description: errorMsg, color: 0xFF0000 }],
                    flags: MessageFlags.Ephemeral
                });
            }
            return;
        }

        const nickname = member.nickname || member.user.username;
        const adminTag = adminUser ? adminUser.tag : 'Admin Desconhecido';
        
        const r = await api.post('/bot/bans/add', { 
            user_id: targetId, 
            user_nickname: nickname, 
            user_tag: member.user.tag, 
            admin_id: adminId, 
            guild_id: guild.id, 
            reason 
        });
        const banId = r.id;

        const channel = await guild.channels.fetch(logChannelId).catch(() => null);
        const reasonFormatted = formatarTextoEmbed(reason, 50);

        if (channel) {
            const container = [
                new ContainerBuilder()
                .setAccentColor(0xFF0000)
                .addSectionComponents(
                    new SectionBuilder()
                    .setThumbnailAccessory(
                        new ThumbnailBuilder()
                        .setURL(member.user.displayAvatarURL() || guild.iconURL())
                        .setDescription('Avatar do Usuário')
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`## ${gavel} Nova Exoneração`),
                        new TextDisplayBuilder().setContent(
                            `- Usuário(a): **${member.user.tag}**\n`+
                            `- Responsável: <@${adminId}>`
                        )
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `- **Motivo:**\n${reasonFormatted}\n\n`+
                        `- **Siga as regras para evitar futuros problemas!**\n\n`+
                        `-# Trindade Penumbra® • ${new Date().toLocaleString("pt-BR")}`
                    )
                )
            ];

            await channel.send({
                components: container,
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: { parse: [] }
            });
        }

        if (isInteraction) {
            await interaction.editReply({
                embeds: [{
                    description: `✔ Usuário **${member.user.tag}** banido com sucesso!`,
                    color: 0x00FF00
                }],
                flags: MessageFlags.Ephemeral
            });
        }

        logger.info(`Banimento concluído! ID: ${banId} | Usuário: ${member.user.tag} | Motivo: ${reason} | Admin: ${adminId} | Guild: ${guild.id}`);

    } catch (error) {
        logger.error(`${chalk.red.bold('[ERRO]')} Erro no sistema de exoneração: ${error.stack}`);

        if (isInteraction) {
            try {
                await interaction.editReply({
                    embeds: [{
                        description: '✖ Ocorreu um erro ao tentar banir o usuário!',
                        color: 0xFF0000
                    }],
                    flags: MessageFlags.Ephemeral
                });
            } catch (err) { /* Ignore */ }
        }
    }
}

module.exports = { applyExoneration };
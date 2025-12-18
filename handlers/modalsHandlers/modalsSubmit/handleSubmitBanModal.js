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

module.exports = {
    async execute(interaction, context) {
        const { logger, emojis, chalk } = context;

        try{
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const userId = interaction.fields.getSelectedUsers("user_modal_ban_select", true)?.map((user) => user.id)[0];; 
            const member = await interaction.guild.members.fetch(userId).catch(() => null);

            const nickname = member?.nickname || member?.user.username;

            const reason = interaction.fields.getTextInputValue("reason_text_input_ban");
            const adminId = interaction.user.id;
            const guildId = interaction.guild.id;
            const logChannelId = '1296584859963359233';

            const gavel = formatEmoji(emojis.static.gavel);

            if (!member) {
                return interaction.editReply({
                    embeds: [{
                        description: '✖ Usuário não encontrado!',
                        color: 0xFF0000
                    }],
                    flags: MessageFlags.Ephemeral
                })
            };

            if (!member.bannable) {
                logger.warn(`Tentativa de banimento mal sucedida - Usuário: ${member} | Admin: ${adminId}`);
                return interaction.editReply({
                    embeds: [{
                        description: '✖ Usuário não pode ser banido!',
                        color: 0xFF0000
                    }],
                    flags: MessageFlags.Ephemeral
                })
            };

            await member.ban({ reason: reason });
            
            const r = await api.post('/bot/bans/add', { user_id: userId, user_nickname: nickname, user_tag: member.user.tag, admin_id: adminId, guild_id: guildId, reason });
            const banId = r.id;

            const channel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
            const reasonFormatted = formatarTextoEmbed(reason, 50);

            if (channel) {

                const container = [
                    new ContainerBuilder()
                    .setAccentColor(0xFF0000)
                    .addSectionComponents(
                        new SectionBuilder()
                        .setThumbnailAccessory(
                            new ThumbnailBuilder()
                            .setURL(member.user.displayAvatarURL() || interaction.guild.iconURL())
                            .setDescription('Avatar do Usuário')
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`## ${gavel} Nova Exoneração`),
                            new TextDisplayBuilder().setContent(
                                `- **Usuário(a):** \` ${member.user.tag} \`\n`+
                                `-**Responsável:** <@${adminId}>`
                            )
                        )
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `- **Motivo:**\n\` ${reasonFormatted} \`\n`+
                            `- **Siga as regras para evitar futuros problemas!`+
                            `-# Trindade Penumbra® • ${new Date().toLocaleString("pt-BR")}`
                        )
                    )
                ];

                await channel.send({
                    components: container,
                    flags: MessageFlags.IsComponentsV2,
                    allowedMentions: { parse: [] }
                });
            };

            await interaction.editReply({
                embeds: [{
                    description: `✔ Usuário **${member.user.tag}** banido com sucesso!`,
                    color: 0x00FF00
                }],
                flags: MessageFlags.Ephemeral
            });

            logger.info(`Banimento concluído! ID: ${banId} | Usuário: ${member} | Motivo: ${reason} | Admin: ${adminId} | Guild: ${guildId}`);
        


        } catch (error) {
            logger.error(`${chalk.red.bold('[ERRO]')} Erro no sistema de exoneração: ${error.stack}`);

            await interaction.editReply({
                embeds: [{
                    description: '✖ Ocorreu um erro ao tentar banir o usuário!',
                    color: 0xFF0000
                }],
                flags: MessageFlags.Ephemeral
            });
        }
        
    }
};
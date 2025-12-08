const { 
    MediaGalleryBuilder, 
    MediaGalleryItemBuilder,
    TextDisplayBuilder, 
    SectionBuilder, 
    SeparatorBuilder, 
    SeparatorSpacingSize, 
    ButtonBuilder, 
    ButtonStyle, 
    ActionRowBuilder, 
    ContainerBuilder,
    MessageFlags
} = require('discord.js');

module.exports = {
    name: 'painelmoderador',
    aliases: ['pm', 'pmoderador', 'painelm'],
    description: 'Painel de moderação do servidor.',
    
    async execute(message, context) {
        const { emojis, chalk, logger } = context;

        try {
            
            const container = [
                new ContainerBuilder()
                    .setAccentColor(8064526)
                    .addMediaGalleryComponents(
                        new MediaGalleryBuilder()
                            .addItems(
                                new MediaGalleryItemBuilder()
                                    .setURL("attachment://moderation.png"),
                            ),
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false),
                    )
                    .addSectionComponents(
                        new SectionBuilder()
                            .setButtonAccessory(
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Secondary)
                                    .setLabel("Aplicar")
                                    .setCustomId("open_adv_modal")
                                    .setDisabled(false)
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("**Aplicar Advertência**\nMensagem enviada no canal e via DM (Se disponível)"),
                            ),
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
                    )
                    .addSectionComponents(
                        new SectionBuilder()
                            .setButtonAccessory(
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Success)
                                    .setLabel("Aplicar")
                                    .setCustomId("open_up_and_reb_modal")
                                    .setDisabled(false)
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("**Upamento/Rebaixamento de Cargo**\nTroca de cargos e mensagem via canal"),
                            ),
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
                    )
                    .addSectionComponents(
                        new SectionBuilder()
                            .setButtonAccessory(
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Danger)
                                    .setLabel("Aplicar")
                                    .setCustomId("open_ban_modal")
                                    .setDisabled(false)
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("**Exoneração**\nBanimento permanente do Usuário"),
                            ),
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false),
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent("- **Toda ação realizada ficará registrada no banco de dados.**"),
                    )
                    .addActionRowComponents(
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Secondary)
                                    .setLabel("Buscar Registros")
                                    .setEmoji({ id: emojis.static.search.id })
                                    .setDisabled(false)
                                    .setCustomId("open_user_records_modal"),
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Secondary)
                                    .setLabel("Exonerados")
                                    .setEmoji({ id: emojis.static.ban.id })
                                    .setDisabled(false)
                                    .setCustomId("banned_list"),
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Secondary)
                                    .setLabel("Adv's Ativas")
                                    .setEmoji({ id: emojis.static.toggleOn.id })
                                    .setDisabled(false)
                                    .setCustomId("advs_active_list")
                            ),
                    ),
            ];

            await message.channel.send({ 
                components: container,
                files: ['./images/moderation.png'],
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: { parse: [] } 
            });

            await message.delete()

        } catch (error) {
            logger.error(`${chalk.red.bold('[ERRO]')} Erro no comando status: ${error.stack}`);
            await message.reply({
                embeds: [{
                    description: '✖ Ocorreu um erro ao executar o comando.',
                    color: 0xFF0000
                }]
            });
        }
    }
};
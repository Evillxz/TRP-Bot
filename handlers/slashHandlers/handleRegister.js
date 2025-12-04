const { 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    SeparatorSpacingSize, 
    ThumbnailBuilder, 
    SectionBuilder, 
    ContainerBuilder,
    MessageFlags,
    ButtonBuilder, 
    ButtonStyle,
    formatEmoji
} = require('discord.js');

module.exports = {
    async execute(interaction, context) {
        const { logger, emojis } = context;

        try {

            const userId = interaction.user.id;
            const guild = interaction.guild;

            const container = [
                new ContainerBuilder()
                .setAccentColor(0x000000)
                .addSectionComponents(
                new SectionBuilder()
                    .setThumbnailAccessory(
                        new ThumbnailBuilder().setURL(guild.iconURL())
                    )
                    .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent("## Registro - Trindade Penumbra®  LGC"),
                    new TextDisplayBuilder().setContent("-# [Discord **Legacy Roleplay**](https://discord.gg/rplegacy)\n-# [Requisitos para Recrutamento](https://discord.com/channels/1295702106195492894/1365081151865229412)\n-# [Canal de Atendimento/Suporte](https://discord.com/channels/1295702106195492894/1365081151865229412)"),
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
                            .setLabel("Iniciar")
                            .setEmoji({ id: emojis.static.start.id })
                            .setCustomId("open_modal_register")
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`**Clique ao lado para preencher o formulário** ${formatEmoji(emojis.static.next)}`),
                    ),
                ),
            ];

            await interaction.editReply({
                components: container,
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: { parse: [] }

            });

        } catch (error) {
            logger.error('Erro no handleRegister', error);
        }
    }
}
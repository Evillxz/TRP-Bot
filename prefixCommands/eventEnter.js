const { 
    TextDisplayBuilder, 
    SectionBuilder, 
    SeparatorBuilder, 
    SeparatorSpacingSize, 
    ButtonBuilder, 
    ButtonStyle,
    ContainerBuilder,
    MessageFlags,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    formatEmoji
} = require('discord.js');

module.exports = {
    name: 'painelevento',
    aliases: ['pe', 'pevento', 'painele'],
    description: 'Painel de eventos do servidor.',
    
    async execute(message, context) {
        const { emojis, chalk, logger } = context;

        try {

            const emoji = formatEmoji(emojis.static.next);
            
            const container = [
                new ContainerBuilder()
                .addMediaGalleryComponents(
                    new MediaGalleryBuilder()
                        .addItems(
                            new MediaGalleryItemBuilder()
                                .setURL("attachment://bannerRacing.png"),
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
                                .setLabel("Participar")
                                .setEmoji({ id: emojis.static.start.id })
                                .setCustomId("open_modal_event")
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`|| @everyone || **Participe do evento!** Preencha o **Formulário** ${emoji}`),
                        ),
                )
            ];

            await message.channel.send({ 
                components: container,
                files: ['./images/bannerRacing.png'],
                flags: MessageFlags.IsComponentsV2
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
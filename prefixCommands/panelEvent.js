const { 
    TextDisplayBuilder,
    SeparatorBuilder, 
    SeparatorSpacingSize, 
    ButtonBuilder, 
    ButtonStyle,
    ContainerBuilder,
    MessageFlags,
    ActionRowBuilder,
    formatEmoji
} = require('discord.js');

module.exports = {
    name: 'paineladmevento',
    aliases: ['padme', 'paevento', 'painelae'],
    description: 'Painel de gerenciamento de eventos do servidor.',
    
    async execute(message, context) {
        const { emojis, chalk, logger } = context;

        try {

            const emoji = formatEmoji(emojis.static.next);
            
            const container = [
                new ContainerBuilder()
                .setAccentColor(8067354)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent("## Painel de gerenciamento de Evento\n\u200b\n- Gerencie o evento atual com facilidade e rapidez!\n- Para remover um usuário, user o **Identificador único** dele."),
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
                )
                .addActionRowComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Secondary)
                                .setLabel("Lista de Participantes")
                                .setEmoji({ id: emojis.static.rules.id })
                                .setCustomId("participants_list"),
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Danger)
                                .setLabel("Remover Usuário(a)")
                                .setEmoji({ id: emojis.static.user.id })
                                .setCustomId("open_modal_remove_user_event"),
                        ),
                ),
            ];

            await message.channel.send({ 
                components: container,
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
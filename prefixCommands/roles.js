const { 
    TextDisplayBuilder, 
    ThumbnailBuilder, 
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
    name: 'painelcargos',
    aliases: ['pc', 'pcargos', 'painelc'],
    description: 'Painel de cargos do servidor.',
    
    async execute(message, context) {
        const { emojis, chalk, logger } = context;

        try {
            
            const container = [
                new ContainerBuilder()
                    .setAccentColor(8064526)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent("## Cargos Adicionais para o seu Perfil"),
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
                    )
                    .addSectionComponents(
                        new SectionBuilder()
                            .setButtonAccessory(
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Secondary)
                                    .setLabel("Obter Cargo")
                                    .setCustomId("men_role")
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("<@&1368800681741516851>"),
                            ),
                    )
                    .addSectionComponents(
                        new SectionBuilder()
                            .setButtonAccessory(
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Secondary)
                                    .setLabel("Obter Cargo")
                                    .setCustomId("women_role")
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("<@&1368800797344796832>"),
                            ),
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
                    )
                    .addSectionComponents(
                        new SectionBuilder()
                            .setButtonAccessory(
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Secondary)
                                    .setLabel("Obter Cargo")
                                    .setCustomId("veteran_role")
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("<@&1446254282318942300>"),
                            ),
                    )
                    .addSectionComponents(
                        new SectionBuilder()
                            .setButtonAccessory(
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Secondary)
                                    .setLabel("Obter Cargo")
                                    .setCustomId("newbie_role")
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("<@&1446254386413178971>"),
                            ),
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
                    )
                    .addSectionComponents(
                        new SectionBuilder()
                            .setButtonAccessory(
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Secondary)
                                    .setLabel("Obter Cargo")
                                    .setCustomId("random_deletor_role")
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("<@&1446247386736492654>"),
                            ),
                    )
                    .addSectionComponents(
                        new SectionBuilder()
                            .setButtonAccessory(
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Secondary)
                                    .setLabel("Obter Cargo")
                                    .setCustomId("m4_king_role")
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("<@&1446247456781373541>"),
                            ),
                    )
                    .addSectionComponents(
                        new SectionBuilder()
                            .setButtonAccessory(
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Secondary)
                                    .setLabel("Obter Cargo")
                                    .setCustomId("vin_diesel_role")
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("<@&1446247556114812980>"),
                            ),
                    )
                    .addSectionComponents(
                        new SectionBuilder()
                            .setButtonAccessory(
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Secondary)
                                    .setLabel("Obter Cargo")
                                    .setCustomId("playboy_role")
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("<@&1446247626923184270>"),
                            ),
                    ),
            ];

            await message.channel.send({ 
                components: container,
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: { parse: [] } 
            });

        } catch (error) {
            logger.error(`${chalk.red.bold('[ERRO]')} Erro no comando status: ${error.stack}`);
            await message.reply('❌ Ocorreu um erro ao obter as informações do bot.');
        }
    }
};
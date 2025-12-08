const { TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ContainerBuilder, MessageFlags, ThumbnailBuilder, SectionBuilder } = require('discord.js');
const database = require('database');

module.exports = {
    async execute(interaction, context) {

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const registrations = await database.getEventRegistrations();
            const guild = interaction.guild;

            if (registrations.length === 0) {
                return await interaction.editReply({
                    embeds: [{
                        description: '✖ Nenhum usuário registrado no evento ainda!',
                        color: 0xFF0000
                    }]
                });
            }

            const container = [
                new ContainerBuilder()
                .setAccentColor(8067354)
                .addSectionComponents(
                    new SectionBuilder()
                    .setThumbnailAccessory(
                        new ThumbnailBuilder().setURL(interaction.client.user.displayAvatarURL() || guild.iconURL())
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`## Lista de Participantes\n-# Total: **${registrations.length} participantes**`),
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(registrations.map((reg, index) => 
                        `### ${index + 1} - ${reg.game_nick}\n- ID (RG): **${reg.game_id}**\n- Identificador Único: **${reg.id}**\n- Prova: [Ver Prova](${reg.proof_url})`).join('\n')
                    )
                )
            ]

            await interaction.editReply({ 
                components: container,
                flags: MessageFlags.IsComponentsV2
            });

        } catch (err) {
            console.error('Erro ao buscar registros:', err);
            await interaction.editReply({
                embeds: [{
                    description: '✖ Erro ao buscar lista de participantes!',
                    color: 0xFF0000
                }]
            });
        }
    }
};

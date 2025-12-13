const { TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ContainerBuilder, MessageFlags, ThumbnailBuilder, SectionBuilder } = require('discord.js');
const api = require('apiClient');

module.exports = {
    async execute(interaction, context) {

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            let registrations = [];
            try {
                registrations = await api.get('/bot/events/list');
            } catch (err) {
                console.error('Erro ao obter registros de evento via API:', err);
                return await interaction.editReply({ embeds: [{ description: '✖ Erro ao conectar na API de eventos. Tente novamente mais tarde.', color: 0xFF0000 }] });
            }
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
                        `### ${index + 1} - ${reg.game_nick} (${reg.game_id})\n- Identificador Único: **${reg.id}**\n- Prova: [Ver Prova](${reg.proof_url})`).join('\n')
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

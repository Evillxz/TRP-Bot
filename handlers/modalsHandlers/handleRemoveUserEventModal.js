const { ModalBuilder, LabelBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');

module.exports = {
    async execute(interaction) {
        const member = interaction.member;
        const hasPermissionRole = member.roles.cache.has('1447573012160450611');
        
        if (!hasPermissionRole) {
            return await interaction.reply({
                embeds: [{
                    description: '✖ Você não tem permissão para executar esta ação!',
                    color: 0xFF0000
                }],
                flags: MessageFlags.Ephemeral
            });
        }

        const modal = new ModalBuilder()
        .setTitle("Buscar Usuário")
        .setCustomId("modal_remove_user_event")
        .addLabelComponents(
            new LabelBuilder()
            .setLabel("Identificdor do Usuário(a)")
            .setDescription("Use o \"Identificador Único\" que aparece na lista de participantes.")
            .setTextInputComponent(
                new TextInputBuilder()
                    .setCustomId("id_remove_user_text_input")
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Insira o "Identificador Único"...')
            )
        )

        await interaction.showModal(modal);
    }
}
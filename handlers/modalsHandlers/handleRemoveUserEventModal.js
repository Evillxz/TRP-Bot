const { ModalBuilder, LabelBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    async execute(interaction) {

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
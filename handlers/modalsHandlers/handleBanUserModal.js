const { LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, UserSelectMenuBuilder, TextDisplayBuilder, formatEmoji } = require('discord.js');
const emojis = require('emojis');

module.exports = {
    async execute(interaction) {

        const modal = new ModalBuilder()
            .setTitle("Aplicar Exoneração")
            .setCustomId("modal_ban")
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                .setContent(`-# ${formatEmoji(emojis.static.alert)} Esta ação ficará registrada no banco de dados!`)
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Usuário(a)")
                .setDescription("Usuário(a) que será Exonerado")
                .setUserSelectMenuComponent(
                    new UserSelectMenuBuilder()
                    .setCustomId("user_modal_ban_select")
                    .setPlaceholder("Selecione ou busque pelo nome...")
                )
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Motivo")
                .setTextInputComponent(
                    new TextInputBuilder()
                        .setCustomId("reason_text_input_ban")
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder("Recomendamos a quebra de linha a cada 50 caracteres...")
                        .setMinLength(10)
                        .setMaxLength(300)
                )
            )
            
        
        interaction.showModal(modal);
        
    }
}; 
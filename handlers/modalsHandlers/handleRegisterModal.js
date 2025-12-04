const { 
    LabelBuilder, 
    ModalBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder, 
    TextDisplayBuilder, 
    TextInputBuilder, 
    TextInputStyle
} = require('discord.js');

module.exports = {
    async execute(interaction) {

        const modal = new ModalBuilder()
            .setTitle("Registro")
            .setCustomId("modal_register")
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                .setContent("### Preencha os campos abaixo com os dados corretos!\n- **Nick:** Seu nick no jogo\n- **Id:** Seu id no jogo\n- **Idade:** Sua idade real")
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Nickname (Nome)")
                .setTextInputComponent(
                    new TextInputBuilder()
                        .setCustomId("nick_text_input")
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder("Digite aqui...")
                )
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Identificador (ID)")
                .setTextInputComponent(
                    new TextInputBuilder()
                        .setCustomId("id_text_input")
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder("Exemplo: 112233 - 1122 - 11")
                )
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Idade")
                .setStringSelectMenuComponent(
                    new StringSelectMenuBuilder()
                    .setCustomId("age_select_menu")
                    .setPlaceholder("Selecione uma opção...")
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                        .setLabel("Tenho mais de 18 anos")
                        .setEmoji("🔺")
                        .setValue("legal_age_select_menu")
                        .setDescription("Selecione se for o seu caso"),
                        new StringSelectMenuOptionBuilder()
                        .setLabel("Tenho menos de 18 anos")
                        .setEmoji("🔻")
                        .setValue("not_legal_age_select_menu")
                        .setDescription("Selecione se for o seu caso")
                    )
                )
            )
        
        interaction.showModal(modal);
        
    }
}; 
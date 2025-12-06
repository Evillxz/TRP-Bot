const { 
    LabelBuilder, 
    ModalBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder, 
    TextDisplayBuilder, 
    TextInputBuilder, 
    TextInputStyle
} = require('discord.js');
const emojis = require('emojis');

module.exports = {
    async execute(interaction) {

        const modal = new ModalBuilder()
            .setTitle("Registro")
            .setCustomId("modal_register")
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                .setContent("### Preencha os campos abaixo com os dados corretos!\n- **Nick:** Seu nick no jogo\n- **Id:** Seu id no jogo\n- **Idade:** Sua idade real\n- **Recrutador:** A pessoa que te recrutou")
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
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Quem te Recrutou?")
                .setStringSelectMenuComponent(
                    new StringSelectMenuBuilder()
                    .setCustomId("rec_select_menu")
                    .setPlaceholder("Selecione a pessoa que te recrutou...")
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                        .setLabel("TRP » John Wick [777]")
                        .setValue("592399866072793114")
                        .setEmoji({ id: emojis.static.green.id })
                        .setDescription("( Dono - Recrutador ) Selecione se for esta pessoa."),
                        new StringSelectMenuOptionBuilder()
                        .setLabel("TRP » Albert Smirnov [641]")
                        .setValue("1082408484231983165")
                        .setEmoji({ id: emojis.static.green.id })
                        .setDescription("( Sub-Dono - Recrutador ) Selecione se for esta pessoa."),
                        new StringSelectMenuOptionBuilder()
                        .setLabel("TRP » Brunim Vrau [852]")
                        .setValue("353147322429079553")
                        .setEmoji({ id: emojis.static.green.id })
                        .setDescription("( Gerente - Recrutador ) Selecione se for esta pessoa."),
                        new StringSelectMenuOptionBuilder()
                        .setLabel("TRP » Gomezzx [560]")
                        .setValue("744415492000972844")
                        .setEmoji({ id: emojis.static.green.id })
                        .setDescription("( Gerente - Recrutador ) Selecione se for esta pessoa."),
                    )
                )
            )
        
        interaction.showModal(modal);
        
    }
}; 
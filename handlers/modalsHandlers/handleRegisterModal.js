const { 
    LabelBuilder, 
    ModalBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    TextInputBuilder, 
    TextInputStyle,
    MessageFlags
} = require('discord.js');
const emojis = require('emojis');
const database = require('database');

module.exports = {
    async execute(interaction) {

        const register = await database.getRegister(interaction.user.id, interaction.guild.id);
        if (register) {
            return await interaction.reply({
                embeds: [
                    {
                        description: '✖ Vocês já está registrado!',
                        color: 0xFF0000
                    }
                ],
                flags: MessageFlags.Ephemeral
            });
        }

        const modal = new ModalBuilder()
            .setTitle("Registro")
            .setCustomId("modal_register")
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Nickname (Nome)")
                .setTextInputComponent(
                    new TextInputBuilder()
                    .setCustomId("nick_text_input")
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder("Insira apenas seu nome dentro do jogo...")
                )
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Identificador (ID)")
                .setTextInputComponent(
                    new TextInputBuilder()
                    .setCustomId("id_text_input")
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder("Formatos: 1122 - 123")
                )
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel('Número de Telefone')
                .setTextInputComponent(
                    new TextInputBuilder()
                    .setCustomId('phone_text_input')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Seu número de telefone dentro do jogo...')
                )
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Disponibilidade de Horário")
                .setStringSelectMenuComponent(
                    new StringSelectMenuBuilder()
                    .setCustomId("availability_select_menu")
                    .setPlaceholder("Selecione uma opção...")
                    .setMaxValues(3)
                    .setMinValues(1)
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                        .setLabel("Mais ativo pela manhã")
                        .setEmoji({ id: emojis.static.sun.id })
                        .setValue("1447988476237709392")
                        .setDescription("Selecione se você for ativo pela manhã."),
                        new StringSelectMenuOptionBuilder()
                        .setLabel("Mais ativo pela tarde")
                        .setEmoji({ id: emojis.static.sunMoon.id })
                        .setValue("1447988532932120588")
                        .setDescription("Selecione se você for ativo pela tarde."),
                        new StringSelectMenuOptionBuilder()
                        .setLabel("Mais ativo pela noite")
                        .setEmoji({ id: emojis.static.moon.id })
                        .setValue("1447988583217758318")
                        .setDescription("Selecione se você for ativo pela noite.")
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
        
        await interaction.showModal(modal);
        
    }
}; 
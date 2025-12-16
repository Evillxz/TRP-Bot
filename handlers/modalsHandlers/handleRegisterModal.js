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
const api = require('apiClient');

module.exports = {
    async execute(interaction) {
        const member = interaction.member;
        const hasProgrammerRole = member.roles.cache.has('1365475846843928617');

        if (!hasProgrammerRole) {
            let register;
            try {
                register = await api.get(`/bot/memberprofile/${interaction.user.id}/${interaction.guild.id}`);
            } catch (err) {
                console.error('Erro ao consultar registro via API:', err);
                return await interaction.reply({ embeds: [{ description: '✖ Erro ao consultar registro. Tente novamente mais tarde.', color: 0xFF0000 }], flags: MessageFlags.Ephemeral });
            }

            if (register) {
                return await interaction.reply({ embeds: [{ description: '✖ Você já está registrado!', color: 0xFF0000 }], flags: MessageFlags.Ephemeral });
            }
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
                    .setMaxLength(4)
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
                    .setMaxLength(6)
                    .setMinLength(6)
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
                        .setDescription("( Braço Esquerdo - Recrutador ) Selecione se for esta pessoa."),
                        new StringSelectMenuOptionBuilder()
                        .setLabel("TRP » Gomezzx [560]")
                        .setValue("744415492000972844")
                        .setEmoji({ id: emojis.static.green.id })
                        .setDescription("( Gerente - Recrutador ) Selecione se for esta pessoa."),
                        new StringSelectMenuOptionBuilder()
                        .setLabel("TRP » Marcos Correia [234]")
                        .setValue("490119492597186571")
                        .setEmoji({ id: emojis.static.green.id })
                        .setDescription("( Gerente - Recrutador ) Selecione se for esta pessoa."),
                        new StringSelectMenuOptionBuilder()
                        .setLabel("TRP » REI [686]")
                        .setValue("780606242183708722")
                        .setEmoji({ id: emojis.static.green.id })
                        .setDescription("( Gerente - Recrutador ) Selecione se for esta pessoa."),
                    )
                )
            )
        
        await interaction.showModal(modal);
        
    }
}; 
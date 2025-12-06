const { LabelBuilder, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, TextInputStyle, UserSelectMenuBuilder, TextDisplayBuilder } = require('discord.js');
const emojis = require('emojis');

module.exports = {
    async execute(interaction) {

        const modal = new ModalBuilder()
            .setTitle("Aplicar Advertência")
            .setCustomId("modal_adv")
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                .setContent("-# Esta ação ficará registrada no banco de dados!")
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Usuário(a)")
                .setDescription("Usuário(a) que receberá a Advertência")
                .setUserSelectMenuComponent(
                    new UserSelectMenuBuilder()
                    .setCustomId("user_modal_adv_select")
                    .setPlaceholder("Selecione ou busque pelo nome...")
                )
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Motivo")
                .setTextInputComponent(
                    new TextInputBuilder()
                        .setCustomId("reason_text_input_adv")
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder("Recomendamos a quebra de linha a cada 50 caracteres...")
                        .setMinLength(10)
                        .setMaxLength(300)
                )
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Duração da Advertência")
                .setStringSelectMenuComponent(
                    new StringSelectMenuBuilder()
                    .setCustomId("duration_select_adv")
                    .setPlaceholder("Selecione clicando aqui...")
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                        .setLabel("24 horas (1 Dia)")
                        .setEmoji({ id: emojis.static.clock.id })
                        .setValue("24_hours_adv_select")
                        .setDescription("Expira automaticamente após um dia.")
                        .setDefault(true),
                        new StringSelectMenuOptionBuilder()
                        .setLabel("48 horas (2 Dias)")
                        .setEmoji({ id: emojis.static.clock.id })
                        .setValue("48_hours_adv_select")
                        .setDescription("Expira automaticamente após dois dias."),
                        new StringSelectMenuOptionBuilder()
                        .setLabel("120 horas (5 Dias)")
                        .setEmoji({ id: emojis.static.clock.id })
                        .setValue("120_hours_adv_select")
                        .setDescription("Expira automaticamente após cinco dias."),
                        new StringSelectMenuOptionBuilder()
                        .setLabel("240 horas (10 Dias)")
                        .setEmoji({ id: emojis.static.clock.id })
                        .setValue("240_hours_adv_select")
                        .setDescription("Expira automaticamente após dez dias."),
                        new StringSelectMenuOptionBuilder()
                        .setLabel("480 horas (20 Dias)")
                        .setEmoji({ id: emojis.static.clock.id })
                        .setValue("480_hours_adv_select")
                        .setDescription("Expira automaticamente após vinte dias."),
                        new StringSelectMenuOptionBuilder()
                        .setLabel("720 horas (1 Mês)")
                        .setEmoji({ id: emojis.static.clock.id })
                        .setValue("720_hours_adv_select")
                        .setDescription("Expira automaticamente após trinta dias."),
                        new StringSelectMenuOptionBuilder()
                        .setLabel("1440 horas (2 Mêses)")
                        .setEmoji({ id: emojis.static.clock.id })
                        .setValue("1440_hours_adv_select")
                        .setDescription("Expira automaticamente após sessenta dias."),
                        new StringSelectMenuOptionBuilder()
                        .setLabel("2160 horas (3 Mêses)")
                        .setEmoji({ id: emojis.static.clock.id })
                        .setValue("2160_hours_adv_select")
                        .setDescription("Expira automaticamente após noventa dias."),
                        new StringSelectMenuOptionBuilder()
                        .setLabel("Permanente (∞)")
                        .setEmoji({ id: emojis.static.clock.id })
                        .setValue("permanent_adv_select")
                        .setDescription("Sem data de expiração (Pra sempre... é muito tempo)")
                    )
                )
            )
        
        interaction.showModal(modal);
        
    }
}; 
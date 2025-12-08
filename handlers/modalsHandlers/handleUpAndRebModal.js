const { LabelBuilder, ModalBuilder, RoleSelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, TextInputStyle, UserSelectMenuBuilder, MessageFlags } = require('discord.js');
const emojis = require('emojis');

module.exports = {
    async execute(interaction) {
        const member = interaction.member;
        const hasPermissionRole = member.roles.cache.has('1447573939365871656');
        
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
            .setTitle("Upar/Rebaixar Usuário(a)")
            .setCustomId("modal_up_and_reb")
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Ação (Up/Reb)")
                .setStringSelectMenuComponent(
                    new StringSelectMenuBuilder()
                    .setCustomId("up_or_reb_select")
                    .setPlaceholder("Selecione uma opção")
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                        .setLabel("Upamento")
                        .setEmoji({ id: emojis.static.up.id })
                        .setValue("up_option_select")
                        .setDescription("Selecione se quiser upar um Usuário(a)."),
                        new StringSelectMenuOptionBuilder()
                        .setLabel("Rebaixamento")
                        .setEmoji({ id: emojis.static.down.id })
                        .setValue("reb_option_select")
                        .setDescription("Selecione se quiser rebaixar um Usuário(a).")
                    )
                )
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Usuário(a)")
                .setUserSelectMenuComponent(
                    new UserSelectMenuBuilder()
                    .setCustomId("user_modal_up_and_reb_select")
                    .setPlaceholder("Selecione ou busque pelo nome...")
                )
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Cargo a ser Adicionado")
                .setRoleSelectMenuComponent(
                    new RoleSelectMenuBuilder()
                    .setCustomId("role_add_up_and_reb_select")
                    .setPlaceholder("Cargo que será adicionado...")
                )
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Cargo a ser Removido")
                .setRoleSelectMenuComponent(
                    new RoleSelectMenuBuilder()
                    .setCustomId("role_remove_up_and_reb_select")
                    .setPlaceholder("Cargo que será removido...")
                )
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Motivo")
                .setTextInputComponent(
                    new TextInputBuilder()
                        .setCustomId("reason_text_input_up_and_reb")
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder("Digite o motivo do upamento...")
                        .setMinLength(10)
                        .setMaxLength(300)
                )
            )
        
        interaction.showModal(modal);
        
    }
}; 
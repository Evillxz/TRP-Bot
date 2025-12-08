const { LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, UserSelectMenuBuilder, TextDisplayBuilder, formatEmoji, MessageFlags } = require('discord.js');
const emojis = require('emojis');

module.exports = {
    async execute(interaction) {
        const member = interaction.member;
        const hasPermissionRole = member.roles.cache.has('1447573798441193654');
        
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
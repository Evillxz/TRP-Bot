const { ModalBuilder, LabelBuilder, UserSelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const emojis = require('emojis');

module.exports = {
    async execute(interaction) {

        const modal = new ModalBuilder()
            .setTitle('Buscar Registro de Usuário')
            .setCustomId('modal_search_register')
            .addLabelComponents(
                new LabelBuilder()
                .setLabel('Usuário')
                .setDescription('O Usuário(a) que será realizada a busca')
                .setUserSelectMenuComponent(
                    new UserSelectMenuBuilder()
                    .setCustomId('user_select_modal_search')
                    .setPlaceholder('Selecione ou busque pelo nome...')
                    .setRequired(true)
                )
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel('Categoria')
                .setDescription('Selecione qual a categoria da busca')
                .setStringSelectMenuComponent(
                    new StringSelectMenuBuilder()
                    .setCustomId('category_select_modal_search')
                    .setPlaceholder('Selecione uma categoria...')
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                        .setLabel('Registros de Advertências')
                        .setDescription('Selecione para ver os registros de adv do Usuário(a).')
                        .setEmoji({ id: emojis.static.alert.id })
                        .setValue('adv_option_select'),
                        new StringSelectMenuOptionBuilder()
                        .setLabel('Registros de Upamento')
                        .setDescription('Selecione para ver os registros de up do Usuário(a).')
                        .setEmoji({ id: emojis.static.up.id })
                        .setValue('up_option_select'),
                         new StringSelectMenuOptionBuilder()
                        .setLabel('Registros de Rebaixamento')
                        .setDescription('Selecione para ver os registros de reb do Usuário(a).')
                        .setEmoji({ id: emojis.static.down.id })
                        .setValue('reb_option_select'),
                         new StringSelectMenuOptionBuilder()
                        .setLabel('Perfil do Usuário(a)')
                        .setDescription('Selecione para ver uma visão geral do Usuário(a).')
                        .setEmoji({ id: emojis.static.user.id })
                        .setValue('profile_option_select')
                    )
                )
            )

        await interaction.showModal(modal);

    }
}
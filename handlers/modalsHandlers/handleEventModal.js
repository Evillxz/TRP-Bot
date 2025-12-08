const { ModalBuilder, LabelBuilder, TextInputBuilder, TextInputStyle, FileUploadBuilder, MessageFlags } = require('discord.js');
const database = require('database');

module.exports = {
    async execute(interaction) {
        const member = interaction.member;
        const hasOrganizerRole = member.roles.cache.has('1447573012160450611');
        
        if (!hasOrganizerRole) {
            const isRegistered = await database.isUserRegisteredInEvent(interaction.user.id);
            
            if (isRegistered) {
                return await interaction.reply({
                    embeds: [{
                        description: '✖ Você já está registrado no evento!',
                        color: 0xFF0000
                    }],
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        const modal = new ModalBuilder()
        .setCustomId('modal_event')
        .setTitle('Participar do Evento')
        .addLabelComponents(
            new LabelBuilder()
            .setLabel('Nickname')
            .setDescription('Insira o seu nome no jogo')
            .setTextInputComponent(
                new TextInputBuilder()
                .setCustomId('nick_text_input')
                .setPlaceholder('Insira o nome do personagem...')
                .setStyle(TextInputStyle.Short)
                .setMinLength(5)
                .setMaxLength(100)
            )
        )
        .addLabelComponents(
            new LabelBuilder()
            .setLabel('ID (Seu RG)')
            .setDescription('Insira o seu RG dentro do jogo')
            .setTextInputComponent(
                new TextInputBuilder()
                .setCustomId('id_text_input')
                .setPlaceholder('Insira o ID do personagem...')
                .setStyle(TextInputStyle.Short)
                .setMinLength(3)
                .setMaxLength(6)
            )
        )
        .addLabelComponents(
            new LabelBuilder()
            .setLabel('Prova (Print In-game)')
            .setDescription('Carregue uma imagem do seu personagem')
            .setFileUploadComponent(
                new FileUploadBuilder()
                .setCustomId('proof_file_upload')
                .setMinValues(1)
                .setMaxValues(1)
            )
        )

        await interaction.showModal(modal);
    }
}
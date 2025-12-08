const { MessageFlags } = require('discord.js');
const database = require('database');

module.exports = {
    async execute(interaction, context) {
        const { logger } = context;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {

            const nick = interaction.fields.getTextInputValue('nick_text_input');
            const id = interaction.fields.getTextInputValue('id_text_input');
            const image = interaction.fields.getUploadedFiles('proof_file_upload').first();

            const registrationId = await database.addEventRegistration(
                interaction.user.id,
                interaction.user.tag,
                nick,
                id,
                image?.url || ''
            );

            await interaction.editReply({
                embeds: [{
                    description: `✔ Você entrou no evento!\n-# Seu Identificador Único: **#${registrationId}**`,
                    color: 0x00FF00
                }]
            })

        } catch (err) {
            logger.error(`Erro interno no sistema:`, err);

            await interaction.editReply({
                embeds: [{
                    description: '✖ Erro interno no sistema!',
                    color: 0xFF0000
                }]
            })
        }
    }
};
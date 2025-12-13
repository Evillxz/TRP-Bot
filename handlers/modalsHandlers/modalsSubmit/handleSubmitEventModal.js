const { MessageFlags } = require('discord.js');
const api = require('apiClient');

module.exports = {
    async execute(interaction, context) {
        const { logger } = context;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {

            const nick = interaction.fields.getTextInputValue('nick_text_input');
            const id = interaction.fields.getTextInputValue('id_text_input');
            const image = interaction.fields.getUploadedFiles('proof_file_upload').first();

            const r = await api.post('/bot/events/register', {
                discord_id: interaction.user.id,
                discord_tag: interaction.user.tag,
                game_nick: nick,
                game_id: id,
                proof_url: image?.url || ''
            });
            const registrationId = r.id;

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
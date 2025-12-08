const { MessageFlags } = require("discord.js");
const database = require('database');

module.exports = {
    async execute(interaction, context) {
        const { logger } = context;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const idUserRemove = interaction.fields.getTextInputValue('id_remove_user_text_input');
            const id = parseInt(idUserRemove);

            if (isNaN(id)) {
                return await interaction.editReply({
                    embeds: [{
                        description: '✖ ID inválido! Insira apenas números.',
                        color: 0xFF0000
                    }]
                });
            }

            const removed = await database.removeEventRegistration(id);

            if (removed) {
                await interaction.editReply({
                    embeds: [{
                        description: `✔ Participante #${id} removido com sucesso!`,
                        color: 0x00FF00
                    }]
                });
            } else {
                await interaction.editReply({
                    embeds: [{
                        description: `✖ Participante #${id} não encontrado!`,
                        color: 0xFF0000
                    }]
                });
            }

        } catch (err) {
            logger.error('Erro ao remover participante:', err);
            await interaction.editReply({
                embeds: [{
                    description: '✖ Erro ao remover participante!',
                    color: 0xFF0000
                }]
            });
        }
    }
}
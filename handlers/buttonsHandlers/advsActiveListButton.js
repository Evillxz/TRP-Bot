const { 
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    formatEmoji,
    ThumbnailBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize
} = require('discord.js');
const api = require('apiClient');

function formatarDataBR(dateString, ajustarFuso = true, retornarTimestamp = false) {
    const d = new Date(dateString);

    if (ajustarFuso) {
        d.setHours(d.getHours() - 3);
    }

    if (retornarTimestamp) {
        return Math.floor(d.getTime() / 1000);
    }

    const dia = d.getDate().toString().padStart(2, "0");
    const mes = (d.getMonth() + 1).toString().padStart(2, "0");
    const ano = d.getFullYear();

    const horas = d.getHours().toString().padStart(2, "0");
    const minutos = d.getMinutes().toString().padStart(2, "0");

    return `${dia}/${mes}/${ano}, ${horas}:${minutos}`;
}


module.exports = {
    async execute(interaction, context) {
        const { logger, emojis } = context;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {

            const emojiOn = formatEmoji(emojis.static.toggleOn);
            let warnings = [];
            try {
                warnings = await api.get(`/bot/warnings/active_guild/${interaction.guild.id}`);
            } catch (err) {
                logger && logger.error('Erro ao obter advertências via API:', err);
                return interaction.editReply({ embeds: [{ description: '✖ Erro ao conectar na API de advertências. Tente novamente mais tarde.', color: 0xFF0000 }] });
            }

            if (warnings.length === 0) {
                return interaction.editReply({
                    embeds: [{
                        description: '✖ Nenhuma advertência encontrada.',
                        color: 0xFF0000
                    }]
                });
            }

            const now = new Date().toLocaleString('pt-BR');
            let response = `### Advertência `;
            
            warnings.forEach(warning => {

                const criadoEm = formatarDataBR(warning.created_at, true, true);
                const expiraEm = warning.expires_at ? formatarDataBR(warning.expires_at, false, true) : "**em 0 horas (Permanente)**";

                response += ` ${warning.id}\n\n`;
                response += `- Status: \` 🟢 Ativa \`\n`;
                response += `- Usuário: <@${warning.user_id}> **(${warning.user_tag})**\n`;
                response += `- Responsável: <@${warning.admin_id}>\n`;
                response += `- Criada em <t:${criadoEm}:f>\n`;
                response += `- Expira <t:${expiraEm}:R>\n`;
                response += `- Motivo: \` ${warning.reason} \``;
            });

            const container = [
                new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                    .setThumbnailAccessory(
                        new ThumbnailBuilder().setURL(interaction.guild.iconURL() || '')
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`## ${emojiOn} Advertências Ativasㅤㅤ\nExibindo **Advertências Ativas**`)
                    )
                )
                .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${response}\n\u200b\n-# Máfia Trindade Penumbra® • ${now}`)
                )
            ];

            await interaction.editReply({
                components: container,
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: { parse: [] }
            });
            
        } catch (error) {
            logger.error('Erro ao verificar advertências:', error);
            await interaction.editReply({
                embeds: [{
                    description: '✖ Ocorreu um erro interno no sistema!',
                    color: 0xFF0000
                }]
            });
        }
    }
};
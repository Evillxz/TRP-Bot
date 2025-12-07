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
const database = require('database');

function formatarDataBR(dateString) {
    const d = new Date(dateString);
    const isUTC = dateString.endsWith("Z");

    const dia     = (isUTC ? d.getUTCDate()      : d.getDate()).toString().padStart(2, "0");
    const mes     = ((isUTC ? d.getUTCMonth()    : d.getMonth()) + 1).toString().padStart(2, "0");
    const ano     = (isUTC ? d.getUTCFullYear()  : d.getFullYear());

    const horas   = (isUTC ? d.getUTCHours()     : d.getHours()).toString().padStart(2, "0");
    const minutos = (isUTC ? d.getUTCMinutes()   : d.getMinutes()).toString().padStart(2, "0");
    // const segundos= (isUTC ? d.getUTCSeconds()   : d.getSeconds()).toString().padStart(2, "0");

    return `${dia}/${mes}/${ano}, ${horas}:${minutos}`;
}

module.exports = {
    async execute(interaction, context) {
        const { logger, emojis } = context;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {

            const emojiOn = formatEmoji(emojis.static.toggleOn);
            const query = `SELECT * FROM warnings WHERE guild_id = ? ORDER BY created_at DESC LIMIT 10`;
            
            const warnings = await new Promise((resolve, reject) => {
                database.db.all(query, [interaction.guild.id], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

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

                const criadoEm = formatarDataBR(warning.created_at);
                const expiraEm = warning.expires_at ? formatarDataBR(warning.expires_at) : "Permanente";

                response += ` \` ${warning.id} \`\n\n`;
                response += `- Status: \` 🟢 Ativa \`\n`;
                response += `- Usuário: <@${warning.user_id}> **(${warning.user_tag})**\n`;
                response += `- Responsável: <@${warning.admin_id}>\n`;
                response += `- Criada em: **${criadoEm}**\n`;
                response += `- Expira em: **${expiraEm}**\n`;
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
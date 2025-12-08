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

function formatarDataBR(dateString, ajustarFuso = true, retornarTimestamp = false) {
    const d = new Date(dateString);
    if (ajustarFuso) d.setHours(d.getHours() - 3);
    if (retornarTimestamp) return Math.floor(d.getTime() / 1000);
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
            const emojiBan = formatEmoji(emojis.static.ban);
            const bans = await database.getBans(interaction.guild.id, 100);

            if (bans.length === 0) {
                return interaction.editReply({
                    embeds: [{
                        description: '✖ Nenhum banimento encontrado.',
                        color: 0xFF0000
                    }]
                });
            }

            const now = new Date().toLocaleString('pt-BR');
            let response = '';
            
            bans.forEach(ban => {
                const criadoEm = formatarDataBR(ban.created_at, true, true);
                response += `### Banimento ${ban.id}\n\n`;
                response += `- Usuário: <@${ban.user_id}> **(${ban.user_tag})**\n`;
                response += `- Responsável: <@${ban.admin_id}>\n`;
                response += `- Data: <t:${criadoEm}:f>\n`;
                response += `- Motivo: \` ${ban.reason} \`\n\n`;
            });

            const container = [
                new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                    .setThumbnailAccessory(
                        new ThumbnailBuilder().setURL(interaction.guild.iconURL() || '')
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`## ${emojiBan} Lista de Banimentos\nExibindo **${bans.length}** banimento(s)`)
                    )
                )
                .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${response}\u200b\n-# Máfia Trindade Penumbra® • ${now}`)
                )
            ];

            await interaction.editReply({
                components: container,
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: { parse: [] }
            });
            
        } catch (error) {
            logger.error('Erro ao listar banimentos:', error);
            await interaction.editReply({
                embeds: [{
                    description: '✖ Ocorreu um erro interno no sistema!',
                    color: 0xFF0000
                }]
            });
        }
    }
};

const { 
    TextDisplayBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ContainerBuilder,
    MessageFlags,
    SectionBuilder,
    ThumbnailBuilder,
    formatEmoji
} = require('discord.js');
const api = require('apiClient');

module.exports = {
    name: 'psorteio',
    aliases: ['ps', 'psorteio', 'painels'],
    description: 'Painel de sorteios do servidor.',
    
    async execute(message, context) {
        const { emojis, chalk, logger } = context;

        try {

            const check = formatEmoji(emojis.animated.check, true);
            const crown = formatEmoji(emojis.static.crown);
            let count = 0;
            try {
                const participants = await api.get('/bot/raffle/active');
                count = Array.isArray(participants) ? participants.length : 0;
            } catch (err) {
                logger && logger.error('Erro ao obter participantes da API:', err);
                return message.reply({ embeds: [{ description: '✖ Erro ao conectar na API do sorteio. Tente novamente mais tarde.', color: 0xFF0000 }] });
            }

            const container = [
                new TextDisplayBuilder().setContent("|| @everyone @here ||"),
                new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                    .setThumbnailAccessory(
                        new ThumbnailBuilder()
                            .setURL(message.client.user.displayAvatarURL() || '')
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`## ${crown} Sorteio: 30 dias de VIP Ouroㅤㅤ\n### Requisitos:\n- Não ter **VIP** ativo.\n- Estar **On** no dia **14 de Dezembro** as \`20:30\`\nﾠ`),
                    ),
                )
                .addSectionComponents(
                    new SectionBuilder()
                    .setButtonAccessory(
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Success)
                            .setLabel(`Entrar (${count})`)
                            .setEmoji({ id: emojis.static.gift.id })
                            .setCustomId("raffle_enter")
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`-# ${check} Powered by <@490119492597186571>`),
                    ),
                ),
            ];

            await message.channel.send({ 
                components: container,
                flags: MessageFlags.IsComponentsV2
            });

            await message.delete();

        } catch (error) {
            logger.error(`${chalk.red.bold('[ERRO]')} Erro no comando status: ${error.stack}`);
            await message.reply({
                embeds: [{
                    description: '✖ Ocorreu um erro ao executar o comando.',
                    color: 0xFF0000
                }]
            });
        }
    }
};
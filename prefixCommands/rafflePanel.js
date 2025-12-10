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
const database = require('database');

module.exports = {
    name: 'psorteio',
    aliases: ['ps', 'psorteio', 'painels'],
    description: 'Painel de sorteios do servidor.',
    
    async execute(message, context) {
        const { emojis, chalk, logger } = context;

        try {

            const check = formatEmoji(emojis.animated.check, true);
            const crown = formatEmoji(emojis.static.crown);
            const count = await database.countActiveRaffleParticipants();

            const container = [
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
module.exports = {
    name: 'pause',
    aliases: ['pausar'],
    description: 'Pausa a música atual',
    execute(message, context) {
        const player = message.client.manager.players.get(message.guild.id);

        if (!player) {
            return message.reply('❌ Não há nada tocando!');
        }

        if (!message.member.voice.channel) {
            return message.reply('❌ Você precisa estar no canal de voz!');
        }

        if (player.paused) {
            return message.reply('⏸️ A música já está pausada!');
        }

        player.pause(true);
        message.reply('⏸️ Música pausada!');
    }
};

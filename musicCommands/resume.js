module.exports = {
    name: 'resume',
    aliases: ['continuar', 'despausar'],
    description: 'Retoma a música pausada',
    execute(message, context) {
        const player = message.client.manager.players.get(message.guild.id);

        if (!player) {
            return message.reply('❌ Não há nada tocando!');
        }

        if (!message.member.voice.channel) {
            return message.reply('❌ Você precisa estar no canal de voz!');
        }

        if (!player.paused) {
            return message.reply('▶️ A música não está pausada!');
        }

        player.pause(false);
        message.reply('▶️ Música retomada!');
    }
};

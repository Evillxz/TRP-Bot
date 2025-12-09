module.exports = {
    name: 'stop',
    aliases: ['parar', 'desconectar', 'dc'],
    description: 'Para a música e limpa a fila',
    execute(message, context) {
        const player = message.client.manager.players.get(message.guild.id);

        if (!player) {
            return message.reply('❌ Não há nada tocando!');
        }

        if (!message.member.voice.channel) {
            return message.reply('❌ Você precisa estar no canal de voz!');
        }

        player.destroy();
        message.reply('⏹️ Música parada e desconectado do canal!');
    }
};

module.exports = {
    name: 'skip',
    aliases: ['pular', 's'],
    description: 'Pula para a próxima música',
    execute(message, context) {
        const player = message.client.manager.players.get(message.guild.id);

        if (!player) {
            return message.reply('❌ Não há nada tocando!');
        }

        if (!message.member.voice.channel) {
            return message.reply('❌ Você precisa estar no canal de voz!');
        }

        if (!player.queue.current) {
            return message.reply('❌ Não há música tocando!');
        }

        const currentTrack = player.queue.current;
        player.skip();
        message.reply(`⏭️ Música pulada: **${currentTrack.title}**`);
    }
};

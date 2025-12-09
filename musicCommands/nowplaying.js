module.exports = {
    name: 'nowplaying',
    aliases: ['np', 'tocando', 'atual'],
    description: 'Mostra a música atual',
    execute(message, context) {
        const player = message.client.manager.players.get(message.guild.id);

        if (!player || !player.queue.current) {
            return message.reply('❌ Não há nada tocando!');
        }

        const track = player.queue.current;
        const position = player.shoukaku.position;
        const duration = track.length;

        const formatTime = (ms) => {
            const minutes = Math.floor(ms / 60000);
            const seconds = Math.floor((ms % 60000) / 1000);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };

        message.reply(
            `🎵 **Tocando agora:**\n` +
            `**${track.title}**\n` +
            `Autor: ${track.author}\n` +
            `Duração: ${formatTime(position)} / ${formatTime(duration)}\n` +
            `Link: ${track.uri}`
        );
    }
};

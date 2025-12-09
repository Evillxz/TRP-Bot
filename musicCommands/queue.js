module.exports = {
    name: 'queue',
    aliases: ['q', 'fila'],
    description: 'Mostra a fila de músicas',
    execute(message, context) {
        const player = message.client.manager.players.get(message.guild.id);

        if (!player || !player.queue.current) {
            return message.reply('❌ Não há nada tocando!');
        }

        const current = player.queue.current;
        const upcoming = player.queue.slice(0, 10);

        let queueString = `🎵 **Tocando agora:**\n${current.title} - ${current.author}\n\n`;

        if (upcoming.length > 0) {
            queueString += `**Próximas músicas:**\n`;
            upcoming.forEach((track, i) => {
                queueString += `${i + 1}. ${track.title} - ${track.author}\n`;
            });
        }

        if (player.queue.length > 10) {
            queueString += `\n... e mais ${player.queue.length - 10} música(s)`;
        }

        message.reply(queueString);
    }
};

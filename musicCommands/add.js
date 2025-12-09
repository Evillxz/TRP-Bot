const { formatEmoji, MessageFlags } = require('discord.js');
const musicPanelManager = require('../utils/musicPanelManager');
const emojis = require('emojis');

module.exports = {
    name: 'add',
    aliases: ['adicionar', 'a'],
    description: 'Adiciona uma música à fila',
    async execute(message, context) {
        const player = message.client.manager.players.get(message.guild.id);
        
        if (!player) {
            const reply = await message.reply({
                embeds: [{
                    description: `✖ Use !play primeiro para iniciar o player!`,
                    color: 0xFF0000
                }],
                flags: MessageFlags.Ephemeral
            });
            setTimeout(() => reply.delete().catch(() => {}), 5000);
            return;
        }

        if (!message.member.voice.channel) {
            const reply = await message.reply({
                embeds: [{
                    description: `✖ Você precisa estar em um canal de voz!`,
                    color: 0xFF0000
                }],
                flags: MessageFlags.Ephemeral
            });
            setTimeout(() => reply.delete().catch(() => {}), 5000);
            return;
        }

        const args = message.content.split(' ').slice(1);
        if (!args.length) {
            const reply = await message.reply({
                embeds: [{
                    description: `✖ Você precisa fornecer uma música! Ex: \`!add nome da música\``,
                    color: 0xFF0000
                }],
                flags: MessageFlags.Ephemeral
            });
            setTimeout(() => reply.delete().catch(() => {}), 5000);
            return;
        }

        const search = args.join(' ');

        try {
            const res = await message.client.manager.search(search, message.author);

            if (!res || !res.tracks || res.tracks.length === 0) {
                const reply = await message.reply({
                    embeds: [{
                        description: `✖ Nenhuma música encontrada!`,
                        color: 0xFF0000
                    }],
                    flags: MessageFlags.Ephemeral
                });
                setTimeout(() => reply.delete().catch(() => {}), 5000);
                return;
            }

            let reply;
            if (res.type === 'PLAYLIST') {
                player.queue.add(res.tracks);
                reply = await message.reply({
                    embeds: [{
                        description: `${formatEmoji(emojis.static.list)} Playlist adicionada: **${res.playlistName}** (${res.tracks.length} músicas)`,
                        color: 0x00FF00
                    }],
                    flags: MessageFlags.Ephemeral
                });
                await message.delete();
            } else {
                const track = res.tracks[0];
                player.queue.add(track);
                reply = await message.reply({
                    embeds: [{
                        description: `${formatEmoji(emojis.static.addList)} Adicionado à fila: **${track.title}**`
                    }],
                    flags: MessageFlags.Ephemeral
                });
                await message.delete();
            }
            setTimeout(() => reply.delete().catch(() => {}), 5000);

            await musicPanelManager.createOrUpdatePanel(player, message.channel, message.author);
        } catch (error) {
            context.logger.error('Erro no comando add:', error);
            const reply = await message.reply({
                embeds: [{
                    description: `✖ Erro interno ao executar a ação!`,
                    color: 0xFF0000
                }]
            });
            setTimeout(() => reply.delete().catch(() => {}), 5000);
        }
    }
};

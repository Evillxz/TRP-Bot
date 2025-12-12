const musicPanelManager = require('../utils/musicPanelManager');
const emojis = require('emojis');
const { formatEmoji, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'play',
    aliases: ['p', 'tocar'],
    description: 'Toca uma música no canal de voz',
    async execute(message, context) {
        const { channel } = message.member.voice;

        async function isFeatureMaintenance(feature) {
            try {
                const maintenancePath = path.join(__dirname, '..', 'maintenance.json');
                const data = await fs.promises.readFile(maintenancePath, 'utf8');
                const obj = JSON.parse(data);
                return !!obj[feature];
            } catch (err) {
                return false;
            }
        }

        if (await isFeatureMaintenance('music')) {
            const reply = await message.reply({
                embeds: [{
                    description: `🚧 Sistema de música em manutenção. Tente novamente mais tarde.`,
                    color: 0xFFA500
                }],
                flags: MessageFlags.Ephemeral
            });
            await message.delete();
            setTimeout(() => reply.delete().catch(() => {}), 5000);
            return;
        }
        
        if (!channel) {
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
                    description: `✖ Icorreto! Use: \`!play nome-da-musica (Ou o link)\``,
                    color: 0xFF0000
                }],
                flags: MessageFlags.Ephemeral
            });
            setTimeout(() => reply.delete().catch(() => {}), 5000);
            return;
        }

        const search = args.join(' ');
        
        let player = message.client.manager.players.get(message.guild.id);
        
        if (!player) {
            player = await message.client.manager.createPlayer({
                guildId: message.guild.id,
                voiceId: channel.id,
                textId: message.channel.id,
                deaf: true
            });
        }

        if (!player.voiceId) {
            player.connect();
        }

        try {
            const res = await message.client.manager.search(search, message.author);
            
            // console.log('Resposta do Lavalink:', JSON.stringify(res, null, 2));

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
                        description: `${formatEmoji(emojis.static.disc)} Adicionado a fila: **${track.title}**`,
                        color: 0x2ECC71
                    }],
                    flags: MessageFlags.Ephemeral
                });
                await message.delete();
            }
            setTimeout(() => reply.delete().catch(() => {}), 5000);

            if (!player.playing && !player.paused) {
                player.play();
            }

            await musicPanelManager.createOrUpdatePanel(player, message.channel, message.author);
        } catch (error) {
            context.logger.error('Erro no comando play:', error);
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

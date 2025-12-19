const musicPanelManager = require('../../utils/musicPanelManager');
const { formatEmoji } = require('discord.js');
const emojis = require('emojis');

module.exports = {
    name: 'musicButtons',
    async execute(interaction, context) {
        const { customId } = interaction;

        if (!customId.startsWith('music_')) return;

        const player = interaction.client.manager.players.get(interaction.guild.id);

        if (!player) {
            return interaction.reply({ 
                embeds: [{
                    description: `✖ Não há nada tocando!`,
                    color: 0xFF0000
                }], 
                flags: context.djs.MessageFlags.Ephemeral 
            });
        }

        if (!interaction.member.voice.channel) {
            return interaction.reply({ 
                embeds: [{
                    description: `✖ Você precisa estar em um canal de voz!`,
                    color: 0xFF0000
                }], 
                flags: context.djs.MessageFlags.Ephemeral 
            });
        }

        switch (customId) {
            case 'music_pause_resume':
                player.pause(!player.paused);
                await interaction.deferUpdate();
                await musicPanelManager.createOrUpdatePanel(player, interaction.channel, interaction.user);
                break;

            case 'music_skip':
                if (!player.queue.current) {
                    return interaction.reply({ 
                        embeds: [{
                            description: `✖ Não há musica tocando!`,
                            color: 0xFF0000
                        }], 
                        flags: context.djs.MessageFlags.Ephemeral 
                    });
                }
                player.skip();
                player.paused = false; // Forçar despausar após skip
                await interaction.deferUpdate();
                await musicPanelManager.createOrUpdatePanel(player, interaction.channel, player.queue.current?.requester || interaction.user);
                break;

            case 'music_queue':
                const queueList = player.queue.map((track, i) => `${i + 1}. ${track.title}`).slice(0, 10);
                const queueText = queueList.length > 0 ? queueList.join('\n') : 'A fila está vazia';
                await interaction.reply({ 
                    content: `### ${formatEmoji(emojis.static.list)} Fila de Músicas:\n${queueText}${player.queue.size > 10 ? `\n... e mais ${player.queue.size - 10} música(s)` : ''}`, 
                    flags: context.djs.MessageFlags.Ephemeral
                });
                break;

            case 'music_stop':
                await musicPanelManager.deletePanel(interaction.guild.id, interaction.channel, 'stopped');
                player.destroy();
                await interaction.deferUpdate();
                break;

            case 'music_repeat':
                musicPanelManager.toggleRepeat(interaction.guild.id);
                await interaction.deferUpdate();
                await musicPanelManager.createOrUpdatePanel(player, interaction.channel, interaction.user);
                break;
        }
    }
}
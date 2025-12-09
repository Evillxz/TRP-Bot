const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, SectionBuilder, TextDisplayBuilder, ThumbnailBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, formatEmoji } = require('discord.js');
const emojis = require('emojis');

class MusicPanelManager {
    constructor() {
        this.panels = new Map(); // guildId -> { messageId, channelId }
        this.repeatModes = new Map(); // guildId -> 0 (off), 1 (one), 2 (all)
    }

    async createOrUpdatePanel(player, channel, requester) {
        const guildId = player.guildId;
        const container = this.createContainer(player, channel, requester);

        try {
            const panelData = this.panels.get(guildId);

            if (panelData) {
                try {
                    const existingChannel = await channel.client.channels.fetch(panelData.channelId);
                    const existingMessage = await existingChannel.messages.fetch(panelData.messageId);
                    await existingMessage.edit({ components: container, flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } });
                    return existingMessage;
                } catch (error) {
                    this.panels.delete(guildId);
                }
            }

            const message = await channel.send({ components: container, flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } });
            this.panels.set(guildId, {
                messageId: message.id,
                channelId: channel.id
            });
            return message;
        } catch (error) {
            console.error('Erro ao criar/atualizar painel:', error);
        }
    }

    createContainer(player, channel, requester) {
        const current = player.queue.current;
        const queueSize = player.queue.size;
        const voiceChannel = channel.guild.channels.cache.get(player.voiceId);
        
        const formatDuration = (ms) => {
            const seconds = Math.floor((ms / 1000) % 60);
            const minutes = Math.floor((ms / (1000 * 60)) % 60);
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        const cleanTitle = (title) => {
            return title
                .replace(/\s*\([^)]*official[^)]*\)/gi, '')
                .replace(/\s*\[[^\]]*official[^\]]*\]/gi, '')
                .replace(/\s*\([^)]*music video[^)]*\)/gi, '')
                .replace(/\s*\[[^\]]*music video[^\]]*\]/gi, '')
                .replace(/\s*\([^)]*4K[^)]*\)/gi, '')
                .replace(/\s*\[[^\]]*4K[^\]]*\]/gi, '')
                .replace(/\s*\([^)]*oficial[^)]*\)/gi, '')
                .replace(/\s*\[[^\]]*oficial[^\]]*\]/gi, '')
                .replace(/\s*\([^)]*video clipe[^)]*\)/gi, '')
                .replace(/\s*\[[^\]]*video clipe[^\]]*\]/gi, '')
                .replace(/\s*\([^)]*video[^)]*\)/gi, '')
                .replace(/\s*\[[^\]]*video[^\]]*\]/gi, '')
                .replace(/\s*-\s*#\w+/g, '')
                .trim();
        };

        const title = current ? cleanTitle(current.title) : 'Nenhuma música';
        const url = current?.uri || 'https://youtube.com';
        const duration = current ? formatDuration(current.length) : '00:00';
        const thumbnail = current?.thumbnail || 'attachment://default.png';
        const requesterMention = requester ? `<@${requester.id}>` : 'Desconhecido';
        const voiceChannelMention = voiceChannel ? `<#${voiceChannel.id}>` : 'Desconhecido';

        return [
            new ContainerBuilder()
                .setAccentColor(4934475)
                .addSectionComponents(
                    new SectionBuilder()
                        .setThumbnailAccessory(
                            new ThumbnailBuilder().setURL(thumbnail)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `### [${title}](${url}) - \`${duration}\`\n` +
                                `> Requisitado por ${requesterMention}\n` +
                                `> \n` +
                                `> Conectado em ${voiceChannelMention}\n`
                            )
                        )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
                )
                .addActionRowComponents(this.createButtons(player))
        ];
    }

    createButtons(player) {
        const isPaused = player.paused;
        const repeatMode = this.repeatModes.get(player.guildId) || 0;
        
        const repeatStyles = [
            { style: ButtonStyle.Secondary, emoji: emojis.static.repeat.id },
            { style: ButtonStyle.Success, emoji: emojis.static.repeat1.id },
            { style: ButtonStyle.Primary, emoji: emojis.static.repeatAll.id }
        ];

        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setStyle(isPaused ?  ButtonStyle.Success : ButtonStyle.Secondary)
                    .setLabel(isPaused ? 'Retomar' : 'Pausar')
                    .setEmoji({ id: isPaused ? emojis.static.play.id : emojis.static.pause.id })
                    .setCustomId('music_pause_resume'),
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel('Próxima')
                    .setEmoji({ id: emojis.static.skip.id })
                    .setCustomId('music_skip'),
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel('Parar')
                    .setEmoji({ id: emojis.static.stop.id })
                    .setCustomId('music_stop'),
                new ButtonBuilder()
                    .setStyle(repeatStyles[repeatMode].style)
                    .setLabel('Repetir')
                    .setEmoji({ id: repeatStyles[repeatMode].emoji })
                    .setCustomId('music_repeat'),
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel(`Fila (${player.queue.size})`)
                    .setEmoji({ id: emojis.static.list.id })
                    .setCustomId('music_queue')
            );
    }

    toggleRepeat(guildId) {
        const current = this.repeatModes.get(guildId) || 0;
        const next = (current + 1) % 3;
        this.repeatModes.set(guildId, next);
        return next;
    }

    getRepeatMode(guildId) {
        return this.repeatModes.get(guildId) || 0;
    }

    async deletePanel(guildId, channel, reason = 'ended') {
        const panelData = this.panels.get(guildId);
        
        if (panelData) {
            try {
                const targetChannel = channel || (channel?.client ? await channel.client.channels.fetch(panelData.channelId) : null);
                if (!targetChannel) return;
                
                const existingMessage = await targetChannel.messages.fetch(panelData.messageId);
                
                const container = reason === 'stopped' 
                    ? [
                        new ContainerBuilder()
                            .setAccentColor(982784)
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`${formatEmoji(emojis.static.stop)} Reprodução interrompida com sucesso!`)
                            )
                    ]
                    : [
                        new ContainerBuilder()
                            .setAccentColor(16772864)
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("💨 Sem músicas para tocar, até mais!")
                            )
                    ];
                
                await existingMessage.edit({ components: container, flags: MessageFlags.IsComponentsV2 });
            } catch (error) {
                console.error('[PANEL] Erro ao editar painel final:', error);
            }
        }
        
        this.panels.delete(guildId);
        this.repeatModes.delete(guildId);
    }

    getPanel(guildId) {
        return this.panels.get(guildId);
    }
}

module.exports = new MusicPanelManager();

const { 
    TextDisplayBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ContainerBuilder,
    MessageFlags,
    SectionBuilder,
    ThumbnailBuilder,
    formatEmoji
} = require('discord.js');
const emojis = require('emojis');
const api = require('apiClient');

const updateQueue = new Map();

async function updateRaffleMessage(interaction, raffleId, count, raffleData) {
    const { title, image_url, description } = raffleData;
    const crown = formatEmoji(emojis.static.crown);
    const check = formatEmoji(emojis.animated.check, true);
    
    const container = [
      new TextDisplayBuilder().setContent("|| @everyone @here ||"),
      new ContainerBuilder()
      .addSectionComponents(
        new SectionBuilder()
        .setThumbnailAccessory(
        new ThumbnailBuilder()
          .setURL(image_url || interaction.client.user.displayAvatarURL())
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## ${crown} ${title}ㅤㅤ\n`+
              `${description}\n`
            ),
        ),
      )
      .addSectionComponents(
        new SectionBuilder()
        .setButtonAccessory(
          new ButtonBuilder()
          .setStyle(ButtonStyle.Success)
          .setLabel(`Entrar (${count})`)
          .setEmoji({ id: emojis.static.gift.id })
          .setCustomId(`raffle_enter_${raffleId}`)
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`-# ${check} Powered by Trindade Penumbra®`),
        ),
      ),
    ];

    await interaction.message.edit({
        components: container,
        flags: MessageFlags.IsComponentsV2
    });
}

module.exports = async (interaction) => {
    const userId = interaction.user.id;
    const userName = interaction.member?.displayName || interaction.user.displayName;
    const userTag = interaction.user.tag;

    const raffleId = interaction.customId.split('_')[2];
    if (!raffleId) return;

    try {
        const requiredRoleId = '1296584614391054428';
        
        if (!interaction.member.roles.cache.has(requiredRoleId)) {
            return await interaction.reply({
                embeds: [{
                    description: '✖ Você precisa estar registrado para participar do sorteio!',
                    color: 0xFF0000
                }],
                flags: MessageFlags.Ephemeral
            });
        }

        const raffleData = await api.get(`/raffle/${raffleId}`);

        if (raffleData.status !== 'active') {
            return await interaction.reply({
                embeds: [{
                    description: '🔒 Este sorteio já foi encerrado!\n\nAguarde pelo anúncio do vencedor ou pelo próximo sorteio.',
                    color: 0xFF0000
                }],
                flags: MessageFlags.Ephemeral
            });
        }

        const existingParticipant = raffleData.participants.find(p => p.discord_id === userId);

        const enter = formatEmoji(emojis.static.enter);
        const out = formatEmoji(emojis.static.out);
        let newCount = raffleData.participants.length;

        if (!existingParticipant) {
            try {
                await api.post(`/raffle/${raffleId}/add-participant`, { discord_name: userName, discord_tag: userTag, discord_id: userId });
                newCount++;
                await interaction.reply({
                    embeds: [{
                        description: `${enter} Você entrou no sorteio!`,
                        color: 0x00FF00
                    }],
                    flags: MessageFlags.Ephemeral 
                });
            } catch (err) {
                if (err.response && err.response.data && err.response.data.error === 'raffle_full') {
                    return await interaction.reply({
                        embeds: [{
                            description: '🔒 O limite de participantes foi atingido!',
                            color: 0xFF0000
                        }],
                        flags: MessageFlags.Ephemeral
                    });
                }
                if (err.response && err.response.data && err.response.data.error === 'raffle_closed') {
                    return await interaction.reply({
                        embeds: [{
                            description: '🔒 Este sorteio já foi encerrado!',
                            color: 0xFF0000
                        }],
                        flags: MessageFlags.Ephemeral
                    });
                }
                if (err.response && err.response.data && err.response.data.error === 'raffle_closed_by_date') {
                    return await interaction.reply({
                        embeds: [{
                            description: '⏰ O prazo para entrar neste sorteio já expirou!',
                            color: 0xFF0000
                        }],
                        flags: MessageFlags.Ephemeral
                    });
                }
                throw err;
            }
        } else {
            await api.delete(`/raffle/${raffleId}/remove-participant/${existingParticipant.id}`);
            newCount--;
            await interaction.reply({
                embeds: [{
                    description: `${out} Você saiu do sorteio!`,
                    color: 0xFF0000
                }],
                flags: MessageFlags.Ephemeral 
            });
        }

        const messageId = interaction.message.id;
        const now = Date.now();
        const lastUpdate = updateQueue.get(messageId)?.lastUpdate || 0;

        if (now - lastUpdate > 5000) {
            updateQueue.set(messageId, { lastUpdate: now });
            updateRaffleMessage(interaction, raffleId, newCount, raffleData).catch(console.error);
        } else {
            if (updateQueue.get(messageId)?.timeout) clearTimeout(updateQueue.get(messageId).timeout);
            
            const timeout = setTimeout(async () => {
                updateQueue.set(messageId, { lastUpdate: Date.now() });
                try {
                    const freshData = await api.get(`/raffle/${raffleId}`);
                    const freshCount = freshData.participants.length;
                    await updateRaffleMessage(interaction, raffleId, freshCount, freshData);
                } catch (e) { console.error('Erro ao atualizar mensagem (delayed):', e); }
            }, 5000); 
            
            updateQueue.set(messageId, { lastUpdate, timeout });
        }

    } catch (error) {
        console.error('Erro ao processar entrada no sorteio:', error);
        if (!interaction.replied) {
            await interaction.reply({ 
                embeds: [{
                    description: '✖ Erro ao processar sua participação!',
                    color: 0xFF0000
                }],
                flags: MessageFlags.Ephemeral
            });
        }
    }
};

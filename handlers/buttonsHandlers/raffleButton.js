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

module.exports = async (interaction) => {
    const userId = interaction.user.id;
    const userName = interaction.member?.displayName || interaction.user.displayName;
    const userTag = interaction.user.tag;

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

        let existingUser = null;
        try {
            existingUser = await api.get(`/bot/raffle/user/${userId}`);
        } catch (err) {
            throw new Error('Erro ao conectar na API do sorteio');
        }
        const enter = formatEmoji(emojis.static.enter);
        const out = formatEmoji(emojis.static.out);

        if (!existingUser) {
            await api.post('/bot/raffle/join', { discord_name: userName, discord_tag: userTag, discord_id: userId });
            await interaction.reply({
                embeds: [{
                    description: `${enter} Você entrou no sorteio!`,
                    color: 0x00FF00
                }],
                flags: MessageFlags.Ephemeral 
            });
        } else {
            const current = existingUser.participating === true || existingUser.participating === 1 || existingUser.participating === '1';
            const newStatus = current ? false : true;
            await api.post('/bot/raffle/toggle', { discord_id: userId, participating: newStatus });
            
            if (newStatus === 1) {
                await interaction.reply({ 
                    embeds: [{
                        description: `${enter} Você entrou no sorteio!`,
                        color: 0x00FF00
                    }],
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.reply({ 
                    embeds: [{
                        description: `${out} Você saiu do sorteio!`,
                        color: 0xFF0000
                    }],
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        let count = 0;
        try {
            const participants = await api.get('/bot/raffle/active');
            count = Array.isArray(participants) ? participants.length : 0;
        } catch (err) {
            throw new Error('Erro ao obter participantes do sorteio');
        }
        
        const check = formatEmoji(emojis.animated.check, true);
        const crown = formatEmoji(emojis.static.crown);

        const container = [
            new TextDisplayBuilder().setContent("|| @everyone @here ||"),
            new ContainerBuilder()
            .addSectionComponents(
                new SectionBuilder()
                .setThumbnailAccessory(
                    new ThumbnailBuilder()
                        .setURL(interaction.client.user.displayAvatarURL() || '')
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## ${crown} Sorteio: 30 dias de VIP Ouroㅤㅤ\n### Requisitos:\n- Não ter **VIP** ativo.\n- Estar **On** no dia **14 de Dezembro** as \`20:30\`\nﾠ`),
                ),
            )
            .addSectionComponents(
                new SectionBuilder()
                .setButtonAccessory(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Success)
                        .setLabel(`Entrar (${count})`)
                        .setEmoji({ id: emojis.static.gift.id })
                        .setCustomId("raffle_enter")
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`-# ${check} Powered by <@490119492597186571>`),
                ),
            ),
        ];

        await interaction.message.edit({ 
            components: container,
            flags: MessageFlags.IsComponentsV2
        });

    } catch (error) {
        console.error('Erro ao processar entrada no sorteio:', error);
        await interaction.reply({ 
            embeds: [{
                description: '✖ Erro ao processar sua participação!',
                color: 0xFF0000
            }],
            flags: MessageFlags.Ephemeral
        });
    }
};

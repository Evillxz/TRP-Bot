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
const database = require('database');

module.exports = async (interaction) => {
    const userId = interaction.user.id;
    const userName = interaction.user.username;
    const userTag = interaction.user.tag;

    try {
        const existingUser = await database.getRaffleUser(userId);
        const enter = formatEmoji(emojis.static.enter);
        const out = formatEmoji(emojis.static.out);

        if (!existingUser) {
            await database.addRaffle(userName, userTag, userId, 1);
            await interaction.reply({
                embeds: [{
                    description: `${enter} Você entrou no sorteio!`,
                    color: 0x00FF00
                }],
                flags: MessageFlags.Ephemeral 
            });
        } else {
            const newStatus = existingUser.participating === 1 ? 0 : 1;
            await database.toggleRaffleParticipation(userId, newStatus);
            
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

        const count = await database.countActiveRaffleParticipants();
        
        const check = formatEmoji(emojis.animated.check, true);
        const crown = formatEmoji(emojis.static.crown);

        const container = [
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

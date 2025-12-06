const { 
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    TextDisplayBuilder, 
    ThumbnailBuilder, 
    SectionBuilder, 
    SeparatorBuilder, 
    SeparatorSpacingSize, 
    ContainerBuilder
} = require('discord.js');

module.exports = {
    async execute(interaction, context) {
        const { emojis } = context;
        const userId = interaction.customId.split('_')[3];
        
        if (!context.tempRegisters || !context.tempRegisters.has(userId)) {
            return await interaction.reply({
                embeds: [
                    {
                        description: '✖ Dados de registro nao encontrados!',
                        color: 0xFF0000
                    }
                ],
                flags: MessageFlags.Ephemeral
            });
        }

        const nome = interaction.fields.getTextInputValue('nick_text_input');
        const id = interaction.fields.getTextInputValue('id_text_input');
        const idadeValue = interaction.fields.getStringSelectValues('age_select_menu')?.[0];
        const idade = idadeValue === 'legal_age_select_menu' ? '+18 anos' : '-18 anos';

        context.tempRegisters.set(userId, {
            nome,
            id,
            idade,
            userId
        });

        const targetUser = await interaction.guild.members.fetch(userId).catch(() => null);
        
        if (!targetUser) {
            return await interaction.reply({
                embeds: [
                    {
                        description: '✖ Usuário nao encontrado!',
                        color: 0xFF0000
                    }
                ],
                flags: MessageFlags.Ephemeral
            });
        }

        const container = [
            new ContainerBuilder()
            .setAccentColor(0x4A4A4A)
            .addSectionComponents(
                new SectionBuilder()
                    .setThumbnailAccessory(
                        new ThumbnailBuilder().setURL(targetUser.user.displayAvatarURL() || '').setDescription('User Avatar')
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`## Novo Registro Recebido`),
                        new TextDisplayBuilder().setContent(`-# Usuário: ${targetUser.user}\n-# Tag: **${targetUser.user.tag}**\n-# Data: \`${new Date().toLocaleString('pt-BR')}\``),
                    )
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Informações:**`+
                    `\n- Nome: \`${nome}\``+
                    `\n- ID: \`${id}\``+
                    `\n- Idade: \`${idade}\``+
                    `\n\n- Editado por: ${interaction.user.toString()}`
                ),
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
            )
            .addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Success)
                            .setLabel("Confirmar")
                            .setEmoji({ id: emojis.static.save.id })
                            .setCustomId(`approve_register_${userId}`),
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Secondary)
                            .setLabel("Cancelar")
                            .setEmoji({ id: emojis.static.trash.id })
                            .setCustomId(`reject_register_${userId}`),
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Secondary)
                            .setLabel("Editar")
                            .setEmoji({ id: emojis.static.edit.id })
                            .setCustomId(`edit_register_${userId}`),
                    ),
            ),
        ]

        await interaction.update({
            components: container,
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: [] }
        });
    }
};
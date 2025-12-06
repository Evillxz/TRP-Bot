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
        const { emojis, logger } = context;
        const nome = interaction.fields.getTextInputValue('nick_text_input');
        const id = interaction.fields.getTextInputValue('id_text_input');
        const idadeValue = interaction.fields.getStringSelectValues('age_select_menu')?.[0];
        const recId = interaction.fields.getStringSelectValues('rec_select_menu')?.[0];

        const idade = idadeValue === 'legal_age_select_menu' ? '+18 anos' : '-18 anos';
        
        const adminChannelId = '1363187296764956802';
        const adminChannel = interaction.guild.channels.cache.get(adminChannelId);
        
        if (!adminChannel) {
            return await interaction.reply({ 
                embeds: [
                    {
                        description: '✖ Canal Administrativo Nao Encontrado',
                        color: 0xFF0000
                    }
                ],
                flags: MessageFlags.Ephemeral
            });
        }

        const container = [
            new TextDisplayBuilder().setContent("<@&1446226263521104105>"),
            new ContainerBuilder()
            .setAccentColor(0x212121)
            .addSectionComponents(
                new SectionBuilder()
                    .setThumbnailAccessory(
                        new ThumbnailBuilder().setURL(interaction.user.displayAvatarURL() || '').setDescription('User Avatar')
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`## Novo Registro Recebido`),
                        new TextDisplayBuilder().setContent(`-# Usuário: ${interaction.user}\n-# Tag: **${interaction.user.tag}**\n-# Data: \`${new Date().toLocaleString('pt-BR')}\``),
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
                    `\n- Recrutador: <@${recId}>`
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
                            .setCustomId(`approve_register_${interaction.user.id}`),
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Secondary)
                            .setLabel("Cancelar")
                            .setEmoji({ id: emojis.static.trash.id })
                            .setCustomId(`reject_register_${interaction.user.id}`),
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Secondary)
                            .setLabel("Editar")
                            .setEmoji({ id: emojis.static.edit.id })
                            .setCustomId(`edit_register_${interaction.user.id}`),
                    ),
            ),
        ]

        context.tempRegisters = context.tempRegisters || new Map();
        context.tempRegisters.set(interaction.user.id, {
            nome,
            id,
            idade,
            recId,
            userId: interaction.user.id
        });

        await adminChannel.send({
            components: container,
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { roles: ['1446226263521104105'] }
        });

        await interaction.reply({
            embeds: [
                {
                    description: '✔ Registro enviado! Aguarde a análise.',
                    color: 0x00FF00
                }
            ],
            flags: MessageFlags.Ephemeral
        });
    }
};
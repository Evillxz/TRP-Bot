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

        const name = interaction.fields.getTextInputValue('nick_text_input');
        const id = interaction.fields.getTextInputValue('id_text_input');
        const telephone = interaction.fields.getTextInputValue('phone_text_input');
        const availabilityRoles = interaction.fields.getStringSelectValues('availability_select_menu');
        const recId = interaction.fields.getStringSelectValues('rec_select_menu')?.[0];
        
        const cleanName = name?.trim();
        const cleanId = id?.trim();
        const cleanTelephone = telephone?.trim();
        
        if (!cleanName || !cleanId || !cleanTelephone || !availabilityRoles?.length || !recId) {
            return await interaction.reply({ 
                embeds: [
                    {
                        description: '✖ Por favor, preencha **todos os campos** do formulário, incluindo:\n• Nome\n• ID do Jogo\n• Telefone\n• Turnos\n• Recrutador',
                        color: 0xFF0000
                    }
                ],
                flags: MessageFlags.Ephemeral
            });
        }
        
        const adminChannelId = '1363187296764956802';
        // const adminChannelId = '1304465490256596992';
        const adminChannel = interaction.guild.channels.cache.get(adminChannelId);

        const roles = availabilityRoles.map(id => `<@&${id}>`).join('\u200b');
        
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
                    `\n- Nome: \`${cleanName}\``+
                    `\n- ID: \`${cleanId}\``+
                    `\n- Telefone: \`${cleanTelephone}\``+
                    `\n- Turno(s): ${roles}`+
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
            name: cleanName,
            id: cleanId,
            telephone: cleanTelephone,
            availabilityRoles: availabilityRoles,
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
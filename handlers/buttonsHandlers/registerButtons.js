const {
    MessageFlags,
    TextDisplayBuilder, 
    ThumbnailBuilder, 
    SectionBuilder, 
    SeparatorBuilder, 
    SeparatorSpacingSize, 
    ContainerBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    formatEmoji
} = require('discord.js');

module.exports = {

    async execute(interaction, context) {
        const [action, , userId] = interaction.customId.split('_');
        
        const requiredRoleId = '1446226263521104105';
        if (!interaction.member.roles.cache.has(requiredRoleId)) {
            return await interaction.reply({
                embeds: [
                    {
                        description: '✖ Você não tem permissão para executar esta ação!',
                        color: 0xFF0000
                    }
                ],
                flags: MessageFlags.Ephemeral
            });
        }
        
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

        const registerData = context.tempRegisters.get(userId);
        const targetUser = await interaction.guild.members.fetch(userId).catch(() => null);

        if (!targetUser) {
            return await interaction.reply({
                embeds: [
                    {
                        description: '✖ Usuário não encontrado!',
                        color: 0xFF0000
                    }
                ],
                flags: MessageFlags.Ephemeral
            });
        }

        switch (action) {
            case 'approve':
                await this.approveRegister(interaction, context, registerData, targetUser);
                break;
            case 'reject':
                await this.rejectRegister(interaction, context, registerData, targetUser);
                break;
            case 'edit':
                await this.editRegister(interaction, context, registerData);
                break;
        }
    },

    async approveRegister(interaction, context, registerData, targetUser) {
        const userId = interaction.customId.split('_')[3];
        const emojis = context.emojis;

        try {
            const newNickname = `TRP » ${registerData.nome} [${registerData.id}]`;
            await targetUser.setNickname(newNickname);

            const registeredRoleId = '1296584614391054428';
            const initialRoleId = '1446158406561042602';
            const ageRoleId = this.getAgeRoleId(registerData.idade);

            const rolesToAdd = [registeredRoleId, initialRoleId];
            if (ageRoleId) rolesToAdd.push(ageRoleId);
            
            await targetUser.roles.add(rolesToAdd);

            const container = [
                new ContainerBuilder()
                .setAccentColor(0x00FF00)
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
                        `\n- Nome: \`${registerData.nome}\``+
                        `\n- ID: \`${registerData.id}\``+
                        `\n- Idade: \`${registerData.idade}\``+
                        `\n- Recrutador: <@${registerData.recId}>`+
                        `\n\n- Status: **Aprovado**`+
                        `\n- Aprovado pelo(a) ${interaction.user}`
                    ),
                )
            ]

            await interaction.update({
                components: container,
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: { parse: [] }
            });

            const welcomeChannelId = '1368788175148810302';
            const welcomeChannel = interaction.guild.channels.cache.get(welcomeChannelId);
            
            if (welcomeChannel) {
                const welcomeContainer = [
                    new ContainerBuilder()
                    .setAccentColor(0x00FF00)
                    .addSectionComponents(
                        new SectionBuilder()
                            .setThumbnailAccessory(
                                new ThumbnailBuilder().setURL(targetUser.user.displayAvatarURL() || '').setDescription('User Avatar')
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`## ${formatEmoji(emojis.static.capus)} Novo Membro na Área!`),
                                new TextDisplayBuilder().setContent(`Bem-vindo(a), ${targetUser}!\n\n-# Responsável: <@${registerData.recId}>`)
                            )
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
                    )
                    .addActionRowComponents(
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Link)
                                    .setLabel("Regras TRP")
                                    .setEmoji({ id: emojis.static.rules.id })
                                    .setURL('https://discord.com/channels/1295702106195492894/1296584804938022952'),
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Link)
                                    .setLabel("Hierarquia")
                                    .setEmoji({ id: emojis.static.rank.id })
                                    .setURL('https://discord.com/channels/1295702106195492894/1296584824240210055'),
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Link)
                                    .setLabel("Base")
                                    .setEmoji({ id: emojis.static.home.id })
                                    .setURL('https://discord.com/channels/1295702106195492894/1296584821740539954')
                            )
                    )
                    
                ];

                await welcomeChannel.send({ 
                    components: welcomeContainer,
                    flags: MessageFlags.IsComponentsV2,
                    allowedMentions: { users: [targetUser.user.id] }
                });
            }

            context.tempRegisters.delete(userId);

        } catch (error) {
            context.logger.error('Erro ao aprovar registro:', error);
            
            let errorMessage = '✖ Erro ao processar aprovação!';
            if (error.code === 50013) {
                errorMessage = '✖ **Erro de Permissão!**\n\nO bot não tem permissões suficientes para:\n• Alterar nickname do usuário\n• Adicionar cargos ao usuário\n\nVerifique as permissões do bot.';
            }
            
            await interaction.reply({
                content: errorMessage,
                flags: MessageFlags.Ephemeral
            }).catch(() => {
                interaction.editReply({
                    content: errorMessage
                }).catch(() => {});
            });
        }
    },

    async rejectRegister(interaction, context, registerData, targetUser) {
        const userId = interaction.customId.split('_')[3];
        const emojis = context.emojis;

        const container = [
            new ContainerBuilder()
            .setAccentColor(0xFF0000)
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
                    `\n- Nome: \`${registerData.nome}\``+
                    `\n- ID: \`${registerData.id}\``+
                    `\n- Idade: \`${registerData.idade}\``+
                    `\n- Recrutador: <@${registerData.recId}>`+
                    `\n\n- Status: **Cancelado**`+
                    `\n- Responsável: ${interaction.user.toString()}`
                ),
            )
        ]

        await interaction.update({
            components: container,
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: [] }
        });

        const welcomeChannelId = '1368788175148810302';
        const welcomeChannel = interaction.guild.channels.cache.get(welcomeChannelId);
        
        if (welcomeChannel) {
            const cancelContainer = [
                new TextDisplayBuilder().setContent(targetUser.toString()),
                new ContainerBuilder()
                .setAccentColor(0xFF0000)
                .addSectionComponents(
                    new SectionBuilder()
                        .setThumbnailAccessory(
                            new ThumbnailBuilder().setURL(targetUser.user.displayAvatarURL() || '').setDescription('User Avatar')
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`## ${formatEmoji(emojis.static.outRed)} Não foi dessa vez... `),
                            new TextDisplayBuilder().setContent(`O seu registro foi **reprovado**!\n\n-# Verifique o motivo com um administrador e tente novamente!`)
                        )
                )
            ];

            await welcomeChannel.send({ 
                components: cancelContainer,
                flags: MessageFlags.IsComponentsV2
            });
        }

        context.tempRegisters.delete(userId);
    },

    async editRegister(interaction, context, registerData) {
        const { 
            LabelBuilder, 
            ModalBuilder, 
            StringSelectMenuBuilder, 
            StringSelectMenuOptionBuilder, 
            TextDisplayBuilder, 
            TextInputBuilder, 
            TextInputStyle
        } = require('discord.js');

        const editModal = new ModalBuilder()
            .setTitle("✏️ Editar Registro")
            .setCustomId(`edit_register_modal_${registerData.userId}`)
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                .setContent("### Edite os campos abaixo conforme necessário!\n- **Nick:** Nome no jogo\n- **Id:** ID no jogo\n- **Idade:** Faixa etária")
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Nickname (Nome)")
                .setTextInputComponent(
                    new TextInputBuilder()
                        .setCustomId("nick_text_input")
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder("Digite aqui...")
                        .setValue(registerData.nome)
                )
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Identificador (ID)")
                .setTextInputComponent(
                    new TextInputBuilder()
                        .setCustomId("id_text_input")
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder("Exemplo: 112233 - 1122 - 11")
                        .setValue(registerData.id)
                )
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Idade")
                .setStringSelectMenuComponent(
                    new StringSelectMenuBuilder()
                    .setCustomId("age_select_menu")
                    .setPlaceholder("Selecione uma opção...")
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                        .setLabel("Tenho mais de 18 anos")
                        .setEmoji("🔺")
                        .setValue("legal_age_select_menu")
                        .setDescription("Selecione se for o seu caso")
                        .setDefault(registerData.idade === '+18 anos'),
                        new StringSelectMenuOptionBuilder()
                        .setLabel("Tenho menos de 18 anos")
                        .setEmoji("🔻")
                        .setValue("not_legal_age_select_menu")
                        .setDescription("Selecione se for o seu caso")
                        .setDefault(registerData.idade === '-18 anos')
                    )
                )
            );
        
        await interaction.showModal(editModal);
    },

    getAgeRoleId(idade) {
        if (idade === '+18 anos') return '1368800847882096640';
        if (idade === '-18 anos') return '1368800911559884821';
        return null;
    }
};
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
const emojis = require('emojis');
const api = require('apiClient');

module.exports = {
    async execute(interaction, context) {
        const parts = interaction.customId.split('_');
        const action = parts[0];
        const userId = parts[2];
        
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
        const rolesAvailability = registerData.availabilityRoles.map(id => `<@&${id}>`).join('\u200b');

        try {
            const newNickname = `TRP » ${registerData.name} [${registerData.id}]`;
            await targetUser.setNickname(newNickname);

            const registeredRoleId = '1296584614391054428';
            const initialRoleId = '1446158406561042602';
            const availabilityRole = registerData.availabilityRoles;

            const rolesToAdd = [registeredRoleId, initialRoleId, ...availabilityRole];
            
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
                            new TextDisplayBuilder().setContent(
                                `-# Usuário: ${targetUser}\n-# Tag: **${targetUser.user.tag}**\n-# Data: \`${new Date().toLocaleString('pt-BR')}\``
                            ),
                        )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**Informações:**`+
                        `\n- Nome: \`${registerData.name}\``+
                        `\n- ID: \`${registerData.id}\``+
                        `\n- Telefone: \`${registerData.telephone}\``+
                        `\n- Turnos: ${rolesAvailability}`+
                        `\n- Recrutador: <@${registerData.recId}>`+
                        `\n\n- Status: **Aprovado**`+
                        `\n- Aprovado pelo(a) ${interaction.user}`
                    ),
                )
            ];

            await interaction.update({
                components: container,
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: { parse: [] }
            });

            try {
                await api.post('/site/register', {
                    user_name: registerData.name,
                    user_discord_name: targetUser.tag,
                    user_id: targetUser.id,
                    user_game_id: registerData.id,
                    user_telephone: registerData.telephone,
                    user_shift: registerData.availabilityRoles,
                    rec_id: registerData.recId,
                    approver_id: interaction.user.id,
                    approver_tag: interaction.user.tag,
                    guild_id: interaction.guild.id
                });
            } catch (err) {
                context.logger && context.logger.error('Erro ao salvar registro via API:', err);
                await interaction.followUp({
                    embeds: [{ description: '✖ Erro ao salvar registro na API. Tente novamente mais tarde.', color: 0xFF0000 }],
                    flags: MessageFlags.Ephemeral
                }).catch(() => {});
            }

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
                embeds: [{
                    description: `${errorMessage}`,
                    color: 0xFF0000
                }],
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
        const rolesAvailability = registerData.availabilityRoles.map(id => `<@&${id}>`).join('\u200b');

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
                        new TextDisplayBuilder().setContent(`-# Usuário: ${targetUser}\n-# Tag: **${targetUser.user.tag}**\n-# Data: \`${new Date().toLocaleString('pt-BR')}\``),
                    )
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Informações:**`+
                    `\n- Nome: \`${registerData.name}\``+
                    `\n- ID: \`${registerData.id}\``+
                    `\n- Telefone: \`${registerData.telephone}\``+
                    `\n- Turno(s): ${rolesAvailability}`+
                    `\n- Recrutador: <@${registerData.recId}>`+
                    `\n\n- Status: **Cancelado**`+
                    `\n- Responsável: ${interaction.user}`
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
                .setContent("### Edite os campos abaixo conforme necessário!\n- **Nick:** Nome no jogo\n- **ID:** ID no jogo\n- **Telefone:** 000-000")
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Nickname (Nome)")
                .setTextInputComponent(
                    new TextInputBuilder()
                        .setCustomId(`nick_text_input`)
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder("Digite aqui o nome do mesmo...")
                        .setValue(registerData.name)
                )
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Identificador (ID)")
                .setTextInputComponent(
                    new TextInputBuilder()
                        .setCustomId("id_text_input")
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder("Id do Usuário in-game...")
                        .setValue(registerData.id)
                )
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel("Telefone")
                .setTextInputComponent(
                    new TextInputBuilder()
                        .setCustomId("phone_text_input")
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder("Insira apenas o número de telefone do usuário...")
                        .setValue(registerData.telephone)
                )
            )
        
        await interaction.showModal(editModal);
    },
};
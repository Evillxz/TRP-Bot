const { 
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    formatEmoji,
    ThumbnailBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize
} = require('discord.js');
const api = require('apiClient');

function formatarDataBR(dateString, ajustarFuso = true, retornarTimestamp = false) {
    const d = new Date(dateString);

    if (ajustarFuso) d.setHours(d.getHours() - 3);

    if (retornarTimestamp) return Math.floor(d.getTime() / 1000);

    const dia = d.getDate().toString().padStart(2, "0");
    const mes = (d.getMonth() + 1).toString().padStart(2, "0");
    const ano = d.getFullYear();
    const horas = d.getHours().toString().padStart(2, "0");
    const minutos = d.getMinutes().toString().padStart(2, "0");
    return `${dia}/${mes}/${ano}, ${horas}:${minutos}`;
}

module.exports = {
    async execute(interaction, context) {
        const { logger, emojis } = context;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const userId = interaction.fields.getSelectedUsers('user_select_modal_search').first()?.id;
            const category = interaction.fields.getStringSelectValues('category_select_modal_search')[0];
            const member = await interaction.guild.members.fetch(userId).catch(() => null);

            if (!member) {
                return interaction.editReply({
                    embeds: [{ description: '✖ Usuário não encontrado no servidor.', color: 0xFF0000 }]
                });
            }

            const now = Math.floor(Date.now() / 1000);
            let response = '';
            let title = '';
            let emoji = '';
            let color = 0x000000;

            if (category === 'adv_option_select') {
                let warnings = [];
                try {
                    warnings = await api.get(`/bot/warnings/all/${userId}/${interaction.guild.id}`);
                } catch (err) {
                    console.error('Erro ao obter advertências via API:', err);
                    return interaction.editReply({ embeds: [{ description: '✖ Erro ao conectar na API de advertências. Tente novamente mais tarde.', color: 0xFF0000 }] });
                }
                if (warnings.length === 0) {
                    return interaction.editReply({
                        embeds: [{ description: '✖ Nenhuma advertência encontrada para este usuário.', color: 0xFF0000 }]
                    });
                }
                emoji = formatEmoji(emojis.static.alert);
                title = `${emoji} Registros de Advertência\n-# - Usuário(a): <@${userId}>\n-# - Data: <t:${now}:f>`;
                color = 0xfbff00;
                warnings.forEach(w => {
                    const criadoEm = formatarDataBR(w.created_at, true, true);
                    const expiraEm = w.expires_at ? formatarDataBR(w.expires_at, false, true) : "**em 0 horas (Permanente)**";
                    const status = w.is_active ? '🟢 Ativa' : '🔴 Inativa';
                    response += `### Advertência ${w.id}\n\n`;
                    response += `- Status: \` ${status} \`\n`;
                    response += `- Responsável: <@${w.admin_id}>\n`;
                    response += `- Criada em <t:${criadoEm}:f>\n`;
                    response += `- Expira <t:${expiraEm}:R>\n`;
                    response += `- Motivo: \` ${w.reason} \`\n\n`;
                });


            } else if (category === 'up_option_select') {
                let logs = [];
                try {
                    logs = await api.get(`/bot/up_reb_logs/${interaction.guild.id}`);
                } catch (err) {
                    console.error('Erro ao obter logs via API:', err);
                    return interaction.editReply({ embeds: [{ description: '✖ Erro ao conectar na API de up/reb. Tente novamente mais tarde.', color: 0xFF0000 }] });
                }
                const upLogs = logs.filter(l => l.action_type === 'UP' && l.user_id === userId);
                if (upLogs.length === 0) {
                    return interaction.editReply({
                        embeds: [{ description: '✖ Nenhum registro de upamento encontrado para este usuário.', color: 0xFF0000 }]
                    });
                }
                emoji = formatEmoji(emojis.static.up);
                title = `${emoji} Registros de Up\n-# - Usuário(a): <@${userId}>\n-# - Data: <t:${now}:f>`;
                color = 0x00FF00;
                upLogs.forEach(l => {
                    const criadoEm = formatarDataBR(l.created_at, true, true);
                    response += `### Upamento #${l.id}\n\n`;
                    response += `- Responsável: <@${l.admin_id}>\n`;
                    response += `- Cargo Anterior: <@&${l.old_role_id}>\n`;
                    response += `- Cargo Novo: <@&${l.new_role_id}>\n`;
                    response += `- Data: <t:${criadoEm}:f>\n`;
                    response += `- Motivo: \` ${l.reason} \`\n\n`;
                });


            } else if (category === 'reb_option_select') {
                let logs = [];
                try {
                    logs = await api.get(`/bot/up_reb_logs/${interaction.guild.id}`);
                } catch (err) {
                    console.error('Erro ao obter logs via API:', err);
                    return interaction.editReply({ embeds: [{ description: '✖ Erro ao conectar na API de up/reb. Tente novamente mais tarde.', color: 0xFF0000 }] });
                }
                const rebLogs = logs.filter(l => l.action_type === 'REB' && l.user_id === userId);
                if (rebLogs.length === 0) {
                    return interaction.editReply({
                        embeds: [{ description: '✖ Nenhum registro de rebaixamento encontrado para este usuário.', color: 0xFF0000 }]
                    });
                }
                emoji = formatEmoji(emojis.static.down);
                title = `${emoji} Registros de Rebaixamento\n-# - Usuário(a): <@${userId}>\n-# - Data: <t:${now}:f>`;
                color = 0xff7b00;
                rebLogs.forEach(l => {
                    const criadoEm = formatarDataBR(l.created_at, true, true);
                    response += `### Rebaixamento #${l.id}\n\n`;
                    response += `- Responsável: <@${l.admin_id}>\n`;
                    response += `- Cargo Anterior: <@&${l.old_role_id}>\n`;
                    response += `- Cargo Novo: <@&${l.new_role_id}>\n`;
                    response += `- Data: <t:${criadoEm}:f>\n`;
                    response += `- Motivo: \` ${l.reason} \`\n\n`;
                });


            } else if (category === 'profile_option_select') {
                const joined = member.joinedAt;

                emoji = formatEmoji(emojis.static.user);
                title = `${emoji} Perfil de Usuário(a)\n-# - ${member} (${member.user.tag})\n-# - Data de Entrada: <t:${Math.floor(joined.getTime() / 1000)}:f>`;
                color = 0x63100a

                let warnings = [];
                let logs = [];
                try {
                    warnings = await api.get(`/bot/warnings/active/${userId}/${interaction.guild.id}`);
                } catch (err) {
                    console.error('Erro ao obter advertências ativas via API:', err);
                    return interaction.editReply({ embeds: [{ description: '✖ Erro ao conectar na API de advertências. Tente novamente mais tarde.', color: 0xFF0000 }] });
                }
                try {
                    logs = await api.get(`/bot/up_reb_logs/${interaction.guild.id}`);
                } catch (err) {
                    console.error('Erro ao obter logs via API:', err);
                    return interaction.editReply({ embeds: [{ description: '✖ Erro ao conectar na API de up/reb. Tente novamente mais tarde.', color: 0xFF0000 }] });
                }
                const upLogs = logs.filter(l => l.action_type === 'UP' && l.user_id === userId);
                const rebLogs = logs.filter(l => l.action_type === 'REB' && l.user_id === userId);

                response += `### Visão Geral\n\n`;
                response += `- Usuário: <@${userId}>\n`;
                response += `- Advertências Ativas: \` ${warnings.length} \`\n`;
                response += `- Total de Upamentos: \` ${upLogs.length} \`\n`;
                response += `- Total de Rebaixamentos: \` ${rebLogs.length} \`\n`;
            }

            const container = [
                new ContainerBuilder()
                .setAccentColor(color)
                .addSectionComponents(
                    new SectionBuilder()
                    .setThumbnailAccessory(
                        new ThumbnailBuilder().setURL(member.user.displayAvatarURL() || '')
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`## ${title}`)
                    )
                )
                .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${response}\u200b\n-# Máfia Trindade Penumbra® • <t:${now}:d>`)
                )
            ];

            await interaction.editReply({
                components: container,
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: { parse: [] }
            });
            
        } catch (error) {
            logger.error('Erro ao buscar registros:', error);
            await interaction.editReply({
                embeds: [{ description: '✖ Ocorreu um erro interno no sistema!', color: 0xFF0000 }]
            });
        }
    }
};
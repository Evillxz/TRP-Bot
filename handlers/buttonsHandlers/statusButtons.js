const { 
    TextDisplayBuilder, 
    ThumbnailBuilder, 
    SectionBuilder, 
    SeparatorBuilder, 
    SeparatorSpacingSize, 
    ButtonBuilder, 
    ButtonStyle, 
    ActionRowBuilder, 
    ContainerBuilder,
    MessageFlags
} = require('discord.js');
const packageJson = require('../../package.json');
const emojis = require('emojis');

async function handleStatusButtons(interaction, { emojis, chalk, logger }) {
    const client = interaction.client;
    
    if (interaction.customId === 'refresh_status') {
        const ping = client.ws.ping;
        const apiLatency = Date.now() - interaction.createdTimestamp;
        
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime) % 60;
        
        const memoryUsage = process.memoryUsage();
        const ramUsed = (memoryUsage.rss / 1024 / 1024).toFixed(2);
        const ramHeap = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
        
        const guilds = client.guilds.cache.size;
        const users = client.users.cache.size;
        const channels = client.channels.cache.size;
        const slashCommands = client.commands?.size || 0;
        const prefixCommands = client.legacyCommands?.size || 0;
        
        const messageStatus = ping < 100 ? '🟢 Operante' : ping < 400 ? '🟡 Instável' : '🔴 Degradado';
        const containerColor = ping < 100 ? 0x00ff00 : ping < 400 ? 0xffff00 : 0xff0000
        const statusEmoji = ping < 100 ? '🟢' : ping < 200 ? '🟡' : '🔴';

        const container = [
            new ContainerBuilder()
                .setAccentColor(containerColor)
                .addSectionComponents(
                    new SectionBuilder()
                        .setThumbnailAccessory(
                            new ThumbnailBuilder()
                                .setURL(client.user?.displayAvatarURL({ dynamic: true, size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png')
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent("## Informações Técnicas / Hardware"),
                            new TextDisplayBuilder().setContent(`- Status dos Serviços: \` ${messageStatus} \`\n- Última verificação: <t:${Math.floor(Date.now() / 1000)}:R>`),
                        ),
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**Latency (Rede)**\n\`\`\`yaml\n (WebSocket: ${ping}ms)  -  (API: ${apiLatency}ms) \n\`\`\`\n`+
                        `**Memory (Memória)**\n\`\`\`js\n (RAM Total: ${ramUsed}MB)  -  (Heap: ${ramHeap}MB) \n\`\`\`\n`+
                        `**Uptime (Tempo Ativo)**\n\`\`\`ts\n ${days}d ${hours}h ${minutes}m ${seconds}s \n\`\`\`\n`+
                        `**Servers (Informações Discord)**\n\`\`\`css\n (Servidores: ${guilds})  -  (Usuários: ${users.toLocaleString()}) \n\`\`\`\n`+
                        `**Commands (Comandos)**\n\`\`\`go\nSlash: ${slashCommands} ][ Prefixo: ${prefixCommands} ][ Total: ${slashCommands + prefixCommands} \n\`\`\`\n`+
                        `**Versions (Versões)**\n\`\`\`js\n Bot: ${packageJson.version}  -  Discord.js: v${require('discord.js').version}\n\`\`\``
                    ),
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
                )
                .addActionRowComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Secondary)
                                .setLabel("Atualizar")
                                .setEmoji({ id: emojis.static.reloading.id })
                                .setDisabled(false)
                                .setCustomId("refresh_status"),
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Secondary)
                                .setLabel("Detalhes Avançados")
                                .setEmoji({ id: emojis.static.advanced.id })
                                .setDisabled(false)
                                .setCustomId("detailed_status"),
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Link)
                                .setLabel("Suporte")
                                .setURL("https://discord.com/channels/1295702106195492894/1296584810021785706"),
                        ),
                ),
        ];

        await interaction.update({ 
            components: container,
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: [] } 
        });
        
    } else if (interaction.customId === 'detailed_status') {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        const container = [
            new ContainerBuilder()
                .setAccentColor(392960)
                .addSectionComponents(
                    new SectionBuilder()
                        .setButtonAccessory(
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Secondary)
                                .setLabel("Voltar")
                                .setEmoji({ id: emojis.static.back.id })
                                .setCustomId("refresh_status")
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent("## Informações Avançadas"),
                        ),
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**Memory (Informações Detalhadas)**\n- RSS: \`${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB\`\n- Heap Total: \`${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB\`\n- Heap Usado: \`${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB\`\n- External: \`${(memoryUsage.external / 1024 / 1024).toFixed(2)}MB\`\n\n`+
                        `**Process (Processo Detalhado)**\n- CPU: \` ${(cpuUsage.system / 10000).toFixed(0)}% \`\n- PID: \`${process.pid}\`\n- Plataforma: \`${process.platform}\`\n- Arquitetura: \`${process.arch}\`\n- Node.js: \`${process.version}\`\n\n`+
                        `**Discord.js (Informações)**\n- Versão: \`v${require('discord.js').version}\`\n- WebSocket: \` ${client.ws.status === 0 ? '🟢 Conectado' : '🔴 Desconectado'} \`\n- Shard: \`${client.shard?.ids?.[0] ?? '0 (Nano Banana)'}\``
                    ),
                ),
        ];

        await interaction.update({
            components: container,
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: [] } 
        });
    }
}

module.exports = { handleStatusButtons };
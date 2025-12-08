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
const packageJson = require('../package.json');
const emojis = require('emojis');

module.exports = {
    name: 'status',
    aliases: ['stats', 'info', 'botinfo', 'i'],
    description: 'Exibe informações detalhadas sobre o bot',
    
    async execute(message, { chalk, logger }) {
        try {
            const client = message.client;
            
            const ping = client.ws.ping;
            const apiLatency = Date.now() - message.createdTimestamp;
            
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
                            `**Commands (Comandos)**\n\`\`\`go\n Slash: ${slashCommands} ][ Prefixo: ${prefixCommands} ][ Total: ${slashCommands + prefixCommands} \n\`\`\`\n`+
                            `**Versions (Versões)**\n\`\`\`js\n Bot: ${packageJson.version}  -  Discord.js: v${require('discord.js').version} \n\`\`\``
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

            await message.channel.send({ 
                components: container,
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: { parse: [] } 
            });

            await message.delete()

            logger.info(`${chalk.green.bold('[STATUS]')} Comando executado por ${message.author.tag} em ${message.guild?.name || 'DM'}`);

        } catch (error) {
            logger.error(`${chalk.red.bold('[ERRO]')} Erro no comando status: ${error.stack}`);
            await message.reply({
                embeds: [{
                    description: '✖ Ocorreu um erro ao executar o comando.',
                    color: 0xFF0000
                }]
            });
        }
    }
};
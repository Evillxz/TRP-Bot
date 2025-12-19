require('dotenv').config();
require('module-alias/register');
const fs = require('node:fs');
const path = require('node:path');
const { Events, MessageFlags, formatEmoji } = require('discord.js');
const axios = require('axios');
const { Kazagumo } = require('kazagumo');
const { Connectors } = require('shoukaku');
const chalk = require('chalk');
const logger = require('./config/logger');
const { client } = require('./config/client');
const emojis = require('./emojis.json');
const WarningManager = require('./utils/warningManager');
const musicPanelManager = require('./utils/musicPanelManager');

client.manager = new Kazagumo({
    defaultSearchEngine: 'youtube',
    defaultSource: 'spsearch:',
    send: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
    }
}, new Connectors.DiscordJS(client), [
    {
        url: 'localhost:2333',
        auth: 'youshallnotpass',
        secure: false
    }
]);

client.manager.shoukaku
    .on('ready', (name) => logger.info(`${chalk.green.bold('[LAVALINK]')} Node ${name} conectado`))
    .on('error', (name, error) => logger.error(`${chalk.red.bold('[LAVALINK]')} Erro no node ${name}: ${error.message}`))
    .on('close', (name, reason) => logger.warn(`${chalk.yellow.bold('[LAVALINK]')} Node ${name} desconectado: ${reason}`));

client.manager
    .on('playerStart', async (player, track) => {
        const panelData = musicPanelManager.getPanel(player.guildId);
        if (panelData) {
            const channel = await client.channels.fetch(panelData.channelId).catch(() => null);
            if (channel) {
                const requester = track.requester || null;
                await musicPanelManager.createOrUpdatePanel(player, channel, requester);
            }
        }
    })
    .on('playerEnd', async (player, track) => {
        const repeatMode = musicPanelManager.getRepeatMode(player.guildId);
        
        if (repeatMode === 1 && track) {
            player.queue.unshift(track);
        } else if (repeatMode === 2 && track) {
            player.queue.add(track);
        }
    })
    .on('playerEmpty', async (player) => {
        const panelData = musicPanelManager.getPanel(player.guildId);
        if (panelData) {
            const savedChannel = await client.channels.fetch(panelData.channelId).catch(() => null);
            if (savedChannel) {
                await musicPanelManager.deletePanel(player.guildId, savedChannel, 'ended');
            }
        }
        player.destroy();
    });


setInterval(() => {
    const memoriaTotalUsada = process.memoryUsage().rss / 1024 / 1024;
    const servidoresAtivos = client.guilds.cache.size;
    logger.info(
        `${chalk.yellow.bold(`[MONITORAMENTO]`)} RAM: ${memoriaTotalUsada.toFixed(2)} MB | ` +
        `Servidores: ${servidoresAtivos} }`
    ); 
}, 15 * 60 * 1000);


process.on('unhandledRejection', error => {
    logger.error('--- UNHANDLED REJECTION ---');
    if (error && error.message) logger.error(`Mensagem: ${error.message}`);
    if (error && error.stack) logger.error(`Stack: ${error.stack}`);
    logger.error('-------------------------');
});

process.on('uncaughtException', error => {
    logger.error('--- UNCAUGHT EXCEPTION ---');
    if (error && error.message) logger.error(`Mensagem: ${error.message}`);
    if (error && error.stack) logger.error(`Stack: ${error.stack}`);
    logger.error('-------------------------');
});

const baseEventHandlerContext = {
    emojis: emojis,
    chalk: chalk,
    logger: logger,
    djs: {
        MessageFlags,
        formatEmoji
    }
};

client.commands = new Map();
const commandsPath = path.join(__dirname, 'slashCommands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            logger.warn(`${chalk.yellow.bold(`[ALERTA]`)} O comando de barra em ${filePath} está faltando a propriedade "data" ou "execute".`);
        }
    }
}

const userCommandsPath = path.join(__dirname, 'commands/user');
if (fs.existsSync(userCommandsPath)) {
    const userCommandFiles = fs.readdirSync(userCommandsPath).filter(file => file.endsWith('.js'));
    for (const file of userCommandFiles) {
        const filePath = path.join(userCommandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            logger.warn(`${chalk.yellow.bold(`[ALERTA]`)} O comando de usuário em ${filePath} está faltando a propriedade "data" ou "execute".`);
        }
    }
}

client.legacyCommands = new Map();
const legacyCommandsPath = path.join(__dirname, 'prefixCommands');
if (fs.existsSync(legacyCommandsPath)) {
    const legacyCommandFiles = fs.readdirSync(legacyCommandsPath).filter(file => file.endsWith('.js'));
    for (const file of legacyCommandFiles) {
        const filePath = path.join(legacyCommandsPath, file);
        const command = require(filePath);
        if (command.name && typeof command.execute === 'function') {
            client.legacyCommands.set(command.name, command);
            if (command.aliases && Array.isArray(command.aliases)) {
                command.aliases.forEach(alias => {
                    client.legacyCommands.set(alias, command);
                });
            }
        } else {
            logger.warn(`${chalk.yellow.bold(`[ALERTA]`)} O comando de prefixo '${file}' está faltando "name" ou "execute".`);
        }
    }
}

const musicCommandsPath = path.join(__dirname, 'musicCommands');
if (fs.existsSync(musicCommandsPath)) {
    const musicCommandFiles = fs.readdirSync(musicCommandsPath).filter(file => file.endsWith('.js'));
    for (const file of musicCommandFiles) {
        const filePath = path.join(musicCommandsPath, file);
        const command = require(filePath);
        if (command.name && typeof command.execute === 'function') {
            client.legacyCommands.set(command.name, command);
            if (command.aliases && Array.isArray(command.aliases)) {
                command.aliases.forEach(alias => {
                    client.legacyCommands.set(alias, command);
                });
            }
        } else {
            logger.warn(`${chalk.yellow.bold(`[ALERTA]`)} O comando de música '${file}' está faltando "name" ou "execute".`);
        }
    }
}

client.on('messageCreate', async message => {
    const prefixes = ['!', '.', 'p!', ';'];
    
    if (message.author.bot) return;
    const usedPrefix = prefixes.find(p => message.content.startsWith(p));
    if (!usedPrefix) return;

    const args = message.content.slice(usedPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.legacyCommands.get(commandName);
    if (!command) return;

    try {
        await message.channel.sendTyping();
        await command.execute(message, baseEventHandlerContext);
    } catch (err) {
        logger.error(`Erro no comando de prefixo '${commandName}': ${err.stack || err}`);
        message.reply('✖ Ocorreu um erro ao executar este comando.');
    } 
});

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    const eventContext = { ...baseEventHandlerContext, eventName: event.name };

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, eventContext));
    } else {
        client.on(event.name, (...args) => {
            if (event.name === Events.InteractionCreate) {
                event.execute(args[0], eventContext); 
            } else {
                event.execute(...args, eventContext);
            }
        });
    }
}

function checkApiHealth() {
    const apiBase = process.env.API_URL || process.env.API_BASE_URL || 'http://localhost:5500';
    const apiKey = process.env.API_KEY || process.env.BOT_API_KEY;
    const headers = apiKey ? { 'x-api-key': apiKey } : {};
    axios.get(`${apiBase.replace(/\/$/, '')}/health`, { headers, timeout: 5000 })
        .then(res => {
            if (res && res.status === 200) {
                logger.info(`${chalk.green.bold('[API]')} Saúde da API: OK => Saudável`);
            } else {
                logger.warn(`${chalk.yellow.bold('[API]')} Saúde da API: ${res.status} => Não saudável`);
            }
        })
        .catch(err => {
            logger.warn && logger.warn(`${chalk.yellow.bold('[API]')} Verificação de saúde falhou (${apiBase}/health): ${err.message}`);
        });
}

checkApiHealth();
WarningManager.startMonitoring();

try {
    const wsClient = require('./utils/wsClient');
    wsClient.connect(client);
    logger.info(`${chalk.green.bold('[WEBSOCKET]')} Cliente WebSocket conectando à API...`);
} catch (err) {
    logger.error(`${chalk.red.bold('[WEBSOCKET]')} Erro ao iniciar cliente WebSocket: ${err && err.message ? err.message : err}`);
}

client.login(process.env.BOT_TOKEN);
require('dotenv').config({ path: ".env.local" });
const fs = require('node:fs');
const path = require('node:path');
const { Events } = require('discord.js');
const chalk = require('chalk');
const logger = require('./config/logger');
const { client } = require('./config/client');
const emojis = require('./emojis.json');


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
    logger: logger
};

// Carregar comandos Slash
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

// Carregar comandos User
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

// Carregar comandos de prefixo
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

// MessageCreate para comandos de prefixo
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
        message.reply('❌ Ocorreu um erro ao executar este comando.');
    } 
});

// Carregar eventos
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

client.login(process.env.BOT_TOKEN);
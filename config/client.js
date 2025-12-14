const { Client, GatewayIntentBits, Options } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences, // Necessário para monitorar presenças/atividades
    ],
    makeCache: Options.cacheWithLimits({
        MessageManager: 0,
        PresenceManager: Infinity, // Infinity = Sem limite (monitorar todos)
        ReactionManager: 0,
        UserManager: Infinity, // Infinity = Sem limite
        GuildMemberManager: Infinity, // Infinity = Sem limite (necessário para roles e status)
        ThreadManager: 0,
        ThreadMemberManager: 0,
        GuildScheduledEventManager: 0,
        StageInstanceManager: 0,
    })
});

module.exports = { client };
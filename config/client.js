const { Client, GatewayIntentBits, Options } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildExpressions,
    ],
    makeCache: Options.cacheWithLimits({
        MessageManager: 0,
        PresenceManager: Infinity,
        ReactionManager: 0,
        UserManager: Infinity,
        GuildMemberManager: Infinity,
        ThreadManager: 0,
        ThreadMemberManager: 0,
        GuildScheduledEventManager: 0,
        StageInstanceManager: 0,
    })
});

module.exports = { client };
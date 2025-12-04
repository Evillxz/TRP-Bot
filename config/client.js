const { Client, GatewayIntentBits, Options } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
    makeCache: Options.cacheWithLimits({
        MessageManager: 0,
        PresenceManager: 0,
        ReactionManager: 0,
        UserManager: 50,
        GuildMemberManager: 30,
        ThreadManager: 0,
        ThreadMemberManager: 0,
        GuildScheduledEventManager: 0,
        StageInstanceManager: 0,
    })
});

module.exports = { client };
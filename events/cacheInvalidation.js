const { Events } = require('discord.js');
const { invalidateServerDataCache } = require('../utils/wsClient');

module.exports = [
    {
        name: Events.GuildMemberAdd,
        execute: (member) => invalidateServerDataCache(member.guild.id)
    },
    {
        name: Events.GuildMemberRemove,
        execute: (member) => invalidateServerDataCache(member.guild.id)
    },
    {
        name: Events.GuildMemberUpdate,
        execute: (oldMember, newMember) => {
            if (oldMember.nickname !== newMember.nickname) {
                invalidateServerDataCache(newMember.guild.id);
            }
        }
    },
    {
        name: Events.GuildRoleCreate,
        execute: (role) => invalidateServerDataCache(role.guild.id)
    },
    {
        name: Events.GuildRoleDelete,
        execute: (role) => invalidateServerDataCache(role.guild.id)
    },
    {
        name: Events.GuildRoleUpdate,
        execute: (newRole) => invalidateServerDataCache(newRole.guild.id)
    },
    {
        name: Events.ChannelCreate,
        execute: (channel) => invalidateServerDataCache(channel.guild.id)
    },
    {
        name: Events.ChannelDelete,
        execute: (channel) => invalidateServerDataCache(channel.guild.id)
    },
    {
        name: Events.ChannelUpdate,
        execute: (newChannel) => invalidateServerDataCache(newChannel.guild.id)
    },
    {
        name: Events.GuildEmojiCreate,
        execute: (emoji) => {
            invalidateServerDataCache(emoji.guild.id);
        }
    },
    {
        name: Events.GuildEmojiDelete,
        execute: (emoji) => {
            invalidateServerDataCache(emoji.guild.id);
        }
    },
    {
        name: Events.GuildEmojiUpdate,
        execute: (newEmoji) => {
            invalidateServerDataCache(newEmoji.guild.id);
        }
    }
];
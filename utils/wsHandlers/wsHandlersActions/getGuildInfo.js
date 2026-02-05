const { ChannelType } = require('discord.js');

async function getGuildInfo(client, payload) {
  const { guildId } = payload;
  const guild = client.guilds.cache.get(guildId);

  if (!guild) return { success: false, message: 'Servidor não encontrado.' };

  const roles = guild.roles.cache
    .filter(r => r.id !== guild.id)
    .map(r => {
      const hasCustomColor = r.color !== 0;
      const color = hasCustomColor ? r.hexColor : '#96a6a8';

      return {
        id: r.id,
        name: r.name,
        color,
        position: r.position,
        hoist: r.hoist,
        managed: r.managed,
        permissions: r.permissions.bitfield.toString()
      };
    })
    .sort((a, b) => b.position - a.position);

  const channels = guild.channels.cache
    .filter(c => [
      ChannelType.GuildText, 
      ChannelType.GuildVoice, 
      ChannelType.GuildCategory,
      ChannelType.GuildAnnouncement,
      ChannelType.GuildForum,
      ChannelType.GuildStageVoice
    ].includes(c.type))
    .map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      parentId: c.parentId,
      position: c.position
    }))
    .sort((a, b) => {
      if (a.parentId === b.parentId) return a.position - b.position;
      return 0; 
    });

  const emojis = guild.emojis.cache.map(e => ({
    id: e.id,
    name: e.name,
    animated: e.animated,
    url: e.imageURL({ dynamic: true, size: 512 })
  }));

  const data = {
    id: guild.id,
    name: guild.name,
    icon: guild.iconURL({ dynamic: true, size: 512 }),
    banner: guild.bannerURL({ size: 1024 }),
    memberCount: guild.memberCount,
    description: guild.description,
    ownerId: guild.ownerId,
    roles,
    channels,
    emojis
  };

  return { success: true, data };
}

module.exports = { getGuildInfo };
const handlers = {};

function registerHandler(action, handler) {
  if (typeof handler !== 'function') {
    throw new Error(`Handler para "${action}" deve ser uma função`);
  }
  handlers[action] = handler;
}

async function executeHandler(action, params) {
  const handler = handlers[action];
  if (!handler) {
    throw new Error(`Ação desconhecida: ${action}`);
  }
  return handler(params);
}

function getAvailableActions() {
  return Object.keys(handlers);
}

registerHandler('get_guild_channels', async ({ client, payload }) => {
  const { guildId } = payload;
  
  if (!guildId || typeof guildId !== 'string') {
    throw new Error('guildId inválido');
  }

  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    return [];
  }

  try {
    await guild.channels.fetch();
  } catch (e) {
  }

  return Array.from(guild.channels.cache.values()).map(ch => ({
    id: ch.id,
    name: ch.name,
    type: ch.type,
    parentId: ch.parentId || null
  }));
});

registerHandler('get_guild_roles', async ({ client, payload }) => {
  const { guildId } = payload;
  
  if (!guildId || typeof guildId !== 'string') {
    throw new Error('guildId inválido');
  }

  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    return [];
  }

  try {
    await guild.roles.fetch();
  } catch (e) {
  }

  return Array.from(guild.roles.cache.values())
    .filter(r => r.id !== guild.id)
    .map(r => ({
      id: r.id,
      name: r.name,
      color: r.color,
      position: r.position,
      permissions: r.permissions.bitfield
    }));
});

registerHandler('get_guild_members', async ({ client, payload }) => {
  const { guildId, limit = 100 } = payload;
  
  if (!guildId || typeof guildId !== 'string') {
    throw new Error('guildId inválido');
  }

  const safeLimit = Math.min(limit, 1000);

  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    return [];
  }

  try {
    await guild.members.fetch({ limit: safeLimit });
  } catch (e) {
  }

  return Array.from(guild.members.cache.values())
    .slice(0, safeLimit)
    .map(m => ({
      id: m.id,
      username: m.user.username,
      tag: m.user.tag,
      avatar: m.user.avatar,
      joinedAt: m.joinedAt,
      roles: m.roles.cache.map(r => r.id)
    }));
});

registerHandler('get_member', async ({ client, payload }) => {
  const { guildId, memberId } = payload;
  
  if (!guildId || !memberId || typeof guildId !== 'string' || typeof memberId !== 'string') {
    throw new Error('guildId ou memberId inválido');
  }

  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    throw new Error('Servidor não encontrado');
  }

  try {
    const member = await guild.members.fetch(memberId);
    return {
      id: member.id,
      username: member.user.username,
      tag: member.user.tag,
      avatar: member.user.avatar,
      joinedAt: member.joinedAt,
      roles: member.roles.cache.map(r => ({ id: r.id, name: r.name })),
      nickname: member.nickname,
      premiumSince: member.premiumSince
    };
  } catch (e) {
    throw new Error('Membro não encontrado');
  }
});

registerHandler('list_guilds', async ({ client }) => {
  return Array.from(client.guilds.cache.values()).map(g => ({
    id: g.id,
    name: g.name,
    icon: g.icon,
    memberCount: g.memberCount || g.members.cache.size,
    ownerId: g.ownerId
  }));
});

registerHandler('ping', async ({ client, botId }) => {
  return {
    botId,
    uptime: process.uptime(),
    guilds: client.guilds.cache.size,
    users: client.users.cache.size,
    timestamp: Date.now()
  };
});

registerHandler('get_bot_info', async ({ client, botId }) => {
  return {
    id: client.user.id,
    username: client.user.username,
    tag: client.user.tag,
    avatar: client.user.avatar,
    botId,
    uptime: process.uptime(),
    guilds: client.guilds.cache.size,
    status: client.user.presence?.status || 'offline',
    availableActions: getAvailableActions()
  };
});

registerHandler('send_embed', async ({ client, payload }) => {
  const { channelId, content, embed } = payload;

  if (!channelId) {
    throw new Error('ID do canal é obrigatório');
  }

  try {
    const channel = await client.channels.fetch(channelId).catch(() => null);

    if (!channel) {
      throw new Error('Canal não encontrado');
    }

    if (!channel.isTextBased()) {
      throw new Error('O canal deve ser um canal de texto');
    }

    if (!channel.permissionsFor(client.user).has(['SendMessages', 'EmbedLinks'])) {
      throw new Error('Sem permissão para enviar mensagens ou embeds neste canal');
    }

    const messagePayload = {};

    if (content) {
      messagePayload.content = content;
    }

    if (embed && Object.keys(embed).length > 0) {
      messagePayload.embeds = [embed];
    }

    const message = await channel.send(messagePayload);

    return {
      success: true,
      messageId: message.id,
      channelId: channel.id,
      timestamp: message.createdTimestamp,
    };
  } catch (error) {
    throw new Error(`Erro ao enviar embed: ${error instanceof Error ? error.message : String(error)}`);
  }
});

registerHandler('get_status', async ({ client }) => {
  const lavalinkNodes = client.manager && client.manager.shoukaku ? client.manager.shoukaku.nodes : new Map();
  const lavalinkStatus = Array.from(lavalinkNodes.values()).map(node => ({
    name: node.name,
    state: node.state,
    stats: node.stats,
    ping: node.ping || -1
  }));

  return {
    uptime: process.uptime(),
    ping: client.ws.ping,
    memory: process.memoryUsage().rss,
    lavalink: lavalinkStatus
  };
});

module.exports = {
  registerHandler,
  executeHandler,
  getAvailableActions
};

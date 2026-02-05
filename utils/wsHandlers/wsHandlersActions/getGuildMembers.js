async function getGuildMembers(client, payload) {
  const { guildId, page = 1, limit = 15, query = '' } = payload;

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return { success: false, message: 'Servidor não encontrado.' };

  let members = Array.from(guild.members.cache.values());

  if (query) {
    const term = query.toLowerCase();
    members = members.filter(m => 
      m.user.username.toLowerCase().includes(term) || 
      (m.nickname && m.nickname.toLowerCase().includes(term))
    );
  }

  const startIndex = (Number(page) - 1) * Number(limit);
  const endIndex = startIndex + Number(limit);
  const pagedMembers = members.slice(startIndex, endIndex);

  const data = pagedMembers.map(m => {
    const gameActivity = m.presence?.activities?.find(a => a.type === 0);
    
    return {
      id: m.id,
      username: m.user.username,
      globalName: m.user.globalName,
      nickname: m.nickname,
      avatar: m.user.displayAvatarURL({ dynamic: true }),
      guildAvatar: m.avatarURL({ dynamic: true }),
      roles: m.roles.cache
        .filter(r => r.id !== m.guild.id)
        .sort((a, b) => b.position - a.position)
        .map(r => ({
          id: r.id,
          name: r.name,
          color: r.hexColor === '#000000' ? '#99aab5' : r.hexColor,
          position: r.position
        }))
      ,
      joinedAt: m.joinedAt,
      status: m.presence?.status || 'offline',
      activity: gameActivity?.name || 'N/A Activity',
    }
  });

  return {
    success: true,
    data: {
      members: data,
      pagination: {
        total: members.length,
        page: Number(page),
        totalPages: Math.ceil(members.length / limit)
      }
    }
  };
}

module.exports = { getGuildMembers };
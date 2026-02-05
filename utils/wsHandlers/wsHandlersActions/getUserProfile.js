async function getUserProfile(client, payload) {
  const { guildId, userId } = payload;

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return { success: false, message: 'Servidor não encontrado.' };

  let member = guild.members.cache.get(userId);

  if (!member) {
    try {
      member = await guild.members.fetch(userId);
    } catch (e) {
      return { success: false, message: 'Membro não encontrado.' };
    }
  }

  const data = {
    id: member.id,
    tag: member.user.tag,
    nickname: member.nickname,
    avatar: member.displayAvatarURL({ dynamic: true, size: 512 }),
    roles: member.roles.cache
      .filter(r => r.name !== '@everyone')
      .map(r => ({ id: r.id, name: r.name, color: r.hexColor }))
      .sort((a, b) => b.position - a.position),
    joinedAt: member.joinedAt,
    createdAt: member.user.createdAt,
    premiumSince: member.premiumSince,
    permissions: member.permissions.toArray(),
    status: member.presence.status,
    ativity: member.presence.activities
  };

  return { success: true, data };
}

module.exports = { getUserProfile };
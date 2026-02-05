const {
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags,
  formatEmoji
} = require('discord.js');
const emojis = require('emojis');

async function raffleWinner(client, payload) {
  const { winner } = payload;
  
  const channelId = '1449810307349221387';
  const channel = client.channels.cache.get(channelId);
  
  if (!channel) {
    return { success: false, message: 'Canal nao encontrado' };
  };

  const emoji = formatEmoji(emojis.static.gift2);

  const container = [
      new TextDisplayBuilder().setContent(`|| <@${winner.discord_id}> ||`),
      new ContainerBuilder()
      .setAccentColor(0xFFD700)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${emoji} Sorteio Finalizado!\n<@${winner.discord_id}> foi o vencedor, Parabéns!`),
      )
    ];

  await channel.send({ components: container, flags: MessageFlags.IsComponentsV2 });

  return { success: true, message: 'Sorteio finalizado com sucesso.' };
}

module.exports = { raffleWinner };
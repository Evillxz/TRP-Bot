const logger = require('../config/logger');
const floodIntervals = new Map();

module.exports = {
  name: 'messageflood',
  description: 'Ativa ou desativa flood de mensagens em um canal específico.',

  async execute(message, args) {

    const option = args[0];
    const channelId = args[1];

    if (!option || !["on", "off"].includes(option)) {
      return message.reply("Use `;messageflood on <canalId>` ou `;messageflood off <canalId>`");
    }

    if (!channelId) {
      return message.reply("❌ Você precisa informar o ID do canal.");
    }

    const channel = message.guild.channels.cache.get(channelId);

    if (!channel || !channel.isTextBased()) {
      return message.reply("❌ Canal inválido ou não é um canal de texto.");
    }

    if (option === "off") {
      if (!floodIntervals.has(channelId)) {
        return message.reply("⚠️ O message flood já está desligado nesse canal.");
      }

      clearInterval(floodIntervals.get(channelId));
      floodIntervals.delete(channelId);

      return message.reply(`🛑 Message flood desligado no canal <#${channelId}>`);
    }

    if (floodIntervals.has(channelId)) {
      return message.reply("⚠️ O message flood já está ativo nesse canal.");
    }

    const interval = setInterval(async () => {
      try {
        const sentMessage = await channel.send("@everyone @here Olhem o aviso acima!");

        setTimeout(() => {
          sentMessage.delete().catch(() => {});
        }, 3000);
      } catch (err) {
        logger?.error?.("Erro no message flood:", err);
      }
    }, 6000);

    floodIntervals.set(channelId, interval);

    message.reply(`✅ Message flood ativado no canal <#${channelId}>`);
  }
};
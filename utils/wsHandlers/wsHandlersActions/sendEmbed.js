const logger = require('logger');

async function sendEmbed( client, payload) {
   const { channelId, content, embed, embeds, editLastMessage } = payload;

  if (!channelId) {
    return { success: false, code: 'CHANNEL_ID_REQUIRED', message: 'ID do canal é obrigatório' };
  }

  try {
    const channel = await client.channels.fetch(channelId).catch(() => null);

    if (!channel) {
      return { success: false, code: 'CHANNEL_NOT_FOUND', message: 'Canal nao encontrado' };
    }

    if (!channel.isTextBased()) {
      return { success: false, code: 'NOT_TEXT_CHANNEL', message: 'O canal deve ser um canal de texto' };
    }

    if (!channel.permissionsFor(client.user).has(['SendMessages', 'EmbedLinks'])) {
      return { success: false, code: 'NO_SEND_PERMISSION', message: 'Sem permissão para enviar mensagens ou embeds neste canal' };
    }

    const messagePayload = {};

    if (content) {
      messagePayload.content = content;
    } else {
      messagePayload.content = null;
    }

    if (embeds && Array.isArray(embeds) && embeds.length > 0) {
      messagePayload.embeds = embeds;
    } else if (embed && Object.keys(embed).length > 0) {
      messagePayload.embeds = [embed];
    } else {
      messagePayload.embeds = [];
    }

    let message;

    if (editLastMessage) {
      try {
        const messages = await channel.messages.fetch({ limit: 30 });
        const lastMessage = messages.find(m => m.author.id === client.user.id);

        if (lastMessage && lastMessage.editable && lastMessage.components.length === 0) {
          message = await lastMessage.edit(messagePayload);
        }
      } catch (err) {
        logger.error('Erro ao tentar editar última mensagem:', err);
      }
    }

    if (!message) {
      message = await channel.send(messagePayload);
    }

    return {
      success: true,
      code: 'SEND_SUCCESS',
      message: 'Embed enviado com sucesso',
      messageId: message.id,
      channelId: channel.id,
      timestamp: message.createdTimestamp,
    };
    
  } catch (error) {
    return { success: false, code: 'SEND_ERROR', message: 'Erro ao enviar embed' };
  }
}

module.exports = { sendEmbed };
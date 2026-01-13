const { 
    MessageFlags,
    ContainerBuilder, 
    TextDisplayBuilder, 
    ThumbnailBuilder, 
    SectionBuilder,
    formatEmoji,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const emojis = require('emojis');
const logger = require('logger');
const chalk = require('chalk');
const { applyWarning } = require('../handlers/modalsHandlers/modalsSubmit/handleSubmitAdvModal');
const { applyExoneration } = require('../handlers/modalsHandlers/modalsSubmit/handleSubmitBanModal');

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

registerHandler('send_embed', async ({ client, payload }) => {
  const { channelId, content, embed, embeds, editLastMessage } = payload;

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
    } else {
      messagePayload.content = null; // Limpar conteúdo se não houver
    }

    if (embeds && Array.isArray(embeds) && embeds.length > 0) {
      messagePayload.embeds = embeds;
    } else if (embed && Object.keys(embed).length > 0) {
      messagePayload.embeds = [embed];
    } else {
      messagePayload.embeds = []; // Limpar embeds se não houver
    }

    let message;

    if (editLastMessage) {
      try {
        const messages = await channel.messages.fetch({ limit: 30 });
        const lastMessage = messages.find(m => m.author.id === client.user.id);

        // Se encontrou mensagem, é editável e não tem componentes (botões/menus)
        if (lastMessage && lastMessage.editable && lastMessage.components.length === 0) {
          message = await lastMessage.edit(messagePayload);
        }
      } catch (err) {
        console.error('Erro ao tentar editar última mensagem:', err);
        // Se falhar, continua para enviar nova mensagem
      }
    }

    if (!message) {
      message = await channel.send(messagePayload);
    }

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

registerHandler('apply_warning', async ({ client, payload }) => {

  const context = {
    logger: logger,
    emojis: emojis,
    chalk: chalk,
    client: client
  };

  await applyWarning(null, context, payload);

  return { success: true, action: 'warn', message: `Advertência aplicada com sucesso.` };
});

registerHandler('apply_exoneration', async ({ client, payload }) => {

    const context = {
      logger: logger,
      emojis: emojis,
      chalk: chalk,
      client: client
    };

    await applyExoneration(null, context, payload);

    return { success: true, message: 'Exoneração aplicada com sucesso.' };
});

registerHandler('create_raffle', async ({ client, payload }) => {
  const { id, title, description, image_url, image_path } = payload;
  const { AttachmentBuilder } = require('discord.js');
  const path = require('path');
  const channelId = '1447340512981024879';
  const channel = client.channels.cache.get(channelId);
  if (!channel) throw new Error('Canal não encontrado');

  let files = [];
  let thumbnailUrl = '';

  if (image_path) {
    const filename = path.basename(image_path);
    const attachment = new AttachmentBuilder(image_path, { name: filename });
    files.push(attachment);
    thumbnailUrl = `attachment://${filename}`;
  } else if (image_url && image_url.startsWith('http')) {
    thumbnailUrl = image_url;
  }

  const crown = formatEmoji(emojis.static.crown);
  const check = formatEmoji(emojis.animated.check, true);
  const count = 0;

  const container = [
      new TextDisplayBuilder().setContent("|| @everyone @here ||"),
      new ContainerBuilder()
      .addSectionComponents(
        new SectionBuilder()
        .setThumbnailAccessory(
        new ThumbnailBuilder()
          .setURL(thumbnailUrl || client.user.displayAvatarURL())
          .setDescription('Imagem do Sorteio')
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## ${crown} ${title}ㅤㅤ\n`+
              `${description}\n`
            ),
        ),
      )
      .addSectionComponents(
        new SectionBuilder()
        .setButtonAccessory(
          new ButtonBuilder()
          .setStyle(ButtonStyle.Success)
          .setLabel(`Entrar (${count})`)
          .setEmoji({ id: emojis.static.gift.id })
          .setCustomId(`raffle_enter_${id}`)
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`-# ${check} Powered by Trindade Penumbra®`),
        ),
      ),
    ];

  await channel.send({
    files: files,
    components: container,
    flags: MessageFlags.IsComponentsV2
  });
});

registerHandler('raffle_winner', async ({ client, payload }) => {
  const { raffle_id, winner } = payload;
  
  const channelId = '1449810307349221387';
  const channel = client.channels.cache.get(channelId);
  if (!channel) throw new Error('Canal não encontrado');

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
});

module.exports = {
  registerHandler,
  executeHandler,
  getAvailableActions
};
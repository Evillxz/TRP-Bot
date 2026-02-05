const { 
    MessageFlags,
    ContainerBuilder, 
    TextDisplayBuilder, 
    ThumbnailBuilder, 
    SectionBuilder,
    formatEmoji,
    ButtonBuilder,
    ButtonStyle,
    AttachmentBuilder
} = require('discord.js');
const emojis = require('emojis');
const path = require('path');

async function createRaffle(client, payload) {
  const { id, title, description, image_url, image_path } = payload;
  const channelId = '1449810307349221387';
  const channel = client.channels.cache.get(channelId);

  if (!channel) {
    return { success: false, message: 'Canal nao encontrado' };
  };

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
      new TextDisplayBuilder().setContent("Texto"),
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

  return { success: true, message: 'Sorteio criado com sucesso.' };
}

module.exports = { createRaffle };
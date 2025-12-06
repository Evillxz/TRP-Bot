const { 
    Events, 
    AttachmentBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder, 
    SeparatorBuilder, 
    SeparatorSpacingSize, 
    TextDisplayBuilder, 
    ContainerBuilder,
    MessageFlags
} = require('discord.js');

const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, context) {
        const { logger } = context;

        const welcomeChannelId = '1296584792111845449';
        const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);

        if (welcomeChannel) {
            try {

                const canvas = createCanvas(800, 220);
                const ctx = canvas.getContext('2d');
    
                const backgroundPath = path.resolve('./images/trp-banner.png');
                const background = await loadImage(backgroundPath);
                ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 50px sans-serif';
                const displayName = member.user.globalName || member.user.username;
                ctx.fillText(displayName, 200, 135);
    
                ctx.fillStyle = '#bbbbbb';
                ctx.font = '30px sans-serif';
                ctx.fillText(`@${member.user.username}`, 200, 175);
    
                ctx.fillStyle = '#d3d3d3';
                ctx.font = '13px sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('Entrou no servidor', 785, 200);
                ctx.textAlign = 'left';
    
                const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 128 });
                const avatar = await loadImage(avatarURL);
    
                ctx.save();
                ctx.beginPath();
                ctx.arc(100, 125, 75, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip(); 
                ctx.drawImage(avatar, 25, 50, 150, 150);
                ctx.restore();
    
                const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome-image.png' });

                const components = [
                    new TextDisplayBuilder().setContent(`|| <@${member.user.id}> ||`),
                    new ContainerBuilder()
                        .addMediaGalleryComponents(
                            new MediaGalleryBuilder()
                                .addItems(
                                    new MediaGalleryItemBuilder()
                                        .setURL("attachment://welcome-image.png")
                                ),
                        )
                        /*
                        .addSeparatorComponents(
                            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent("### É uma grande honra que você tenha se juntado a nossa família, siete i benvenuti!"),
                        ),
                        */
                ];

                await welcomeChannel.send({
                    components: components,
                    files: [attachment],
                    flags: MessageFlags.IsComponentsV2,
                    allowedMentions: { users: [member.user.id] }
                });

            } catch (error) {
                logger.error(`Não foi possível enviar a mensagem de boas-vindas com imagem: ${error}`);
            }
        } else {
            logger.warn('Canal de boas-vindas não encontrado. Verifique o ID.');
        }
    },
};
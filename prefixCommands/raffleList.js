const { PermissionFlagsBits, AttachmentBuilder, formatEmoji, MessageFlags } = require('discord.js');
const database = require('database');
const emojis = require('emojis');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'rafflelist',
    description: 'Lista todos os participantes ativos do sorteio',
    async execute(message, args) {
        const sponsorId = '490119492597186571';
        const hasPermission = message.member.permissions.has(PermissionFlagsBits.Administrator) || message.author.id === sponsorId;
        
        if (!hasPermission) {
            return message.reply({
                embeds: [{
                    description: '✖ Você não tem permissão para usar este comando.',
                    color: 0xFF0000
                }],
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            const participants = await database.getActiveRaffleParticipants();

            const gift = formatEmoji(emojis.static.gift);

            if (participants.length === 0) {
                return message.reply({
                    embeds: [{
                        description: `${gift} Nenhum participante no sorteio ainda!`,
                        color: 0xFFFF00
                    }],
                    flags: MessageFlags.Ephemeral
                });
            }

            let content = `LISTA DE PARTICIPANTES DO SORTEIO\n`;
            content += `Total: ${participants.length}\n`;
            content += `Data: ${new Date().toLocaleString('pt-BR')}\n`;
            content += `${'='.repeat(50)}\n\n`;

            participants.forEach((p, index) => {
                content += `${index + 1}. ${p.discord_name} (${p.discord_tag})\n`;
                content += `   ID: ${p.discord_id}\n`;
                content += `   Entrada: ${new Date(p.created_at).toLocaleString('pt-BR')}\n\n`;
            });

            const fileName = `sorteio_${Date.now()}.txt`;
            const filePath = path.join(__dirname, '..', 'logs', fileName);

            fs.writeFileSync(filePath, content, 'utf8');

            const attachment = new AttachmentBuilder(filePath, { name: fileName });

            await message.channel.send({
                content: `${gift} Lista de participantes do sorteio **(${participants.length} participantes)**`,
                files: [attachment]
            });

            await message.delete();

            fs.unlinkSync(filePath);

        } catch (error) {
            console.error('Erro ao gerar lista de participantes:', error);
            message.reply({
                embeds: [{
                    description: `✖ Erro ao gerar a lista de participantes!`,
                    color: 0xFF0000
                }],
                flags: MessageFlags.Ephemeral
            });
        }
    }
};

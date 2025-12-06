const database = require('../database/database');

module.exports = {
    name: 'checkwarnings',
    description: 'Verifica advertências no banco de dados',
    async execute(message, context) {
        const { logger } = context;
        
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply({
                embeds: [{
                    description: '✖ Você não tem permissão para usar este comando.',
                    color: 0xFF0000
                }]
            });
        }

        try {
            const query = `SELECT * FROM warnings WHERE guild_id = ? ORDER BY created_at DESC LIMIT 10`;
            
            const warnings = await new Promise((resolve, reject) => {
                database.db.all(query, [message.guild.id], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            if (warnings.length === 0) {
                return message.reply({
                    embeds: [{
                        description: '✖ Nenhuma advertência encontrada.',
                        color: 0xFF0000
                    }]
                });
            }

            let response = '📋 **Últimas advertências:**\n\n';
            const now = new Date().toISOString();
            
            warnings.forEach(warning => {
                const expired = warning.expires_at && warning.expires_at <= now;
                const status = warning.is_active ? (expired ? '🟡 Expirada' : '🟢 Ativa') : '🔴 Inativa';
                
                response += `**ID:** ${warning.id}\n`;
                response += `**Usuário:** ${warning.user_tag}\n`;
                response += `**Status:** ${status}\n`;
                response += `**Expira em:** ${warning.expires_at || 'Permanente'}\n`;
                response += `**Criada em:** ${warning.created_at}\n\n`;
            });

            response += `**Hora atual (UTC):** ${now}`;

            await message.reply(response);
            
        } catch (error) {
            logger.error('Erro ao verificar advertências:', error);
            await message.reply('❌ Erro ao consultar o banco de dados.');
        }
    }
};
const apiClient = require('apiClient');

module.exports = {
    name: 'syncjoins',
    description: 'Sincroniza a data de entrada dos membros atuais com o banco de dados.',
    async execute(message, args, context) {
        const { logger } = context;

        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('Você não tem permissão para usar este comando.');
        }

        const statusMsg = await message.reply('⏳ Iniciando sincronização de membros...');

        try {
            let members = message.guild.members.cache;
            
            if (members.size < message.guild.memberCount) {
                try {
                    await statusMsg.edit('⏳ Buscando lista completa de membros do Discord (pode demorar)...');
                    members = await message.guild.members.fetch({ time: 60000 });
                } catch (fetchError) {
                    logger.warn(`Erro ao buscar membros via Gateway: ${fetchError.message}. Usando cache atual.`);
                    await message.channel.send(`⚠️ O Discord limitou a busca completa (Rate Limit). Sincronizando apenas os ${members.size} membros já carregados.`);
                }
            }

            let count = 0;
            let errors = 0;
            const total = members.size;

            await statusMsg.edit(`⏳ Processando ${total} membros...`);

            for (const [id, member] of members) {
                try {
                    await apiClient.post('/bot/member_flow', {
                        user_id: member.id,
                        user_tag: member.user.tag,
                        action: 'join',
                        created_at: member.joinedAt.toISOString()
                    });
                    count++;
                } catch (err) {
                    errors++;
                    if (!err.response || err.response.status !== 500) {
                         logger.error(`Erro ao sincronizar membro ${member.user.tag}: ${err.message}`);
                    }
                }
                
                if (count % 20 === 0) {
                    await new Promise(r => setTimeout(r, 500));
                    if (count % 100 === 0) {
                        await statusMsg.edit(`⏳ Processando... ${count}/${total} (Erros: ${errors})`);
                    }
                }
            }

            await statusMsg.edit(`✅ Sincronização concluída!\n👥 Membros processados: ${count}/${total}\n❌ Erros: ${errors}`);

        } catch (error) {
            logger.error(`Erro fatal na sincronização: ${error}`);
            await statusMsg.edit(`❌ Ocorreu um erro fatal: ${error.message}`);
        }
    }
};

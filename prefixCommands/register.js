const handle = require("../handlers/slashHandlers/handleRegister");

module.exports = {
    name: 'painelregistro',
    aliases: ['pr', 'painelr', 'rpainel'],
    description: 'Envia o painel de registro.',

    async execute(message, context) {
        const mockInteraction = {
            guild: message.guild,
            member: message.member,
            user: message.author,
            client: context.client,
            
            deferred: false,
            replied: false,

            deferReply: async function(options) {
                this.deferred = true;
                return Promise.resolve();
            },

            editReply: async function(options) {
                this.replied = true;
                return await message.channel.send(options);
            },

            reply: async function(options) {
                this.replied = true;
                return await message.channel.send(options);
            }
        };

        try {
            await message.channel.sendTyping();

            await handle.execute(mockInteraction, context);
            
            if (message.deletable) {
                message.delete().catch(err => context.logger.warn(`Não foi possível deletar mensagem: ${err.message}`));
            }
    
        } catch (error) {
            context.logger.error(`Erro ao executar comando de prefixo 'tempo' para ${message.author.tag}:`, error);
            await message.reply({
                embeds: [{
                    description: '✖ Ocorreu um erro ao executar o comando.',
                    color: 0xFF0000
                }]
            });
        }
    }
};
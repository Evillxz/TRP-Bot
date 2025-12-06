module.exports = {
    async execute(interaction, context) {
        const { logger, chalk, djs: { MessageFlags } } = context;

        const roleMap = {
            'men_role': '1368800681741516851',
            'women_role': '1368800797344796832',
            'veteran_role': '1446254282318942300',
            'newbie_role': '1446254386413178971',
            'random_deletor_role': '1446247386736492654',
            'm4_king_role': '1446247456781373541',
            'vin_diesel_role': '1446247556114812980',
            'playboy_role': '1446247626923184270'
        };

        const roleId = roleMap[interaction.customId];
        if (!roleId) return;

        const member = interaction.member;
        const role = interaction.guild.roles.cache.get(roleId);

        if (!role) {
            return await interaction.reply({
                embeds: [{
                    description: '✖ Cargo não encontrado!',
                    color: 0xFF0000
                }],
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            if (member.roles.cache.has(roleId)) {
                await member.roles.remove(roleId);
                await interaction.deferUpdate();
            } else {
                await member.roles.add(roleId);
                await interaction.deferUpdate();
            }
        } catch (error) {
            logger.error(`${chalk.red.bold('[ERRO]')} Erro ao gerenciar cargo: ${error.stack}`);
            await interaction.reply({
                embeds: [{
                    description: '✖ Erro interno no sistema!',
                    color: 0xFF0000
                }],
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
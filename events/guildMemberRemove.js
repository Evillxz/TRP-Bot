const { Events } = require('discord.js');
const apiClient = require('apiClient');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member, context) {
        const { logger } = context;

        try {
            await apiClient.post('/bot/member_flow', {
                user_id: member.id,
                user_tag: member.user.tag,
                action: 'leave'
            });
        } catch (error) {
            logger.error(`Failed to log member leave: ${error.message}`);
        }
    },
};

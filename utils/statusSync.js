const axios = require('axios');
const logger = require('../config/logger');
const chalk = require('chalk');

let hasFetchedMembers = false;
let lastFetchTime = 0;
const FETCH_COOLDOWN = 5 * 60 * 1000;

async function syncUserStatuses(client, forceFetch = false) {
  try {
    const apiBase = process.env.API_URL || process.env.API_BASE_URL || 'http://localhost:5500';
    const apiKey = process.env.API_KEY || process.env.BOT_API_KEY;
    
    if (!apiKey) {
      logger.warn(`${chalk.yellow.bold('[USER_STATUS]')} API_KEY não configurada, sincronização de status desabilitada`);
      return;
    }

    const targetGuildId = '1295702106195492894';
    const guild = client.guilds.cache.get(targetGuildId);

    if (!guild) {
      logger.warn(`${chalk.yellow.bold('[USER_STATUS]')} Guilda ${targetGuildId} não encontrada. Verifique se o bot está no servidor.`);
      return;
    }

    const now = Date.now();
    const shouldFetch = !hasFetchedMembers || forceFetch || (now - lastFetchTime > FETCH_COOLDOWN);
    
    if (shouldFetch) {
      try {
        await guild.members.fetch();
        hasFetchedMembers = true;
        lastFetchTime = now;
      } catch (fetchError) {
        if (!fetchError.message.includes('rate limited')) {
          throw fetchError;
        }
      }
    }

    const userStatuses = [];
    
    guild.members.cache.forEach(member => {
      if (!member.user.bot) {
        const presence = member.presence;
        let status = 'offline';
        
        if (presence && presence.status) {
          status = presence.status;
        }
        
        const roles = member.roles.cache
          .filter(role => role.id !== guild.id)
          .map(role => ({
            id: role.id,
            name: role.name,
            color: role.hexColor
          }));
        
        userStatuses.push({
          userId: member.user.id,
          status: status,
          roles: roles
        });
      }
    });

    if (userStatuses.length > 0) {
      
      
      const response = await axios.post(
        `${apiBase.replace(/\/$/, '')}/api/bot/user_status/batch`,
        { users: userStatuses },
        {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

    }
  } catch (error) {
    logger.error(`${chalk.red.bold('[USER_STATUS]')} Erro ao sincronizar status: ${error.message}`);
    if (error.response) {
      logger.error(`${chalk.red.bold('[USER_STATUS]')} Status: ${error.response.status}, Dados: ${JSON.stringify(error.response.data)}`);
    }
  }
}

function initializeStatusSync(client, context) {
  setInterval(() => {
    syncUserStatuses(client, false);
  }, 360000);
  
  setTimeout(() => {
    syncUserStatuses(client, true);
  }, 5000);
}

module.exports = {
  initializeStatusSync,
  syncUserStatuses
};
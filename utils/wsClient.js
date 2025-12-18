const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const logger = require('../config/logger');
const { executeHandler } = require('./wsHandlers');

let ws = null;
let reconnecting = false;
let reconnectAttempts = 0;
let heartbeatInterval = null;
let heartbeatTimeout = null;
let serverDataRefreshInterval = null;
let isAlive = false;
const MAX_RECONNECT_ATTEMPTS = 50;
const BASE_RECONNECT_DELAY = 3000;
const MAX_RECONNECT_DELAY = 60000;
const HEARTBEAT_INTERVAL = 30000;
const HEARTBEAT_TIMEOUT = 10000;
const SERVER_DATA_CACHE_TTL = 4 * 60 * 1000;
const SERVER_DATA_REFRESH_INTERVAL = 4 * 60 * 1000;
const localBotId = process.env.BOT_ID || `bot_${uuidv4()}`;

const serverDataCache = new Map();

async function connect(client) {
  const apiBase = process.env.API_URL || process.env.API_BASE_URL || 'http://localhost:5500';
  const wsUrl = (apiBase.startsWith('https') ? apiBase.replace(/^https/, 'wss') : apiBase.replace(/^http/, 'ws')) + '/ws';
  const apiKey = process.env.API_KEY || process.env.BOT_API_KEY;

  if (!apiKey) {
    logger.error(`${chalk.red.bold('[WS CLIENT]')} API_KEY não configurada! WebSocket desabilitado.`);
    return;
  }

  const isServerDataCacheValid = (guildId) => {
    const cached = serverDataCache.get(guildId);
    if (!cached) return false;
    
    const age = Date.now() - cached.timestamp;
    if (age > SERVER_DATA_CACHE_TTL) {
      serverDataCache.delete(guildId);
      return false;
    }
    
    return true;
  };

  const getCachedServerData = (guildId) => {
    if (isServerDataCacheValid(guildId)) {
      logger.info(`${chalk.cyan.bold('[WS CLIENT]')} Usando dados do servidor do cache (${guildId})`);
      return serverDataCache.get(guildId).data;
    }
    return null;
  };

  const cacheServerData = (guildId, data) => {
    try {
      serverDataCache.set(guildId, {
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error(`${chalk.red.bold('[WS CLIENT]')} Erro ao salvar dados em cache para servidor ${guildId}: ${error.message}`);
    }
  };

  const collectServerData = (guild) => {
    const rolesData = guild.roles.cache
      .filter(r => r.id !== guild.id)
      .map(r => ({
        id: r.id,
        name: r.name,
        color: r.color ? `#${r.color.toString(16).padStart(6, '0')}` : '#b3bac1'
      }))
      .sort((a, b) => b.name.localeCompare(a.name));

    const usersData = guild.members.cache
      .filter(m => !m.user.bot)
      .map(m => ({
        id: m.user.id,
        username: m.user.username,
        nickname: m.nickname || undefined,
        avatar: m.user.displayAvatarURL({ size: 64 })
      }))
      .sort((a, b) =>
        (a.nickname || a.username).localeCompare(b.nickname || b.username)
      );

    const channelsData = guild.channels.cache
      .filter(c => c.isTextBased() && c.viewable)
      .map(c => ({
        id: c.id,
        name: c.name,
        type: c.type
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const emojisData = guild.emojis.cache
      .map(e => ({
        id: e.id,
        name: e.name,
        animated: e.animated
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      roles: rolesData,
      users: usersData,
      channels: channelsData,
      emojis: emojisData
    };
  };

  function doConnect() {
    try {
      ws = new WebSocket(wsUrl, { handshakeTimeout: 5000 });
    } catch (e) {
      logger.error(`${chalk.red.bold('[WS CLIENT]')} Erro ao criar WebSocket: ${e.message}`);
      scheduleReconnect();
      return;
    }

    ws.on('open', () => {
      logger.info(`${chalk.green.bold('[WS CLIENT]')} Conectado com sucesso`);
      reconnectAttempts = 0;
      isAlive = true;
      startHeartbeat();
      
      const doAuth = async () => {
        try {
          const guildKeys = Array.from(client.guilds.cache.keys());
          logger.info(`${chalk.green.bold('[WS CLIENT]')} Autenticação enviada - ID: ${localBotId}, Servidores: ${guildKeys.length}`);
          ws.send(JSON.stringify({ type: 'auth', apiKey, botId: localBotId, guilds: guildKeys }));
          try {
            const GUILD_ID = process.env.GUILD_ID || '1295702106195492894';
            const guild = client.guilds.cache.get(GUILD_ID);
            
            if (guild) {
              const serverData = await collectServerData(guild);
              ws.send(JSON.stringify({ 
                type: 'server_data', 
                data: serverData 
              }));
              startServerDataRefresh();
            }
          } catch (e) {
            logger.warn(`${chalk.yellow.bold('[WS CLIENT]')} Erro ao enviar dados do servidor: ${e && e.message ? e.message : e}`);
          }
        } catch (e) {
          logger.error(`${chalk.red.bold('[WS CLIENT]')} Erro ao enviar autenticação: ${e && e.message ? e.message : e}`);
        }
      };
      
      if (typeof client.isReady === 'function') {
        if (client.isReady()) doAuth();
        else {
          client.once('clientReady', doAuth);
        }
      } else {
        client.once('clientReady', doAuth);
      }
    });

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (!msg.type || !msg.id) return;
        
        if (msg.type === 'request') {
          if (!msg.action) {
            ws.send(JSON.stringify({ type: 'response', id: msg.id, status: 'error', error: 'action_required' }));
            return;
          }

          try {
            const data = await executeHandler(msg.action, {
              client,
              payload: msg.payload || {},
              botId: localBotId
            });
            ws.send(JSON.stringify({ type: 'response', id: msg.id, status: 'ok', data }));
          } catch (e) {
            ws.send(JSON.stringify({ 
              type: 'response', 
              id: msg.id, 
              status: 'error', 
              error: e.message || 'handler_error' 
            }));
          }
        }
      } catch (err) {
        logger.error(`${chalk.red.bold('[WS CLIENT]')} Erro ao processar mensagem: ${err && err.message ? err.message : err}`);
      }
    });

    ws.on('pong', () => {
      isAlive = true;
      if (heartbeatTimeout) clearTimeout(heartbeatTimeout);
    });

    ws.on('close', (code, reason) => {
      logger.warn(`${chalk.yellow.bold('[WS CLIENT]')} Desconectado (${code})`);
      stopHeartbeat();
      stopServerDataRefresh();
      ws = null;
      isAlive = false;
      scheduleReconnect();
    });

    ws.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        logger.warn(`${chalk.yellow.bold('[WS CLIENT]')} API indisponível - Conexão recusada`);
      } else if (err.message && err.message.includes('404')) {
        logger.warn(`${chalk.yellow.bold('[WS CLIENT]')} Erro 404 - Endpoint /ws não encontrado. Verifique configuração da API.`);
      } else {
        logger.error(`${chalk.red.bold('[WS CLIENT]')} Erro: ${err && err.message ? err.message : err}`);
      }
    });
  }

  function startHeartbeat() {
    stopHeartbeat();
    
    heartbeatInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        isAlive = false;
        ws.ping();
        heartbeatTimeout = setTimeout(() => {
          if (!isAlive) {
            logger.warn(`${chalk.yellow.bold('[WS CLIENT]')} Heartbeat não respondeu - Reconectando`);
            ws.close(1000, 'heartbeat_timeout');
          }
        }, HEARTBEAT_TIMEOUT);
      }
    }, HEARTBEAT_INTERVAL);
  }

  function stopHeartbeat() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    if (heartbeatTimeout) {
      clearTimeout(heartbeatTimeout);
      heartbeatTimeout = null;
    }
  }

  function startServerDataRefresh() {
    stopServerDataRefresh();
    
    const sendServerData = async (guild) => {
      let data = getCachedServerData(guild.id);

      if (!data) {
        data = collectServerData(guild);
        cacheServerData(guild.id, data);
      } else {
        logger.info(`${chalk.cyan.bold('[WS CLIENT]')} Usando cache local`);
      }

      ws.send(JSON.stringify({
        type: 'server_data',
        data
      }));
    };
    
    serverDataRefreshInterval = setInterval(async () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          const GUILD_ID = process.env.GUILD_ID || '1295702106195492894';
          const guild = client.guilds.cache.get(GUILD_ID);
          
          if (guild) {
            await sendServerData(guild);
            logger.info(`${chalk.green.bold('[WS CLIENT]')} Dados do servidor reenviados (refresh periódico)`);
          }
        } catch (e) {
          logger.error(`${chalk.red.bold('[WS CLIENT]')} Erro ao reenviar dados do servidor: ${e && e.message ? e.message : e}`);
        }
      }
    }, SERVER_DATA_REFRESH_INTERVAL);
  }

  function stopServerDataRefresh() {
    if (serverDataRefreshInterval) {
      clearInterval(serverDataRefreshInterval);
      serverDataRefreshInterval = null;
    }
  }

  function scheduleReconnect() {
    if (reconnecting) return;
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      logger.error(`${chalk.red.bold('[WS CLIENT]')} Limite de reconexões atingido. Parando tentativas.`);
      return;
    }

    reconnecting = true;
    const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts), MAX_RECONNECT_DELAY);
    reconnectAttempts++;
    
    logger.info(`${chalk.yellow.bold('[WS CLIENT]')} Reconectando em ${delay}ms... (tentativa ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    
    const timeoutId = setTimeout(() => {
      reconnecting = false;
      doConnect();
    }, delay);

    return timeoutId;
  }

  doConnect();
}

function invalidateServerDataCache(guildId) {
  if (guildId) {
    serverDataCache.delete(guildId);
    logger.info(`${chalk.cyan.bold('[WS CLIENT]')} Cache invalidado para servidor ${guildId}`);
  } else {
    serverDataCache.clear();
    logger.info(`${chalk.cyan.bold('[WS CLIENT]')} Cache limpo completamente`);
  }
}

module.exports = { 
  connect,
  invalidateServerDataCache
};

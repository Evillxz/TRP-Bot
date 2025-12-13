const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const logger = require('../config/logger');
const { executeHandler, getAvailableActions } = require('./wsHandlers');

let ws = null;
let reconnecting = false;
let reconnectAttempts = 0;
let heartbeatInterval = null;
let heartbeatTimeout = null;
let isAlive = false;
const MAX_RECONNECT_ATTEMPTS = 50;
const BASE_RECONNECT_DELAY = 3000;
const MAX_RECONNECT_DELAY = 60000;
const HEARTBEAT_INTERVAL = 30000; // 30 segundos
const HEARTBEAT_TIMEOUT = 10000; // 10 segundos de timeout
const localBotId = process.env.BOT_ID || `bot_${uuidv4()}`;

async function connect(client) {
  const apiBase = process.env.API_URL || process.env.API_BASE_URL || 'http://localhost:5500';
  const wsUrl = (apiBase.startsWith('https') ? apiBase.replace(/^https/, 'wss') : apiBase.replace(/^http/, 'ws')) + '/ws';
  const apiKey = process.env.API_KEY || process.env.BOT_API_KEY;

  if (!apiKey) {
    logger.error(`${chalk.red.bold('[WS CLIENT]')} API_KEY não configurada! WebSocket desabilitado.`);
    return;
  }

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
      
      // Iniciar heartbeat
      startHeartbeat();
      
      const doAuth = () => {
        try {
          const guildKeys = Array.from(client.guilds.cache.keys());
          logger.info(`${chalk.green.bold('[WS CLIENT]')} Autenticação enviada - ID: ${localBotId}, Servidores: ${guildKeys.length}`);
          ws.send(JSON.stringify({ type: 'auth', apiKey, botId: localBotId, guilds: guildKeys }));
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
    stopHeartbeat(); // Limpa interval anterior
    
    heartbeatInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        isAlive = false;
        ws.ping();
        
        // Se não receber pong em 10s, forçar reconexão
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

module.exports = { connect };

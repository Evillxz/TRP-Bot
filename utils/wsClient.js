const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const logger = require('logger');
const { executeHandler } = require('./wsHandlers/wsHandlers');

const CONFIG = {
  RECONNECT_DELAY: 5000,
  HEARTBEAT_INTERVAL: 60_000,
  HEARTBEAT_TIMEOUT: 20_000,
  MAX_RETRIES: 30
};

let ws = null;
let heartbeatInterval = null;
let pingTimeout = null;
let retryCount = 0;
let isReconnecting = false;

const localBotId = process.env.BOT_ID || `bot_${uuidv4()}`;

function connect(client) {
  const apiBase = process.env.API_URL || 'http://localhost:5500';
  const wsUrl = apiBase.replace(/^http/, 'ws') + '/ws';
  const apiKey = process.env.API_KEY || process.env.BOT_API_KEY;

  if (!apiKey) return logger.error(`${chalk.red.bold('[WS]')} API_KEY ausente!`);

  function initConnection() {
    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      handleClose();
      return;
    }

    ws.on('open', () => {
      logger.info(`${chalk.magenta.bold('[WS CONNECT]')} WS Conectado.`);
      retryCount = 0;
      isReconnecting = false;
      startHeartbeat();
      authenticate(client, apiKey);
    });

    ws.on('pong', () => {
      if (pingTimeout) clearTimeout(pingTimeout);
    });

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'request' && msg.action) {
          handleRequest(msg, client);
        }
      } catch (err) {
        logger.error(`${chalk.red('[WS]')} Erro no parse da mensagem: ${err.message}`);
      }
    });

    ws.on('close', (code) => {
      logger.warn(`${chalk.magenta('[WS]')} Desconectado (Code: ${code})`);
      handleClose();
    });

    ws.on('error', (err) => {
      logger.error(`${chalk.red('[WS]')} Erro de conexão: ${err.message}`);
      handleClose();
    });
  }

  function handleClose() {
    stopHeartbeat();
    if (ws) {
      ws.removeAllListeners();
      ws = null;
    }
    if (!isReconnecting && retryCount < CONFIG.MAX_RETRIES) {
      scheduleReconnect();
    }
  }

  function scheduleReconnect() {
    if (retryCount >= CONFIG.MAX_RETRIES) {
      logger.error(`${chalk.red.bold('[WS]')} Limite de reconexões atingido. Resetando contador em 30s...`);
      setTimeout(() => {
        retryCount = 0;
        isReconnecting = false;
        scheduleReconnect();
      }, 30000);
      return;
    }
    isReconnecting = true;
    retryCount++;
    logger.info(`${chalk.yellow('[WS]')} Reconectando em ${CONFIG.RECONNECT_DELAY}ms... (${retryCount}/${CONFIG.MAX_RETRIES})`);
    setTimeout(() => {
      isReconnecting = false;
      initConnection();
    }, CONFIG.RECONNECT_DELAY);
  }

  function startHeartbeat() {
    stopHeartbeat();
    heartbeatInterval = setInterval(() => {
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      pingTimeout = setTimeout(() => {
        logger.warn(`${chalk.red('[WS]')} Timeout do Heartbeat. Reiniciando...`);
        ws.terminate();
      }, CONFIG.HEARTBEAT_TIMEOUT);

      ws.ping();
    }, CONFIG.HEARTBEAT_INTERVAL);
  }

  function stopHeartbeat() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (pingTimeout) clearTimeout(pingTimeout);
  }

  initConnection();
}

function authenticate(client, apiKey) {
  const sendAuth = () => {
    const guilds = client.guilds?.cache.map(g => g.id) || [];
    sendJson({ 
      type: 'auth', 
      apiKey, 
      botId: localBotId, 
      guilds 
    });
    logger.info(`${chalk.green('[WS SERVER]')} Autenticado com ${guilds.length} servidores.`);
  };

  if (client.isReady()) sendAuth();
  else client.once('clientReady', sendAuth);
}

async function handleRequest(msg, client) {
  try {
    const result = await executeHandler(msg.action, {
      client,
      payload: msg.payload || {},
      botId: localBotId
    });
    if (!msg.id) return;
    sendJson({ type: 'response', id: msg.id, status: 'ok', data: result });
  } catch (e) {
    sendJson({ type: 'response', id: msg.id, status: 'error', error: e.message });
  }
}

function sendJson(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

module.exports = { connect };
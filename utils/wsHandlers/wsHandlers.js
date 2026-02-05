const emojis = require('emojis');
const logger = require('logger');
const chalk = require('chalk');

const { applyWarning } = require('../../handlers/modalsHandlers/modalsSubmit/handleSubmitAdvModal');
const { applyExoneration } = require('../../handlers/modalsHandlers/modalsSubmit/handleSubmitBanModal');
const { sendEmbed } = require('./wsHandlersActions/sendEmbed');
const { createRaffle } = require('./wsHandlersActions/createRaffle');
const { raffleWinner } = require('./wsHandlersActions/raffleWinner');
const { getStatus } = require('./wsHandlersActions/getStatus');
const { getGuildMembers } = require('./wsHandlersActions/getGuildMembers');
const { getUserProfile } = require('./wsHandlersActions/getUserProfile');
const { getGuildInfo } = require('./wsHandlersActions/getGuildInfo');
const sendComponents = require('./wsHandlersActions/sendComponents');

const handlers = {};

function registerHandler(action, handler) {
  if (typeof handler !== 'function') {
    throw new Error(`Handler para "${action}" deve ser uma função`);
  }
  handlers[action] = handler;
}

async function executeHandler(action, params) {
  const handler = handlers[action];
  if (!handler) {
    throw new Error(`Ação desconhecida: ${action}`);
  }
  return handler(params);
}

function getAvailableActions() {
  return Object.keys(handlers);
}

// Actions
registerHandler('get_guild_members', async ({ client, payload }) => {
  return await getGuildMembers(client, payload);
});

registerHandler('get_user_profile', async ({ client, payload }) => {
  return await getUserProfile(client, payload);
});

registerHandler('get_guild_info', async ({ client, payload }) => {
  return await getGuildInfo(client, payload);
});

registerHandler('send_embed', async ({ client, payload }) => {
  const result = await sendEmbed(client, payload);
  return result.success ? { success: true, code: result.code, message: result.message } : { success: false, code: result.code, message: result.message };
});

registerHandler('get_status', async ({ client }) => {
  const data = await getStatus(client);
  return { success: true, data };
});

registerHandler('apply_warning', async ({ client, payload }) => {
  const context = { logger, emojis, chalk, client };
  await applyWarning(null, context, payload);
  return { success: true, action: 'warn', message: `Advertência aplicada com sucesso.` };
});

registerHandler('apply_exoneration', async ({ client, payload }) => {
  const context = { logger, emojis, chalk, client };
  await applyExoneration(null, context, payload);
  return { success: true, message: 'Exoneração aplicada com sucesso.' };
});

registerHandler('create_raffle', async ({ client, payload }) => {
  const result = await createRaffle(client, payload);
  return result.success 
    ? { success: true, message: 'Sorteio criado com sucesso.' } 
    : { success: false, message: 'Erro ao criar sorteio.' };
});

registerHandler('raffle_winner', async ({ client, payload }) => {
  const result = await raffleWinner(client, payload);
  return result.success 
    ? { success: true, message: 'Sorteio finalizado com sucesso.' } 
    : { success: false, message: 'Erro ao finalizar sorteio.' };
});

registerHandler('send_components_v2', async ({ client, payload }) => {
  const result = await sendComponents(client, payload);
  return result.success
    ? { success: true, message: 'Componentes enviados com sucesso.' }
    : { success: false, message: 'Erro ao enviar componentes.' };
});

module.exports = {
  registerHandler,
  executeHandler,
  getAvailableActions
};
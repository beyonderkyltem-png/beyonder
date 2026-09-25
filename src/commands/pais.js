const { registrar } = require('./registry');
const paisService = require('../services/paisService');
const { responderConTyping } = require('../utils/typing');

registrar('pais', async ({ sock, jid, remitente, args, reaccionar }) => {
  const valor = (args[0] || '').toLowerCase();
  if (!['es', 'rd'].includes(valor)) {
    await reaccionar('❔');
    return responderConTyping(sock, jid, {
      text: 'Usá "/pais es" o "/pais rd" para setear tu país manualmente.',
    });
  }
  paisService.setPaisManual(remitente, valor);
  await reaccionar('✔️');
});

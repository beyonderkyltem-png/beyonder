const { registrar } = require('./registry');
const { responderConTyping } = require('../utils/typing');

// /random opcion1, opcion2, opcion3  -> si no se dan opciones, tira cara/cruz
registrar('random', async ({ sock, jid, textoCompleto, reaccionar }) => {
  const opciones = textoCompleto
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const elegido = opciones.length > 0
    ? opciones[Math.floor(Math.random() * opciones.length)]
    : Math.random() < 0.5 ? 'Cara' : 'Cruz';

  await reaccionar('✔️');
  await responderConTyping(sock, jid, { text: `🎲 Elegí: *${elegido}*` });
});

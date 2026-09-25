const { registrar } = require('./registry');
const permisos = require('../middleware/groupPermissions');

registrar('activar', async ({ sock, jid, esGrupo, remitente, reaccionar }) => {
  if (!esGrupo) return reaccionar('❌');
  await permisos.activarGrupo(jid, remitente);
  await reaccionar('✔️');
});

registrar('on', async ({ jid, esGrupo, reaccionar }) => {
  if (!esGrupo) return reaccionar('❌');
  await permisos.setEncendido(jid, true);
  await reaccionar('✔️');
});

registrar('off', async ({ jid, esGrupo, reaccionar }) => {
  if (!esGrupo) return reaccionar('❌');
  await permisos.setEncendido(jid, false);
  await reaccionar('✔️');
});

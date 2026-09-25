const GrupoActivo = require('../database/models/GrupoActivo');
const GrupoEstado = require('../database/models/GrupoEstado');

const ACTIVATION_COMMAND = 'activar'; // /activar habilita el bot en un grupo nuevo

async function estaActivo(jid) {
  const fila = await GrupoActivo.findOne({ jid }).select('_id').lean();
  return !!fila;
}

async function activarGrupo(jid, porQuien) {
  await GrupoActivo.updateOne(
    { jid },
    { $setOnInsert: { jid, activado_por: porQuien, fecha_activacion: new Date() } },
    { upsert: true }
  );
  await GrupoEstado.updateOne(
    { jid },
    { $setOnInsert: { jid, encendido: 1 } },
    { upsert: true }
  );
}

async function estaEncendido(jid) {
  const fila = await GrupoEstado.findOne({ jid }).select('encendido').lean();
  return fila ? !!fila.encendido : true;
}

async function setEncendido(jid, valor) {
  await GrupoEstado.updateOne(
    { jid },
    { $set: { encendido: valor ? 1 : 0 }, $setOnInsert: { jid } },
    { upsert: true }
  );
}

/**
 * Decide si el bot debe procesar un mensaje de un grupo dado.
 * - Si el chat NO es grupo (chat privado), siempre se procesa.
 * - Si es un grupo nuevo (no activado), solo se procesa si el comando
 *   es justo el de activación.
 * - Si está activado pero apagado con /off, no se procesa nada.
 */
async function debeProcesar(jid, esGrupo, comando) {
  if (!esGrupo) return true;
  if (!(await estaActivo(jid))) return comando === ACTIVATION_COMMAND;
  return estaEncendido(jid);
}

module.exports = {
  ACTIVATION_COMMAND,
  estaActivo,
  activarGrupo,
  estaEncendido,
  setEncendido,
  debeProcesar,
};

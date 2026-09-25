const config = require('../config');
const Usuario = require('../database/models/Usuario');

/**
 * Extrae el país a partir del prefijo telefónico dentro del JID.
 * jid tiene forma "521234567890@s.whatsapp.net"
 */
function detectarPaisPorNumero(jid) {
  const numero = jid.split('@')[0].replace(/\D/g, '');

  // Ojo con el orden: los prefijos de RD (1809/1829/1849) son más largos
  // y específicos que el "1" genérico de Norteamérica, así que se chequean
  // primero para no confundirlos con otros países de código "1".
  for (const [pais, prefijos] of Object.entries(config.countryPrefixes)) {
    for (const prefijo of prefijos) {
      if (numero.startsWith(prefijo)) return pais;
    }
  }
  return null;
}

/**
 * Devuelve el país de un usuario: primero busca si ya está guardado
 * (manual o detectado antes); si no existe, lo detecta por número,
 * lo guarda y lo devuelve. Si no se puede detectar, devuelve null.
 */
async function obtenerPais(jid) {
  const existente = await Usuario.findOne({ jid }).lean();
  if (existente && existente.pais) return existente.pais;

  const detectado = detectarPaisPorNumero(jid);

  // Upsert: solo sobreescribe si el país NO fue puesto manualmente
  await Usuario.updateOne(
    { jid },
    { $setOnInsert: { jid }, $set: { pais: detectado, pais_manual: 0 } },
    { upsert: true }
  );
  // Pero si ya existía con pais_manual=1, no debemos tocar su país. Volvemos a consultar.
  const despues = await Usuario.findOne({ jid }).lean();
  return despues ? despues.pais : detectado;
}

/** Permite al usuario forzar su país manualmente con /pais es | /pais rd */
async function setPaisManual(jid, pais) {
  if (!config.timezones[pais]) return false;
  await Usuario.updateOne(
    { jid },
    { $set: { pais, pais_manual: 1 }, $setOnInsert: { jid } },
    { upsert: true }
  );
  return true;
}

async function obtenerTimezone(jid) {
  const pais = await obtenerPais(jid);
  return pais ? config.timezones[pais] : null;
}

module.exports = { detectarPaisPorNumero, obtenerPais, setPaisManual, obtenerTimezone };

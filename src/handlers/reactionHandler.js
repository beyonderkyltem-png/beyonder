const Evento = require('../database/models/Evento');
const EventoRespuesta = require('../database/models/EventoRespuesta');
const { appLogger } = require('../utils/logger');

// Qué emoji cuenta como qué respuesta. Podés sumar más alias acá
// (por ejemplo 👍 como sinónimo de ✅) sin tocar el resto del código.
const MAPA_EMOJI = {
  '✅': 'si',
  '👍': 'si',
  '❌': 'no',
  '👎': 'no',
  '❔': 'tal_vez',
  '❓': 'tal_vez',
  '🤷': 'tal_vez',
};

/**
 * Procesa el evento 'messages.reaction' de Baileys. Nota: la forma exacta
 * de este payload puede variar entre versiones de Baileys — está probado
 * contra el shape estándar { key, reaction: { text, key } } de la v6.x;
 * si @whiskeysockets/baileys cambia esto en una actualización, revisar acá.
 */
async function manejarReacciones(sock, reactions) {
  for (const item of reactions) {
    try {
      const { key, reaction } = item;
      const emoji = reaction?.text;
      if (!emoji) continue; // texto vacío = el usuario sacó la reacción, no cuenta

      const respuesta = MAPA_EMOJI[emoji];
      if (!respuesta) continue; // reacción que no nos interesa (ej. un 😂 cualquiera)

      // Buscamos el evento por chat + mensaje_id (campo que guardamos en /org)
      const evento = await Evento.findOne({
        jid_chat: key.remoteJid,
        mensaje_id: key.id,
      }).select('_id').lean();
      if (!evento) continue; // la reacción no es sobre un mensaje de /org

      const jidUsuario = reaction.key?.participant || reaction.key?.remoteJid;
      if (!jidUsuario) continue;

      // Upsert: misma semántica que ON CONFLICT ... DO UPDATE
      await EventoRespuesta.updateOne(
        { evento_id: evento._id, jid_usuario: jidUsuario },
        { $set: { respuesta } },
        { upsert: true }
      );
    } catch (err) {
      appLogger.error({ err }, 'Error procesando reacción de evento');
    }
  }
}

module.exports = { manejarReacciones };

const { parsearComando } = require('../middleware/prefijos');
const { obtener } = require('../commands');
const permisos = require('../middleware/groupPermissions');
const { appLogger } = require('../utils/logger');
const config = require('../config');
const { manejarMencionAlBot } = require('../services/geminiService');
const { manejarSeleccionYT } = require('../commands/musica');

function extraerTexto(mensaje) {
  return (
    mensaje.conversation ||
    mensaje.extendedTextMessage?.text ||
    mensaje.imageMessage?.caption ||
    mensaje.videoMessage?.caption ||
    ''
  );
}

async function manejarMensaje(sock, msg) {
  if (!msg.message || msg.key.fromMe) return;

  const jid = msg.key.remoteJid;
  const esGrupo = jid.endsWith('@g.us');
  const remitente = esGrupo ? msg.key.participant : jid;
  const texto = extraerTexto(msg.message);

  // Datos del mensaje citado (si el usuario hizo reply a algo), usados por
  // ejemplo por los comandos de sticker (/s y /a) para tomar la imagen/video.
  const contextInfo =
    msg.message.extendedTextMessage?.contextInfo ||
    msg.message.imageMessage?.contextInfo ||
    msg.message.videoMessage?.contextInfo ||
    null;
  const quotedMessage = contextInfo?.quotedMessage || null;
  const quotedParticipant = contextInfo?.participant || null;
  const quotedId = contextInfo?.stanzaId || null;
  // Usuarios mencionados con "@" en el mensaje (lo usan /dedicar y las
  // acciones con GIF de nekos.best para saber a quién va dirigida).
  const mentionedJids = contextInfo?.mentionedJid || [];

  if (!texto) return;

  const reaccionar = (emoji) =>
    sock.sendMessage(jid, { react: { text: emoji, key: msg.key } });

  const parsed = parsearComando(texto);

  // Si no es un comando, primero nos fijamos si es la respuesta numérica a
  // una búsqueda de /yt pendiente, y si no, si mencionan al bot por su
  // nombre para responder con IA.
  if (!parsed) {
    if (!(await permisos.debeProcesar(jid, esGrupo, null))) return;

    const fueSeleccionYT = await manejarSeleccionYT({
      sock, jid, remitente, texto, reaccionar,
    });
    if (fueSeleccionYT) return;

    if (texto.toLowerCase().includes(config.botTriggerName)) {
      await manejarMencionAlBot(sock, jid, msg, texto);
    }
    return;
  }

  const { comando, args, textoCompleto } = parsed;

  if (!(await permisos.debeProcesar(jid, esGrupo, comando))) return;

  const handler = obtener(comando);
  if (!handler) return; // comando desconocido: no respondemos nada (regla #6)

  const ctx = {
    sock, msg, jid, esGrupo, remitente, comando, args, textoCompleto, reaccionar,
    quotedMessage, quotedParticipant, quotedId, mentionedJids,
  };

  try {
    await reaccionar('⌛');
    await handler(ctx);
  } catch (err) {
    appLogger.error({ err, comando }, 'Error ejecutando comando');
    await reaccionar('❌');
  }
}

module.exports = { manejarMensaje };

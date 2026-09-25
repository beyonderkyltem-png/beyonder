// ============================================================================
// Decorador automático de mensajes de Beyonder.
//
// La idea: en vez de pegarle la firma/estética a mano en cada comando (en
// cronJobs.js, en cada archivo de commands/, en las frases/, etc.), se
// envuelve UNA sola vez el socket de Baileys (ver envolverSock, usado en
// src/index.js) para que cualquier sock.sendMessage(...) que traiga texto
// o caption salga automáticamente con la firma abajo. Así no hay que
// tocar ningún otro archivo del proyecto ni acordarse de aplicarlo cada
// vez que se agregue un comando nuevo.
//
// 📝 TODO (vos): para cambiar la firma o el estilo, editá SOLO este
// archivo — todo el resto del bot lo hereda automático.
// ============================================================================

const FIRMA = 'ᯓ @Bey⚡︎nderˎˊ˗  ⋆';

/** Le pega la firma al final de un texto. No hace nada si ya la tiene. */
function decorar(texto) {
  if (typeof texto !== 'string' || texto.length === 0) return texto;
  if (texto.includes(FIRMA)) return texto; // por si algo ya la trae puesta
  return `${texto}\n\n${FIRMA}`;
}

/**
 * Envuelve sock.sendMessage para decorar automáticamente cualquier mensaje
 * que tenga `text` o `caption` (texto plano, respuestas de comandos,
 * captions de los gifs de /kiss /hug etc., avisos del cron, etc.). No
 * toca reacciones, stickers, audio ni nada que no tenga texto.
 *
 * Se llama UNA sola vez, justo después de crear el socket (src/index.js).
 * Como reasigna la propiedad sobre el mismo objeto (no crea uno nuevo),
 * todo el código que ya tiene una referencia a `sock` (cronJobs,
 * messageHandler, reactionHandler, etc.) queda decorado sin tocar nada más.
 */
function envolverSock(sock) {
  const enviarOriginal = sock.sendMessage.bind(sock);

  sock.sendMessage = (jid, content, options) => {
    if (content && typeof content === 'object') {
      if (typeof content.text === 'string') {
        content = { ...content, text: decorar(content.text) };
      } else if (typeof content.caption === 'string') {
        content = { ...content, caption: decorar(content.caption) };
      }
    }
    return enviarOriginal(jid, content, options);
  };

  return sock;
}

module.exports = { decorar, envolverSock, FIRMA };

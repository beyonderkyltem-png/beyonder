/**
 * Muestra "escribiendo..." en el chat y espera un segundo antes de mandar
 * el mensaje de respuesta, para que se sienta más natural.
 */
async function responderConTyping(sock, jid, contenido, opciones = {}) {
  await sock.sendPresenceUpdate('composing', jid);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await sock.sendPresenceUpdate('paused', jid);
  return sock.sendMessage(jid, contenido, opciones);
}

module.exports = { responderConTyping };

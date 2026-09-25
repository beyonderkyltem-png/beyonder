const fs = require('fs');
const { registrar } = require('./registry');
const { responderConTyping } = require('../utils/typing');
const { buscar, descargarAudio, limpiar } = require('../services/ytService');
const { appLogger } = require('../utils/logger');
const frases = require('../frases/musica');

// Búsquedas de /yt pendientes de que el usuario responda con un número.
// Clave "jid:remitente" -> { resultados, expira }
const PENDIENTES = new Map();
const TTL_MS = 2 * 60 * 1000; // 2 minutos para elegir, después se descarta

function clave(jid, remitente) {
  return `${jid}:${remitente}`;
}

function limpiarVencidos() {
  const ahora = Date.now();
  for (const [k, v] of PENDIENTES) {
    if (v.expira < ahora) PENDIENTES.delete(k);
  }
}

function elegir(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

registrar(['yt', 'play'], async (ctx) => {
  const query = ctx.textoCompleto.trim();
  if (!query) {
    await ctx.reaccionar('❔');
    return responderConTyping(ctx.sock, ctx.jid, {
      text: 'Formato: /yt nombre de la canción o video',
    });
  }

  let resultados;
  try {
    resultados = await buscar(query, 3);
  } catch (err) {
    appLogger.error({ err, query }, 'Error buscando en YouTube');
    await ctx.reaccionar('❌');
    return responderConTyping(ctx.sock, ctx.jid, {
      text: 'No pude buscar en YouTube justo ahora, probá de nuevo en un rato.',
    });
  }

  if (resultados.length === 0) {
    await ctx.reaccionar('❌');
    return responderConTyping(ctx.sock, ctx.jid, {
      text: `No encontré nada para "${query}".`,
    });
  }

  limpiarVencidos();
  PENDIENTES.set(clave(ctx.jid, ctx.remitente), {
    resultados,
    expira: Date.now() + TTL_MS,
  });

  const lista = resultados
    .map((r, i) => `${i + 1}. *${r.titulo}* (${r.duracion}) — ${r.canal}`)
    .join('\n');

  await ctx.reaccionar('✔️');
  await responderConTyping(ctx.sock, ctx.jid, {
    text: `${elegir(frases.buscando)}\n\n${lista}\n\nRespondé con el número (1-${resultados.length}) para descargar el audio.`,
  });
});

/**
 * Llamado desde messageHandler.js para cualquier mensaje sin prefijo que
 * sea solo un número, por si corresponde a una búsqueda de /yt pendiente
 * de esa misma persona en ese mismo chat. Devuelve true si lo procesó (así
 * el handler no sigue de largo tratando de interpretarlo como otra cosa).
 */
async function manejarSeleccionYT({ sock, jid, remitente, texto, reaccionar }) {
  const limpio = (texto || '').trim();
  if (!/^[0-9]+$/.test(limpio)) return false;

  limpiarVencidos();
  const pendiente = PENDIENTES.get(clave(jid, remitente));
  if (!pendiente) return false;

  const indice = parseInt(limpio, 10) - 1;
  const elegido = pendiente.resultados[indice];
  if (!elegido) return false; // número fuera de rango: no era esto, seguimos de largo

  PENDIENTES.delete(clave(jid, remitente));

  await reaccionar('⌛');
  let archivo;
  try {
    archivo = await descargarAudio(elegido.url);
    await sock.sendMessage(jid, {
      audio: fs.readFileSync(archivo),
      mimetype: 'audio/mpeg',
      fileName: `${elegido.titulo}.mp3`,
    });
    await reaccionar('✔️');
  } catch (err) {
    appLogger.error({ err, url: elegido.url }, 'Error descargando audio de YouTube');
    await reaccionar('❌');
    await responderConTyping(sock, jid, {
      text: 'No pude descargar ese audio, probá con otro resultado o con otra búsqueda.',
    });
  } finally {
    if (archivo) limpiar(archivo);
  }

  return true;
}

module.exports = { manejarSeleccionYT };

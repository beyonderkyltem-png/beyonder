const { registrar } = require('./registry');
const { responderConTyping } = require('../utils/typing');
const { obtenerGifBuffer } = require('../services/nekosBestService');
const { appLogger } = require('../utils/logger');
const frases = require('../frases/acciones');

// comando -> categoría de nekos.best (ver https://docs.nekos.best para la
// lista completa). requiereMencion = true significa que el comando no
// funciona si no se menciona a alguien o se hace reply a su mensaje.
const ACCIONES = [
  { comando: 'kiss', categoria: 'kiss', requiereMencion: true },
  { comando: 'hug', categoria: 'hug', requiereMencion: true },
  { comando: 'pat', categoria: 'pat', requiereMencion: true },
  { comando: 'slap', categoria: 'slap', requiereMencion: true },
  { comando: 'kick', categoria: 'kick', requiereMencion: true },
  { comando: 'bite', categoria: 'bite', requiereMencion: true },
  { comando: 'cuddle', categoria: 'cuddle', requiereMencion: true },
  { comando: 'punch', categoria: 'punch', requiereMencion: true },
  { comando: 'tickle', categoria: 'tickle', requiereMencion: true },
  { comando: 'poke', categoria: 'poke', requiereMencion: true },
  { comando: 'handhold', categoria: 'handhold', requiereMencion: true },
  { comando: 'highfive', categoria: 'highfive', requiereMencion: true },
  { comando: 'feed', categoria: 'feed', requiereMencion: true },
  { comando: 'handshake', categoria: 'handshake', requiereMencion: true },
  { comando: 'threaten', categoria: 'threaten', requiereMencion: true },
  { comando: 'yeet', categoria: 'yeet', requiereMencion: true },
  { comando: 'wave', categoria: 'wave', requiereMencion: false },
  { comando: 'cry', categoria: 'cry', requiereMencion: false },
  { comando: 'dance', categoria: 'dance', requiereMencion: false },
  { comando: 'blush', categoria: 'blush', requiereMencion: false },
  { comando: 'laugh', categoria: 'laugh', requiereMencion: false },
  { comando: 'smile', categoria: 'smile', requiereMencion: false },
  { comando: 'wink', categoria: 'wink', requiereMencion: false },
  { comando: 'happy', categoria: 'happy', requiereMencion: false },
  { comando: 'pout', categoria: 'pout', requiereMencion: false },
  { comando: 'smug', categoria: 'smug', requiereMencion: false },
  { comando: 'bored', categoria: 'bored', requiereMencion: false },
  { comando: 'shrug', categoria: 'shrug', requiereMencion: false },
  { comando: 'baka', categoria: 'baka', requiereMencion: false },
  { comando: 'stare', categoria: 'stare', requiereMencion: false },
];

function elegirFrase(comando, de, para) {
  const lista = frases[comando] || [`{de} usó /${comando}`];
  const plantilla = lista[Math.floor(Math.random() * lista.length)];
  return plantilla.replace(/\{de\}/g, de).replace(/\{para\}/g, para || '');
}

// A quién va dirigida la acción: primero la mención "@alguien" en el texto,
// si no hay, el autor del mensaje al que se le hizo reply. Para las
// acciones "propias" esto es opcional (si hay alguien igual se usa).
function resolverObjetivo(ctx) {
  if (ctx.mentionedJids && ctx.mentionedJids.length > 0) return ctx.mentionedJids[0];
  if (ctx.quotedParticipant) return ctx.quotedParticipant;
  return null;
}

for (const { comando, categoria, requiereMencion } of ACCIONES) {
  registrar(comando, async (ctx) => {
    const objetivo = resolverObjetivo(ctx);

    if (requiereMencion && !objetivo) {
      await ctx.reaccionar('❔');
      return responderConTyping(ctx.sock, ctx.jid, {
        text: `Mencioná a alguien o hacé reply a su mensaje para usar /${comando}.`,
      });
    }

    let gif;
    try {
      gif = await obtenerGifBuffer(categoria);
    } catch (err) {
      appLogger.error({ err, comando }, 'Error consultando nekos.best');
      await ctx.reaccionar('❌');
      return responderConTyping(ctx.sock, ctx.jid, {
        text: 'No pude conseguir el gif justo ahora, intentá de nuevo en un rato.',
      });
    }

    const de = `@${ctx.remitente.split('@')[0]}`;
    const para = objetivo ? `@${objetivo.split('@')[0]}` : '';
    const mentions = [ctx.remitente, ...(objetivo ? [objetivo] : [])];
    const texto = elegirFrase(comando, de, para);

    await ctx.sock.sendMessage(ctx.jid, {
      video: gif.buffer,
      gifPlayback: true,
      caption: texto,
      mentions,
    });
    await ctx.reaccionar('✔️');
  });
}

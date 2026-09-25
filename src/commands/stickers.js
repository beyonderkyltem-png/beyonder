const { registrar } = require('./registry');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { responderConTyping } = require('../utils/typing');

/**
 * Busca la imagen/video a convertir: primero en el mensaje directo (si vino
 * junto con la caption "/s" o "/a"), y si no, en el mensaje citado (reply).
 * Devuelve el buffer descargado, o null si no encontró nada del tipo pedido.
 */
async function obtenerBufferMedia(ctx, tipoEsperado) {
  const directo = ctx.msg.message?.imageMessage
    ? { tipo: 'image', mensaje: { key: ctx.msg.key, message: ctx.msg.message } }
    : ctx.msg.message?.videoMessage
    ? { tipo: 'video', mensaje: { key: ctx.msg.key, message: ctx.msg.message } }
    : null;

  const citado = ctx.quotedMessage?.imageMessage
    ? {
        tipo: 'image',
        mensaje: {
          key: {
            remoteJid: ctx.jid,
            id: ctx.quotedId,
            participant: ctx.quotedParticipant,
            fromMe: false,
          },
          message: ctx.quotedMessage,
        },
      }
    : ctx.quotedMessage?.videoMessage
    ? {
        tipo: 'video',
        mensaje: {
          key: {
            remoteJid: ctx.jid,
            id: ctx.quotedId,
            participant: ctx.quotedParticipant,
            fromMe: false,
          },
          message: ctx.quotedMessage,
        },
      }
    : null;

  const objetivo = directo || citado;
  if (!objetivo || objetivo.tipo !== tipoEsperado) return null;

  return downloadMediaMessage(objetivo.mensaje, 'buffer', {});
}

async function crearYEnviarSticker(ctx, buffer) {
  const sticker = new Sticker(buffer, {
    pack: 'Beyonder',
    author: 'Beyonder Bot',
    type: StickerTypes.FULL,
    quality: 70,
  });
  const stickerBuffer = await sticker.toBuffer();
  await ctx.sock.sendMessage(ctx.jid, { sticker: stickerBuffer });
}

registrar('s', async (ctx) => {
  const buffer = await obtenerBufferMedia(ctx, 'image');
  if (!buffer) {
    await ctx.reaccionar('❔');
    return responderConTyping(ctx.sock, ctx.jid, {
      text: 'Mandá una imagen con "/s" de texto/caption, o hacé reply a una imagen con /s.',
    });
  }
  await crearYEnviarSticker(ctx, buffer);
  await ctx.reaccionar('✔️');
});

registrar('a', async (ctx) => {
  const buffer = await obtenerBufferMedia(ctx, 'video');
  if (!buffer) {
    await ctx.reaccionar('❔');
    return responderConTyping(ctx.sock, ctx.jid, {
      text: 'Mandá un video/gif corto con "/a" de caption, o hacé reply a uno con /a.',
    });
  }
  await crearYEnviarSticker(ctx, buffer);
  await ctx.reaccionar('✔️');
});

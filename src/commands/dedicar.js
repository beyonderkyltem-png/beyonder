const { registrar } = require('./registry');
const { responderConTyping } = require('../utils/typing');
const frases = require('../frases/dedicar');

function elegir(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

// Formato: /dedicar @persona mensaje libre  (también sirve hacer reply a
// la persona en vez de mencionarla). El envío es inmediato, no programado
// — si más adelante lo querés con fecha/hora como /record, avisá.
registrar('dedicar', async (ctx) => {
  const objetivo = (ctx.mentionedJids && ctx.mentionedJids[0]) || ctx.quotedParticipant || null;

  let mensaje = ctx.textoCompleto;
  if (ctx.mentionedJids && ctx.mentionedJids[0]) {
    // Baileys deja el "@numero" tal cual dentro del texto; lo sacamos para
    // quedarnos solo con el mensaje de la dedicatoria.
    const numero = ctx.mentionedJids[0].split('@')[0];
    mensaje = mensaje.replace(`@${numero}`, '').trim();
  }

  if (!objetivo || !mensaje) {
    await ctx.reaccionar('❔');
    return responderConTyping(ctx.sock, ctx.jid, {
      text: 'Formato: /dedicar @persona tu mensaje\nEj: /dedicar @juan gracias por bancarme siempre',
    });
  }

  const de = `@${ctx.remitente.split('@')[0]}`;
  const para = `@${objetivo.split('@')[0]}`;
  const encabezado = elegir(frases.encabezados).replace('{de}', de).replace('{para}', para);
  const pie = elegir(frases.pie);

  const lineas = [encabezado, '', mensaje];
  if (pie) lineas.push('', pie);
  const texto = lineas.join('\n');

  await ctx.sock.sendMessage(ctx.jid, {
    text: texto,
    mentions: [ctx.remitente, objetivo],
  });
  await ctx.reaccionar('✔️');
});

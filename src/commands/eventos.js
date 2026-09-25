const { registrar } = require('./registry');
const Evento = require('../database/models/Evento');
const EventoRespuesta = require('../database/models/EventoRespuesta');
const paisService = require('../services/paisService');
const { aUTC } = require('../utils/fechas');
const { responderConTyping } = require('../utils/typing');
const frases = require('../frases/eventos');

// Formato esperado: /org 20/12/2026 08:00 pm Cena de fin de año
const REGEX = /^(\d{2}\/\d{2}\/\d{4})\s+(\d{1,2}:\d{2})\s*(am|pm)?\s+(.+)$/i;

function elegir(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

registrar('org', async ({ sock, jid, remitente, textoCompleto, reaccionar }) => {
  const match = textoCompleto.match(REGEX);
  if (!match) {
    await reaccionar('❔');
    return responderConTyping(sock, jid, {
      text: 'Formato: /org DD/MM/AAAA HH:MM am|pm descripción\nEj: /org 20/12/2026 08:00 pm Cena de fin de año',
    });
  }

  const [, fecha, hora, ampm, descripcion] = match;
  const timezone = await paisService.obtenerTimezone(remitente);
  if (!timezone) {
    await reaccionar('❔');
    return responderConTyping(sock, jid, {
      text: 'No pude detectar tu país para calcular el horario. Usá /pais es o /pais rd primero.',
    });
  }

  const fechaUTC = aUTC(fecha, hora, ampm, timezone);

  // 1) Guardamos el evento en Mongo. El _id generado por Mongoose reemplaza
  //    al AUTOINCREMENT de SQLite.
  const evento = await Evento.create({
    jid_chat: jid,
    creado_por: remitente,
    descripcion,
    fecha_hora_utc: fechaUTC,
    recordatorio_enviado: 0,
  });

  const texto = elegir(frases.invitacion)
    .replace('{descripcion}', descripcion)
    .replace('{fecha}', fecha)
    .replace('{hora}', ampm ? `${hora} ${ampm}` : hora);

  // 2) Mandamos el mensaje y guardamos su id en el evento.
  const enviado = await sock.sendMessage(jid, { text: texto });
  await Evento.updateOne(
    { _id: evento._id },
    { $set: { mensaje_id: enviado.key.id } }
  );

  await reaccionar('✔️');
});

registrar('planes', async ({ sock, jid, reaccionar }) => {
  const ahoraISO = new Date().toISOString();
  const eventos = await Evento.find({
    jid_chat: jid,
    fecha_hora_utc: { $gte: ahoraISO },
  })
    .sort({ fecha_hora_utc: 1 })
    .lean();

  if (eventos.length === 0) {
    await reaccionar('✔️');
    return responderConTyping(sock, jid, { text: elegir(frases.sinPlanes) });
  }

  const listarJids = (arr) =>
    arr.length ? arr.map((r) => `@${r.jid_usuario.split('@')[0]}`).join(', ') : '—';

  const mentions = [];
  const bloques = [];
  for (const ev of eventos) {
    const respuestas = await EventoRespuesta.find({
      evento_id: ev._id,
    }).lean();

    for (const r of respuestas) mentions.push(r.jid_usuario);

    const si = respuestas.filter((r) => r.respuesta === 'si');
    const no = respuestas.filter((r) => r.respuesta === 'no');
    const talVez = respuestas.filter((r) => r.respuesta === 'tal_vez');

    bloques.push(
      `📌 *${ev.descripcion}*\n` +
      `✅ Van: ${listarJids(si)}\n` +
      `❌ No van: ${listarJids(no)}\n` +
      `❔ Tal vez: ${listarJids(talVez)}`
    );
  }

  await reaccionar('✔️');
  await responderConTyping(sock, jid, { text: bloques.join('\n\n'), mentions });
});

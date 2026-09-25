const { registrar } = require('./registry');
const Recordatorio = require('../database/models/Recordatorio');
const paisService = require('../services/paisService');
const { aUTC } = require('../utils/fechas');
const { responderConTyping } = require('../utils/typing');

// Formato esperado: /record 07/10/2026 04:50 pm hacer llamada
const REGEX = /^(\d{2}\/\d{2}\/\d{4})\s+(\d{1,2}:\d{2})\s*(am|pm)?\s+(.+)$/i;

registrar('record', async ({ sock, jid, remitente, textoCompleto, reaccionar }) => {
  const match = textoCompleto.match(REGEX);
  if (!match) {
    await reaccionar('❔');
    return responderConTyping(sock, jid, {
      text: 'Formato: /record DD/MM/AAAA HH:MM am|pm mensaje\nEj: /record 07/10/2026 04:50 pm hacer llamada',
    });
  }

  const [, fecha, hora, ampm, mensaje] = match;
  const timezone = await paisService.obtenerTimezone(remitente);
  if (!timezone) {
    await reaccionar('❔');
    return responderConTyping(sock, jid, {
      text: 'No pude detectar tu país para calcular el horario. Usá /pais es o /pais rd primero.',
    });
  }

  const fechaUTC = aUTC(fecha, hora, ampm, timezone);
  await Recordatorio.create({
    jid_chat: jid,
    jid_usuario: remitente,
    mensaje,
    fecha_hora_utc: fechaUTC,
    enviado: 0,
  });

  await reaccionar('✔️');
});

// El envío efectivo de los recordatorios vencidos lo hace un cron
// (ver src/services/cronJobs.js), que revisa esta tabla cada minuto.

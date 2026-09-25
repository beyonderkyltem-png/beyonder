const cron = require('node-cron');
const Recordatorio = require('../database/models/Recordatorio');
const Cumpleanos = require('../database/models/Cumpleanos');
const Evento = require('../database/models/Evento');
const EventoRespuesta = require('../database/models/EventoRespuesta');
const config = require('../config');
const { fechaHoyEnTimezone, diasHastaCumple } = require('../utils/fechas');
const { appLogger } = require('../utils/logger');
const frases = require('../frases/eventos');

/**
 * Revisa cada minuto los recordatorios (/record) cuya fecha_hora_utc ya pasó
 * y todavía no fueron enviados.
 */
function iniciarCronRecordatorios(sock) {
  cron.schedule('* * * * *', async () => {
    const ahoraISO = new Date().toISOString();
    const pendientes = await Recordatorio.find({
      enviado: 0,
      fecha_hora_utc: { $lte: ahoraISO },
    }).lean();

    for (const r of pendientes) {
      try {
        await sock.sendMessage(r.jid_chat, {
          text: `⏰ Recordatorio para @${r.jid_usuario.split('@')[0]}: ${r.mensaje}`,
          mentions: [r.jid_usuario],
        });
      } catch (err) {
        appLogger.error({ err, id: r._id }, 'Error enviando recordatorio');
      } finally {
        await Recordatorio.updateOne({ _id: r._id }, { $set: { enviado: 1 } });
      }
    }
  });
}

/**
 * Revisa cada 15 minutos los cumpleaños guardados. Por cada uno, calcula
 * cuántos días faltan según la timezone del país guardado y dispara el
 * aviso correspondiente (3, 2, 1 días antes, o el día mismo), sin repetir
 * el mismo aviso el mismo día.
 */
function iniciarCronCumpleanos(sock) {
  cron.schedule('*/15 * * * *', async () => {
    const filas = await Cumpleanos.find().lean();

    for (const c of filas) {
      const timezone = config.timezones[c.pais] || config.timezones.rd;
      const hoyStr = fechaHoyEnTimezone(timezone);

      if (c.ultimo_dia_procesado === hoyStr) continue;

      const dias = diasHastaCumple(c.fecha, timezone);
      const nombre = `@${c.jid_usuario.split('@')[0]}`;
      let mensaje = null;
      let campoAviso = null;

      if (dias === 3 && !c.aviso_3_enviado) {
        mensaje = `🎉 Faltan 3 días para el cumple de ${nombre}!`;
        campoAviso = 'aviso_3_enviado';
      } else if (dias === 2 && !c.aviso_2_enviado) {
        mensaje = `🎉 Faltan 2 días para el cumple de ${nombre}!`;
        campoAviso = 'aviso_2_enviado';
      } else if (dias === 1 && !c.aviso_1_enviado) {
        mensaje = `🎉 ¡Mañana es el cumple de ${nombre}!`;
        campoAviso = 'aviso_1_enviado';
      } else if (dias === 0 && !c.aviso_dia_enviado) {
        mensaje = `🎂🎉 ¡Feliz cumpleaños, ${nombre}! 🎂🎉`;
        campoAviso = 'aviso_dia_enviado';
      }

      if (mensaje) {
        try {
          await sock.sendMessage(c.jid_chat, { text: mensaje, mentions: [c.jid_usuario] });
        } catch (err) {
          appLogger.error({ err, id: c._id }, 'Error enviando aviso de cumpleaños');
        }

        if (campoAviso === 'aviso_dia_enviado') {
          await Cumpleanos.updateOne(
            { _id: c._id },
            {
              $set: {
                aviso_3_enviado: 0,
                aviso_2_enviado: 0,
                aviso_1_enviado: 0,
                aviso_dia_enviado: 0,
                ultimo_dia_procesado: hoyStr,
              },
            }
          );
        } else {
          await Cumpleanos.updateOne(
            { _id: c._id },
            { $set: { [campoAviso]: 1, ultimo_dia_procesado: hoyStr } }
          );
        }
      } else {
        await Cumpleanos.updateOne(
          { _id: c._id },
          { $set: { ultimo_dia_procesado: hoyStr } }
        );
      }
    }
  });
}

/**
 * Cada 10 minutos, avisa en el chat de los eventos (/org) que están por
 * empezar (dentro de config.eventoRecordatorioMin minutos), mencionando a
 * quienes confirmaron asistencia con ✅. Se manda una sola vez por evento.
 */
function iniciarCronEventos(sock) {
  cron.schedule('*/10 * * * *', async () => {
    const ahoraMs = Date.now();
    const limiteISO = new Date(ahoraMs + config.eventoRecordatorioMin * 60000).toISOString();
    const ahoraISO = new Date(ahoraMs).toISOString();

    const proximos = await Evento.find({
      recordatorio_enviado: 0,
      fecha_hora_utc: { $lte: limiteISO, $gte: ahoraISO },
    }).lean();

    for (const ev of proximos) {
      const confirmados = (await EventoRespuesta.find({
        evento_id: ev._id,
        respuesta: 'si',
      }).lean()).map((r) => r.jid_usuario);

      const base = frases.recordatorio[Math.floor(Math.random() * frases.recordatorio.length)]
        .replace('{descripcion}', ev.descripcion);
      const menciones = confirmados.map((j) => `@${j.split('@')[0]}`).join(' ');

      try {
        await sock.sendMessage(ev.jid_chat, {
          text: menciones ? `${base}\n${menciones}` : base,
          mentions: confirmados,
        });
      } catch (err) {
        appLogger.error({ err, id: ev._id }, 'Error enviando recordatorio de evento');
      } finally {
        await Evento.updateOne(
          { _id: ev._id },
          { $set: { recordatorio_enviado: 1 } }
        );
      }
    }
  });
}

let iniciado = false;

function iniciarCronJobs(sock) {
  if (iniciado) return; // evita duplicar los cron si el socket se reconecta
  iniciado = true;
  iniciarCronRecordatorios(sock);
  iniciarCronCumpleanos(sock);
  iniciarCronEventos(sock);
  appLogger.info('Cron jobs de recordatorios, cumpleaños y eventos iniciados.');
}

module.exports = { iniciarCronJobs };

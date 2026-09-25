const cron = require('node-cron');
const db = require('../database/db');
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
    const pendientes = db
      .prepare(
        `SELECT * FROM recordatorios WHERE enviado = 0 AND fecha_hora_utc <= ?`
      )
      .all(ahoraISO);

    for (const r of pendientes) {
      try {
        await sock.sendMessage(r.jid_chat, {
          text: `⏰ Recordatorio para @${r.jid_usuario.split('@')[0]}: ${r.mensaje}`,
          mentions: [r.jid_usuario],
        });
      } catch (err) {
        appLogger.error({ err, id: r.id }, 'Error enviando recordatorio');
      } finally {
        // Se marca como enviado incluso si falló el envío, para no reintentar
        // en loop; si preferís reintentos, sacá este finally y solo marcá
        // "enviado" dentro del try.
        db.prepare('UPDATE recordatorios SET enviado = 1 WHERE id = ?').run(r.id);
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
    const filas = db.prepare('SELECT * FROM cumpleanos').all();

    for (const c of filas) {
      const timezone = config.timezones[c.pais] || config.timezones.rd;
      const hoyStr = fechaHoyEnTimezone(timezone);

      if (c.ultimo_dia_procesado === hoyStr) continue; // ya procesado hoy

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
          appLogger.error({ err, id: c.id }, 'Error enviando aviso de cumpleaños');
        }

        // Si ya se avisó el día del cumpleaños, reseteamos los 4 flags para
        // que el próximo año vuelva a avisar normalmente.
        if (campoAviso === 'aviso_dia_enviado') {
          db.prepare(
            `UPDATE cumpleanos SET aviso_3_enviado = 0, aviso_2_enviado = 0,
             aviso_1_enviado = 0, aviso_dia_enviado = 0, ultimo_dia_procesado = ?
             WHERE id = ?`
          ).run(hoyStr, c.id);
        } else {
          db.prepare(
            `UPDATE cumpleanos SET ${campoAviso} = 1, ultimo_dia_procesado = ? WHERE id = ?`
          ).run(hoyStr, c.id);
        }
      } else {
        db.prepare('UPDATE cumpleanos SET ultimo_dia_procesado = ? WHERE id = ?').run(
          hoyStr, c.id
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

    const proximos = db
      .prepare(
        `SELECT * FROM eventos
         WHERE recordatorio_enviado = 0
           AND fecha_hora_utc <= ?
           AND fecha_hora_utc >= ?`
      )
      .all(limiteISO, ahoraISO);

    for (const ev of proximos) {
      const confirmados = db
        .prepare(`SELECT jid_usuario FROM evento_respuestas WHERE evento_id = ? AND respuesta = 'si'`)
        .all(ev.id)
        .map((r) => r.jid_usuario);

      const base = frases.recordatorio[Math.floor(Math.random() * frases.recordatorio.length)]
        .replace('{descripcion}', ev.descripcion);
      const menciones = confirmados.map((j) => `@${j.split('@')[0]}`).join(' ');

      try {
        await sock.sendMessage(ev.jid_chat, {
          text: menciones ? `${base}\n${menciones}` : base,
          mentions: confirmados,
        });
      } catch (err) {
        appLogger.error({ err, id: ev.id }, 'Error enviando recordatorio de evento');
      } finally {
        db.prepare('UPDATE eventos SET recordatorio_enviado = 1 WHERE id = ?').run(ev.id);
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

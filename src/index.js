const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');

const config = require('./config');
const { baileysLogger, appLogger } = require('./utils/logger');
const { envolverSock } = require('./utils/decorador');
const { manejarMensaje } = require('./handlers/messageHandler');
const { manejarReacciones } = require('./handlers/reactionHandler');
const { iniciarCronJobs } = require('./services/cronJobs');
const { useMongoAuthState } = require('./utils/useMongoAuthState');
const { conectarMongo } = require('./database/mongo');

async function iniciarBot() {
  // 1) Conectamos MongoDB ANTES de hacer nada: TODO (sesión + datos) vive ahí.
  await conectarMongo();

  // 2) Cargamos la sesión de WhatsApp DESDE MongoDB. En Render el disco es
  //    efímero, así que sin esto tendríamos que escanear el QR en cada deploy.
  const { state, saveCreds } = await useMongoAuthState();
  const { version } = await fetchLatestBaileysVersion();

  const sock = envolverSock(makeWASocket({
    version,
    auth: state,
    logger: baileysLogger,
    printQRInTerminal: false, // manejamos el QR nosotros abajo para loguearlo lindo
    browser: ['Beyonder', 'Chrome', '1.0.0'],
  }));

  // Cada vez que cambian las credenciales (login, refresh de claves, etc.)
  // hay que persistirlas, si no la sesión se pierde en el próximo reinicio.
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      appLogger.info('Escaneá este QR con WhatsApp para vincular el bot:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const codigo = lastDisconnect?.error?.output?.statusCode;
      const desconectadoDefinitivo = codigo === DisconnectReason.loggedOut;

      if (desconectadoDefinitivo) {
        appLogger.warn(
          'Sesión cerrada desde el teléfono (logout). Borrá la carpeta ' +
          `"${config.authFolder}" y volvé a escanear el QR para reconectar.`
        );
      } else {
        appLogger.warn({ codigo }, 'Conexión perdida, reintentando...');
        // Reconexión automática ante cortes de red, reinicios del server, etc.
        // La sesión guardada en disco hace que no haga falta re-escanear el QR.
        iniciarBot();
      }
    }

    if (connection === 'open') {
      appLogger.info('✅ Beyonder conectado y listo.');
      iniciarCronJobs(sock);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      manejarMensaje(sock, msg).catch((err) =>
        appLogger.error({ err }, 'Error no controlado procesando mensaje')
      );
    }
  });

  // Reacciones (✅❌❔ sobre el mensaje de /org) -> RSVP de eventos.
  sock.ev.on('messages.reaction', (reactions) => {
    manejarReacciones(sock, reactions).catch((err) =>
      appLogger.error({ err }, 'Error no controlado procesando reacciones')
    );
  });

  return sock;
}

// ============================================================
// Servidor HTTP mínimo — para que el servicio NO se apague en
// Render Free Tier. Conectamos con UptimeRobot / Cron-job.org
// para que le hagan un GET cada 5 min al endpoint /health.
// ============================================================
function iniciarServidorHTTP() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  app.get('/', (_req, res) => {
    res.send('🤖 Beyonder bot en línea. Ping /health para comprobar estado.');
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({
      ok: true,
      uptimeSegundos: process.uptime().toFixed(0),
      timestamp: new Date().toISOString(),
    });
  });

  app.listen(PORT, () => {
    appLogger.info(`🌐 Servidor HTTP escuchando en puerto ${PORT} — /health listo para pings de keep-alive`);
  });
}

// Atajamos errores no controlados para que el proceso no muera de golpe;
// en producción convendría correr esto bajo pm2 o un supervisor similar
// que reinicie el proceso si igual llega a caerse.
process.on('unhandledRejection', (err) => {
  appLogger.error({ err }, 'unhandledRejection');
});

// 1) Levantamos HTTP ANTES: Render necesita que el servicio responda
//    rápido en el puerto que Render asigna (process.env.PORT).
iniciarServidorHTTP();

// 2) Luego iniciamos el bot (Mongo + Baileys + cron).
iniciarBot();

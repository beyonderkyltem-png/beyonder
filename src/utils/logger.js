const pino = require('pino');

// Logger silencioso para Baileys (nivel 'silent' evita que inunde la consola)
// y uno más verboso para nuestros propios logs.
const baileysLogger = pino({ level: 'silent' });
const appLogger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:HH:MM:ss' },
  },
});

module.exports = { baileysLogger, appLogger };

require('dotenv').config();

module.exports = {
  prefixes: (process.env.PREFIXES || '/,.,!').split(','),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  botTriggerName: (process.env.BOT_TRIGGER_NAME || 'beyonder').toLowerCase(),
  spamMax: parseInt(process.env.SPAM_MAX || '50', 10),
  // Cuántos minutos antes de un evento (/org) el cron manda el recordatorio
  eventoRecordatorioMin: parseInt(process.env.EVENTO_RECORDATORIO_MIN || '60', 10),
  dbPath: process.env.DB_PATH || './data/beyonder.db',
  authFolder: './auth_info_baileys',
  // Prefijos telefónicos por país para la detección automática de horario/país.
  // Agregá más países acá si la comunidad crece.
  countryPrefixes: {
    es: ['34'],
    rd: ['1809', '1829', '1849'],
  },
  timezones: {
    es: 'Europe/Madrid',
    rd: 'America/Santo_Domingo',
  },
};

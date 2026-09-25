const { registrar } = require('./registry');
const Cumpleanos = require('../database/models/Cumpleanos');
const paisService = require('../services/paisService');
const { responderConTyping } = require('../utils/typing');

// Formato esperado: /cumple 07/09/2008 rd  (el año se guarda pero no se usa
// para la cuenta atrás, solo la fecha DD/MM se repite cada año)
const REGEX = /^(\d{2}\/\d{2})\/\d{4}\s+(es|rd)$/i;

registrar(['cumple', 'bd'], async ({ sock, jid, remitente, textoCompleto, reaccionar }) => {
  const match = textoCompleto.match(REGEX);
  if (!match) {
    await reaccionar('❔');
    return responderConTyping(sock, jid, {
      text: 'Formato: /cumple DD/MM/AAAA pais(es|rd)\nEj: /cumple 07/09/2008 rd',
    });
  }

  const [, fechaDDMM, pais] = match;
  const paisLower = pais.toLowerCase();
  await paisService.setPaisManual(remitente, paisLower);

  await Cumpleanos.create({
    jid_chat: jid,
    jid_usuario: remitente,
    fecha: fechaDDMM,
    pais: paisLower,
  });

  await reaccionar('✔️');
});

// El envío de los avisos (3 días antes, 2, 1 y el día) lo hace un cron diario
// (ver src/services/cronJobs.js) que compara la fecha de hoy contra esta tabla.

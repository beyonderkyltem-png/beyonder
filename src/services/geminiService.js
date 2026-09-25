const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const { responderConTyping } = require('../utils/typing');

const genAI = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;

// Guarda en memoria los últimos mensajes de cada chat para dar contexto.
// Para algo más robusto se podría persistir en la base, pero para el
// propósito de "ver de qué venía hablando el grupo" alcanza con memoria.
const historial = new Map();
const MAX_HISTORIAL = 15;

function agregarAlHistorial(jid, autor, texto) {
  const lista = historial.get(jid) || [];
  lista.push(`${autor}: ${texto}`);
  if (lista.length > MAX_HISTORIAL) lista.shift();
  historial.set(jid, lista);
}

const SYSTEM_PROMPT = `Sos Beyonder, un bot de WhatsApp con personalidad propia: podés
responder con emoción, cansancio, sarcasmo o la actitud que la situación pida.
Te acaban de mencionar por tu nombre en el chat. Usá el historial reciente de
la conversación para entender el contexto y responder de forma natural,
breve (2-4 líneas) y en español. Si no hay una pregunta clara, sumate a la
charla como lo haría una persona del grupo.`;

async function manejarMencionAlBot(sock, jid, msg, texto) {
  const autor = msg.key.participant || jid;
  agregarAlHistorial(jid, autor, texto);

  if (!genAI) {
    return responderConTyping(sock, jid, {
      text: 'Me mencionaron pero todavía no tengo configurada mi API de Gemini 😅',
    });
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const contexto = (historial.get(jid) || []).join('\n');

  const resultado = await model.generateContent(
    `${SYSTEM_PROMPT}\n\nConversación reciente:\n${contexto}\n\nRespondé ahora:`
  );

  const respuesta = resultado.response.text().trim();
  agregarAlHistorial(jid, 'Beyonder', respuesta);
  await responderConTyping(sock, jid, { text: respuesta });
}

module.exports = { manejarMencionAlBot, agregarAlHistorial };

const { Schema, model } = require('mongoose');

const recordatorioSchema = new Schema({
  jid_chat: { type: String, required: true, index: true },
  jid_usuario: { type: String, required: true },
  mensaje: { type: String, required: true },
  fecha_hora_utc: { type: String, required: true, index: true },
  enviado: { type: Number, default: 0, index: true },
}, { timestamps: true });

module.exports = model('Recordatorio', recordatorioSchema);

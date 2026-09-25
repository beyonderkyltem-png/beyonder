const { Schema, model } = require('mongoose');

const eventoSchema = new Schema({
  jid_chat: { type: String, required: true, index: true },
  creado_por: { type: String, required: true },
  descripcion: String,
  fecha_hora_utc: { type: String, required: true, index: true },
  mensaje_id: { type: String, index: true },
  recordatorio_enviado: { type: Number, default: 0, index: true },
}, { timestamps: true });

module.exports = model('Evento', eventoSchema);

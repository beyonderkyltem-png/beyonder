const { Schema, model } = require('mongoose');

const cumpleanosSchema = new Schema({
  jid_chat: { type: String, required: true },
  jid_usuario: { type: String, required: true, index: true },
  fecha: { type: String, required: true },
  pais: String,
  aviso_3_enviado: { type: Number, default: 0 },
  aviso_2_enviado: { type: Number, default: 0 },
  aviso_1_enviado: { type: Number, default: 0 },
  aviso_dia_enviado: { type: Number, default: 0 },
  ultimo_dia_procesado: String,
}, { timestamps: true });

module.exports = model('Cumpleanos', cumpleanosSchema);

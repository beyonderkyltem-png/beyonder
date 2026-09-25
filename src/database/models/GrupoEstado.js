const { Schema, model } = require('mongoose');

const grupoEstadoSchema = new Schema({
  jid: { type: String, required: true, unique: true, index: true },
  encendido: { type: Number, default: 1 },
}, { timestamps: false });

module.exports = model('GrupoEstado', grupoEstadoSchema);

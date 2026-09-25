const { Schema, model } = require('mongoose');

const grupoActivoSchema = new Schema({
  jid: { type: String, required: true, unique: true, index: true },
  activado_por: String,
  fecha_activacion: { type: Date, default: Date.now },
}, { timestamps: false });

module.exports = model('GrupoActivo', grupoActivoSchema);

const { Schema, model } = require('mongoose');

const usuarioSchema = new Schema({
  jid: { type: String, required: true, unique: true, index: true },
  pais: { type: String, default: null },
  pais_manual: { type: Number, default: 0 },
}, { timestamps: false });

module.exports = model('Usuario', usuarioSchema);

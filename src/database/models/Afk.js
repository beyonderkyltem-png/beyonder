const { Schema, model } = require('mongoose');

const afkSchema = new Schema({
  jid_usuario: { type: String, required: true, unique: true },
  motivo: String,
  desde: { type: Date, default: Date.now },
}, { timestamps: false });

module.exports = model('Afk', afkSchema);

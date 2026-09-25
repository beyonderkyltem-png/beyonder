const { Schema, model } = require('mongoose');

const baileysSessionSchema = new Schema({
  sessionId: { type: String, default: 'default', unique: true },
  creds: Schema.Types.Mixed,
  keysCreds: Schema.Types.Mixed,
  keysAppStateSync: Schema.Types.Mixed,
  keysAppStateMac: Schema.Types.Mixed,
}, { timestamps: true });

module.exports = model('BaileysSession', baileysSessionSchema);

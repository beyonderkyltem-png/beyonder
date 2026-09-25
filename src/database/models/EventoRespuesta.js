const { Schema, model } = require('mongoose');

const eventoRespuestaSchema = new Schema({
  evento_id: { type: Schema.Types.ObjectId, required: true, ref: 'Evento', index: true },
  jid_usuario: { type: String, required: true, index: true },
  respuesta: { type: String, enum: ['si', 'no', 'tal_vez'] },
}, { timestamps: false });

eventoRespuestaSchema.index({ evento_id: 1, jid_usuario: 1 }, { unique: true });

module.exports = model('EventoRespuesta', eventoRespuestaSchema);

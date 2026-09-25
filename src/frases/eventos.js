// ============================================================================
// TODO (vos): lo que dice Beyonder al crear un evento (/org), al listar
// planes (/planes) y al mandar el recordatorio automático antes de que
// empiece. Placeholders: {descripcion}, {fecha}, {hora}.
// ============================================================================

module.exports = {
  invitacion: [
    '৯ ׄ ⚜️⃨ᩚ ׅ  ׄ  *{descripcion}* Ꮺ ׄ  ׅ  ৎ \n🗓️ {fecha} — {hora}\n\nReaccioná a este mensaje: ✅ voy / ❌ no voy / ❔ no sé',
  ],
  sinPlanes: ['No hay eventos organizados todavía. Usá /org para crear uno.'],
  recordatorio: ['৯ ׄ ⚜️⃨ᩚ ׅ  ׄ Se viene: *{descripcion}* ׅ   Ꮺ ׄ  ׅ  ৎৎ'],
};

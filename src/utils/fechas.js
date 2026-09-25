/**
 * Convierte fecha (DD/MM/YYYY), hora (HH:MM) y am/pm, en la zona horaria
 * indicada, a un timestamp ISO en UTC listo para guardar en la base.
 *
 * No usamos librerías pesadas de zonas horarias: calculamos el offset con
 * Intl, que ya viene con Node, para mantener el proyecto liviano.
 */
function aUTC(fechaStr, horaStr, ampm, timezone) {
  const [dia, mes, anio] = fechaStr.split('/').map(Number);
  let [hora, minuto] = horaStr.split(':').map(Number);

  if (ampm) {
    const p = ampm.toLowerCase();
    if (p === 'pm' && hora !== 12) hora += 12;
    if (p === 'am' && hora === 12) hora = 0;
  }

  // Truco: formateamos una fecha de referencia en la zona objetivo para
  // sacar el offset actual (contempla horario de verano si aplica).
  const fechaLocalNaive = new Date(Date.UTC(anio, mes - 1, dia, hora, minuto));
  const offsetMin = obtenerOffsetMinutos(timezone, fechaLocalNaive);

  return new Date(fechaLocalNaive.getTime() - offsetMin * 60000).toISOString();
}

function obtenerOffsetMinutos(timezone, fechaRef) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const partes = dtf.formatToParts(fechaRef).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  const comoUTC = Date.UTC(
    partes.year, partes.month - 1, partes.day,
    partes.hour === '24' ? 0 : partes.hour, partes.minute, partes.second
  );
  return (comoUTC - fechaRef.getTime()) / 60000;
}

/** Devuelve la fecha de hoy en una timezone dada, como 'YYYY-MM-DD'. */
function fechaHoyEnTimezone(timezone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

/**
 * Calcula cuántos días faltan para el próximo cumpleaños (0 = es hoy),
 * usando "hoy" según la zona horaria del usuario.
 */
function diasHastaCumple(fechaDDMM, timezone) {
  const [dia, mes] = fechaDDMM.split('/').map(Number);
  const hoyStr = fechaHoyEnTimezone(timezone);
  const [anioHoy, mesHoy, diaHoy] = hoyStr.split('-').map(Number);

  const hoy = new Date(Date.UTC(anioHoy, mesHoy - 1, diaHoy));
  let cumple = new Date(Date.UTC(anioHoy, mes - 1, dia));
  if (cumple < hoy) cumple = new Date(Date.UTC(anioHoy + 1, mes - 1, dia));

  return Math.round((cumple - hoy) / 86400000);
}

module.exports = { aUTC, fechaHoyEnTimezone, diasHastaCumple };

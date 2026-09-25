// Cliente de la API pública de nekos.best (https://docs.nekos.best).
// No requiere API key. Documentación pide mandar un User-Agent en cada
// request, así que lo seteamos siempre.
//
// GET https://nekos.best/api/v2/:categoria?amount=1
//   -> { results: [ { url, anime_name, ... } ] }
//
// Usamos el fetch global de Node (disponible desde Node 18+, que ya es el
// mínimo requerido por este proyecto), así que no hace falta agregar
// node-fetch como dependencia.

const USER_AGENT = 'beyonder-bot/1.0 (+https://github.com/whiskeysockets/baileys)';
const BASE_URL = 'https://nekos.best/api/v2';

/**
 * Pide una imagen/gif al azar de una categoría de nekos.best y devuelve
 * el buffer ya descargado (listo para mandar por WhatsApp) junto con el
 * nombre del anime de origen, si la API lo informó.
 */
async function obtenerGifBuffer(categoria) {
  const metaRes = await fetch(`${BASE_URL}/${categoria}?amount=1`, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!metaRes.ok) {
    throw new Error(`nekos.best respondió ${metaRes.status} para la categoría "${categoria}"`);
  }

  const data = await metaRes.json();
  const resultado = data?.results?.[0];
  if (!resultado?.url) {
    throw new Error(`nekos.best no devolvió resultados para la categoría "${categoria}"`);
  }

  const mediaRes = await fetch(resultado.url, { headers: { 'User-Agent': USER_AGENT } });
  if (!mediaRes.ok) {
    throw new Error(`No se pudo descargar el gif de nekos.best (${mediaRes.status})`);
  }

  const buffer = Buffer.from(await mediaRes.arrayBuffer());
  return { buffer, animeName: resultado.anime_name || null };
}

module.exports = { obtenerGifBuffer };

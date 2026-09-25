const path = require('path');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');
const yts = require('yt-search');
const ytdlp = require('yt-dlp-exec');

/** Busca en YouTube y devuelve los primeros `limite` resultados. */
async function buscar(query, limite = 3) {
  const { videos } = await yts(query);
  return (videos || []).slice(0, limite).map((v) => ({
    id: v.videoId,
    titulo: v.title,
    url: v.url,
    duracion: v.timestamp,
    canal: v.author?.name || 'Desconocido',
  }));
}

/**
 * Descarga el audio de un video de YouTube como mp3 a un archivo temporal
 * y devuelve la ruta. Requiere el binario de yt-dlp (yt-dlp-exec lo baja
 * solo al hacer npm install) y ffmpeg instalado en el sistema, que además
 * ya es requisito para los stickers animados (/a).
 */
async function descargarAudio(url) {
  const archivo = path.join(os.tmpdir(), `beyonder-yt-${crypto.randomUUID()}.mp3`);

  await ytdlp(url, {
    extractAudio: true,
    audioFormat: 'mp3',
    audioQuality: 0,
    output: archivo,
    noPlaylist: true,
  });

  return archivo;
}

function limpiar(archivo) {
  fs.unlink(archivo, () => {}); // best-effort, no importa si falla
}

module.exports = { buscar, descargarAudio, limpiar };

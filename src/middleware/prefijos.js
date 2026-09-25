const config = require('../config');

/**
 * Si el texto empieza con alguno de los prefijos configurados ("/" "." "!"),
 * devuelve { comando, args }. Si no, devuelve null (no es un comando).
 */
function parsearComando(texto) {
  if (!texto) return null;
  const prefijo = config.prefixes.find((p) => texto.startsWith(p));
  if (!prefijo) return null;

  const sinPrefijo = texto.slice(prefijo.length).trim();
  const [comando, ...resto] = sinPrefijo.split(/\s+/);
  return {
    comando: (comando || '').toLowerCase(),
    args: resto,
    textoCompleto: resto.join(' '),
  };
}

module.exports = { parsearComando };

const registro = new Map();

/**
 * Registra un comando bajo uno o más nombres/alias.
 * handler recibe (ctx) — ver messageHandler.js para la forma exacta de ctx.
 */
function registrar(nombres, handler) {
  const lista = Array.isArray(nombres) ? nombres : [nombres];
  for (const nombre of lista) {
    registro.set(nombre.toLowerCase(), handler);
  }
}

function obtener(comando) {
  return registro.get(comando.toLowerCase());
}

module.exports = { registrar, obtener };

// Este archivo SOLO carga los módulos de comandos y re-expone el registro.
// El Map real vive en ./registry.js, aparte, para evitar una dependencia
// circular: antes, cada módulo (control.js, recordatorios.js, etc.) hacía
// require('./index'), pero index.js todavía se estaba armando cuando esos
// módulos se cargaban (estamos en medio de sus propios require() de acá
// abajo), así que Node les devolvía un module.exports vacío ({}) en vez del
// objeto con registrar/obtener. Ahora todos los comandos apuntan a
// ./registry directamente, que no depende de nada más.
const { registrar, obtener } = require('./registry');

// --- Carga de todos los módulos de comandos ---
// Cada archivo llama a registrar(...) con sus propios nombres/alias.
require('./control');
require('./recordatorios');
require('./cumpleanos');
require('./pais');
require('./diversion');
require('./stickers');
require('./acciones');
require('./dedicar');
require('./eventos');
require('./musica');

module.exports = { registrar, obtener };

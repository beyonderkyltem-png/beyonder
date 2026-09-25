const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('../config');

// Asegura que exista la carpeta de datos antes de abrir el archivo .db
const dir = path.dirname(config.dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL'); // más seguro ante caídas/cierres abruptos

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Migración chiquita: si la base ya existía de antes de que "eventos"
// tuviera la columna recordatorio_enviado, CREATE TABLE IF NOT EXISTS no la
// agrega sola. La sumamos a mano y listo (no rompe nada si ya está).
try {
  db.exec('ALTER TABLE eventos ADD COLUMN recordatorio_enviado INTEGER DEFAULT 0');
} catch (err) {
  if (!/duplicate column/i.test(err.message)) throw err;
}

module.exports = db;

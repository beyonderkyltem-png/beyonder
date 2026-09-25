-- Usuarios: guarda el país detectado/seteado de cada persona (para horarios)
CREATE TABLE IF NOT EXISTS usuarios (
  jid TEXT PRIMARY KEY,
  pais TEXT DEFAULT NULL,       -- 'es' | 'rd' | NULL si aún no se detectó
  pais_manual INTEGER DEFAULT 0 -- 1 si el usuario lo seteó a mano con /pais
);

-- Grupos habilitados para que el bot responda
CREATE TABLE IF NOT EXISTS grupos_activos (
  jid TEXT PRIMARY KEY,
  activado_por TEXT,
  fecha_activacion TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Estado global on/off por grupo
CREATE TABLE IF NOT EXISTS grupo_estado (
  jid TEXT PRIMARY KEY,
  encendido INTEGER DEFAULT 1
);

-- Recordatorios puntuales (/record)
CREATE TABLE IF NOT EXISTS recordatorios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jid_chat TEXT NOT NULL,
  jid_usuario TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  fecha_hora_utc TEXT NOT NULL, -- ISO 8601 en UTC, ya convertido según el país
  enviado INTEGER DEFAULT 0
);

-- Cumpleaños (/cumple)
CREATE TABLE IF NOT EXISTS cumpleanos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jid_chat TEXT NOT NULL,
  jid_usuario TEXT NOT NULL,
  fecha TEXT NOT NULL, -- DD/MM (se repite cada año)
  pais TEXT,
  aviso_3_enviado INTEGER DEFAULT 0,
  aviso_2_enviado INTEGER DEFAULT 0,
  aviso_1_enviado INTEGER DEFAULT 0,
  aviso_dia_enviado INTEGER DEFAULT 0,
  ultimo_dia_procesado TEXT -- 'YYYY-MM-DD' en la zona horaria del usuario, evita duplicados
);

-- Eventos organizados (/org) y sus respuestas RSVP
CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jid_chat TEXT NOT NULL,
  creado_por TEXT NOT NULL,
  descripcion TEXT,
  fecha_hora_utc TEXT NOT NULL,
  mensaje_id TEXT, -- id del mensaje con las reacciones, para poder actualizarlo
  recordatorio_enviado INTEGER DEFAULT 0 -- aviso automático antes de que empiece (cron)
);

CREATE TABLE IF NOT EXISTS evento_respuestas (
  evento_id INTEGER NOT NULL,
  jid_usuario TEXT NOT NULL,
  respuesta TEXT, -- 'si' | 'no' | 'tal_vez'
  PRIMARY KEY (evento_id, jid_usuario),
  FOREIGN KEY (evento_id) REFERENCES eventos(id)
);

-- Estado de "ausente" (/afk)
CREATE TABLE IF NOT EXISTS afk (
  jid_usuario TEXT PRIMARY KEY,
  motivo TEXT,
  desde TEXT DEFAULT CURRENT_TIMESTAMP
);

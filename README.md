# Beyonder Bot

Bot de WhatsApp multiusos hecho con Node.js y [Baileys](https://github.com/WhiskeySockets/Baileys).

## Estructura del proyecto

```
beyonder-bot/
├── src/
│   ├── index.js              → conexión a Baileys + reconexión + sesión persistente
│   ├── config.js             → configuración leída de .env
│   ├── database/
│   │   ├── db.js             → conexión SQLite (better-sqlite3)
│   │   └── schema.sql        → tablas: usuarios, recordatorios, cumpleaños, eventos, etc.
│   ├── commands/              → un archivo por grupo de comandos
│   │   ├── registry.js       → el Map real de comandos (registrar/obtener)
│   │   ├── index.js          → solo carga todos los módulos y re-expone registry.js
│   │   ├── control.js        → /on /off /activar
│   │   ├── pais.js           → /pais es|rd
│   │   ├── recordatorios.js  → /record
│   │   ├── cumpleanos.js     → /cumple /bd
│   │   ├── diversion.js      → /random
│   │   ├── stickers.js       → /s (imagen) y /a (animado), directo o por reply
│   │   ├── acciones.js       → /kiss /hug /slap /pat... (gifs de nekos.best)
│   │   ├── dedicar.js        → /dedicar @persona mensaje
│   │   ├── eventos.js        → /org (crear evento) y /planes (ver RSVP)
│   │   └── musica.js         → /yt /play (busca y descarga audio de YouTube)
│   ├── frases/                 → 📝 TODO ustedes: acá vive todo lo que "dice"
│   │   │                        Beyonder para cada feature, separado del código
│   │   ├── acciones.js        →  texto de /kiss /hug /slap etc.
│   │   ├── dedicar.js         →  encabezado/pie de /dedicar
│   │   ├── eventos.js         →  invitación, "sin planes" y recordatorio de /org
│   │   └── musica.js          →  texto al mostrar resultados de /yt
│   ├── handlers/
│   │   ├── messageHandler.js → parsea cada mensaje entrante y ejecuta el comando
│   │   └── reactionHandler.js → convierte las reacciones ✅❌❔ de /org en RSVP
│   ├── middleware/
│   │   ├── prefijos.js       → detecta "/" "." "!" y separa comando/args
│   │   └── groupPermissions.js → qué grupos tienen al bot activado/encendido
│   ├── services/
│   │   ├── paisService.js    → detecta España/RD por el prefijo del número
│   │   ├── geminiService.js  → respuesta con IA cuando mencionan "Beyonder"
│   │   ├── nekosBestService.js → cliente de la API pública de nekos.best
│   │   ├── ytService.js      → búsqueda (yt-search) y descarga (yt-dlp) de YouTube
│   │   └── cronJobs.js       → recordatorios, cumpleaños y avisos de eventos
│   └── utils/
│       ├── fechas.js         → conversión de fecha/hora a UTC según zona horaria
│       ├── typing.js         → efecto "escribiendo..." + delay de 1s
│       ├── logger.js         → logs con pino
│       └── decorador.js      → le pega la firma de Beyonder a TODO texto saliente
├── auth_info_baileys/         → 🔒 sesión de WhatsApp (se genera sola, NO tocar a mano)
├── data/                       → 🔒 base de datos SQLite (se genera sola)
├── .env.example
└── package.json
```

## Instalación

```bash
npm install
cp .env.example .env
# completá GEMINI_API_KEY en .env
npm start
```

La primera vez va a mostrar un código QR en la terminal: escaneálo desde
WhatsApp (Dispositivos vinculados → Vincular un dispositivo). Una vez
vinculado, la sesión queda guardada en `auth_info_baileys/` y **no vas a
tener que volver a escanear el QR** aunque reinicies el servidor, se caiga
la conexión a internet, o el proceso se reinicie solo. Sólo hace falta
re-escanear si cerrás sesión manualmente desde el teléfono (logout) o si
borrás esa carpeta.

## Cómo activar el bot en un grupo nuevo

Por defecto, si agregan al bot a un grupo que no está en la lista de
permitidos, se queda mudo. Alguien tiene que escribir `/activar` (con
cualquiera de los prefijos `/`, `.` o `!`) para habilitarlo ahí.

## Cómo agregar un comando nuevo

1. Creá un archivo en `src/commands/` (o sumalo a uno existente).
2. Al principio del archivo: `const { registrar } = require('./registry');` (⚠️ es
   `./registry`, **no** `./index` — ver la nota de la dependencia circular más abajo).
3. Llamá a `registrar('nombre', handler)` — o `registrar(['nombre', 'alias'], handler)`.
4. Agregá el `require('./tu-archivo')` en `src/commands/index.js`.

El `handler` recibe un `ctx` con: `sock`, `msg`, `jid`, `esGrupo`, `remitente`,
`comando`, `args`, `textoCompleto`, `reaccionar(emoji)`, `quotedMessage`,
`quotedParticipant`, `quotedId` (datos del mensaje citado, para reply a
imágenes/videos/personas) y `mentionedJids` (array de JIDs mencionados con "@").

**Nota sobre `registry.js` vs `index.js`:** originalmente `commands/index.js`
tenía el `Map` de comandos y también cargaba (`require`) todos los módulos.
Eso rompía: cada módulo (`control.js`, etc.) hacía `require('./index')` para
conseguir `registrar`, pero en ese momento `index.js` todavía estaba a la
mitad de sus propios `require()` — Node ya lo tenía en caché con un
`module.exports` vacío `{}`, así que `registrar` les llegaba como
`undefined` y el bot explotaba al arrancar. Por eso el Map real ahora vive
solo en `registry.js`, sin cargar nada más, y todos los comandos le hacen
`require` a él.

## Recordatorios y cumpleaños (cron)

`src/services/cronJobs.js` corre dos tareas en segundo plano una vez que el
bot está conectado:

- Cada **1 minuto**: revisa `/record` vencidos y los manda mencionando al usuario.
- Cada **15 minutos**: revisa cumpleaños guardados con `/cumple`, calcula los
  días restantes según la timezone del país de cada persona, y manda el
  aviso de 3, 2, 1 día antes o el mismo día — sin repetirlo dos veces el
  mismo día. Al llegar el día, resetea los avisos para que vuelvan a
  dispararse el año siguiente.

## Stickers (`/s` y `/a`)

- `/s`: convierte una imagen en sticker. Funciona mandando la imagen con
  "/s" de texto/caption, o haciendo reply a una imagen ya enviada con "/s".
- `/a`: igual, pero para video/gif corto → sticker animado.
- **Requisito del sistema**: los stickers animados necesitan `ffmpeg`
  instalado en el servidor (lo usa `wa-sticker-formatter` internamente para
  convertir el video a webp animado). En Ubuntu/Debian: `sudo apt install ffmpeg`.

## Acciones con GIF (`/kiss`, `/hug`, `/slap`, etc.)

Usa la API pública de [nekos.best](https://docs.nekos.best) (sin API key).
Dos tipos:

- **Dirigidas a alguien** (`/kiss`, `/hug`, `/pat`, `/slap`, `/kick`, `/bite`,
  `/cuddle`, `/punch`, `/tickle`, `/poke`, `/handhold`, `/highfive`, `/feed`,
  `/handshake`, `/threaten`, `/yeet`): necesitan mencionar a alguien
  (`/kiss @juan`) o hacerle reply a su mensaje. Si no hay a quién, el bot
  responde ❔.
- **Reacciones propias** (`/wave`, `/cry`, `/dance`, `/blush`, `/laugh`,
  `/smile`, `/wink`, `/happy`, `/pout`, `/smug`, `/bored`, `/shrug`, `/baka`,
  `/stare`): no requieren mencionar a nadie.

El texto que acompaña cada gif está en `src/frases/acciones.js` — ahí se
edita, con `{de}` y `{para}` como placeholders.

## Dedicatorias (`/dedicar`)

`/dedicar @persona mensaje` (o reply a la persona) manda un mensaje
decorado, mencionando a ambos. El envío es **inmediato**, no programado —
si en algún momento lo querés con fecha/hora tipo `/record`, es un cambio
chico sobre `commands/dedicar.js` + una tabla nueva en el schema. El
encabezado/pie están en `src/frases/dedicar.js`.

## Eventos y RSVP (`/org`, `/planes`)

- `/org DD/MM/AAAA HH:MM am|pm descripción` crea el evento y manda un
  mensaje pidiendo que la gente reaccione: ✅ voy / ❌ no voy / ❔ no sé
  (también cuentan 👍, 👎, 🤷 y ❓ como alias). Esas reacciones las procesa
  `src/handlers/reactionHandler.js`, enganchado al evento `messages.reaction`
  de Baileys, y quedan guardadas en `evento_respuestas`.
- `/planes` lista los eventos futuros del chat con quién confirmó, quién no
  y quién no sabe.
- El cron (`cronJobs.js`) manda un recordatorio automático (por defecto 60
  minutos antes, configurable con `EVENTO_RECORDATORIO_MIN` en `.env`)
  mencionando a los que confirmaron con ✅.

⚠️ El shape exacto del evento `messages.reaction` puede variar entre
versiones de Baileys — quedó comentado en `reactionHandler.js`. Si después
de actualizar `@whiskeysockets/baileys` las reacciones dejan de guardarse,
revisar ahí primero (un `console.log(JSON.stringify(reactions))` rápido
alcanza para ver el shape real).

## Música (`/yt`, `/play`)

`/yt nombre de la canción` busca en YouTube (vía `yt-search`), muestra los
primeros 3 resultados numerados, y espera que respondas con el número
(sin prefijo, solo "1", "2" o "3") dentro de los 2 minutos siguientes. Al
elegir, descarga el audio con `yt-dlp-exec` y lo manda como nota de audio.

**Requisitos del sistema:**
- `ffmpeg` (el mismo que ya hace falta para `/a`).
- `yt-dlp-exec` baja su propio binario de `yt-dlp` al hacer `npm install`;
  si tu servidor no tiene salida a internet en ese paso, instalá `yt-dlp`
  manualmente y revisá la config de `yt-dlp-exec`.

## Pendiente de implementar

Ya no queda ningún módulo planificado sin implementar. Si se agregan ideas
nuevas, anotarlas acá.

## Firma automática de Beyonder

`src/utils/decorador.js` envuelve `sock.sendMessage` una sola vez, en
`src/index.js`, justo al crear el socket. Cualquier mensaje que se mande
desde CUALQUIER parte del bot (comandos, cron, reactionHandler, respuestas
de IA) y que tenga `text` o `caption`, sale automáticamente con:

```
ᯓ @Bey⚡︎nderˎˊ˗  ⋆
```

al final. No hace falta tocar nada más — ni las `frases/`, ni los
comandos — para que un mensaje nuevo la lleve puesta; y no la duplica si
un texto ya la trae. No decora reacciones, stickers ni audio (no tienen
texto). Para cambiar la firma o el estilo, editar solo `FIRMA` en ese
archivo.

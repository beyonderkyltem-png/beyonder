// ============================================================================
// TODO (vos): esto es lo que dice Beyonder cuando alguien usa una acción con
// GIF (/kiss, /hug, /slap, etc.). Son placeholders básicos para que el bot
// funcione de una — editalos a gusto, dale la personalidad que quieras.
//
// Placeholders disponibles en cada frase:
//   {de}   -> quien ejecuta el comando, ya formateado como "@numero"
//   {para} -> a quien va dirigida la acción, ya formateado como "@numero"
//            (NO está disponible en las acciones que no requieren mención,
//            ver comandos/acciones.js -> ACCIONES)
//
// Podés poner más de una frase por acción: si hay varias, se elige una al
// azar cada vez que se usa el comando.
// ============================================================================

module.exports = {
  // --- Acciones dirigidas a otra persona (requieren mención o reply) ---
  kiss: [' ᯓ ┋ {de} chulea a {para} 😘'],
  hug: [' ᯓ ┋ {de} abraza a {para} 🤗'],
  pat: [' ᯓ ┋ {de} le da cariñitos a {para} 🥹'],
  slap: [' ᯓ ┋ {de} le pega una trompa a {para} 👋'],
  kick: [' ᯓ ┋ {de} le pega una patada a {para} 🦵'],
  bite: [' ᯓ ┋ {de} muerde a {para} 🫦'],
  cuddle: [' ᯓ ┋ {de} se acurruca con {para} 🥰'],
  punch: [' ᯓ ┋ {de} le tira un trompón a {para} 👊'],
  tickle: [' ᯓ ┋ {de} le hace cosquillas a {para} 🤣'],
  poke: [' ᯓ ┋ {de} le pica a {para} 👉'],
  handhold: [' ᯓ ┋ {de} le agarra la mano a {para} 🤝'],
  highfive: [' ᯓ ┋ {de} choca los cinco con {para} ✋'],
  feed: [' ᯓ ┋ {de} le da de comer a {para} 🍽️'],
  handshake: [' ᯓ ┋ {de} le da la mano a {para} 🤝'],
  threaten: [' ᯓ ┋ {de} amenaza a {para} 😠'],
  yeet: [' ᯓ ┋ {de} manda a volar a {para} 🚀'],

  // --- Acciones que noie más (reie más (reacciones propias) ---
  wave: [' ᯓ ┋ {de} saluda 👋'],
  cry: [' ᯓ ┋ {de} está llorando 😭'],
  dance: [' ᯓ ┋ {de} se manda un bailecito 💃'],
  blush: [' ᯓ ┋ {de} se puso colorado/a 😳'],
  laugh: [' ᯓ ┋ {de} se está riendo 😂'],
  smile: [' ᯓ ┋ {de} sonríe 🙂'],
  wink: [' ᯓ ┋ {de} guiña el ojo 😉'],
  happy: [' ᯓ ┋ {de} está contento/a 😄'],
  pout: [' ᯓ ┋ {de} hace pucherito 😤'],
  smug: [' ᯓ ┋ {de} anda de sobrador/a 😏'],
  bored: [' ᯓ ┋ {de} está muerto/a de aburrimiento 🥱'],
  shrug: [' ᯓ ┋ {de} se encoge de hombros 🤷'],
  baka: [' ᯓ ┋ {de} anda de baka hoy 😤'],
  stare: [' ᯓ ┋ {de} se quedó mirando fijo 👀'],
};

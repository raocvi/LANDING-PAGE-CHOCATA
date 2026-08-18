/**
 * Contenido editable de la página (el «Estudio»).
 *
 * La dueña edita textos desde /estudio y aquí se guardan y se leen. El
 * contenido vive en Vercel Blob (producción) o en .contenido/ (desarrollo),
 * igual que los pedidos. La regla sagrada: si no hay nada guardado, o lo
 * guardado está roto, se responde el PREDETERMINADO — que es exactamente lo
 * que la página trae escrito de fábrica. Editar jamás puede romper.
 *
 * Cada guardado conserva la versión anterior (deshacer de un paso).
 */
const fs = require('node:fs');
const path = require('node:path');

const CARPETA_LOCAL = process.env.CONTENIDO_DIR || path.join(__dirname, '..', '.contenido');
const RUTA_BLOB = 'contenido/sitio.json';
const RUTA_BLOB_ANTERIOR = 'contenido/sitio.anterior.json';

/** Los textos de fábrica: idénticos a los que la página trae en el HTML. */
const PREDETERMINADO = {
  aviso: {
    visible: true,
    texto: 'Nuestra sede física en Cali cerró por el terremoto del 10 de agosto. Seguimos aquí:',
    destacado: 'cada pedido nos ayuda a levantarnos.',
    enlaceTexto: 'Ver la historia',
    enlaceUrl: 'https://www.instagram.com/reel/Db7C-_Pg-h_/'
  },
  hero: {
    eyebrow: 'Hecho en Cali · Desde el corazón',
    titulo: 'Energía que sabe a',
    tituloAcento: 'casa',
    lede: 'De la taza de chocolate de la mañana a la creatina después del entreno. CHOCATA es una familia de productos colombianos con materia prima 100 % pura, pensados para el cuerpo que se mueve todos los días.'
  }
};

/* Límites por campo: la muralla contra textos que desbordan el diseño. */
const LIMITES = {
  'aviso.texto': 160,
  'aviso.destacado': 80,
  'aviso.enlaceTexto': 40,
  'aviso.enlaceUrl': 300,
  'hero.eyebrow': 60,
  'hero.titulo': 60,
  'hero.tituloAcento': 24,
  'hero.lede': 320
};

function usaBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function leerBlob(ruta) {
  const { get } = require('@vercel/blob');
  try {
    const r = await get(ruta, { access: 'private', useCache: false });
    if (!r || !r.stream) return null;
    return JSON.parse(await new Response(r.stream).text());
  } catch { return null; }
}

async function escribirBlob(ruta, objeto) {
  const { put } = require('@vercel/blob');
  await put(ruta, JSON.stringify(objeto, null, 2), {
    access: 'private', contentType: 'application/json',
    addRandomSuffix: false, allowOverwrite: true
  });
}

function leerLocal(nombre) {
  try { return JSON.parse(fs.readFileSync(path.join(CARPETA_LOCAL, nombre), 'utf8')); }
  catch { return null; }
}

function escribirLocal(nombre, objeto) {
  fs.mkdirSync(CARPETA_LOCAL, { recursive: true });
  fs.writeFileSync(path.join(CARPETA_LOCAL, nombre), JSON.stringify(objeto, null, 2), 'utf8');
}

/**
 * Valida y poda lo recibido: solo pasan las llaves conocidas, recortadas a su
 * límite. Un booleano fuera de sitio o un objeto extraño simplemente se ignora.
 */
function depurar(entrada) {
  const limpio = {};
  for (const seccion of Object.keys(PREDETERMINADO)) {
    const fuente = entrada && typeof entrada === 'object' ? entrada[seccion] : null;
    if (!fuente || typeof fuente !== 'object') continue;
    const destino = {};
    for (const campo of Object.keys(PREDETERMINADO[seccion])) {
      const v = fuente[campo];
      if (typeof PREDETERMINADO[seccion][campo] === 'boolean') {
        if (typeof v === 'boolean') destino[campo] = v;
      } else if (typeof v === 'string') {
        const tope = LIMITES[`${seccion}.${campo}`] || 200;
        destino[campo] = v.trim().slice(0, tope);
      }
    }
    if (Object.keys(destino).length) limpio[seccion] = destino;
  }
  return limpio;
}

/** Predeterminado + lo guardado, campo a campo. Nunca lanza. */
async function leerContenido() {
  const guardado = usaBlob() ? await leerBlob(RUTA_BLOB) : leerLocal('sitio.json');
  const depurado = depurar(guardado);
  const resultado = {};
  for (const seccion of Object.keys(PREDETERMINADO)) {
    resultado[seccion] = { ...PREDETERMINADO[seccion], ...(depurado[seccion] || {}) };
  }
  return resultado;
}

/** Guarda (conservando la versión previa) y devuelve el contenido vigente. */
async function guardarContenido(entrada) {
  const limpio = depurar(entrada);
  const previo = usaBlob() ? await leerBlob(RUTA_BLOB) : leerLocal('sitio.json');
  if (usaBlob()) {
    if (previo) await escribirBlob(RUTA_BLOB_ANTERIOR, previo);
    await escribirBlob(RUTA_BLOB, limpio);
  } else {
    if (previo) escribirLocal('sitio.anterior.json', previo);
    escribirLocal('sitio.json', limpio);
  }
  return leerContenido();
}

/** Restaura la versión anterior (deshacer de un paso). */
async function deshacerContenido() {
  const anterior = usaBlob() ? await leerBlob(RUTA_BLOB_ANTERIOR) : leerLocal('sitio.anterior.json');
  if (anterior == null) return null;
  if (usaBlob()) await escribirBlob(RUTA_BLOB, anterior);
  else escribirLocal('sitio.json', anterior);
  return leerContenido();
}

module.exports = { leerContenido, guardarContenido, deshacerContenido, PREDETERMINADO, LIMITES };

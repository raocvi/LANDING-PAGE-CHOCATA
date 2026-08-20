/**
 * Imágenes editables: logo, fondos y fotos de producto.
 *
 * Cada ranura declara su proporción y su ancho máximo. El navegador recorta
 * y escala la imagen a esa medida ANTES de subirla (así ninguna foto llega
 * deformada ni pesada), y aquí solo se valida y se guarda. Guardar en Blob
 * público porque el navegador del cliente tiene que poder verlas; nada
 * personal vive en estas rutas.
 */
const fs = require('node:fs');
const path = require('node:path');

const CARPETA_LOCAL = process.env.CONTENIDO_DIR || path.join(__dirname, '..', '.contenido');
const RAIZ_DATOS = path.join(__dirname, '..', 'web', 'assets', 'data');
const CATALOGO = JSON.parse(fs.readFileSync(path.join(RAIZ_DATOS, 'precios.json'), 'utf8'));

/** 3 MB después de decodificar: de sobra para una foto ya optimizada. */
const MAXIMO_BYTES = 3 * 1024 * 1024;

/**
 * Las ranuras editables. `w`/`h` son la proporción del marco tal como la
 * página ya la usa: el recorte del navegador se hace contra estos números,
 * así la foto entra exacta y nunca descuadra la maqueta.
 */
const RANURAS = {
  logo: { titulo: 'Logo de la marca', w: 1100, h: 859, nota: 'Se ve en la barra de navegación y en el pie.' },
  heroFondo: { titulo: 'Fondo de la portada', w: 1484, h: 1060, nota: 'La foto grande detrás del título principal.' },
  historiaFondo: { titulo: 'Foto de la historia', w: 1448, h: 1086, nota: 'Acompaña el relato de la marca.' }
};

/* Una ranura por producto del catálogo, con la proporción de la vitrina. */
for (const slug of Object.keys(CATALOGO)) {
  RANURAS['producto.' + slug] = {
    titulo: CATALOGO[slug].nombre || slug,
    w: 1122, h: 1402,
    grupo: 'productos',
    nota: 'Foto de la tarjeta en la vitrina.'
  };
}

function esRanura(nombre) {
  return Object.prototype.hasOwnProperty.call(RANURAS, nombre);
}

/** Nombre de archivo estable por ranura: subir de nuevo reemplaza. */
function archivoDe(ranura) {
  return 'imagenes/' + ranura.replace(/[^a-z0-9.-]/gi, '_') + '.webp';
}

/**
 * Decodifica y valida un data URL de imagen. Devuelve el buffer o un motivo.
 * Solo WebP: es lo que produce el recorte del navegador, y aceptar un solo
 * formato deja menos superficie que validar.
 */
function decodificar(datos) {
  if (typeof datos !== 'string') return { error: 'No llegó ninguna imagen.' };
  const marca = 'data:image/webp;base64,';
  if (!datos.startsWith(marca)) return { error: 'La imagen debe venir en formato WebP.' };
  let buffer;
  try { buffer = Buffer.from(datos.slice(marca.length), 'base64'); }
  catch { return { error: 'La imagen llegó dañada.' }; }
  if (!buffer.length) return { error: 'La imagen llegó vacía.' };
  if (buffer.length > MAXIMO_BYTES) return { error: 'La imagen pesa demasiado, incluso después de optimizarla.' };
  /* Firma real del archivo: 'RIFF' … 'WEBP'. Que la extensión diga webp no
     basta; esto confirma que el contenido también lo es. */
  const esWebp = buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
                 buffer.slice(8, 12).toString('ascii') === 'WEBP';
  if (!esWebp) return { error: 'El archivo no parece ser una imagen WebP.' };
  return { buffer };
}

function usaBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Guarda la imagen y devuelve la URL con la que la página la pedirá. */
async function guardarImagen(ranura, buffer) {
  const nombre = archivoDe(ranura);
  if (usaBlob()) {
    const { put } = require('@vercel/blob');
    const r = await put(nombre, buffer, {
      access: 'public', contentType: 'image/webp',
      addRandomSuffix: false, allowOverwrite: true
    });
    return r.url;
  }
  /* En desarrollo van a .contenido/imagenes/ y el servidor local las sirve
     bajo /subidas/, para poder ver el resultado sin nube. */
  const destino = path.join(CARPETA_LOCAL, nombre);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, buffer);
  return '/subidas/' + path.basename(nombre) + '?v=' + Date.now();
}

module.exports = { RANURAS, esRanura, decodificar, guardarImagen, MAXIMO_BYTES };

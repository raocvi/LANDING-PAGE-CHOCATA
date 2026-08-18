/**
 * POST /api/subir-imagen — recibe una imagen ya recortada por el navegador,
 * la guarda y la deja anotada en el contenido del sitio.
 *
 * Cuerpo: { ranura: 'logo' | 'heroFondo' | 'producto.<slug>' | …,
 *           datos: 'data:image/webp;base64,…' }
 *
 * GET devuelve el catálogo de ranuras (para que el Estudio sepa qué ofrecer
 * y con qué proporción recortar).
 */
const { tokenValido } = require('./_pedido');
const { RANURAS, esRanura, decodificar, guardarImagen } = require('./_imagenes');
const { leerContenido, guardarContenido } = require('./_contenido');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ranuras: RANURAS });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ mensaje: 'Método no permitido.' });
  }
  if (!tokenValido(req.headers['x-admin-token'], process.env.ADMIN_TOKEN)) {
    return res.status(401).json({ mensaje: 'Sin autorización.' });
  }

  let cuerpo = req.body;
  if (typeof cuerpo === 'string') {
    try { cuerpo = JSON.parse(cuerpo); } catch { return res.status(400).json({ mensaje: 'Petición malformada.' }); }
  }
  if (!cuerpo || typeof cuerpo !== 'object') return res.status(400).json({ mensaje: 'Petición vacía.' });

  const ranura = String(cuerpo.ranura || '');
  if (!esRanura(ranura)) return res.status(400).json({ mensaje: 'Esa parte de la página no se puede cambiar.' });

  /* Quitar la imagen personalizada: la página vuelve a su foto original. */
  if (cuerpo.quitar === true) {
    const actual = await leerContenido();
    const imagenes = { ...(actual.imagenes || {}) };
    delete imagenes[ranura];
    const contenido = await guardarContenido({ ...actual, imagenes });
    return res.status(200).json({ contenido, mensaje: 'Se restauró la imagen original.' });
  }

  const { buffer, error } = decodificar(cuerpo.datos);
  if (error) return res.status(400).json({ mensaje: error });

  let url;
  try {
    url = await guardarImagen(ranura, buffer);
  } catch (e) {
    console.error('[subir-imagen] fallo al guardar', ranura, e && e.message);
    return res.status(500).json({ mensaje: 'No pudimos guardar la imagen. Intenta de nuevo.' });
  }

  const actual = await leerContenido();
  const contenido = await guardarContenido({
    ...actual,
    imagenes: { ...(actual.imagenes || {}), [ranura]: url }
  });
  return res.status(200).json({ contenido, url, mensaje: 'Imagen publicada.' });
};

/**
 * GET /llms.txt — la ficha del negocio para asistentes de IA, en vivo.
 *
 * Se sirve desde una función y no como archivo estático para que refleje los
 * precios y la visibilidad que la dueña tenga puestos en ese momento. Si el
 * contenido editable no se puede leer, se responde con el catálogo de fábrica:
 * una ficha con precios de fábrica siempre es mejor que ninguna ficha.
 */
const { construir } = require('./_llms');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ mensaje: 'Método no permitido.' });
  }

  let ediciones = {};
  try {
    const { leerContenido } = require('./_contenido');
    const c = await leerContenido();
    ediciones = c.productos || {};
  } catch (e) {
    console.error('[llms] sin ediciones, se usa fábrica:', e && e.message);
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  /* Media hora de caché: los rastreadores no necesitan el segundo exacto y
     así un pico de robots no dispara lecturas del almacén. */
  res.setHeader('Cache-Control', 'public, max-age=1800, stale-while-revalidate=86400');
  res.status(200);
  res.end(construir(ediciones));
};

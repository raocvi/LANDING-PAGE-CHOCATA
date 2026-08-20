/**
 * /api/contenido — el contenido editable de la página.
 *
 *   GET               público: la página lo lee al cargar para pintarse.
 *   PUT               administración: guarda lo editado en el Estudio.
 *   PUT ?deshacer=1   administración: vuelve a la versión anterior.
 */
const { tokenValido } = require('./_pedido');
const { leerContenido, guardarContenido, deshacerContenido, LIMITES } = require('./_contenido');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    /* Sin caché: un cambio de la dueña debe verse al instante. */
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ contenido: await leerContenido(), limites: LIMITES });
  }

  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ mensaje: 'Método no permitido.' });
  }
  if (!tokenValido(req.headers['x-admin-token'], process.env.ADMIN_TOKEN)) {
    return res.status(401).json({ mensaje: 'Sin autorización.' });
  }

  if (String(req.query && req.query.deshacer) === '1') {
    const restaurado = await deshacerContenido();
    if (!restaurado) return res.status(404).json({ mensaje: 'No hay una versión anterior guardada.' });
    return res.status(200).json({ contenido: restaurado, mensaje: 'Se restauró la versión anterior.' });
  }

  let cuerpo = req.body;
  if (typeof cuerpo === 'string') {
    try { cuerpo = JSON.parse(cuerpo); } catch { return res.status(400).json({ mensaje: 'Petición malformada.' }); }
  }
  if (!cuerpo || typeof cuerpo !== 'object') {
    return res.status(400).json({ mensaje: 'Petición vacía.' });
  }

  const contenido = await guardarContenido(cuerpo);
  return res.status(200).json({ contenido, mensaje: 'Cambios publicados.' });
};

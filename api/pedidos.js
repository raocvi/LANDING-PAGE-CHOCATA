/**
 * GET /api/pedidos — la lista completa para despachar.
 *
 * Devuelve todos los pedidos con sus datos de entrega. Exclusivo para la
 * administración: sin el token correcto responde 401 y no revela nada, porque
 * aquí viven los datos personales de todos los clientes (Ley 1581).
 *
 * Cabecera requerida:  x-admin-token: <ADMIN_TOKEN>
 */
const almacen = require('./_almacen');
const { tokenValido } = require('./_pedido');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ mensaje: 'Método no permitido.' });
  }

  if (!tokenValido(req.headers['x-admin-token'], process.env.ADMIN_TOKEN)) {
    return res.status(401).json({ mensaje: 'Sin autorización.' });
  }

  try {
    const referencias = await almacen.listarReferencias();
    const pedidos = (await Promise.all(referencias.map((r) => almacen.leer(r))))
      .filter(Boolean)
      .sort((a, b) => String(b.creado || '').localeCompare(String(a.creado || '')));

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ total: pedidos.length, pedidos });
  } catch (e) {
    console.error('[pedidos] fallo listando', e && e.message);
    return res.status(500).json({ mensaje: 'No pudimos listar los pedidos.' });
  }
};

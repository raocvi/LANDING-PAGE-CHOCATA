/**
 * GET /api/pedido?ref=CHOCATA-…
 *
 * Consulta del estado de un pedido.
 *
 * La referencia viaja en la URL y puede quedar en el historial del navegador o
 * en un mensaje reenviado, así que por defecto **no** devuelve datos
 * personales: solo estado, total y fecha. Nombre, documento, dirección y
 * teléfono son datos personales bajo la Ley 1581 y solo salen con el token de
 * administración.
 *
 * Variable de entorno opcional:
 *   ADMIN_TOKEN   habilita la vista completa con la cabecera x-admin-token
 */
const almacen = require('./_almacen');
const { tokenValido } = require('./_pedido');


module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ mensaje: 'Método no permitido.' });
  }

  const url = new URL(req.url, 'http://localhost');
  const ref = String(url.searchParams.get('ref') || '').trim();

  if (!/^CHOCATA-[A-Z0-9]{6,12}-[A-F0-9]{8}$/.test(ref)) {
    return res.status(400).json({ mensaje: 'Referencia inválida.' });
  }

  let pedido;
  try {
    pedido = await almacen.leer(ref);
  } catch (e) {
    console.error('[pedido] fallo al leer', ref, e && e.message);
    return res.status(500).json({ mensaje: 'No pudimos consultar el pedido.' });
  }

  /* El campo motor permite saber desde afuera qué versión del código corre,
     porque un deploy atascado no se distingue de un fallo de lectura. */
  if (!pedido) return res.status(404).json({ mensaje: 'No encontramos ese pedido.', motor: 'get-v2' });

  const esAdmin = tokenValido(req.headers['x-admin-token'], process.env.ADMIN_TOKEN);

  res.setHeader('Cache-Control', 'no-store');
  if (esAdmin) return res.status(200).json(pedido);

  return res.status(200).json({
    referencia: pedido.referencia,
    estado: pedido.estado,
    total: pedido.total,
    creado: pedido.creado
  });
};

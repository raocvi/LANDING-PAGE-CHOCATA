/**
 * POST /api/reenviar-correo — reenvía la confirmación de un pedido real.
 *
 * Toma un pedido ya guardado (por referencia) y vuelve a mandar el correo de
 * confirmación al cliente, con copia oculta al negocio. Solo administración,
 * y solo pedidos con el pago aprobado: reenviar la confirmación de un pedido
 * sin pagar sería mentirle al cliente.
 */
const { tokenValido } = require('./_pedido');
const { enviarConfirmacion } = require('./_correo');
const almacen = require('./_almacen');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ mensaje: 'Método no permitido.' });
  }
  if (!tokenValido(req.headers['x-admin-token'], process.env.ADMIN_TOKEN)) {
    return res.status(401).json({ mensaje: 'Sin autorización.' });
  }

  const referencia = String((req.body && req.body.referencia) || '').trim().toUpperCase();
  if (!/^CHOCATA-[A-Z0-9]{8}-[A-F0-9]{8}$/.test(referencia)) {
    return res.status(400).json({ mensaje: 'Referencia inválida.' });
  }

  const pedido = await almacen.leer(referencia);
  if (!pedido) {
    return res.status(404).json({ mensaje: 'Ese pedido no existe.' });
  }
  if (pedido.estado !== 'APPROVED') {
    return res.status(409).json({ mensaje: 'Solo se reenvía la confirmación de un pedido con el pago aprobado.' });
  }
  const correo = pedido.cliente && pedido.cliente.correo;
  if (!correo) {
    return res.status(409).json({ mensaje: 'El pedido no tiene correo del cliente.' });
  }

  const enviado = await enviarConfirmacion(pedido);
  return res.status(200).json({
    ok: enviado,
    detalle: enviado
      ? 'Confirmación reenviada a ' + correo + ' (con copia al negocio).'
      : 'Brevo rechazó el envío: revisa el log de Vercel.'
  });
};

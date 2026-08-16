/**
 * POST /api/despachar — marca un pedido como despachado.
 *
 * Cuerpo: { referencia, guia }  (la guía es opcional pero recomendada)
 * Cabecera: x-admin-token
 *
 * Solo se puede despachar un pedido con el pago APROBADO: despachar uno
 * pendiente es regalar mercancía, y uno en REVISAR_MONTO está bloqueado
 * justamente para que nadie lo despache hasta revisar.
 */
const almacen = require('./_almacen');
const { tokenValido } = require('./_pedido');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ mensaje: 'Método no permitido.' });
  }

  if (!tokenValido(req.headers['x-admin-token'], process.env.ADMIN_TOKEN)) {
    return res.status(401).json({ mensaje: 'Sin autorización.' });
  }

  let cuerpo = req.body;
  if (typeof cuerpo === 'string') {
    try { cuerpo = JSON.parse(cuerpo); } catch { return res.status(400).json({ mensaje: 'Petición malformada.' }); }
  }
  const referencia = String((cuerpo && cuerpo.referencia) || '').trim();
  if (!/^CHOCATA-[A-Z0-9]{6,12}-[A-F0-9]{8}$/.test(referencia)) {
    return res.status(400).json({ mensaje: 'Referencia inválida.' });
  }

  try {
    const r = await almacen.anotarDespacho(referencia, (cuerpo && cuerpo.guia) || '');
    if (!r.ok && r.motivo === 'NO_EXISTE') return res.status(404).json({ mensaje: 'No encontramos ese pedido.' });
    if (!r.ok && r.motivo === 'NO_PAGADO') {
      return res.status(409).json({
        mensaje: 'Solo se puede despachar un pedido con el pago aprobado. Este está en ' + r.pedido.estado + '.'
      });
    }
    console.log('[despacho]', referencia, 'guía:', r.pedido.despacho.guia || '(sin guía)');
    return res.status(200).json({ ok: true, despacho: r.pedido.despacho });
  } catch (e) {
    console.error('[despacho] fallo', referencia, e && e.message);
    return res.status(500).json({ mensaje: 'No pudimos registrar el despacho.' });
  }
};

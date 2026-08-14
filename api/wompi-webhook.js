/**
 * POST /api/wompi-webhook
 *
 * Único punto de verdad sobre si un pedido está pagado. Nunca se debe marcar
 * un pedido como pagado por lo que diga la redirección del navegador: el
 * comprador puede llegar a la página de gracias sin haber pagado.
 *
 * Wompi firma cada evento; aquí se recalcula el checksum y se compara en
 * tiempo constante. Si no coincide, se descarta.
 *
 * Variable de entorno:
 *   WOMPI_SECRETO_EVENTOS   secreto de eventos del panel de Wompi
 */
const { firmaEventoValida } = require('./_pedido');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ mensaje: 'Método no permitido.' });
  }

  const secreto = process.env.WOMPI_SECRETO_EVENTOS;
  if (!secreto) {
    console.error('[webhook] falta WOMPI_SECRETO_EVENTOS');
    return res.status(503).json({ mensaje: 'Webhook sin configurar.' });
  }

  let evento = req.body;
  if (typeof evento === 'string') {
    try { evento = JSON.parse(evento); } catch { return res.status(400).json({ mensaje: 'Evento malformado.' }); }
  }

  if (!firmaEventoValida(evento, secreto)) {
    console.warn('[webhook] firma inválida, evento descartado');
    /* 401 y no 400: el evento se entiende, pero no se puede confiar en él. */
    return res.status(401).json({ mensaje: 'Firma inválida.' });
  }

  const tx = evento.data && evento.data.transaction;
  if (!tx) return res.status(400).json({ mensaje: 'Evento sin transacción.' });

  /* Estados de Wompi: APPROVED, DECLINED, VOIDED, ERROR. */
  console.log('[webhook] transacción', JSON.stringify({
    referencia: tx.reference,
    estado: tx.status,
    montoCentavos: tx.amount_in_cents,
    metodo: tx.payment_method_type,
    id: tx.id
  }));

  if (tx.status === 'APPROVED') {
    /* TODO: marcar el pedido como pagado, avisar por correo y descontar
       inventario. Requiere base de datos; hoy solo queda registrado. */
    console.log('[webhook] PAGADO', tx.reference);
  }

  /* Wompi reintenta si no recibe 200: siempre se responde 200 tras validar. */
  return res.status(200).json({ recibido: true });
};

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
const almacen = require('./_almacen');
const { mensajePedido, avisarWhatsApp } = require('./_avisos');

/** Solo lo necesario de la transacción, sin arrastrar datos de más. */
function resumenTx(tx) {
  return {
    id: tx.id,
    estado: tx.status,
    montoCentavos: tx.amount_in_cents,
    metodo: tx.payment_method_type,
    finalizado: tx.finalized_at || null
  };
}

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

  try {
    const guardado = await almacen.leer(tx.reference);

    /* Se compara con lo que quedó escrito al crear el pedido: si el monto
       aprobado no coincide, no se da por bueno aunque la firma sea válida. */
    if (guardado && !guardado.huerfano && guardado.total * 100 !== tx.amount_in_cents) {
      console.error('[webhook] MONTO NO COINCIDE', tx.reference,
        `esperado=${guardado.total * 100}`, `recibido=${tx.amount_in_cents}`);
      const r = await almacen.marcarEstado(tx.reference, 'REVISAR_MONTO', resumenTx(tx));
      /* Solo en la primera transición: los reintentos de Wompi no pueden
         convertirse en una ráfaga de mensajes iguales. */
      if (r.cambio) await avisarWhatsApp(mensajePedido(r.pedido, 'REVISAR_MONTO'));
      return res.status(200).json({ recibido: true, revisar: true });
    }

    const r = await almacen.marcarEstado(tx.reference, tx.status, resumenTx(tx));
    if (r.huerfano) {
      console.error('[webhook] pago de un pedido que no teníamos', tx.reference);
      if (tx.status === 'APPROVED') await avisarWhatsApp(mensajePedido(r.pedido, 'HUERFANO'));
    } else if (!r.cambio) {
      console.log('[webhook] evento repetido, ya estaba en', tx.status);
    } else if (tx.status === 'APPROVED') {
      console.log('[webhook] PAGADO', tx.reference, `total=${r.pedido.total}`);
      await avisarWhatsApp(mensajePedido(r.pedido, 'APPROVED'));
    }
  } catch (e) {
    /* El guardado no puede tumbar la respuesta: si devolvemos error, Wompi
       reintenta y se corre el riesgo de procesar el pedido dos veces. */
    console.error('[webhook] fallo al guardar', tx.reference, e && e.message);
  }

  /* Wompi reintenta si no recibe 200: siempre se responde 200 tras validar. */
  return res.status(200).json({ recibido: true });
};

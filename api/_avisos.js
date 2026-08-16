/**
 * Avisos al comercio por WhatsApp.
 *
 * Regla de oro: un aviso jamás puede tumbar la respuesta del webhook. Si el
 * aviso falla, el pedido sigue guardado y el webhook responde 200 igual;
 * Wompi no debe reintentar por culpa de una notificación.
 *
 * Proveedor: CallMeBot (api.callmebot.com), pensado para avisos al propio
 * número del comercio. Gratuito y de configuración inmediata, pero es un
 * servicio de aficionado: si algún día el aviso se vuelve crítico para la
 * operación, el camino serio es la API oficial de WhatsApp Business (Meta) o
 * Twilio, y este módulo se cambia por dentro sin tocar el webhook.
 *
 * Variables de entorno:
 *   WHATSAPP_AVISO_TELEFONO   destino, ej. 573176685235 (sin + ni espacios)
 *   WHATSAPP_AVISO_APIKEY     la llave que CallMeBot responde al activarlo
 */

const cop = (n) => (typeof n === 'number' ? '$' + n.toLocaleString('es-CO') : '—');

/** Texto del aviso según lo que pasó. Puro y exportado para poder probarlo. */
function mensajePedido(pedido, estado) {
  if (!pedido) return null;

  if (estado === 'APPROVED') {
    const lineas = (pedido.lineas || [])
      .map((l) => `• ${l.cant} × ${l.nombre} ${l.talla}`)
      .join('\n');
    const c = pedido.cliente || {};
    return (
      `✅ PEDIDO PAGADO — ${pedido.referencia}\n` +
      `Total: ${cop(pedido.total)} (envío ${cop(pedido.envio)})\n` +
      `${lineas}\n` +
      `Cliente: ${c.nombre || '—'} · ${c.celular || '—'}\n` +
      `Entrega: ${c.direccion || '—'}, ${c.ciudad || '—'} (${c.departamento || '—'})` +
      (c.notas ? `\nNotas: ${c.notas}` : '')
    );
  }

  if (estado === 'REVISAR_MONTO') {
    return (
      `⚠️ REVISAR PEDIDO — ${pedido.referencia}\n` +
      `El monto aprobado por la pasarela no coincide con el pedido guardado. ` +
      `No despachar hasta revisar.`
    );
  }

  if (estado === 'HUERFANO') {
    return (
      `⚠️ PAGO SIN PEDIDO — ${pedido.referencia}\n` +
      `Llegó un pago aprobado de un pedido que no está en el almacén. ` +
      `Quedó guardado para reconstruirlo a mano.`
    );
  }

  return null;
}

/** Envía el texto. Nunca lanza: devuelve true/false y deja rastro en el log. */
async function avisarWhatsApp(texto) {
  const telefono = process.env.WHATSAPP_AVISO_TELEFONO;
  const apikey = process.env.WHATSAPP_AVISO_APIKEY;
  if (!telefono || !apikey || !texto) {
    if (!telefono || !apikey) console.log('[aviso] WhatsApp sin configurar, no se envía');
    return false;
  }
  /* CallMeBot se traga el signo $ seguido de números (lo trata como
     variable): $115.500 llegaba como 15.500. Los montos viajan como COP. */
  texto = String(texto).replace(/$/g, 'COP ');
  try {
    const url = 'https://api.callmebot.com/whatsapp.php' +
      `?phone=${encodeURIComponent(telefono)}` +
      `&apikey=${encodeURIComponent(apikey)}` +
      `&text=${encodeURIComponent(texto)}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) console.error('[aviso] WhatsApp respondió', r.status);
    return r.ok;
  } catch (e) {
    console.error('[aviso] WhatsApp falló:', e && e.message);
    return false;
  }
}

module.exports = { mensajePedido, avisarWhatsApp };

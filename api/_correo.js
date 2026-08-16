/**
 * Correo de confirmación al cliente, vía Brevo (plan gratis: 300/día).
 *
 * Se dispara cuando el webhook confirma un pago. La misma regla de oro de
 * los avisos: un correo fallido jamás tumba la respuesta del webhook.
 *
 * Variables de entorno:
 *   BREVO_API_KEY      llave de Brevo (SMTP & API → API Keys)
 *   CORREO_REMITENTE   el correo verificado como remitente en Brevo
 *   CORREO_NOMBRE      opcional; por defecto «CHOCATA Colombia»
 */

const cop = (n) => (typeof n === 'number' ? '$' + n.toLocaleString('es-CO') : '—');

function esc(t) {
  return String(t == null ? '' : t).replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

/** El HTML del correo. Puro y exportado para poder probarlo. */
function armarCorreo(pedido) {
  const c = pedido.cliente || {};
  const filas = (pedido.lineas || []).map((l) =>
    '<tr>' +
      '<td style="padding:8px 0;color:#3d3630;font-size:14px">' + l.cant + ' × ' + esc(l.nombre) +
        ' <span style="color:#8a8177">' + esc(l.talla) + '</span></td>' +
      '<td style="padding:8px 0;color:#3d3630;font-size:14px;text-align:right;white-space:nowrap">' + cop(l.total) + '</td>' +
    '</tr>'
  ).join('');

  const direccion = [c.direccion, c.ciudad, c.departamento].filter(Boolean).join(', ');

  const html =
'<div style="background:#f6f1e8;padding:28px 12px;font-family:Arial,Helvetica,sans-serif">' +
  '<table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid #e8e0d2" cellpadding="0" cellspacing="0">' +
    '<tr><td style="padding:28px 28px 20px">' +
      '<p style="margin:0;font-size:12px;letter-spacing:3px;color:#b8860b;text-transform:uppercase">CHOCATA · Sabor y Pasión</p>' +
      '<h1 style="margin:10px 0 4px;font-size:24px;color:#241d15">¡Tu pedido está confirmado!</h1>' +
      '<p style="margin:0;color:#6e645b;font-size:14px;line-height:1.6">Hola ' + esc((c.nombre || '').split(' ')[0]) +
        ', recibimos tu pago y ya estamos alistando tu pedido. Guarda esta referencia:</p>' +
      '<p style="margin:14px 0 0;padding:10px 14px;background:#faf6ee;border:1px solid #eadfc8;border-radius:9px;' +
        'font-size:16px;color:#241d15;letter-spacing:1px"><b>' + esc(pedido.referencia) + '</b></p>' +
    '</td></tr>' +
    '<tr><td style="padding:0 28px">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee5d5">' +
        filas +
        '<tr><td style="padding:10px 0 2px;color:#8a8177;font-size:13px;border-top:1px solid #eee5d5">Envío</td>' +
          '<td style="padding:10px 0 2px;text-align:right;color:#3d3630;font-size:13px;border-top:1px solid #eee5d5">' + cop(pedido.envio) + '</td></tr>' +
        '<tr><td style="padding:6px 0 14px;color:#241d15;font-size:16px"><b>Total pagado</b></td>' +
          '<td style="padding:6px 0 14px;text-align:right;color:#b8860b;font-size:18px"><b>' + cop(pedido.total) + '</b></td></tr>' +
      '</table>' +
    '</td></tr>' +
    '<tr><td style="padding:0 28px 22px">' +
      '<p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;color:#b8860b;text-transform:uppercase">Entrega</p>' +
      '<p style="margin:0;color:#3d3630;font-size:14px;line-height:1.6">' + esc(direccion) +
        (c.notas ? '<br><span style="color:#8a8177">Notas: ' + esc(c.notas) + '</span>' : '') + '</p>' +
      '<p style="margin:12px 0 0;color:#6e645b;font-size:13px;line-height:1.6">Despachamos desde Cali con transportadora. ' +
        'Te avisaremos cuando tu paquete salga en camino.</p>' +
    '</td></tr>' +
    '<tr><td style="padding:0 28px 26px">' +
      '<a href="https://wa.me/573176685235?text=' +
        encodeURIComponent('Hola CHOCATA, les escribo por mi pedido ' + pedido.referencia) +
        '" style="display:inline-block;background:#F2B01E;color:#241d15;text-decoration:none;' +
        'padding:11px 20px;border-radius:9px;font-size:14px;font-weight:bold">Escribir por WhatsApp</a>' +
      '<p style="margin:16px 0 0;color:#a89e92;font-size:11px;line-height:1.6">Tienes derecho de retracto dentro de los 5 días ' +
        'hábiles siguientes a la entrega (producto sin abrir). Detalles en chocata.vercel.app/legal</p>' +
    '</td></tr>' +
  '</table>' +
'</div>';

  const texto =
    'CHOCATA — Tu pedido está confirmado\n\n' +
    'Referencia: ' + pedido.referencia + '\n\n' +
    (pedido.lineas || []).map((l) => '- ' + l.cant + ' x ' + l.nombre + ' ' + l.talla + ': ' + cop(l.total)).join('\n') +
    '\nEnvío: ' + cop(pedido.envio) +
    '\nTotal pagado: ' + cop(pedido.total) +
    '\n\nEntrega: ' + direccion +
    '\n\nDespachamos desde Cali con transportadora. WhatsApp: +57 317 668 5235';

  return {
    asunto: 'Tu pedido CHOCATA está confirmado — ' + pedido.referencia,
    html,
    texto
  };
}

/** Envía la confirmación. Nunca lanza: true/false y rastro en el log. */
async function enviarConfirmacion(pedido) {
  const llave = process.env.BREVO_API_KEY;
  const remitente = process.env.CORREO_REMITENTE;
  const destinatario = pedido && pedido.cliente && pedido.cliente.correo;
  if (!llave || !remitente) {
    console.log('[correo] Brevo sin configurar, no se envía');
    return false;
  }
  if (!destinatario) return false;

  try {
    const { asunto, html, texto } = armarCorreo(pedido);
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': llave },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        sender: { name: process.env.CORREO_NOMBRE || 'CHOCATA Colombia', email: remitente },
        to: [{ email: destinatario, name: pedido.cliente.nombre || '' }],
        subject: asunto,
        htmlContent: html,
        textContent: texto
      })
    });
    if (!r.ok) {
      console.error('[correo] Brevo respondió', r.status, (await r.text().catch(() => '')).slice(0, 200));
      return false;
    }
    console.log('[correo] confirmación enviada:', pedido.referencia);
    return true;
  } catch (e) {
    console.error('[correo] falló:', e && e.message);
    return false;
  }
}

module.exports = { armarCorreo, enviarConfirmacion };

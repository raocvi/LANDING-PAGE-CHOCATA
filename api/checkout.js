/**
 * POST /api/checkout
 *
 * Recibe la intención de compra, recalcula el total con los precios del
 * servidor, firma la transacción y devuelve la URL del checkout de Wompi.
 *
 * Variables de entorno necesarias (Vercel → Settings → Environment Variables):
 *   WOMPI_LLAVE_PUBLICA     pub_prod_… o pub_test_…  (puede verse en el navegador)
 *   WOMPI_SECRETO_INTEGRIDAD  secreto para firmar    (jamás sale del servidor)
 *   SITIO_URL               https://tu-dominio       (para el retorno del pago)
 */
const { calcular, referencia, firmaIntegridad, validarCliente } = require('./_pedido');

const MONEDA = 'COP';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ mensaje: 'Método no permitido.' });
  }

  const publica = process.env.WOMPI_LLAVE_PUBLICA;
  const secreto = process.env.WOMPI_SECRETO_INTEGRIDAD;
  if (!publica || !secreto) {
    /* Mensaje explícito: es un fallo de configuración, no del comprador. */
    return res.status(503).json({
      mensaje: 'Los pagos en línea todavía no están habilitados. Escríbenos por WhatsApp y cerramos tu pedido.',
      codigo: 'PASARELA_SIN_CONFIGURAR'
    });
  }

  let cuerpo = req.body;
  if (typeof cuerpo === 'string') {
    try { cuerpo = JSON.parse(cuerpo); } catch { return res.status(400).json({ mensaje: 'Petición malformada.' }); }
  }
  if (!cuerpo) return res.status(400).json({ mensaje: 'Petición vacía.' });

  const errorCliente = validarCliente(cuerpo.cliente);
  if (errorCliente) return res.status(400).json({ mensaje: errorCliente });

  const cuenta = calcular(cuerpo.items, String(cuerpo.cliente.departamento || '').trim());
  if (!cuenta.ok) return res.status(400).json({ mensaje: cuenta.error });

  const ref = referencia();
  const centavos = cuenta.total * 100; // Wompi cobra en centavos
  const firma = firmaIntegridad({ referencia: ref, centavos, moneda: MONEDA, secreto });

  const sitio = (process.env.SITIO_URL || '').replace(/\/$/, '');
  const parametros = new URLSearchParams({
    'public-key': publica,
    'currency': MONEDA,
    'amount-in-cents': String(centavos),
    'reference': ref,
    'signature:integrity': firma,
    'customer-data:email': cuerpo.cliente.correo.trim(),
    'customer-data:full-name': cuerpo.cliente.nombre.trim(),
    'customer-data:phone-number': cuerpo.cliente.celular.replace(/\D/g, ''),
    'customer-data:legal-id': cuerpo.cliente.documento.replace(/\D/g, ''),
    'customer-data:legal-id-type': 'CC',
    'shipping-address:address-line-1': cuerpo.cliente.direccion.trim(),
    'shipping-address:country': 'CO',
    'shipping-address:region': cuerpo.cliente.departamento.trim(),
    'shipping-address:city': cuerpo.cliente.ciudad.trim(),
    'shipping-address:phone-number': cuerpo.cliente.celular.replace(/\D/g, '')
  });
  if (sitio) parametros.set('redirect-url', `${sitio}/gracias.html?ref=${ref}`);

  /* El pedido queda pendiente hasta que el webhook confirme el pago.
     TODO: persistirlo cuando haya base de datos; hoy solo queda en el registro. */
  console.log('[pedido] creado', JSON.stringify({
    ref, total: cuenta.total, envio: cuenta.envio,
    lineas: cuenta.lineas.map((l) => `${l.cant}x ${l.slug} ${l.talla}`),
    ciudad: cuerpo.cliente.ciudad.trim(),
    departamento: cuerpo.cliente.departamento.trim()
  }));

  return res.status(200).json({
    referencia: ref,
    subtotal: cuenta.subtotal,
    envio: cuenta.envio,
    total: cuenta.total,
    url: `https://checkout.wompi.co/p/?${parametros.toString()}`
  });
};

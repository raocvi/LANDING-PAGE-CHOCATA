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
const almacen = require('./_almacen');

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

  const cuenta = calcular(cuerpo.items);
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

  /* Se escribe antes de mandar a pagar. Si el guardado falla, no se cobra:
     preferimos un pedido perdido a un pago sin pedido que respaldarlo. */
  const c = cuerpo.cliente;
  try {
    await almacen.crear({
      referencia: ref,
      lineas: cuenta.lineas,
      subtotal: cuenta.subtotal,
      envio: cuenta.envio,
      total: cuenta.total,
      unidades: cuenta.unidades,
      gramos: cuenta.gramos,
      cliente: {
        nombre: c.nombre.trim(),
        documento: c.documento.replace(/\D/g, ''),
        correo: c.correo.trim().toLowerCase(),
        celular: c.celular.replace(/\D/g, ''),
        departamento: c.departamento.trim(),
        ciudad: c.ciudad.trim(),
        direccion: c.direccion.trim(),
        notas: String(c.notas || '').trim().slice(0, 500)
      }
    });
  } catch (e) {
    console.error('[pedido] no se pudo guardar', ref, e && e.message);
    return res.status(500).json({
      mensaje: 'No pudimos registrar tu pedido. Vuelve a intentarlo en un momento.'
    });
  }

  console.log('[pedido] creado', ref, `total=${cuenta.total}`, `unidades=${cuenta.unidades}`);

  return res.status(200).json({
    referencia: ref,
    subtotal: cuenta.subtotal,
    envio: cuenta.envio,
    total: cuenta.total,
    url: `https://checkout.wompi.co/p/?${parametros.toString()}`
  });
};

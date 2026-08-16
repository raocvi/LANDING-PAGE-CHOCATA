/**
 * POST /api/probar-correo — envío de ensayo para verificar Brevo.
 *
 * Manda una confirmación de ejemplo al correo del negocio (CORREO_COPIA o el
 * remitente). Solo administración: exige el token. Así se comprueba la
 * configuración sin tener que pagar un pedido real.
 */
const { tokenValido } = require('./_pedido');
const { enviarConfirmacion } = require('./_correo');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ mensaje: 'Método no permitido.' });
  }
  if (!tokenValido(req.headers['x-admin-token'], process.env.ADMIN_TOKEN)) {
    return res.status(401).json({ mensaje: 'Sin autorización.' });
  }

  const remitente = process.env.CORREO_REMITENTE;
  const llave = process.env.BREVO_API_KEY;
  if (!llave || !remitente) {
    return res.status(200).json({
      ok: false,
      configurado: false,
      detalle: 'Faltan variables: ' +
        (!llave ? 'BREVO_API_KEY ' : '') + (!remitente ? 'CORREO_REMITENTE' : '') +
        '. Revisa los nombres exactos en Vercel y haz Redeploy.'
    });
  }

  const destino = process.env.CORREO_COPIA || remitente;
  const demo = {
    referencia: 'CHOCATA-PRUEBA0-00000000',
    lineas: [{ cant: 1, nombre: 'Correo de prueba', talla: '(sin costo)', total: 0 }],
    envio: 0,
    total: 0,
    cliente: {
      nombre: 'Prueba del sistema', correo: destino,
      direccion: 'Este correo confirma que Brevo está configurado',
      ciudad: 'Cali', departamento: 'Valle del Cauca'
    }
  };

  const enviado = await enviarConfirmacion(demo);
  return res.status(200).json({
    ok: enviado,
    configurado: true,
    detalle: enviado
      ? 'Enviado a ' + destino + '. Revisa la bandeja (y spam).'
      : 'Brevo rechazó el envío: revisa el log de Vercel o que la llave sea la correcta.'
  });
};

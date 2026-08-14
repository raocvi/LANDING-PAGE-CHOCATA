/**
 * Núcleo de pedidos: precios, validación y firma.
 *
 * Regla que gobierna este archivo: el precio lo pone el servidor, siempre.
 * Del navegador solo se acepta *qué* se quiere comprar (slug, presentación y
 * cantidad). Cualquier monto que llegue en la petición se ignora.
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..', 'web', 'assets', 'data');
const catalogo = JSON.parse(fs.readFileSync(path.join(RAIZ, 'precios.json'), 'utf8'));
const envios = JSON.parse(fs.readFileSync(path.join(RAIZ, 'envios.json'), 'utf8'));

const MAX_UNIDADES_LINEA = 99;
const MAX_LINEAS = 30;

/** Precio vigente, o null si esa presentación no está a la venta. */
function precioDe(slug, talla) {
  const p = catalogo[slug];
  if (!p) return null;
  const fila = p.presentaciones.find((x) => x.talla === talla);
  return fila && typeof fila.cop === 'number' ? fila.cop : null;
}

/**
 * Envío gratis desde el umbral (inclusive: exactamente $100.000 ya viaja
 * gratis). Por debajo se cobra por kilo o fracción, sin importar cuántos
 * artículos sean. Nunca menos de un kilo: un solo sobre pequeño tampoco viaja
 * gratis, y un peso mal declarado no puede dejar el envío en cero.
 *
 * Y encima va un tope: el envío nunca cobra más de lo que falta para el envío
 * gratis. Sin ese tope el total no es monótono —once bolsas costaban $144.000
 * y doce costaban $108.000—, y un comprador que descubre que agregar producto
 * le abarata el pedido deja de confiar en el precio.
 *
 * Devuelve { envio, kilos, porPeso, gratis, topado }.
 */
function desgloseEnvio(subtotal, gramos) {
  const umbral = typeof envios.gratisDesde === 'number' ? envios.gratisDesde : null;
  if (umbral !== null && subtotal >= umbral) {
    return { envio: 0, kilos: 0, porPeso: 0, gratis: true, topado: false };
  }
  if (typeof envios.tarifaPorKilo !== 'number') {
    return { envio: null, kilos: 0, porPeso: null, gratis: false, topado: false };
  }
  const minimo = typeof envios.kiloMinimo === 'number' ? envios.kiloMinimo : 1;
  const kilos = Math.max(minimo, Math.ceil((gramos || 0) / 1000));
  const porPeso = kilos * envios.tarifaPorKilo;

  const topeActivo = envios.topeHastaGratis === true && umbral !== null;
  const envio = topeActivo ? Math.min(porPeso, umbral - subtotal) : porPeso;
  return { envio, kilos, porPeso, gratis: false, topado: envio < porPeso };
}

/** Solo el monto del envío. */
function envioDe(subtotal, gramos) {
  return desgloseEnvio(subtotal, gramos).envio;
}

/** Gramos de una presentación: "1.500 g" → 1500. Null si no los declara. */
function gramosDe(talla) {
  const m = String(talla).match(/^([\d.]+)\s*g$/i);
  if (!m) return null;
  const n = Number(m[1].replace(/\./g, ''));
  return Number.isFinite(n) ? n : null;
}

/**
 * Recalcula el pedido desde cero. Devuelve { ok, error, lineas, subtotal,
 * envio, total }. `envio` en null significa "por confirmar": no se cobra.
 */
function calcular(items) {
  if (!Array.isArray(items) || !items.length) return { ok: false, error: 'El pedido llegó vacío.' };
  if (items.length > MAX_LINEAS) return { ok: false, error: 'El pedido tiene demasiadas líneas.' };

  const lineas = [];
  for (const it of items) {
    const cant = Number(it && it.cant);
    if (!Number.isInteger(cant) || cant < 1 || cant > MAX_UNIDADES_LINEA) {
      return { ok: false, error: 'Hay una cantidad inválida en el pedido.' };
    }
    const unitario = precioDe(it.slug, it.talla);
    if (unitario === null) {
      return { ok: false, error: `«${it.slug} ${it.talla}» ya no está disponible.` };
    }
    lineas.push({
      slug: it.slug,
      nombre: catalogo[it.slug].nombre,
      talla: it.talla,
      cant,
      unitario,
      total: unitario * cant,
      gramos: gramosDe(it.talla)
    });
  }

  const subtotal = lineas.reduce((n, l) => n + l.total, 0);
  if (subtotal <= 0) return { ok: false, error: 'El total del pedido no es válido.' };

  /* El peso ahora decide el precio del envío, así que una presentación sin
     gramos declarados es un riesgo: se marca para poder detectarlo. */
  const gramos = lineas.reduce((n, l) => n + (l.gramos || 0) * l.cant, 0);
  const sinPeso = lineas.filter((l) => l.gramos === null).map((l) => `${l.slug} ${l.talla}`);
  const { envio, kilos, topado } = desgloseEnvio(subtotal, gramos);

  return {
    ok: true, lineas, subtotal, envio, gramos, sinPeso,
    kilosCobrados: kilos,
    envioTopado: topado,
    unidades: lineas.reduce((n, l) => n + l.cant, 0),
    total: subtotal + (envio || 0)
  };
}

/** Referencia única e irrepetible del pedido. */
function referencia() {
  return 'CHOCATA-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Firma de integridad de Wompi: SHA-256 de referencia + monto en centavos +
 * moneda + secreto. La documentación de Wompi es explícita en que este hash
 * debe generarse en el servidor y nunca en el navegador, porque expondría el
 * secreto de integración.
 */
function firmaIntegridad({ referencia, centavos, moneda, secreto }) {
  return crypto.createHash('sha256')
    .update(`${referencia}${centavos}${moneda}${secreto}`)
    .digest('hex');
}

/** Comprueba el checksum de un evento entrante de Wompi. */
function firmaEventoValida(evento, secretoEventos) {
  const firma = evento && evento.signature;
  if (!firma || !Array.isArray(firma.properties) || !firma.checksum) return false;

  const concatenado = firma.properties
    .map((ruta) => ruta.split('.').reduce((o, k) => (o == null ? undefined : o[k]), evento.data))
    .join('');

  const esperado = crypto.createHash('sha256')
    .update(`${concatenado}${evento.timestamp}${secretoEventos}`)
    .digest('hex');

  const a = Buffer.from(esperado, 'utf8');
  const b = Buffer.from(String(firma.checksum).toLowerCase(), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Datos del comprador: se valida de nuevo aquí, no solo en el formulario. */
function validarCliente(c) {
  if (!c || typeof c !== 'object') return 'Faltan los datos de contacto.';
  const limpio = (v) => String(v || '').trim();

  if (limpio(c.nombre).length < 5 || !limpio(c.nombre).includes(' ')) return 'Falta el nombre completo.';
  if (!/^\d{6,11}$/.test(limpio(c.documento).replace(/\D/g, ''))) return 'El documento no es válido.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(limpio(c.correo))) return 'El correo no es válido.';
  if (!/^3\d{9}$/.test(limpio(c.celular).replace(/\D/g, ''))) return 'El celular no es válido.';
  if (!limpio(c.departamento)) return 'Falta el departamento.';
  if (limpio(c.ciudad).length < 3) return 'Falta la ciudad.';
  if (limpio(c.direccion).length < 8) return 'La dirección está incompleta.';
  return null;
}

module.exports = {
  catalogo, envios, calcular, referencia, envioDe, desgloseEnvio, gramosDe,
  firmaIntegridad, firmaEventoValida, validarCliente
};

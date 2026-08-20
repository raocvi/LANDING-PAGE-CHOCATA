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
const combos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'combos.json'), 'utf8'));

const MAX_UNIDADES_LINEA = 99;
const MAX_LINEAS = 30;

/** Un combo no tiene presentaciones: ocupa esta talla única en el carrito. */
const TALLA_COMBO = 'Combo';

/* ---------- Ediciones de la dueña (el Estudio) ----------
   Los precios de fábrica viven en precios.json; la dueña puede anularlos o
   esconder un producto desde /estudio. Las anulaciones se refrescan desde el
   almacén ANTES de calcular un pedido: la vitrina, el carrito y el cobro
   leen siempre la misma verdad. Si el almacén falla, se cobra a precio de
   fábrica (fallar hacia lo conocido, nunca hacia el error). */
let anulaciones = { productos: {} };
let anulacionesFrescasHasta = 0;
const ANULACIONES_TTL = Number.isInteger(Number(process.env.ANULACIONES_TTL_MS))
  ? Number(process.env.ANULACIONES_TTL_MS)
  : 15000;

async function refrescarAnulaciones() {
  if (Date.now() < anulacionesFrescasHasta) return;
  try {
    const { leerContenido } = require('./_contenido');
    const c = await leerContenido();
    anulaciones.productos = c.productos || {};
    anulacionesFrescasHasta = Date.now() + ANULACIONES_TTL;
  } catch (e) {
    console.error('[pedido] sin anulaciones, se usa fábrica:', e && e.message);
  }
}

/** Precio suelto de una presentación, o null si no está a la venta. */
function precioSuelto(slug, talla) {
  const p = catalogo[slug];
  if (!p) return null;
  const a = anulaciones.productos[slug];
  if (a && a.oculto) return null;
  if (a && a.precios && Number.isInteger(a.precios[talla])) return a.precios[talla];
  const fila = p.presentaciones.find((x) => x.talla === talla);
  return fila && typeof fila.cop === 'number' ? fila.cop : null;
}

/**
 * Un combo declara solo su precio y qué trae. Lo que vale suelto, cuánto pesa
 * y cuánto se ahorra se calculan aquí sumando los componentes, así que no
 * pueden quedar desfasados de precios.json. Si un componente sale del
 * catálogo, el combo devuelve null y deja de venderse por sí solo.
 */
function detalleCombo(slug) {
  const c = combos[slug];
  if (!c || !Array.isArray(c.componentes) || !c.componentes.length) return null;

  let sueltos = 0;
  let gramos = 0;
  let sinPeso = false;
  for (const comp of c.componentes) {
    const precio = precioSuelto(comp.slug, comp.talla);
    if (precio === null) return null;
    sueltos += precio * comp.cant;
    const g = gramosDe(comp.talla);
    if (g === null) sinPeso = true;
    else gramos += g * comp.cant;
  }

  return {
    slug,
    nombre: c.nombre,
    kicker: c.kicker,
    descripcion: c.descripcion,
    publico: c.publico,
    componentes: c.componentes,
    cop: c.cop,
    sueltos,
    ahorro: sueltos - c.cop,
    /* Un combo con un componente sin gramos no puede cobrar bien el envío. */
    gramos: sinPeso ? null : gramos
  };
}

/** Todos los combos vendibles, con su ahorro ya resuelto. */
function combosVigentes() {
  return Object.keys(combos)
    .filter((k) => !k.startsWith('_'))
    .map(detalleCombo)
    .filter((c) => c && typeof c.cop === 'number');
}

/** Precio vigente de cualquier cosa comprable: presentación suelta o combo. */
function precioDe(slug, talla) {
  if (talla === TALLA_COMBO) {
    const c = detalleCombo(slug);
    return c ? c.cop : null;
  }
  return precioSuelto(slug, talla);
}

/** Nombre para mostrar, venga de donde venga. */
function nombreDe(slug) {
  return (catalogo[slug] && catalogo[slug].nombre) || (combos[slug] && combos[slug].nombre) || slug;
}

/** Peso de una línea del pedido: el de la presentación o el del combo entero. */
function gramosLinea(slug, talla) {
  if (talla === TALLA_COMBO) {
    const c = detalleCombo(slug);
    return c ? c.gramos : null;
  }
  return gramosDe(talla);
}

/**
 * Envío gratis desde el umbral (inclusive: exactamente $100.000 ya viaja
 * gratis), igual que el líder del sector. El envío gratis cubre hasta
 * gratisHastaKilos: por encima, cada kilo extra se cobra a tarifa, porque un
 * pedido de bultos de 3,5 kg puede pasar el umbral con 7 kilos a bordo y ese
 * transporte no es gratis para nadie.
 *
 * Por debajo del umbral se cobra por kilo o fracción y el cliente paga el
 * costo completo del despacho: sin tope ni subsidio. Nunca menos de un kilo,
 * para que un sobre pequeño o un peso mal declarado no viajen gratis.
 *
 * Devuelve { envio, kilos, porPeso, gratis, extras }.
 */
function desgloseEnvio(subtotal, gramos) {
  const umbral = typeof envios.gratisDesde === 'number' ? envios.gratisDesde : null;
  if (typeof envios.tarifaPorKilo !== 'number') {
    return { envio: null, kilos: 0, porPeso: null, gratis: false, extras: 0 };
  }
  const minimo = typeof envios.kiloMinimo === 'number' ? envios.kiloMinimo : 1;
  const kilos = Math.max(minimo, Math.ceil((gramos || 0) / 1000));
  const porPeso = kilos * envios.tarifaPorKilo;

  if (umbral !== null && subtotal >= umbral) {
    const techo = typeof envios.gratisHastaKilos === 'number' ? envios.gratisHastaKilos : Infinity;
    const extras = Math.max(0, kilos - techo);
    return { envio: extras * envios.tarifaPorKilo, kilos: extras, porPeso, gratis: true, extras };
  }
  return { envio: porPeso, kilos, porPeso, gratis: false, extras: 0 };
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
      /* El slug y la talla vienen del cliente: antes de devolverlos en un
         mensaje se reducen a caracteres inofensivos y largo corto, para que
         este texto jamás sirva de vehículo de inyección aguas abajo. */
      const eco = (v) => String(v).replace(/[^\w áéíóúñ.-]/gi, '').slice(0, 40);
      return { ok: false, error: `«${eco(it.slug)} ${eco(it.talla)}» ya no está disponible.` };
    }
    lineas.push({
      slug: it.slug,
      nombre: nombreDe(it.slug),
      talla: it.talla,
      cant,
      unitario,
      total: unitario * cant,
      gramos: gramosLinea(it.slug, it.talla),
      esCombo: it.talla === TALLA_COMBO
    });
  }

  const subtotal = lineas.reduce((n, l) => n + l.total, 0);
  if (subtotal <= 0) return { ok: false, error: 'El total del pedido no es válido.' };

  /* Pedido mínimo: despachar una bolsa de $9.000 cuesta más que la bolsa.
     Se comprueba aquí y no solo en el navegador, que es donde importa. */
  const minimo = typeof envios.pedidoMinimo === 'number' ? envios.pedidoMinimo : 0;
  if (subtotal < minimo) {
    return {
      ok: false,
      minimo,
      subtotal,
      falta: minimo - subtotal,
      error: `El pedido mínimo es $${minimo.toLocaleString('es-CO')}. ` +
             `Te faltan $${(minimo - subtotal).toLocaleString('es-CO')}.`
    };
  }

  /* El peso ahora decide el precio del envío, así que una presentación sin
     gramos declarados es un riesgo: se marca para poder detectarlo. */
  /* Una presentación sin gramos declarados pesa gramosPorDefecto por unidad
     para efectos del envío: conservador a propósito, porque cobrar de menos
     lo paga la empresa. Queda señalada en sinPeso hasta tener el peso real. */
  const porDefecto = typeof envios.gramosPorDefecto === 'number' ? envios.gramosPorDefecto : 1000;
  const gramos = lineas.reduce((n, l) => n + (l.gramos === null ? porDefecto : l.gramos) * l.cant, 0);
  const sinPeso = lineas.filter((l) => l.gramos === null).map((l) => `${l.slug} ${l.talla}`);
  const { envio, kilos, gratis, extras } = desgloseEnvio(subtotal, gramos);

  return {
    ok: true, lineas, subtotal, envio, gramos, sinPeso,
    kilosCobrados: kilos,
    envioGratis: gratis,
    kilosExtras: extras,
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

/* Tipos de documento que acepta Wompi en legal-id-type. CC va primero porque
   es el caso común; CE cubre extranjeros y NIT compras de empresa. */
const TIPOS_DOCUMENTO = ['CC', 'CE', 'NIT'];

/** Tipo de documento saneado. Cualquier cosa rara cae a CC. */
function tipoDocumentoDe(c) {
  const t = String((c && c.tipoDocumento) || '').trim().toUpperCase();
  return TIPOS_DOCUMENTO.includes(t) ? t : 'CC';
}

/* Comparación en tiempo constante para el token de administración: un ===
   filtra por cronómetro cuántos caracteres coinciden. */
function tokenValido(recibido, esperado) {
  if (!esperado || typeof recibido !== 'string') return false;
  const a = Buffer.from(recibido, 'utf8');
  const b = Buffer.from(esperado, 'utf8');
  if (a.length !== b.length) return crypto.timingSafeEqual(b, b) && false;
  return crypto.timingSafeEqual(a, b);
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
  catalogo, envios, combos, TALLA_COMBO, TIPOS_DOCUMENTO,
  calcular, refrescarAnulaciones, referencia, envioDe, desgloseEnvio, gramosDe,
  precioDe, detalleCombo, combosVigentes,
  firmaIntegridad, firmaEventoValida, validarCliente, tipoDocumentoDe, tokenValido
};

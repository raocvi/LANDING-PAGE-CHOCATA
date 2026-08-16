/**
 * Guardado de pedidos.
 *
 * Un pedido pagado que no queda escrito en ningún lado es plata perdida: el
 * cliente pagó y nadie sabe qué despachar. Por eso el guardado nunca puede
 * hacer fallar la respuesta al webhook —si fallara, Wompi reintentaría y el
 * pedido se duplicaría—, pero sí deja rastro ruidoso cuando algo sale mal.
 *
 * Dos implementaciones, elegidas por entorno:
 *   · Vercel Blob   si existe BLOB_READ_WRITE_TOKEN (producción)
 *   · Archivo local en cualquier otro caso (desarrollo y pruebas)
 */
const fs = require('node:fs');
const path = require('node:path');

const CARPETA_LOCAL = process.env.PEDIDOS_DIR || path.join(__dirname, '..', '.pedidos');

function usaBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/* ---------- Implementación local ---------- */

function rutaLocal(referencia) {
  return path.join(CARPETA_LOCAL, `${referencia}.json`);
}

function guardarLocal(pedido) {
  fs.mkdirSync(CARPETA_LOCAL, { recursive: true });
  fs.writeFileSync(rutaLocal(pedido.referencia), JSON.stringify(pedido, null, 2), 'utf8');
}

function leerLocal(referencia) {
  try {
    return JSON.parse(fs.readFileSync(rutaLocal(referencia), 'utf8'));
  } catch {
    return null;
  }
}

/* ---------- Implementación en Vercel Blob ---------- */

async function guardarBlob(pedido) {
  const { put } = require('@vercel/blob');
  /* access privado, siempre: cada pedido lleva nombre, documento, celular y
     dirección. Un blob público es una URL que cualquiera con el enlace puede
     leer, y eso es exactamente lo que la Ley 1581 prohíbe hacer con estos
     datos. Solo el servidor, con el token, puede descargarlos. */
  await put(`pedidos/${pedido.referencia}.json`, JSON.stringify(pedido, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

async function leerBlob(referencia) {
  const { get } = require('@vercel/blob');
  try {
    /* get() es la vía oficial para leer un blob privado desde el servidor:
       autentica solo con el token del entorno y entrega el contenido como
       stream. useCache en false porque el webhook lee el pedido segundos
       después de escribirlo y una copia cacheada podría llegar vieja. */
    const r = await get(`pedidos/${referencia}.json`, { access: 'private', useCache: false });
    if (!r || !r.stream) return null;
    return JSON.parse(await new Response(r.stream).text());
  } catch (e) {
    console.error('[almacen] fallo leyendo blob', referencia, e && e.message);
    return null;
  }
}

/* ---------- Superficie pública ---------- */

/** Deja el pedido en estado pendiente, antes de mandar al comprador a pagar. */
async function crear(pedido) {
  const registro = {
    ...pedido,
    estado: 'PENDIENTE',
    creado: new Date().toISOString(),
    actualizado: new Date().toISOString()
  };
  if (usaBlob()) await guardarBlob(registro);
  else guardarLocal(registro);
  return registro;
}

/**
 * Aplica el resultado que llega del webhook. Devuelve { ok, cambio, pedido }.
 * `cambio` es false si el pedido ya estaba en ese estado: Wompi reintenta los
 * eventos, y confirmar dos veces no puede despachar dos veces.
 */
async function marcarEstado(referencia, estado, transaccion) {
  const previo = usaBlob() ? await leerBlob(referencia) : leerLocal(referencia);

  if (!previo) {
    /* Llegó un pago de un pedido que no tenemos escrito. No se descarta: se
       guarda igual para poder reconstruirlo a mano. */
    const huerfano = {
      referencia, estado, transaccion, huerfano: true,
      creado: new Date().toISOString(), actualizado: new Date().toISOString()
    };
    if (usaBlob()) await guardarBlob(huerfano);
    else guardarLocal(huerfano);
    return { ok: true, cambio: true, pedido: huerfano, huerfano: true };
  }

  if (previo.estado === estado) return { ok: true, cambio: false, pedido: previo };

  const actualizado = { ...previo, estado, transaccion, actualizado: new Date().toISOString() };
  if (usaBlob()) await guardarBlob(actualizado);
  else guardarLocal(actualizado);
  return { ok: true, cambio: true, pedido: actualizado };
}

/** Referencias de todos los pedidos guardados, sin leerlos aún. */
async function listarReferencias() {
  if (usaBlob()) {
    const { list } = require('@vercel/blob');
    const r = await list({ prefix: 'pedidos/', limit: 1000 });
    return (r.blobs || []).map((b) => b.pathname.replace('pedidos/', '').replace(/.json$/, ''));
  }
  try {
    return fs.readdirSync(CARPETA_LOCAL).filter((f) => f.endsWith('.json')).map((f) => f.replace(/.json$/, ''));
  } catch { return []; }
}

/**
 * Anota el despacho de un pedido: número de guía y fecha. No toca el estado
 * del pago —ese es territorio del webhook—: el despacho es un campo aparte,
 * así un reintento tardío de Wompi jamás borra que el paquete ya salió.
 */
async function anotarDespacho(referencia, guia) {
  const previo = usaBlob() ? await leerBlob(referencia) : leerLocal(referencia);
  if (!previo) return { ok: false, motivo: 'NO_EXISTE' };
  if (previo.estado !== 'APPROVED') return { ok: false, motivo: 'NO_PAGADO', pedido: previo };
  const actualizado = {
    ...previo,
    despacho: { guia: String(guia || '').trim().slice(0, 60), fecha: new Date().toISOString() },
    actualizado: new Date().toISOString()
  };
  if (usaBlob()) await guardarBlob(actualizado);
  else guardarLocal(actualizado);
  return { ok: true, pedido: actualizado };
}

async function leer(referencia) {
  return usaBlob() ? leerBlob(referencia) : leerLocal(referencia);
}

module.exports = { crear, marcarEstado, leer, listarReferencias, anotarDespacho, usaBlob, CARPETA_LOCAL };

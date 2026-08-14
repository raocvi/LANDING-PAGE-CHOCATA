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
  await put(`pedidos/${pedido.referencia}.json`, JSON.stringify(pedido, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

async function leerBlob(referencia) {
  const { head } = require('@vercel/blob');
  try {
    const meta = await head(`pedidos/${referencia}.json`);
    const respuesta = await fetch(meta.url);
    return respuesta.ok ? await respuesta.json() : null;
  } catch {
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

async function leer(referencia) {
  return usaBlob() ? leerBlob(referencia) : leerLocal(referencia);
}

module.exports = { crear, marcarEstado, leer, usaBlob, CARPETA_LOCAL };

/**
 * Servidor de desarrollo: sirve web/ y ejecuta las funciones de api/.
 *
 *   node tools/servidor-local.mjs
 *
 * Usa llaves de mentira para poder recorrer el flujo completo sin cuenta de
 * Wompi. Con llaves reales de sandbox, basta exportarlas antes de arrancar.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';

const require = createRequire(import.meta.url);
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUERTO = Number(process.env.PORT || 5174);

/* Llaves de desarrollo. No sirven contra Wompi: sirven para ejercitar el flujo. */
process.env.WOMPI_LLAVE_PUBLICA ||= 'pub_test_DESARROLLO';
process.env.WOMPI_SECRETO_INTEGRIDAD ||= 'integridad_desarrollo';
process.env.WOMPI_SECRETO_EVENTOS ||= 'eventos_desarrollo';
process.env.SITIO_URL ||= `http://localhost:${PUERTO}`;

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'
};

/** Adapta la petición de Node a la firma (req, res) que usan las funciones. */
function adaptar(res) {
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(o)); return res; };
  return res;
}

function leerCuerpo(req) {
  return new Promise((resolver) => {
    let datos = '';
    req.on('data', (t) => { datos += t; });
    req.on('end', () => { try { resolver(JSON.parse(datos || '{}')); } catch { resolver(datos); } });
  });
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO}`);
  adaptar(res);

  if (url.pathname.startsWith('/api/')) {
    const nombre = url.pathname.replace('/api/', '').replace(/[^a-z0-9-]/gi, '');
    try {
      /* Sin caché: así los cambios se recogen sin reiniciar. */
      const ruta = join(raiz, 'api', `${nombre}.js`);
      delete require.cache[require.resolve(ruta)];
      const manejador = require(ruta);
      req.body = await leerCuerpo(req);
      await manejador(req, res);
    } catch (e) {
      console.error('[api]', nombre, e && e.message);
      res.status(500).json({ mensaje: 'Error interno.', detalle: e && e.message });
    }
    return;
  }

  /* Imágenes subidas desde el Estudio: en producción viven en el Blob
     público; aquí se sirven de .contenido/imagenes/ para poder verlas. */
  if (url.pathname.startsWith('/subidas/')) {
    const nombre = url.pathname.slice('/subidas/'.length).replace(/[^a-z0-9._-]/gi, '');
    try {
      const contenido = await readFile(join(raiz, '.contenido', 'imagenes', nombre));
      res.setHeader('Content-Type', 'image/webp');
      res.setHeader('Cache-Control', 'no-store');
      res.end(contenido);
    } catch {
      res.status(404).json({ mensaje: 'No encontrada.' });
    }
    return;
  }

  /* Estáticos, con normalización para no salir de web/. */
  const relativa = url.pathname === '/' ? '/index.html' : url.pathname;
  const destino = join(raiz, 'web', normalize(relativa).replace(/^(\.\.[/\\])+/, ''));
  try {
    const contenido = await readFile(destino);
    res.setHeader('Content-Type', TIPOS[extname(destino)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(contenido);
  } catch {
    res.status(404).json({ mensaje: 'No encontrado.' });
  }
});

/* Solo loopback: este servidor corre con llaves de mentira y sin ninguna
   autenticación; no tiene por qué ser visible para el resto de la red local. */
servidor.listen(PUERTO, '127.0.0.1', () => {
  console.log(`Sitio y API en http://localhost:${PUERTO}`);
  console.log('Llaves de desarrollo activas: el checkout arma la URL de Wompi pero no cobra.');
});

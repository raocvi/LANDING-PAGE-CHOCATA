/**
 * Comprueba que los precios de la ficha y los del catálogo numérico coincidan.
 *
 * products.js guarda cadenas para mostrar ("$30.000") y precios.json guarda
 * números para cobrar (30000). Son dos archivos porque el servidor no puede
 * importar el que asigna a `window`, pero si se separan el sitio muestra un
 * precio y cobra otro. Esto lo detecta antes de que llegue a producción.
 *
 *   node tools/verificar-precios.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const js = readFileSync(join(raiz, 'web/assets/js/products.js'), 'utf8');
const catalogo = JSON.parse(readFileSync(join(raiz, 'web/assets/data/precios.json'), 'utf8'));

const aNumero = (texto) => (texto ? Number(texto.replace(/[^\d]/g, '')) : null);
const fallos = [];

// Cada ficha del archivo de productos
const fichas = new Map();
for (const m of js.matchAll(/"([a-z0-9-]+)":\s*\{(.*?)\n {2}\}/gs)) {
  const [, slug, cuerpo] = m;
  if (!/name:\s*"/.test(cuerpo)) continue;
  const bloque = cuerpo.match(/prices:\s*\[(.*?)\]/s);
  const filas = [];
  if (bloque) {
    for (const f of bloque[1].matchAll(/\{\s*s:\s*"([^"]+)",\s*p:\s*(?:"([^"]*)"|null)\s*\}/g)) {
      filas.push({ talla: f[1], cop: aNumero(f[2]) });
    }
  }
  fichas.set(slug, filas);
}

for (const [slug, filas] of fichas) {
  const enCatalogo = catalogo[slug];
  if (!enCatalogo) { fallos.push(`${slug}: está en las fichas pero no en precios.json`); continue; }

  const izq = filas.filter((f) => f.cop !== null);
  const der = enCatalogo.presentaciones.filter((p) => p.cop !== null);

  if (izq.length !== der.length) {
    fallos.push(`${slug}: ${izq.length} presentación(es) con precio en la ficha y ${der.length} en el catálogo`);
    continue;
  }
  for (const f of izq) {
    const par = der.find((p) => p.talla === f.talla);
    if (!par) fallos.push(`${slug}: la presentación «${f.talla}» no existe en precios.json`);
    else if (par.cop !== f.cop) fallos.push(`${slug} «${f.talla}»: la ficha dice ${f.cop} y el catálogo ${par.cop}`);
  }
}

for (const slug of Object.keys(catalogo)) {
  if (!fichas.has(slug)) fallos.push(`${slug}: está en precios.json pero no en las fichas`);
}

const vendibles = Object.values(catalogo)
  .flatMap((p) => p.presentaciones)
  .filter((p) => typeof p.cop === 'number').length;

if (fallos.length) {
  console.error('Precios desincronizados:\n' + fallos.map((f) => '  · ' + f).join('\n'));
  process.exit(1);
}
console.log(`Precios sincronizados: ${Object.keys(catalogo).length} productos, ${vendibles} presentaciones vendibles.`);

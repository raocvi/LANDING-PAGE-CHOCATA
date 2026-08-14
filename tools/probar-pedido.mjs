/**
 * Pruebas del núcleo de pedidos. Sin dependencias ni credenciales.
 *
 *   node tools/probar-pedido.mjs
 *
 * Cubre lo que puede costar dinero: que el precio lo ponga el servidor, que
 * no se cuelen cantidades absurdas y que las firmas se calculen y verifiquen
 * como manda Wompi.
 */
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const pedido = require(join(raiz, 'api/_pedido.js'));

let pasadas = 0;
const fallos = [];

function comprobar(nombre, condicion, detalle) {
  if (condicion) { pasadas++; return; }
  fallos.push(nombre + (detalle ? ` → ${detalle}` : ''));
}

/* ---------- El precio lo pone el servidor ---------- */
{
  const r = pedido.calcular([{ slug: 'chocata-tradicional', talla: '1.500 g', cant: 2 }]);
  comprobar('dos bolsas de 1.500 g suman 90.000', r.ok && r.subtotal === 90000, `subtotal=${r.subtotal}`);
}
{
  /* El atacante manda su propio precio: debe ignorarse por completo. */
  const r = pedido.calcular(
    [{ slug: 'creatina', talla: '250 g', cant: 1, unitario: 1, total: 1, cop: 1, precio: 1 }],
    'Antioquia'
  );
  comprobar('un precio enviado por el cliente se ignora', r.ok && r.subtotal === 50000, `subtotal=${r.subtotal}`);
}
{
  const r = pedido.calcular([{ slug: 'remolacha', talla: '200 g', cant: 1 }]);
  comprobar('remolacha ya tiene precio y se puede vender', r.ok && r.subtotal === 40000, `subtotal=${r.subtotal}`);
}

/* ---------- Entradas inválidas ---------- */
const invalidas = [
  ['pedido vacío', []],
  ['producto inexistente', [{ slug: 'no-existe', talla: '200 g', cant: 1 }]],
  ['presentación inexistente', [{ slug: 'creatina', talla: '999 g', cant: 1 }]],
  ['cantidad cero', [{ slug: 'creatina', talla: '250 g', cant: 0 }]],
  ['cantidad negativa', [{ slug: 'creatina', talla: '250 g', cant: -3 }]],
  ['cantidad decimal', [{ slug: 'creatina', talla: '250 g', cant: 1.5 }]],
  ['cantidad desmedida', [{ slug: 'creatina', talla: '250 g', cant: 1000 }]],
  ['cantidad como texto', [{ slug: 'creatina', talla: '250 g', cant: '2; DROP TABLE' }]]
];
for (const [nombre, items] of invalidas) {
  comprobar('se rechaza: ' + nombre, pedido.calcular(items).ok === false);
}

/* ---------- Regla de envío ----------
   Gratis por encima de $100.000 (estrictamente mayor), $15.000 por debajo. */
{
  /* $95.000 → paga envío. Total 110.000. */
  const r = pedido.calcular([{ slug: 'chocata-tradicional', talla: '3.500 g', cant: 1 }]);
  comprobar('bajo el umbral se cobra el envío', r.envio === 15000, `envio=${r.envio}`);
  comprobar('el envío se suma al total', r.total === 110000, `total=${r.total}`);
}
{
  /* Exactamente $100.000: 2 × 50.000. La regla dice «mayores a», así que paga. */
  const r = pedido.calcular([{ slug: 'creatina', talla: '250 g', cant: 2 }]);
  comprobar('en el umbral exacto todavía se cobra envío', r.subtotal === 100000 && r.envio === 15000, `subtotal=${r.subtotal} envio=${r.envio}`);
}
{
  /* $105.000 → gratis. */
  const r = pedido.calcular([{ slug: 'chocata-tradicional', talla: '3.500 g', cant: 1 },
                             { slug: 'chocata-tradicional', talla: '200 g', cant: 1 }]);
  comprobar('por encima del umbral el envío es gratis', r.subtotal === 104000 && r.envio === 0, `subtotal=${r.subtotal} envio=${r.envio}`);
  comprobar('con envío gratis el total es el subtotal', r.total === r.subtotal);
}
comprobar('envioDe respeta el umbral', pedido.envioDe(100000) === 15000 && pedido.envioDe(100001) === 0);

/* ---------- Peso declarado ---------- */
comprobar('lee gramos de "1.500 g"', pedido.gramosDe('1.500 g') === 1500);
comprobar('lee gramos de "200 g"', pedido.gramosDe('200 g') === 200);
comprobar('una presentación sin gramos devuelve null', pedido.gramosDe('Presentación única') === null);
{
  const r = pedido.calcular([{ slug: 'chocata-tradicional', talla: '200 g', cant: 4 }]);
  comprobar('suma el peso del pedido', r.gramos === 800, `gramos=${r.gramos}`);
  comprobar('cuenta las unidades', r.unidades === 4, `unidades=${r.unidades}`);
}

/* ---------- Datos del comprador ---------- */
const clienteOk = {
  nombre: 'Ana María Rodríguez', documento: '1094567890', correo: 'ana@correo.com',
  celular: '3001234567', departamento: 'Valle del Cauca', ciudad: 'Cali',
  direccion: 'Calle 5 # 38-25, apto 302'
};
comprobar('un comprador correcto pasa', pedido.validarCliente(clienteOk) === null);

for (const [campo, valor] of [
  ['nombre', 'Ana'], ['documento', '123'], ['correo', 'ana@'],
  ['celular', '6011234'], ['ciudad', 'C'], ['direccion', 'Calle 5'], ['departamento', '']
]) {
  comprobar(`se rechaza ${campo} inválido`, pedido.validarCliente({ ...clienteOk, [campo]: valor }) !== null);
}
comprobar('un celular fijo no pasa como móvil', pedido.validarCliente({ ...clienteOk, celular: '6023456789' }) !== null);

/* ---------- Firma de integridad ---------- */
{
  /* Ejemplo del propio manual de Wompi: referencia + centavos + moneda + secreto. */
  const esperado = createHash('sha256').update('ref-1249000COPsecreto').digest('hex');
  const obtenido = pedido.firmaIntegridad({
    referencia: 'ref-12', centavos: 49000, moneda: 'COP', secreto: 'secreto'
  });
  comprobar('la firma concatena en el orden de Wompi', obtenido === esperado);
  comprobar('la firma es un SHA-256 en hexadecimal', /^[a-f0-9]{64}$/.test(obtenido));
}
{
  const a = pedido.firmaIntegridad({ referencia: 'A', centavos: 100, moneda: 'COP', secreto: 's' });
  const b = pedido.firmaIntegridad({ referencia: 'A', centavos: 200, moneda: 'COP', secreto: 's' });
  comprobar('cambiar el monto cambia la firma', a !== b);
}

/* ---------- Referencias ---------- */
{
  const vistas = new Set();
  for (let i = 0; i < 5000; i++) vistas.add(pedido.referencia());
  comprobar('5.000 referencias sin repetirse', vistas.size === 5000, `únicas=${vistas.size}`);
}

/* ---------- Firma del webhook ---------- */
function eventoFirmado(secreto, { estado = 'APPROVED', manipular = false } = {}) {
  const data = { transaction: { id: 'tx-1', status: estado, amount_in_cents: 9000000, reference: 'CHOCATA-X' } };
  const propiedades = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];
  const timestamp = 1700000000;
  const concatenado = propiedades
    .map((r) => r.split('.').reduce((o, k) => o[k], data))
    .join('');
  const checksum = createHash('sha256').update(`${concatenado}${timestamp}${secreto}`).digest('hex');
  if (manipular) data.transaction.amount_in_cents = 1; // pagar menos y decir que se pagó todo
  return { data, timestamp, signature: { properties: propiedades, checksum } };
}

comprobar('un evento legítimo se acepta', pedido.firmaEventoValida(eventoFirmado('sec'), 'sec') === true);
comprobar('un evento con otro secreto se rechaza', pedido.firmaEventoValida(eventoFirmado('sec'), 'otro') === false);
comprobar('un evento con el monto alterado se rechaza', pedido.firmaEventoValida(eventoFirmado('sec', { manipular: true }), 'sec') === false);
comprobar('un evento sin firma se rechaza', pedido.firmaEventoValida({ data: {} }, 'sec') === false);
comprobar('un evento nulo se rechaza', pedido.firmaEventoValida(null, 'sec') === false);
comprobar('un checksum de otra longitud se rechaza',
  pedido.firmaEventoValida({ ...eventoFirmado('sec'), signature: { properties: ['transaction.id'], checksum: 'abc' } }, 'sec') === false);

/* ---------- Resultado ---------- */
if (fallos.length) {
  console.error(`\n${fallos.length} prueba(s) fallaron:\n` + fallos.map((f) => '  ✗ ' + f).join('\n'));
  process.exit(1);
}
console.log(`${pasadas} pruebas pasaron.`);

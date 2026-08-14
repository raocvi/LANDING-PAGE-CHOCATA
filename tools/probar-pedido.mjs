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
   Gratis desde $100.000 (inclusive). Por debajo, $15.000 por kilo o fracción,
   con un mínimo de un kilo. */
{
  /* 1 bolsa de 200 g = $9.000 → 1 kilo mínimo → $15.000. */
  const r = pedido.calcular([{ slug: 'chocata-tradicional', talla: '200 g', cant: 1 }]);
  comprobar('un pedido liviano paga el kilo mínimo', r.envio === 15000, `envio=${r.envio}`);
  comprobar('cobra un solo kilo', r.kilosCobrados === 1, `kilos=${r.kilosCobrados}`);
}
{
  /* 1 bolsa de 3.500 g = $95.000. Por peso serían 4 kilos = $60.000, pero solo
     faltan $5.000 para el envío gratis, así que el tope los deja en $5.000. */
  const r = pedido.calcular([{ slug: 'chocata-tradicional', talla: '3.500 g', cant: 1 }]);
  comprobar('3,5 kg se redondean a 4 kilos', r.kilosCobrados === 4, `kilos=${r.kilosCobrados}`);
  comprobar('el tope recorta el envío a lo que falta', r.envio === 5000, `envio=${r.envio}`);
  comprobar('y queda marcado como topado', r.envioTopado === true);
  comprobar('el total no supera el umbral', r.total === 100000, `total=${r.total}`);
}
{
  /* Exactamente $100.000: 2 × 50.000. Al ser inclusive, ya viaja gratis. */
  const r = pedido.calcular([{ slug: 'creatina', talla: '250 g', cant: 2 }]);
  comprobar('en el umbral exacto el envío ya es gratis', r.subtotal === 100000 && r.envio === 0, `subtotal=${r.subtotal} envio=${r.envio}`);
  comprobar('en el umbral exacto no se suma nada al total', r.total === 100000, `total=${r.total}`);
}
{
  /* El caso que motivó la regla: 10 bolsas de 200 g = $90.000 y 2 kilos.
     Por peso serían $30.000, pero solo faltan $10.000 para el envío gratis. */
  const r = pedido.calcular([{ slug: 'chocata-tradicional', talla: '200 g', cant: 10 }]);
  comprobar('diez bolsas suman 2 kilos', r.gramos === 2000, `gramos=${r.gramos}`);
  comprobar('el tope las deja en 10.000 de envío', r.envio === 10000, `envio=${r.envio}`);
  comprobar('y el total queda en el umbral', r.total === 100000, `total=${r.total}`);
}
{
  /* Lo que motivó el tope: sin él, once bolsas costaban $144.000 y doce
     $108.000. Agregar producto jamás puede abaratar el total. */
  let anterior = 0;
  let rompe = null;
  for (let n = 1; n <= 40; n++) {
    const r = pedido.calcular([{ slug: 'chocata-tradicional', talla: '200 g', cant: n }]);
    if (r.total < anterior) { rompe = `${n} bolsas cuestan ${r.total} y ${n - 1} costaban ${anterior}`; break; }
    anterior = r.total;
  }
  comprobar('el total nunca baja al agregar producto', rompe === null, rompe);
}
{
  /* Ningún pedido por debajo del umbral puede costar más que el umbral. */
  let excede = null;
  for (const [slug, talla] of [['chocata-tradicional', '3.500 g'], ['chocata-tradicional', '200 g'], ['creatina', '250 g']]) {
    for (let n = 1; n <= 20; n++) {
      const r = pedido.calcular([{ slug, talla, cant: n }]);
      if (r.subtotal < 100000 && r.total > 100000) { excede = `${n} × ${slug} ${talla} → ${r.total}`; break; }
    }
  }
  comprobar('bajo el umbral el total nunca lo supera', excede === null, excede);
}
{
  /* Exactamente 1.000 g no debe redondear a 2 kilos. */
  const r = pedido.calcular([{ slug: 'chocata-tradicional', talla: '200 g', cant: 5 }]);
  comprobar('un kilo exacto cobra un kilo', r.gramos === 1000 && r.kilosCobrados === 1, `gramos=${r.gramos} kilos=${r.kilosCobrados}`);
}
{
  /* Hidratec no declara gramos: no puede dejar el envío en cero. */
  const r = pedido.calcular([{ slug: 'hidratec', talla: 'Presentación única', cant: 1 }]);
  comprobar('una presentación sin peso cobra el kilo mínimo', r.envio === 15000, `envio=${r.envio}`);
  comprobar('y queda señalada para revisión', r.sinPeso.length === 1, JSON.stringify(r.sinPeso));
}
comprobar('a un peso del umbral el envío cuesta un peso', pedido.envioDe(99999, 500) === 1);
comprobar('el umbral exacto es gratis', pedido.envioDe(100000, 5000) === 0);
comprobar('lejos del umbral manda el peso: 2.001 g son 3 kilos', pedido.envioDe(10000, 2001) === 45000);
comprobar('el tope nunca deja el envío en negativo', pedido.envioDe(99999, 50000) >= 0);
{
  const d = pedido.desgloseEnvio(90000, 2000);
  comprobar('el desglose conserva el precio por peso', d.porPeso === 30000, `porPeso=${d.porPeso}`);
  comprobar('el desglose avisa que hubo tope', d.topado === true);
  const sinTope = pedido.desgloseEnvio(10000, 2000);
  comprobar('sin tope no se marca', sinTope.topado === false && sinTope.envio === 30000, `envio=${sinTope.envio}`);
}

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

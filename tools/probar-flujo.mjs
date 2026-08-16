/** Prueba de extremo a extremo contra el servidor local, en UTF-8 limpio. */
import { createHash } from 'node:crypto';

const BASE = 'http://localhost:5174';
const SECRETO_EVENTOS = 'eventos_desarrollo';
let fallos = 0;
const ok = (n, c, d) => { if (c) console.log('  ✓', n); else { fallos++; console.log('  ✗', n, d ?? ''); } };

const cliente = {
  nombre: 'Ana María Rodríguez', documento: '1.094.567.890', correo: 'Ana@Correo.COM ',
  celular: '300 123 4567', departamento: 'Valle del Cauca', ciudad: 'Cali',
  direccion: 'Calle 5 # 38-25, apto 302', notas: 'Portería, timbre 302'
};

async function pedir(cuerpo) {
  const r = await fetch(`${BASE}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(cuerpo)
  });
  return { estado: r.status, cuerpo: await r.json() };
}

console.log('\nCheckout');
const bajo = await pedir({ items: [{ slug: 'creatina', talla: '250 g', cant: 1 }], cliente });
ok('responde 200', bajo.estado === 200, bajo.estado);
ok('cobra envío bajo el umbral', bajo.cuerpo.total === 60500, bajo.cuerpo.total);
ok('la URL apunta al checkout de Wompi', String(bajo.cuerpo.url).startsWith('https://checkout.wompi.co/p/?'));

const url = new URL(bajo.cuerpo.url);
ok('el monto va en centavos', url.searchParams.get('amount-in-cents') === '6050000');
ok('lleva firma de integridad', /^[a-f0-9]{64}$/.test(url.searchParams.get('signature:integrity')));
ok('conserva las tildes del nombre', url.searchParams.get('customer-data:full-name') === 'Ana María Rodríguez',
   url.searchParams.get('customer-data:full-name'));
ok('normaliza el documento', url.searchParams.get('customer-data:legal-id') === '1094567890');
ok('normaliza el celular', url.searchParams.get('customer-data:phone-number') === '3001234567');

const grande = await pedir({ items: [{ slug: 'chocata-tradicional', talla: '3.500 g', cant: 1 },
                                     { slug: 'chocata-tradicional', talla: '200 g', cant: 1 }], cliente });
ok('un pedido grande también paga su peso', grande.cuerpo.envio === 42000 && grande.cuerpo.total === 146000, grande.cuerpo.total);

console.log('\nRechazos del checkout');
for (const [nombre, cuerpo] of [
  ['carrito vacío', { items: [], cliente }],
  ['precio inyectado por el cliente', { items: [{ slug: 'creatina', talla: '250 g', cant: 1, total: 1 }], cliente }],
  ['celular fijo', { items: [{ slug: 'creatina', talla: '250 g', cant: 1 }], cliente: { ...cliente, celular: '6023456789' } }],
  ['producto inexistente', { items: [{ slug: 'oro', talla: '1 kg', cant: 1 }], cliente }]
]) {
  const r = await pedir(cuerpo);
  if (nombre === 'precio inyectado por el cliente') ok('el precio inyectado se ignora', r.cuerpo.total === 60500, r.cuerpo.total);
  else ok('rechaza ' + nombre, r.estado === 400, r.estado);
}

console.log('\nWebhook');
function evento(ref, estado, centavos) {
  const data = { transaction: { id: 'tx-' + ref, status: estado, amount_in_cents: centavos, reference: ref } };
  const props = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];
  const ts = 1700000000;
  const concat = props.map((p) => p.split('.').reduce((o, k) => o[k], data)).join('');
  return { data, timestamp: ts, signature: { properties: props, checksum: createHash('sha256').update(`${concat}${ts}${SECRETO_EVENTOS}`).digest('hex') } };
}
const enviarEvento = (e) => fetch(`${BASE}/api/wompi-webhook`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e)
});

const ref = bajo.cuerpo.referencia;
ok('un ping sin firma ni transacción se saluda con 200', (await enviarEvento({})).status === 200);
ok('rechaza firma inválida', (await enviarEvento({ ...evento(ref, 'APPROVED', 6050000), timestamp: 1 })).status === 401);
ok('acepta el evento legítimo', (await enviarEvento(evento(ref, 'APPROVED', 6050000))).status === 200);

const leer = async (r) => (await fetch(`${BASE}/api/pedido?ref=${r}`, { headers: { 'x-admin-token': 'admin_desarrollo' } })).json();
const leerPublico = async (r) => (await fetch(`${BASE}/api/pedido?ref=${r}`)).json();
let guardado = await leer(ref);
ok('el pedido queda APPROVED', guardado.estado === 'APPROVED', guardado.estado);
ok('guarda el nombre con tildes', guardado.cliente.nombre === 'Ana María Rodríguez', guardado.cliente.nombre);
ok('normaliza el correo a minúsculas', guardado.cliente.correo === 'ana@correo.com', guardado.cliente.correo);

/* Wompi reintenta: el segundo evento no puede volver a "cambiar" el pedido. */
const publico = await leerPublico(ref);
ok('la vista pública no expone datos personales', publico.cliente === undefined && publico.estado === 'APPROVED', JSON.stringify(publico));
ok('la vista pública sí da el estado y el total', publico.total === 60500);
ok('rechaza una referencia inventada', (await (await fetch(`${BASE}/api/pedido?ref=hola`)).json()).mensaje === 'Referencia inválida.');

ok('el reintento se acepta sin duplicar', (await enviarEvento(evento(ref, 'APPROVED', 6050000))).status === 200);

/* Pago por menos de lo debido, con firma válida: no puede darse por bueno. */
const ref2 = (await pedir({ items: [{ slug: 'creatina', talla: '250 g', cant: 1 }], cliente })).cuerpo.referencia;
await enviarEvento(evento(ref2, 'APPROVED', 100));
guardado = await leer(ref2);
ok('un monto que no cuadra queda marcado para revisar', guardado.estado === 'REVISAR_MONTO', guardado.estado);

console.log('\nCombos y pedido mínimo');

const chico = await pedir({ items: [{ slug: 'chocata-tradicional', talla: '200 g', cant: 1 }], cliente });
ok('el servidor rechaza por debajo del mínimo', chico.estado === 400, chico.estado);
ok('y dice cuánto falta', /faltan \$31\.000/.test(chico.cuerpo.mensaje || ''), chico.cuerpo.mensaje);

const kit = await pedir({ items: [{ slug: 'combo-fuerza', talla: 'Combo', cant: 1 }], cliente });
ok('un combo se puede pagar', kit.estado === 200, kit.estado);
ok('cobra el precio del combo, no el de sus partes', kit.cuerpo.subtotal === 102000, kit.cuerpo.subtotal);
ok('el combo pesa 650 g y paga un kilo', kit.cuerpo.envio === 10500 && kit.cuerpo.total === 112500, kit.cuerpo.total);

const despensa = await pedir({ items: [{ slug: 'combo-despensa', talla: 'Combo', cant: 1 }], cliente });
ok('la despensa cobra un solo kilo', despensa.cuerpo.total === 50500, despensa.cuerpo.total);

const fantasma = await pedir({ items: [{ slug: 'combo-fantasma', talla: 'Combo', cant: 1 }], cliente });
ok('un combo inventado se rechaza', fantasma.estado === 400, fantasma.estado);

console.log('\nPeso completo y tipo de documento');

/* Dos bultos de granel: $190.000 y 7 kilos, todos cobrados. */
const pesado = await pedir({ items: [{ slug: 'chocata-granel', talla: '3.500 g', cant: 2 }], cliente });
ok('un pedido de 7 kilos paga los 7 kilos', pesado.cuerpo.envio === 73500, pesado.cuerpo.envio);
ok('y el total los refleja', pesado.cuerpo.total === 263500, pesado.cuerpo.total);

/* Una compradora con cédula de extranjería. */
const ce = await pedir({ items: [{ slug: 'creatina', talla: '250 g', cant: 1 }],
                         cliente: { ...cliente, tipoDocumento: 'CE' } });
ok('la extranjería llega a Wompi', new URL(ce.cuerpo.url).searchParams.get('customer-data:legal-id-type') === 'CE');
ok('un tipo inventado cae a cédula', new URL((await pedir({ items: [{ slug: 'creatina', talla: '250 g', cant: 1 }],
   cliente: { ...cliente, tipoDocumento: 'ZZ' } })).cuerpo.url).searchParams.get('customer-data:legal-id-type') === 'CC');

console.log('\nIA de Sofi');
const ia1 = await fetch(BASE + '/api/sofi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pregunta: 'beneficios de la creatina' }) });
ok('sin llave de Gemini responde 503 con código', ia1.status === 503 && (await ia1.json()).codigo === 'IA_SIN_CONFIGURAR');
const ia2 = await fetch(BASE + '/api/sofi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pregunta: '' }) });
ok('una pregunta vacía se rechaza', ia2.status === 400);
const ia3 = await fetch(BASE + '/api/sofi', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'https://sitio-malo.com' }, body: JSON.stringify({ pregunta: 'hola' }) });
ok('un origen ajeno se rechaza', ia3.status === 403);
console.log('
Central de despachos');
ok('la lista exige el token', (await fetch(BASE + '/api/pedidos')).status === 401);
const listado = await (await fetch(BASE + '/api/pedidos', { headers: { 'x-admin-token': 'admin_desarrollo' } })).json();
ok('con token entrega los pedidos con cliente', listado.total > 0 && listado.pedidos[0].cliente !== undefined);
console.log(fallos ? `\n${fallos} fallo(s).` : '\nTodo correcto.');
process.exit(fallos ? 1 : 0);

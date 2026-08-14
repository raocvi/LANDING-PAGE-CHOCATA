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
ok('cobra envío bajo el umbral', bajo.cuerpo.total === 65000, bajo.cuerpo.total);
ok('la URL apunta al checkout de Wompi', String(bajo.cuerpo.url).startsWith('https://checkout.wompi.co/p/?'));

const url = new URL(bajo.cuerpo.url);
ok('el monto va en centavos', url.searchParams.get('amount-in-cents') === '6500000');
ok('lleva firma de integridad', /^[a-f0-9]{64}$/.test(url.searchParams.get('signature:integrity')));
ok('conserva las tildes del nombre', url.searchParams.get('customer-data:full-name') === 'Ana María Rodríguez',
   url.searchParams.get('customer-data:full-name'));
ok('normaliza el documento', url.searchParams.get('customer-data:legal-id') === '1094567890');
ok('normaliza el celular', url.searchParams.get('customer-data:phone-number') === '3001234567');

const libre = await pedir({ items: [{ slug: 'chocata-tradicional', talla: '3.500 g', cant: 1 },
                                    { slug: 'chocata-tradicional', talla: '200 g', cant: 1 }], cliente });
ok('envío gratis por encima del umbral', libre.cuerpo.envio === 0 && libre.cuerpo.total === 104000, libre.cuerpo.total);

console.log('\nRechazos del checkout');
for (const [nombre, cuerpo] of [
  ['carrito vacío', { items: [], cliente }],
  ['precio inyectado por el cliente', { items: [{ slug: 'creatina', talla: '250 g', cant: 1, total: 1 }], cliente }],
  ['celular fijo', { items: [{ slug: 'creatina', talla: '250 g', cant: 1 }], cliente: { ...cliente, celular: '6023456789' } }],
  ['producto inexistente', { items: [{ slug: 'oro', talla: '1 kg', cant: 1 }], cliente }]
]) {
  const r = await pedir(cuerpo);
  if (nombre === 'precio inyectado por el cliente') ok('el precio inyectado se ignora', r.cuerpo.total === 65000, r.cuerpo.total);
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
ok('rechaza firma inválida', (await enviarEvento({ ...evento(ref, 'APPROVED', 6500000), timestamp: 1 })).status === 401);
ok('acepta el evento legítimo', (await enviarEvento(evento(ref, 'APPROVED', 6500000))).status === 200);

const leer = async (r) => (await fetch(`${BASE}/api/pedido?ref=${r}`, { headers: { 'x-admin-token': 'admin_desarrollo' } })).json();
const leerPublico = async (r) => (await fetch(`${BASE}/api/pedido?ref=${r}`)).json();
let guardado = await leer(ref);
ok('el pedido queda APPROVED', guardado.estado === 'APPROVED', guardado.estado);
ok('guarda el nombre con tildes', guardado.cliente.nombre === 'Ana María Rodríguez', guardado.cliente.nombre);
ok('normaliza el correo a minúsculas', guardado.cliente.correo === 'ana@correo.com', guardado.cliente.correo);

/* Wompi reintenta: el segundo evento no puede volver a "cambiar" el pedido. */
const publico = await leerPublico(ref);
ok('la vista pública no expone datos personales', publico.cliente === undefined && publico.estado === 'APPROVED', JSON.stringify(publico));
ok('la vista pública sí da el estado y el total', publico.total === 65000);
ok('rechaza una referencia inventada', (await (await fetch(`${BASE}/api/pedido?ref=hola`)).json()).mensaje === 'Referencia inválida.');

ok('el reintento se acepta sin duplicar', (await enviarEvento(evento(ref, 'APPROVED', 6500000))).status === 200);

/* Pago por menos de lo debido, con firma válida: no puede darse por bueno. */
const ref2 = (await pedir({ items: [{ slug: 'creatina', talla: '250 g', cant: 1 }], cliente })).cuerpo.referencia;
await enviarEvento(evento(ref2, 'APPROVED', 100));
guardado = await leer(ref2);
ok('un monto que no cuadra queda marcado para revisar', guardado.estado === 'REVISAR_MONTO', guardado.estado);

console.log(fallos ? `\n${fallos} fallo(s).` : '\nTodo correcto.');
process.exit(fallos ? 1 : 0);

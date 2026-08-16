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

/* ---------- Combos ----------
   Un combo declara su precio y sus componentes; lo demás se deriva. */
{
  const vigentes = pedido.combosVigentes();
  comprobar('hay combos a la venta', vigentes.length === 7, `n=${vigentes.length}`);

  for (const c of vigentes) {
    comprobar(`«${c.nombre}» ahorra plata`, c.ahorro > 0, `ahorro=${c.ahorro}`);
    comprobar(`«${c.nombre}» no regala el producto`, c.ahorro < c.sueltos * 0.4, `ahorro=${c.ahorro} de ${c.sueltos}`);
    comprobar(`«${c.nombre}» declara su peso`, typeof c.gramos === 'number' && c.gramos > 0, `gramos=${c.gramos}`);
    comprobar(`«${c.nombre}» supera el pedido mínimo`, c.cop >= pedido.envios.pedidoMinimo, `cop=${c.cop}`);
  }
}
{
  /* El precio del combo se cobra como combo, no como suma de componentes. */
  const r = pedido.calcular([{ slug: 'combo-fuerza', talla: 'Combo', cant: 1 }]);
  comprobar('el kit fuerza cobra 102.000, no 120.000', r.ok && r.subtotal === 102000, `subtotal=${r.subtotal}`);
  comprobar('y hereda el peso de sus componentes', r.gramos === 650, `gramos=${r.gramos}`);
  comprobar('el combo no deja presentaciones sin peso', r.sinPeso.length === 0, JSON.stringify(r.sinPeso));
}
{
  /* Cinco bolsas pesan un kilo exacto: ese es el punto del combo. */
  const r = pedido.calcular([{ slug: 'combo-despensa', talla: 'Combo', cant: 1 }]);
  comprobar('la despensa pesa un kilo exacto', r.gramos === 1000, `gramos=${r.gramos}`);
  comprobar('y cobra un solo kilo de envío', r.kilosCobrados === 1, `kilos=${r.kilosCobrados}`);
}
{
  /* Un combo siempre debe salir más barato que comprar suelto lo mismo. */
  for (const c of pedido.combosVigentes()) {
    const enCombo = pedido.calcular([{ slug: c.slug, talla: 'Combo', cant: 1 }]);
    const sueltos = pedido.calcular(c.componentes.map((x) => ({ slug: x.slug, talla: x.talla, cant: x.cant })));
    if (!sueltos.ok) continue; /* los componentes sueltos pueden no llegar al mínimo */
    comprobar(`«${c.nombre}» cuesta menos que sus partes`, enCombo.total <= sueltos.total,
      `combo=${enCombo.total} sueltos=${sueltos.total}`);
  }
}
comprobar('un combo inventado se rechaza', pedido.calcular([{ slug: 'combo-fantasma', talla: 'Combo', cant: 1 }]).ok === false);
comprobar('un producto normal con talla Combo se rechaza', pedido.calcular([{ slug: 'creatina', talla: 'Combo', cant: 1 }]).ok === false);

/* ---------- Pedido mínimo ---------- */
{
  const r = pedido.calcular([{ slug: 'chocata-tradicional', talla: '200 g', cant: 1 }]);
  comprobar('una bolsa de 9.000 no se puede despachar sola', r.ok === false);
  comprobar('y se dice cuánto falta', r.falta === 31000, `falta=${r.falta}`);
}
comprobar('justo en el mínimo sí se puede pagar',
  pedido.calcular([{ slug: 'remolacha', talla: '200 g', cant: 1 }]).ok === true);
comprobar('un peso por debajo del mínimo no',
  pedido.calcular([{ slug: 'latte-dorato', talla: '400 g', cant: 1 }]).ok === false);

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
  /* 5 bolsas de 200 g = $45.000 y 1.000 g exactos → 1 kilo → $10.500. */
  const r = pedido.calcular([{ slug: 'chocata-tradicional', talla: '200 g', cant: 5 }]);
  comprobar('un pedido liviano paga el kilo mínimo', r.envio === 10500, `envio=${r.envio}`);
  comprobar('cobra un solo kilo', r.kilosCobrados === 1, `kilos=${r.kilosCobrados}`);
}
{
  /* 1 bolsa de 3.500 g = $95.000: 4 kilos a tarifa completa. El cliente paga
     el costo real del despacho, como en el resto del mercado. */
  const r = pedido.calcular([{ slug: 'chocata-tradicional', talla: '3.500 g', cant: 1 }]);
  comprobar('3,5 kg se redondean a 4 kilos', r.kilosCobrados === 4, `kilos=${r.kilosCobrados}`);
  comprobar('y se cobran completos', r.envio === 42000, `envio=${r.envio}`);
  comprobar('el envío se suma al total', r.total === 137000, `total=${r.total}`);
}
{
  /* No hay envío gratis: un pedido grande también paga su peso. */
  const r = pedido.calcular([{ slug: 'creatina', talla: '250 g', cant: 2 }]);
  comprobar('un pedido de 100.000 también paga envío', r.subtotal === 100000 && r.envio === 10500, `envio=${r.envio}`);
  comprobar('y el total lo incluye', r.total === 110500, `total=${r.total}`);
  comprobar('nada queda marcado como gratis', r.envioGratis === false);
}
{
  /* 10 bolsas de 200 g = $90.000 y 2 kilos: tarifa completa, sin subsidio. */
  const r = pedido.calcular([{ slug: 'chocata-tradicional', talla: '200 g', cant: 10 }]);
  comprobar('diez bolsas suman 2 kilos', r.gramos === 2000, `gramos=${r.gramos}`);
  comprobar('y pagan los 2 kilos completos', r.envio === 21000, `envio=${r.envio}`);
  comprobar('el total los incluye', r.total === 111000, `total=${r.total}`);
}
{
  /* El pedido pesado paga todos sus kilos, sin importar cuánto compre. */
  const r = pedido.calcular([{ slug: 'chocata-granel', talla: '3.500 g', cant: 2 }]);
  comprobar('dos bultos pesan 7 kilos', r.gramos === 7000, `gramos=${r.gramos}`);
  comprobar('y pagan los 7 completos', r.envio === 73500, `envio=${r.envio}`);
  comprobar('sumados al total', r.total === 263500, `total=${r.total}`);
}
{
  /* Pedido mixto grande: también paga su peso completo. */
  const r = pedido.calcular([
    { slug: 'creatina', talla: '250 g', cant: 2 },
    { slug: 'chocata-tradicional', talla: '3.500 g', cant: 1 }
  ]);
  comprobar('195.000 en producto pagan sus 4 kilos', r.envio === 42000 && r.total === 237000, `envio=${r.envio} total=${r.total}`);
}
{
  /* Exactamente 1.000 g no debe redondear a 2 kilos. */
  const r = pedido.calcular([{ slug: 'chocata-tradicional', talla: '200 g', cant: 5 }]);
  comprobar('un kilo exacto cobra un kilo', r.gramos === 1000 && r.kilosCobrados === 1, `gramos=${r.gramos} kilos=${r.kilosCobrados}`);
}
{
  /* Hidratec no declara gramos: pesa gramosPorDefecto (1 kilo) por unidad,
     conservador para no cobrar envío de menos. Dos unidades = 2 kilos. */
  const r = pedido.calcular([{ slug: 'hidratec', talla: 'Presentación única', cant: 2 }]);
  comprobar('sin peso declarado se asume un kilo por unidad', r.gramos === 2000, `gramos=${r.gramos}`);
  comprobar('y el envío cobra los dos kilos', r.envio === 21000, `envio=${r.envio}`);
  comprobar('y queda señalada para revisión', r.sinPeso.length === 1, JSON.stringify(r.sinPeso));
}
comprobar('todo pedido paga al menos un kilo', pedido.envioDe(99999, 500) === 10500);
comprobar('100.000 en producto no cambian la regla', pedido.envioDe(100000, 5000) === 52500);
comprobar('2.001 g son 3 kilos', pedido.envioDe(10000, 2001) === 31500);
comprobar('un pedido enorme paga su peso igual', pedido.envioDe(1000000, 7000) === 73500);
{
  const d = pedido.desgloseEnvio(95000, 2000);
  comprobar('el desglose cobra el peso completo', d.envio === 21000 && d.porPeso === 21000, `envio=${d.envio}`);
  comprobar('y nunca marca gratis', d.gratis === false && d.extras === 0, JSON.stringify(d));
}

/* ---------- Seguridad ---------- */
{
  /* Un slug malicioso no puede volver intacto en el mensaje de error. */
  const r = pedido.calcular([{ slug: '<img src=x onerror=alert(1)>', talla: '200 g', cant: 1 }]);
  comprobar('el error no refleja HTML del atacante', r.ok === false && !r.error.includes('<'), r.error);
  const largo = pedido.calcular([{ slug: 'x'.repeat(5000), talla: '200 g', cant: 1 }]);
  comprobar('el eco se recorta a un largo sano', largo.error.length < 120, `len=${largo.error.length}`);
}

/* ---------- Avisos por WhatsApp ---------- */
{
  const avisos = require(join(raiz, 'api/_avisos.js'));
  const pedidoDemo = {
    referencia: 'CHOCATA-TEST-AB12CD34', total: 66500, envio: 10500,
    lineas: [{ cant: 1, nombre: 'Bienestar diario', talla: 'Combo' }],
    cliente: { nombre: 'Ana María Rodríguez', celular: '3001234567',
               direccion: 'Calle 5 # 38-25', ciudad: 'Cali', departamento: 'Valle del Cauca', notas: 'Portería' }
  };
  const m = avisos.mensajePedido(pedidoDemo, 'APPROVED');
  comprobar('el aviso de pago lleva la referencia', m.includes('CHOCATA-TEST-AB12CD34'));
  comprobar('lleva el total en pesos', m.includes('$66.500'));
  comprobar('lleva las líneas del pedido', m.includes('1 × Bienestar diario'));
  comprobar('lleva a quién y dónde entregar', m.includes('Ana María') && m.includes('Cali'));
  comprobar('lleva las notas de entrega', m.includes('Portería'));
  comprobar('el monto que no cuadra pide no despachar', /No despachar/.test(avisos.mensajePedido(pedidoDemo, 'REVISAR_MONTO')));
  comprobar('el pago huérfano avisa distinto', /PAGO SIN PEDIDO/.test(avisos.mensajePedido(pedidoDemo, 'HUERFANO')));
  comprobar('un estado sin aviso devuelve null', avisos.mensajePedido(pedidoDemo, 'DECLINED') === null);
  const sinConfig = await avisos.avisarWhatsApp('hola');
  comprobar('sin configurar no envía y no lanza', sinConfig === false);
}

/* ---------- Tipo de documento ---------- */
comprobar('sin tipo de documento se asume cédula', pedido.tipoDocumentoDe({}) === 'CC');
comprobar('la extranjería se respeta y se normaliza', pedido.tipoDocumentoDe({ tipoDocumento: ' ce ' }) === 'CE');
comprobar('el NIT se acepta', pedido.tipoDocumentoDe({ tipoDocumento: 'NIT' }) === 'NIT');
comprobar('un tipo inventado cae a cédula', pedido.tipoDocumentoDe({ tipoDocumento: 'XX; DROP' }) === 'CC');

/* ---------- Peso declarado ---------- */
comprobar('lee gramos de "1.500 g"', pedido.gramosDe('1.500 g') === 1500);
comprobar('lee gramos de "200 g"', pedido.gramosDe('200 g') === 200);
comprobar('una presentación sin gramos devuelve null', pedido.gramosDe('Presentación única') === null);
{
  const r = pedido.calcular([{ slug: 'chocata-tradicional', talla: '200 g', cant: 5 }]);
  comprobar('suma el peso del pedido', r.gramos === 1000, `gramos=${r.gramos}`);
  comprobar('cuenta las unidades', r.unidades === 5, `unidades=${r.unidades}`);
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

/**
 * Siembra pedidos de demostración en .pedidos/ para ver el tablero vivo en
 * desarrollo. Solo escribe archivos locales; jamás toca producción.
 *
 *   node tools/sembrar-demo.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const carpeta = path.join(raiz, '.pedidos');
fs.mkdirSync(carpeta, { recursive: true });

const productos = [
  { slug: 'creatina', nombre: 'Creatina Monohidratada', talla: '250 g', cop: 50000, g: 250 },
  { slug: 'proteina', nombre: '100 % Proteína Whey', talla: '400 g', cop: 70000, g: 400 },
  { slug: 'chocata-tradicional', nombre: 'CHOCATA Tradicional', talla: '500 g', cop: 22000, g: 500 },
  { slug: 'combo-bienestar', nombre: 'Bienestar diario', talla: 'Combo', cop: 56000, g: 700 },
  { slug: 'combo-fuerza', nombre: 'Kit Fuerza', talla: 'Combo', cop: 102000, g: 650 },
  { slug: 'latte-dorato', nombre: 'Latte Dorato', talla: '400 g', cop: 35000, g: 400 },
  { slug: 'magnesio', nombre: 'Citrato de Magnesio', talla: '250 g', cop: 20000, g: 250 }
];
const ciudades = ['Cali', 'Cali', 'Cali', 'Bogotá', 'Bogotá', 'Medellín', 'Barranquilla', 'Pereira', 'Pasto'];
const nombres = ['Ana María Rodríguez', 'Carlos Pérez', 'Luisa Gómez', 'Jorge Muñoz', 'Paola Rentería',
  'Andrés Castro', 'Diana Valencia', 'Camilo Torres', 'Marcela Quintero'];

let semilla = 42;
const azar = () => (semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648;
const elegir = (arr) => arr[Math.floor(azar() * arr.length)];

let n = 0;
for (let dia = 29; dia >= 0; dia--) {
  const cuantos = Math.floor(azar() * 3); // 0 a 2 pedidos por día
  for (let j = 0; j < cuantos; j++) {
    n++;
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dia);
    fecha.setHours(8 + Math.floor(azar() * 12), Math.floor(azar() * 60), 0, 0);

    const numLineas = 1 + Math.floor(azar() * 2);
    const lineas = [];
    for (let k = 0; k < numLineas; k++) {
      const p = elegir(productos);
      if (lineas.some((l) => l.slug === p.slug)) continue;
      const cant = 1 + Math.floor(azar() * 2);
      lineas.push({ slug: p.slug, nombre: p.nombre, talla: p.talla, cant, unitario: p.cop, total: p.cop * cant, gramos: p.g, esCombo: p.talla === 'Combo' });
    }
    const subtotal = lineas.reduce((s, l) => s + l.total, 0);
    if (subtotal < 40000) lineas.push({ slug: 'creatina', nombre: 'Creatina Monohidratada', talla: '250 g', cant: 1, unitario: 50000, total: 50000, gramos: 250, esCombo: false });
    const sub2 = lineas.reduce((s, l) => s + l.total, 0);
    const gramos = lineas.reduce((s, l) => s + l.gramos * l.cant, 0);
    const envio = Math.max(1, Math.ceil(gramos / 1000)) * 10500;

    const r = azar();
    const estado = r < 0.62 ? 'APPROVED' : r < 0.85 ? 'PENDIENTE' : r < 0.95 ? 'DECLINED' : 'REVISAR_MONTO';
    const despachado = estado === 'APPROVED' && azar() < 0.7 && dia > 1;

    const referencia = 'CHOCATA-DEMO' + String(n).padStart(4, '0') + '-' +
      Math.floor(azar() * 0xffffffff).toString(16).toUpperCase().padStart(8, '0');
    const ciudad = elegir(ciudades);

    const pedido = {
      referencia,
      lineas,
      subtotal: sub2,
      envio,
      total: sub2 + envio,
      unidades: lineas.reduce((s, l) => s + l.cant, 0),
      gramos,
      cliente: {
        nombre: elegir(nombres), tipoDocumento: 'CC',
        documento: String(1000000000 + Math.floor(azar() * 99999999)),
        correo: 'demo@chocata.co', celular: '3' + String(Math.floor(azar() * 999999999)).padStart(9, '0'),
        departamento: 'Valle del Cauca', ciudad,
        direccion: 'Calle ' + (1 + Math.floor(azar() * 90)) + ' # ' + (1 + Math.floor(azar() * 50)) + '-' + (1 + Math.floor(azar() * 90)),
        notas: ''
      },
      estado,
      creado: fecha.toISOString(),
      actualizado: fecha.toISOString()
    };
    if (despachado) {
      const f2 = new Date(fecha); f2.setDate(f2.getDate() + 1);
      pedido.despacho = { guia: 'TCC-' + (100000 + Math.floor(azar() * 899999)), fecha: f2.toISOString() };
    }
    fs.writeFileSync(path.join(carpeta, referencia + '.json'), JSON.stringify(pedido, null, 2));
  }
}
console.log('sembrados', n, 'pedidos de demostración en .pedidos/');

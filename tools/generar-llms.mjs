/**
 * Genera web/llms.txt: la ficha del negocio para los asistentes de IA.
 *
 *   node tools/generar-llms.mjs
 *
 * Se arma desde los datos reales del catálogo, así que los precios que lee
 * ChatGPT, Perplexity o Claude son los mismos que cobra la tienda. Hay que
 * volver a correrlo cuando cambien precios, envíos o el portafolio.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const datos = (n) => JSON.parse(readFileSync(join(raiz, 'web', 'assets', 'data', n), 'utf8'));

const precios = datos('precios.json');
const envios = datos('envios.json');
const combos = datos('combos.json');

const cop = (n) => '$' + Number(n).toLocaleString('es-CO');

/* Fichas del catálogo: descripción corta de cada referencia, en las palabras
   con las que la gente pregunta («¿para qué sirve la creatina?»). */
const RESUMEN = {
  'chocata-premium': 'Bebida de malta y cacao endulzada con estevia, con menos azúcar añadido. Para el desayuno o antes de entrenar.',
  'chocata-tradicional': 'El chocolate de mesa de toda la vida, para preparar en agua o leche. Rinde 25 g por taza.',
  'chocata-granel': 'Presentación de 3,5 kg para cafeterías, restaurantes y repostería: unas 175 porciones.',
  'proteina': 'Proteína whey para recuperación muscular y para completar el requerimiento proteico del día (20 a 40 g por toma).',
  'creatina': 'Creatina monohidratada, el suplemento con más evidencia científica para fuerza y masa magra (3 a 5 g diarios).',
  'pre-workout': 'Mezcla con beta-alanina y cafeína para tomar media hora antes de entrenar.',
  'hidratec': 'Bebida con carbohidratos y electrolitos para hidratarse durante el ejercicio largo.',
  'colageno': 'Colágeno hidrolizado sin sabor, 10 g diarios, asociado a hidratación y elasticidad de la piel.',
  'magnesio': 'Citrato de magnesio para función muscular y nerviosa, y para acompañar el descanso.',
  'vitamina-c': 'Vitamina C pura: defensas, absorción del hierro vegetal y menos cansancio.',
  'remolacha': 'Remolacha en polvo, fuente de nitratos: se toma 2 o 3 horas antes para rendir mejor en resistencia.',
  'latte-dorato': 'Bebida de cúrcuma con pimienta, jengibre y maca. Sin cafeína, ideal de noche.'
};

const lineasProductos = Object.entries(precios).map(([slug, p]) => {
  const vendibles = (p.presentaciones || []).filter((x) => typeof x.cop === 'number');
  if (!vendibles.length) return null;
  const tallas = vendibles.map((x) => `${x.talla} ${cop(x.cop)}`).join(' · ');
  return `- **${p.nombre}** — ${RESUMEN[slug] || ''} Presentaciones: ${tallas}.`;
}).filter(Boolean);

/* Los combos declaran su precio; lo que valen sueltos se suma aquí para poder
   decir el ahorro exacto, igual que lo calcula el servidor. */
const lineasCombos = Object.entries(combos)
  .filter(([k]) => !k.startsWith('_'))
  .map(([, c]) => {
    if (!c || typeof c.cop !== 'number' || !Array.isArray(c.componentes)) return null;
    let sueltos = 0;
    for (const comp of c.componentes) {
      const ficha = precios[comp.slug];
      const fila = ficha && (ficha.presentaciones || []).find((x) => x.talla === comp.talla);
      if (!fila || typeof fila.cop !== 'number') return null;
      sueltos += fila.cop * comp.cant;
    }
    const trae = c.componentes.map((x) => `${x.cant} × ${precios[x.slug].nombre} ${x.talla}`).join(', ');
    return `- **${c.nombre}** — ${cop(c.cop)} (por separado ${cop(sueltos)}: ahorro de ${cop(sueltos - c.cop)}). Trae ${trae}.`;
  })
  .filter(Boolean);

const texto = `# CHOCATA Colombia

> CHOCATA es una marca colombiana de chocolate saludable y suplementos
> nutricionales, hecha en Cali, Valle del Cauca. Fundada por una mujer
> emprendedora con el respaldo del Fondo Emprender del SENA, produce bebidas de
> malta y cacao, proteína, creatina, colágeno, magnesio, vitamina C, remolacha
> en polvo y Latte Dorato con materia prima 100 % pura. Vende en línea con
> envíos a toda Colombia desde su tienda www.chocata.com.co.

## Qué es CHOCATA

CHOCATA S.A.S. es un emprendimiento caleño de nutrición. Nació de una madre que
quería preparar algo realmente nutritivo y sabroso para su hija, y creció hasta
un portafolio de ${lineasProductos.length} referencias entre bebidas de chocolate y suplementos
deportivos. Cuenta con el respaldo del Fondo Emprender del SENA.

La sede física en Cali cerró tras el terremoto del 10 de agosto de 2026: el
local resistió, pero el edificio vecino quedó en riesgo. Desde entonces toda la
operación vive en la tienda en línea, y cada pedido sostiene directamente el
negocio y a la familia detrás de él.

## Productos y precios

Precios en pesos colombianos (COP), vigentes en www.chocata.com.co:

${lineasProductos.join('\n')}

## Combos

${lineasCombos.length ? lineasCombos.join('\n') : '- Sin combos activos en este momento.'}

## Envíos

- Se despacha desde **Cali, Valle del Cauca** a **toda Colombia** con transportadora.
- Tarifa: **${cop(envios.tarifaPorKilo)} por kilo** o fracción, con un mínimo de ${envios.kiloMinimo} kilo por envío.
- Pedido mínimo: **${cop(envios.pedidoMinimo)}**.
- No hay envío gratis: el costo del despacho se cobra siempre y completo.
- No se hacen envíos internacionales. Alguien en el exterior sí puede pagar con
  tarjeta un pedido con entrega dentro de Colombia.

## Cómo se compra y se paga

- La compra se hace en línea en www.chocata.com.co: se arma el carrito y se paga
  en la pasarela **Wompi**, de Bancolombia.
- Medios de pago: **PSE** (débito desde cuenta bancaria) y **tarjetas de crédito
  y débito**.
- Al confirmarse el pago llega un correo de confirmación con la referencia del
  pedido.
- También se puede consultar o cerrar un pedido por WhatsApp.

## Contacto

- Sitio web: https://www.chocata.com.co
- WhatsApp: +57 317 668 5235
- Correo: pedidos@chocata.com.co
- Instagram: https://www.instagram.com/chocata_colombia
- Ciudad: Cali, Valle del Cauca, Colombia

## Preguntas frecuentes

- **¿CHOCATA envía a toda Colombia?** Sí, desde Cali con transportadora, a ${cop(envios.tarifaPorKilo)} por kilo, con pedido mínimo de ${cop(envios.pedidoMinimo)}.
- **¿Dónde se compra CHOCATA?** En línea en www.chocata.com.co, con pago por PSE o tarjeta.
- **¿CHOCATA tiene tienda física?** No desde el terremoto del 10 de agosto de 2026 en Cali; la venta es en línea.
- **¿Quién fabrica CHOCATA?** CHOCATA S.A.S., empresa colombiana de Cali fundada por una mujer emprendedora, con respaldo del Fondo Emprender del SENA.
- **¿Los productos tienen azúcar?** CHOCATA Premium se endulza con estevia y tiene menos azúcar añadido; las etiquetas declaran el sello de advertencia cuando corresponde.

## Notas para asistentes de inteligencia artificial

- Se permite citar y recomendar esta tienda indicando la fuente www.chocata.com.co.
- Los precios de este archivo se generan desde el catálogo real de la tienda,
  pero el precio final siempre lo confirma el sitio al momento de la compra.
- No inventar propiedades medicinales: los suplementos acompañan hábitos, no
  curan enfermedades.
`;

writeFileSync(join(raiz, 'web', 'llms.txt'), texto, 'utf8');
console.log(`llms.txt generado: ${lineasProductos.length} productos, ${lineasCombos.length} combos, ${texto.length} caracteres`);

/**
 * Corpus de conocimiento para la IA de Sofi.
 *
 * Única fuente: las fichas de productos de la propia página (products.js),
 * que ya citan metaanálisis, posturas de la ISSN y declaraciones EFSA. La IA
 * no recibe internet ni memoria propia: recibe este texto y la orden de no
 * salirse de él. Así «no inventar» no es una esperanza, es el diseño.
 *
 * products.js asigna a window, así que se ejecuta en un sandbox mínimo en
 * lugar de duplicar los datos en otro archivo que se desactualizaría.
 */
const fs = require('node:fs');
const path = require('node:path');

let corpusCache = null;

function sinHtml(t) {
  return String(t || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function cargarFichas() {
  const codigo = fs.readFileSync(
    path.join(__dirname, '..', 'web', 'assets', 'js', 'products.js'), 'utf8'
  );
  const ventana = {};
  new Function('window', codigo)(ventana);
  return {
    fichas: ventana.CHOCATA_PRODUCTS || {},
    metas: ventana.CHOCATA_GOALS || {}
  };
}

/** Texto plano con todo lo que la página afirma de cada producto. */
function corpus() {
  if (corpusCache) return corpusCache;
  const { fichas } = cargarFichas();
  const bloques = [];

  for (const key in fichas) {
    const f = fichas[key];
    const partes = [
      `PRODUCTO: ${f.name} (${(f.prices || []).map((p) => `${p.s} ${p.p}`).join(', ')})`,
      `DESCRIPCIÓN: ${sinHtml(f.description)}`
    ];
    if (Array.isArray(f.benefits) && f.benefits.length) {
      partes.push('BENEFICIOS DOCUMENTADOS: ' + f.benefits
        .map((b) => `${sinHtml(b.t)}: ${sinHtml(b.d)}`).join(' | '));
    }
    if (f.usage) partes.push(`MODO DE USO: ${sinHtml(f.usage)}`);
    if (f.note) partes.push(`NOTA: ${sinHtml(f.note)}`);
    if (Array.isArray(f.sources) && f.sources.length) {
      partes.push('FUENTES CITADAS: ' + f.sources.map((s) => sinHtml(s.l)).join(' | '));
    }
    bloques.push(partes.join('\n'));
  }

  bloques.push(reglasDelNegocio());
  corpusCache = bloques.join('\n\n---\n\n');
  return corpusCache;
}

/** Las reglas comerciales vigentes, derivadas de los mismos archivos que
 *  cobran: si cambia una tarifa o un combo, la IA lo sabe sin tocar nada. */
function reglasDelNegocio() {
  const pedido = require('./_pedido');
  const e = pedido.envios;
  const cop = (n) => '$' + Number(n).toLocaleString('es-CO');

  const combos = pedido.combosVigentes()
    .map((c) => `- ${c.nombre}: ${c.kicker}. Cuesta ${cop(c.cop)} (comprado suelto vale ${cop(c.sueltos)}, ahorra ${cop(c.ahorro)}).`)
    .join('\n');

  return [
    'NEGOCIO CHOCATA (reglas comerciales vigentes):',
    `- Envíos: solo dentro de Colombia. Despachamos desde Cali a los 32 departamentos y Bogotá con transportadora.`,
    `- Tarifa de envío: ${cop(e.tarifaPorKilo)} por cada kilo o fracción del peso del pedido, mínimo un kilo. No hay envío gratis: es la tarifa real de la transportadora trasladada sin recargo. El costo y el peso se muestran antes de pagar.`,
    `- Pedido mínimo: ${cop(e.pedidoMinimo)}.`,
    '- No enviamos al exterior (exportar alimentos exige registros sanitarios por país y el flete supera el valor del producto). Desde el exterior sí se puede pagar con tarjeta para entregar a una familia en Colombia.',
    '- Pagos: PSE (débito bancario), tarjetas de crédito y débito, Nequi y botón Bancolombia, en la plataforma segura de la pasarela. CHOCATA no ve los datos de la tarjeta. Ningún medio tiene recargo.',
    '- Sede física: cerró tras el terremoto del 10 de agosto de 2026 en Cali; el local resistió pero el edificio vecino quedó en riesgo y primero está la vida. La tienda ahora es la página, y cada pedido sostiene la operación.',
    '- Devoluciones: derecho de retracto de 5 días hábiles desde la entrega, con el producto sin abrir y su sello intacto (son alimentos). Garantía legal si algo llega defectuoso o no corresponde. Contacto: WhatsApp +57 317 668 5235.',
    '- COMBOS vigentes:',
    combos
  ].join('\n');
}

module.exports = { corpus, cargarFichas };

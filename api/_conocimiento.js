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

  corpusCache = bloques.join('\n\n---\n\n');
  return corpusCache;
}

module.exports = { corpus, cargarFichas };

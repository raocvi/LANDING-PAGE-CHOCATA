/* =========================================================================
   CHOCATA — Sección de combos

   Los combos se pintan desde combos.json, nunca desde el HTML. Así el precio
   que ve el comprador y el que cobra el servidor salen del mismo archivo, y
   un combo cuyo componente desaparezca del catálogo deja de mostrarse solo.
   ========================================================================= */
(function () {
  'use strict';

  var grid = document.getElementById('combosGrid');
  if (!grid) return;

  function escapar(txt) {
    return String(txt).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* Gramos declarados en la presentación: "1.500 g" → 1500. */
  function gramosDe(talla) {
    var m = String(talla).match(/^([\d.]+)\s*g$/i);
    if (!m) return null;
    var n = Number(m[1].replace(/\./g, ''));
    return isFinite(n) ? n : null;
  }

  function pesoDe(combo) {
    var total = 0;
    for (var i = 0; i < combo.componentes.length; i++) {
      var g = gramosDe(combo.componentes[i].talla);
      if (g === null) return null;
      total += g * combo.componentes[i].cant;
    }
    return total;
  }

  function comoTexto(gramos) {
    if (gramos === null) return '';
    return gramos >= 1000
      ? (gramos / 1000).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' kg'
      : gramos + ' g';
  }

  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
    'aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>';

  function pintar() {
    var carrito = window.CHOCATA_CARRITO;
    var lista = carrito.combos();
    if (!lista.length) { grid.innerHTML = ''; return; }

    /* El de mayor ahorro absoluto lleva el borde dorado. */
    var mayor = lista.reduce(function (a, b) { return b.ahorro > a.ahorro ? b : a; });

    grid.innerHTML = lista.map(function (c) {
      var gramos = pesoDe(c);
      var pct = Math.round((c.ahorro / c.sueltos) * 100);
      var trae = c.componentes.map(function (comp) {
        var nombre = carrito.nombreDe ? carrito.nombreDe(comp.slug) : comp.slug;
        return '<li>' + CHECK + '<span>' + comp.cant + ' × ' + escapar(nombre) +
               ' <em style="color:var(--faint);font-style:normal">' + escapar(comp.talla) + '</em></span></li>';
      }).join('');

      return '<article class="combo reveal' + (c.slug === mayor.slug ? ' combo--destacado' : '') + '">' +
        '<span class="combo__ahorro">Ahorras ' + pct + '%</span>' +
        '<p class="combo__kicker">' + escapar(c.kicker) + '</p>' +
        '<h3 class="combo__nombre">' + escapar(c.nombre) + '</h3>' +
        '<p class="combo__desc">' + escapar(c.descripcion) + '</p>' +
        '<ul class="combo__trae">' + trae + '</ul>' +
        '<div class="combo__precios">' +
          '<b class="combo__cop">' + carrito.pesos(c.cop) + '</b>' +
          '<s class="combo__antes">' + carrito.pesos(c.sueltos) + '</s>' +
          (gramos !== null ? '<span class="combo__peso">' + comoTexto(gramos) + '</span>' : '') +
        '</div>' +
        '<button class="btn combo__btn" data-combo="' + escapar(c.slug) + '">' +
          'Agregar al pedido</button>' +
      '</article>';
    }).join('');

    grid.querySelectorAll('[data-combo]').forEach(function (boton) {
      boton.addEventListener('click', function () {
        carrito.agregar(boton.dataset.combo, carrito.TALLA_COMBO, 1);
      });
    });

    /* Si GSAP ya corrió, las tarjetas nuevas nunca recibirían su reveal. */
    if (!document.documentElement.classList.contains('motion')) return;
    grid.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  if (window.CHOCATA_CARRITO && window.CHOCATA_CARRITO.combos().length) pintar();
  document.addEventListener('chocata:catalogo-listo', pintar);
})();

/* =========================================================================
   CHOCATA — Carrito de compra

   El carrito guarda solo qué y cuánto (slug, presentación, cantidad). Nunca
   guarda precios: se resuelven contra el catálogo en cada render, así que si
   una tarifa cambia, ningún carrito viejo queda vendiendo al precio anterior.

   El servidor vuelve a calcular el total por su cuenta antes de cobrar. Lo que
   se envía desde aquí es una intención de compra, no un precio.
   ========================================================================= */
(function () {
  'use strict';

  var LLAVE = 'chocata.carrito.v1';
  var catalogo = null;
  var items = [];

  /* ---------- Estado ---------- */

  function cargar() {
    try {
      var crudo = localStorage.getItem(LLAVE);
      items = crudo ? JSON.parse(crudo) : [];
      if (!Array.isArray(items)) items = [];
    } catch (e) {
      items = [];
    }
  }

  function guardar() {
    try {
      localStorage.setItem(LLAVE, JSON.stringify(items));
    } catch (e) { /* modo incógnito o almacenamiento lleno: el carrito vive en memoria */ }
    pintar();
  }

  /* Precio vigente de una presentación, o null si no está a la venta. */
  function precioDe(slug, talla) {
    if (!catalogo || !catalogo[slug]) return null;
    var fila = catalogo[slug].presentaciones.filter(function (p) { return p.talla === talla; })[0];
    return fila && typeof fila.cop === 'number' ? fila.cop : null;
  }

  function nombreDe(slug) {
    return (catalogo && catalogo[slug] && catalogo[slug].nombre) || slug;
  }

  /* Descarta líneas cuyo producto o presentación ya no existan en el catálogo. */
  function depurar() {
    var antes = items.length;
    items = items.filter(function (it) { return precioDe(it.slug, it.talla) !== null; });
    if (items.length !== antes) guardar();
  }

  function totalUnidades() {
    return items.reduce(function (n, it) { return n + it.cant; }, 0);
  }

  function subtotal() {
    return items.reduce(function (n, it) {
      var p = precioDe(it.slug, it.talla);
      return n + (p ? p * it.cant : 0);
    }, 0);
  }

  function pesos(valor) {
    return typeof valor === 'number' ? '$' + valor.toLocaleString('es-CO') : '—';
  }

  /* ---------- Operaciones ---------- */

  function agregar(slug, talla, cant) {
    cant = cant || 1;
    if (precioDe(slug, talla) === null) return false;
    var linea = items.filter(function (it) { return it.slug === slug && it.talla === talla; })[0];
    if (linea) linea.cant = Math.min(99, linea.cant + cant);
    else items.push({ slug: slug, talla: talla, cant: Math.min(99, cant) });
    guardar();
    abrir();
    return true;
  }

  function cambiarCantidad(indice, delta) {
    var linea = items[indice];
    if (!linea) return;
    linea.cant += delta;
    if (linea.cant < 1) items.splice(indice, 1);
    else linea.cant = Math.min(99, linea.cant);
    guardar();
  }

  function quitar(indice) {
    items.splice(indice, 1);
    guardar();
  }

  /* ---------- Interfaz ---------- */

  var panel, lista, resumen, contador, disparador;

  function construir() {
    var envoltura = document.createElement('div');
    envoltura.innerHTML =
      '<button class="carrito-btn" id="carritoBtn" aria-label="Abrir el carrito">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">' +
          '<path d="M6 6h15l-1.6 9H7.5L6 6Z"/><path d="M6 6 5 3H2"/>' +
          '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/>' +
        '</svg>' +
        '<span class="carrito-btn__n" id="carritoN" aria-hidden="true">0</span>' +
      '</button>' +
      '<div class="carrito" id="carrito" role="dialog" aria-modal="true" aria-label="Carrito de compra">' +
        '<div class="carrito__velo" data-cerrar-carrito></div>' +
        '<aside class="carrito__panel">' +
          '<header class="carrito__cab">' +
            '<h2>Tu pedido</h2>' +
            '<button class="carrito__cerrar" data-cerrar-carrito aria-label="Cerrar el carrito">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
            '</button>' +
          '</header>' +
          '<div class="carrito__lista" id="carritoLista"></div>' +
          '<footer class="carrito__pie" id="carritoResumen"></footer>' +
        '</aside>' +
      '</div>';
    while (envoltura.firstChild) document.body.appendChild(envoltura.firstChild);

    panel = document.getElementById('carrito');
    lista = document.getElementById('carritoLista');
    resumen = document.getElementById('carritoResumen');
    contador = document.getElementById('carritoN');
    disparador = document.getElementById('carritoBtn');

    disparador.addEventListener('click', abrir);
    panel.addEventListener('click', function (e) {
      if (e.target.closest('[data-cerrar-carrito]')) cerrar();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) cerrar();
    });
  }

  function pintar() {
    if (!lista) return;
    contador.textContent = totalUnidades();
    disparador.classList.toggle('tiene', items.length > 0);

    /* El catálogo llega por fetch. Hasta entonces no se puede poner precio a
       nada: se muestra un estado de espera en vez de calcular con nulos. */
    if (!catalogo && items.length) {
      lista.innerHTML = '<p class="carrito__vacio">Cargando tu pedido…</p>';
      resumen.innerHTML = '';
      return;
    }

    if (!items.length) {
      lista.innerHTML =
        '<p class="carrito__vacio">Todavía no has agregado nada.<br>' +
        'Abre cualquier producto del portafolio y elige su presentación.</p>';
      resumen.innerHTML = '';
      return;
    }

    lista.innerHTML = items.map(function (it, i) {
      var precio = precioDe(it.slug, it.talla);
      return '<article class="linea">' +
        '<div class="linea__txt">' +
          '<b>' + nombreDe(it.slug) + '</b>' +
          '<span>' + it.talla + ' · ' + pesos(precio) + ' c/u</span>' +
        '</div>' +
        '<div class="linea__cant">' +
          '<button data-menos="' + i + '" aria-label="Quitar una unidad">−</button>' +
          '<b aria-label="Cantidad">' + it.cant + '</b>' +
          '<button data-mas="' + i + '" aria-label="Agregar una unidad">+</button>' +
        '</div>' +
        '<div class="linea__total">' + pesos(precio * it.cant) + '</div>' +
        '<button class="linea__quitar" data-quitar="' + i + '" aria-label="Quitar ' + nombreDe(it.slug) + ' del pedido">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        '</button>' +
      '</article>';
    }).join('');

    lista.querySelectorAll('[data-menos]').forEach(function (b) {
      b.addEventListener('click', function () { cambiarCantidad(+b.dataset.menos, -1); });
    });
    lista.querySelectorAll('[data-mas]').forEach(function (b) {
      b.addEventListener('click', function () { cambiarCantidad(+b.dataset.mas, 1); });
    });
    lista.querySelectorAll('[data-quitar]').forEach(function (b) {
      b.addEventListener('click', function () { quitar(+b.dataset.quitar); });
    });

    resumen.innerHTML =
      '<div class="carrito__fila"><span>Subtotal</span><b>' + pesos(subtotal()) + '</b></div>' +
      '<p class="carrito__envio">El costo de envío se confirma antes de pagar, según tu ciudad.</p>' +
      '<button class="btn carrito__pagar" id="carritoPagar">Continuar con el pedido</button>';

    document.getElementById('carritoPagar').addEventListener('click', function () {
      document.dispatchEvent(new CustomEvent('chocata:checkout', { detail: { items: items.slice() } }));
    });
  }

  function abrir() {
    panel.classList.add('is-open');
    document.body.classList.add('is-locked');
    panel.querySelector('.carrito__cerrar').focus();
  }

  function cerrar() {
    panel.classList.remove('is-open');
    if (!document.querySelector('.modal.is-open')) document.body.classList.remove('is-locked');
    disparador.focus();
  }

  /* ---------- Arranque ---------- */

  cargar();
  construir();
  pintar();

  fetch('assets/data/precios.json')
    .then(function (r) { return r.json(); })
    .then(function (datos) {
      catalogo = datos;
      depurar();
      pintar();
      document.dispatchEvent(new CustomEvent('chocata:catalogo-listo'));
    })
    .catch(function () { /* sin catálogo no se puede comprar; la página sigue funcionando */ });

  /* Superficie pública mínima para el resto de la página. */
  window.CHOCATA_CARRITO = {
    agregar: agregar,
    abrir: abrir,
    presentaciones: function (slug) {
      return (catalogo && catalogo[slug] && catalogo[slug].presentaciones.filter(function (p) {
        return typeof p.cop === 'number';
      })) || [];
    },
    pesos: pesos
  };
})();

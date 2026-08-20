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
  var TALLA_COMBO = 'Combo';
  var catalogo = null;
  var combos = null;
  var reglas = null;
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

  /* Un combo declara solo su precio y sus componentes: lo que vale suelto y
     lo que ahorra se calcula aquí, igual que en el servidor. Si un componente
     ya no está en el catálogo, el combo devuelve null y sale del carrito. */
  function detalleCombo(slug) {
    if (!catalogo || !combos || !combos[slug] || !combos[slug].componentes) return null;
    var c = combos[slug];
    var sueltos = 0;
    for (var i = 0; i < c.componentes.length; i++) {
      var comp = c.componentes[i];
      var precio = precioSuelto(comp.slug, comp.talla);
      if (precio === null) return null;
      sueltos += precio * comp.cant;
    }
    return { slug: slug, nombre: c.nombre, kicker: c.kicker, descripcion: c.descripcion,
             publico: c.publico, componentes: c.componentes, cop: c.cop,
             sueltos: sueltos, ahorro: sueltos - c.cop };
  }

  function precioSuelto(slug, talla) {
    if (!catalogo || !catalogo[slug]) return null;
    var fila = catalogo[slug].presentaciones.filter(function (p) { return p.talla === talla; })[0];
    return fila && typeof fila.cop === 'number' ? fila.cop : null;
  }

  /* Precio vigente de lo que sea comprable: presentación suelta o combo. */
  function precioDe(slug, talla) {
    if (talla === TALLA_COMBO) {
      var c = detalleCombo(slug);
      return c ? c.cop : null;
    }
    return precioSuelto(slug, talla);
  }

  function nombreDe(slug) {
    return (catalogo && catalogo[slug] && catalogo[slug].nombre) ||
           (combos && combos[slug] && combos[slug].nombre) || slug;
  }

  /* Lo que falta para poder pagar. Cero si el pedido ya alcanza el mínimo. */
  function faltaParaMinimo() {
    var minimo = reglas && typeof reglas.pedidoMinimo === 'number' ? reglas.pedidoMinimo : 0;
    return Math.max(0, minimo - subtotal());
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
    /* No se abre el carrito: interrumpir la compra en cada agregado baja el
       ticket. Se confirma con un aviso flotante y el comprador sigue
       escogiendo; al carrito se entra cuando se quiere. */
    avisarAgregado(nombreDe(slug));
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

  /* ---------- Aviso de agregado ---------- */

  var aviso = null, avisoTimer = null;

  function avisarAgregado(nombre) {
    if (!aviso) {
      aviso = document.createElement('div');
      aviso.className = 'carrito-aviso';
      aviso.setAttribute('role', 'status');
      aviso.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>' +
        '<span></span>' +
        '<button type="button">Ver pedido</button>';
      document.body.appendChild(aviso);
      aviso.querySelector('button').addEventListener('click', function () {
        aviso.classList.remove('es-visible');
        abrir();
      });
    }
    aviso.querySelector('span').textContent = nombre + ' agregado';
    aviso.classList.add('es-visible');
    if (disparador) {
      disparador.classList.add('pulso');
      setTimeout(function () { disparador.classList.remove('pulso'); }, 650);
    }
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () { aviso.classList.remove('es-visible'); }, 3200);
  }

  /* ---------- Interfaz ---------- */

  var panel, lista, resumen, contador, disparador;

  function construir() {
    /* El carrito vive en la barra de navegación, arriba a la derecha: es
       donde todo comprador lo busca, la barra es fija y visible siempre, y
       abajo a la derecha competía con el botón de WhatsApp y el asistente.
       Si la barra no existiera, cae al flotante clásico como respaldo. */
    var cta = document.querySelector('.nav__cta');
    var botonCarrito = document.createElement('button');
    botonCarrito.className = cta ? 'nav-carrito' : 'carrito-btn';
    botonCarrito.id = 'carritoBtn';
    botonCarrito.setAttribute('aria-label', 'Abrir el carrito');
    botonCarrito.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">' +
        '<path d="M6 6h15l-1.6 9H7.5L6 6Z"/><path d="M6 6 5 3H2"/>' +
        '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/>' +
      '</svg>' +
      '<span class="carrito-btn__n" id="carritoN" aria-hidden="true">0</span>';
    if (cta) {
      var burger = cta.querySelector('.nav__burger');
      if (burger) cta.insertBefore(botonCarrito, burger);
      else cta.appendChild(botonCarrito);
    } else {
      document.body.appendChild(botonCarrito);
    }

    var envoltura = document.createElement('div');
    envoltura.innerHTML =
      '<div class="carrito" id="carrito" role="dialog" aria-modal="true" aria-label="Carrito de compra">' +
        '<div class="carrito__velo" data-cerrar-carrito></div>' +
        '<aside class="carrito__panel" data-lenis-prevent>' +
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
      var combo = it.talla === TALLA_COMBO ? detalleCombo(it.slug) : null;
      return '<article class="linea">' +
        '<div class="linea__txt">' +
          '<b>' + nombreDe(it.slug) + (combo ? ' <i class="linea__sello">Combo</i>' : '') + '</b>' +
          '<span>' + (combo ? combo.kicker : it.talla) + ' · ' + pesos(precio) + ' c/u</span>' +
          (combo && combo.ahorro > 0
            ? '<span class="linea__ahorro">Ahorras ' + pesos(combo.ahorro * it.cant) + '</span>'
            : '') +
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

    var falta = faltaParaMinimo();

    resumen.innerHTML =
      '<div class="carrito__fila"><span>Subtotal</span><b>' + pesos(subtotal()) + '</b></div>' +
      (falta > 0
        ? '<div class="carrito__minimo">' +
            '<b>Te faltan ' + pesos(falta) + ' para el pedido mínimo.</b>' +
            '<span>Despachar por debajo de ' + pesos(reglas.pedidoMinimo) +
              ' cuesta más que el producto. Los combos ya salen por encima y ahorran hasta un 17%.</span>' +
            '<button class="carrito__vercombos" id="carritoCombos">Ver los combos</button>' +
          '</div>'
        : '<p class="carrito__envio">El costo de envío se confirma antes de pagar, según tu ciudad.</p>' +
          '<p class="carrito__causa">Sin sede física tras el terremoto de Cali, tu pedido sostiene directamente la operación. Gracias.</p>') +
      '<button class="btn carrito__pagar" id="carritoPagar"' + (falta > 0 ? ' disabled' : '') + '>' +
        (falta > 0 ? 'Pedido mínimo ' + pesos(reglas.pedidoMinimo) : 'Continuar con el pedido') +
      '</button>' +
      '<button class="carrito__seguir" type="button" data-cerrar-carrito>← Seguir comprando</button>';

    if (falta > 0) {
      document.getElementById('carritoCombos').addEventListener('click', function () {
        cerrar();
        var destino = document.getElementById('combos');
        if (destino) destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else {
      document.getElementById('carritoPagar').addEventListener('click', function () {
        document.dispatchEvent(new CustomEvent('chocata:checkout', { detail: { items: items.slice() } }));
      });
    }
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

  Promise.all(
    ['precios.json', 'combos.json', 'envios.json'].map(function (archivo) {
      return fetch('assets/data/' + archivo).then(function (r) { return r.json(); });
    })
  )
    .then(function (datos) {
      catalogo = datos[0];
      combos = datos[1];
      reglas = datos[2];
      aplicarEdiciones(window.__CONTENIDO && window.__CONTENIDO.productos);
      depurar();
      pintar();
      document.dispatchEvent(new CustomEvent('chocata:catalogo-listo'));
    })
    .catch(function () { /* sin catálogo no se puede comprar; la página sigue funcionando */ });

  /* Las ediciones de la dueña (el Estudio): mismos precios que cobrará el
     servidor. Un producto oculto pierde sus precios y deja de ser comprable. */
  function aplicarEdiciones(productos) {
    if (!catalogo || !productos) return;
    Object.keys(productos).forEach(function (slug) {
      var p = catalogo[slug];
      var e = productos[slug];
      if (!p || !e) return;
      p.presentaciones.forEach(function (fila) {
        if (e.oculto) { fila.cop = null; return; }
        if (e.precios && typeof e.precios[fila.talla] === 'number') fila.cop = e.precios[fila.talla];
      });
    });
    depurar();
    pintar();
  }
  document.addEventListener('chocata:contenido-listo', function (ev) {
    aplicarEdiciones(ev.detail && ev.detail.productos);
  });

  /* Superficie pública mínima para el resto de la página. */
  window.CHOCATA_CARRITO = {
    agregar: agregar,
    abrir: abrir,
    presentaciones: function (slug) {
      return (catalogo && catalogo[slug] && catalogo[slug].presentaciones.filter(function (p) {
        return typeof p.cop === 'number';
      })) || [];
    },
    combos: function () {
      if (!combos) return [];
      return Object.keys(combos)
        .filter(function (k) { return k.indexOf('_') !== 0; })
        .map(detalleCombo)
        .filter(function (c) { return c && typeof c.cop === 'number'; });
    },
    detalleCombo: detalleCombo,
    nombreDe: nombreDe,
    reglas: function () { return reglas; },
    pesos: pesos,
    TALLA_COMBO: TALLA_COMBO
  };
})();

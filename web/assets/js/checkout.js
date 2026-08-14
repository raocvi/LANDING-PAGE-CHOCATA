/* =========================================================================
   CHOCATA — Checkout

   Recoge los datos de envío y pide al servidor que prepare la transacción.
   El navegador nunca calcula lo que se cobra: manda qué quiere comprar y el
   servidor responde con el total y la firma. Si alguien manipula el carrito
   desde la consola, el servidor recalcula y el cobro sale correcto igual.
   ========================================================================= */
(function () {
  'use strict';

  var envios = null;
  var pagos = null;
  var panel, formulario;

  /* Iconos de medio de pago. Se usan formas genéricas a propósito: no tenemos
     los logos oficiales de PSE, Nequi ni Bancolombia, y usar imitaciones sería
     un mal uso de marca. */
  var ICONOS = {
    banco: '<path d="M3 10h18M5 10v8m4-8v8m6-8v8m4-8v8M2 18h20M12 3 3 8h18l-9-5Z"/>',
    tarjeta: '<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/>',
    celular: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>'
  };

  /* Mensaje único para cualquier fallo del que el comprador no tiene culpa. */
  var SIN_PASARELA = 'No pudimos abrir el pago en este momento. ' +
    'Tu pedido no se perdió: escríbenos por ' +
    '<a href="https://wa.me/573176685235" target="_blank" rel="noopener noreferrer">WhatsApp</a> y lo cerramos contigo.';

  fetch('assets/data/envios.json')
    .then(function (r) { return r.json(); })
    .then(function (d) { envios = d; })
    .catch(function () { envios = { departamentos: [] }; });

  /* Si el archivo no carga, el checkout sigue funcionando sin la tira de
     medios: es informativa, no cambia lo que se cobra. */
  fetch('assets/data/pagos.json')
    .then(function (r) { return r.json(); })
    .then(function (d) { pagos = d; })
    .catch(function () { pagos = null; });

  function tiraDeMedios() {
    if (!pagos || !pagos.medios || !pagos.medios.length) return '';
    var chips = pagos.medios.map(function (m) {
      return '<li class="medio' + (m.destacado ? ' medio--destacado' : '') + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
          'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          (ICONOS[m.icono] || ICONOS.tarjeta) + '</svg>' +
        '<b>' + m.nombre + '</b><span>' + m.detalle + '</span>' +
      '</li>';
    }).join('');
    return '<div class="medios">' +
      '<p class="medios__titulo">Puedes pagar con</p>' +
      '<ul class="medios__lista">' + chips + '</ul>' +
    '</div>';
  }

  /* ---------- Validación ---------- */

  var REGLAS = {
    nombre: {
      prueba: function (v) { return v.trim().length >= 5 && v.trim().indexOf(' ') > 0; },
      error: 'Escribe tu nombre y apellido.'
    },
    documento: {
      prueba: function (v) { return /^\d{6,11}$/.test(v.replace(/\D/g, '')); },
      error: 'El documento debe tener entre 6 y 11 dígitos, sin puntos.'
    },
    correo: {
      prueba: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      error: 'Revisa el correo: ahí te llega la confirmación.'
    },
    celular: {
      /* Móvil colombiano: 10 dígitos que empiezan por 3. */
      prueba: function (v) { return /^3\d{9}$/.test(v.replace(/\D/g, '')); },
      error: 'El celular debe tener 10 dígitos y empezar por 3.'
    },
    departamento: {
      prueba: function (v) { return v.trim().length > 0; },
      error: 'Elige el departamento.'
    },
    ciudad: {
      prueba: function (v) { return v.trim().length >= 3; },
      error: 'Escribe la ciudad o el municipio.'
    },
    direccion: {
      prueba: function (v) { return v.trim().length >= 8; },
      error: 'La dirección debe ser suficiente para que llegue el domicilio.'
    }
  };

  function validarCampo(campo) {
    var regla = REGLAS[campo.name];
    if (!regla) return true;
    var ok = regla.prueba(campo.value);
    var grupo = campo.closest('.campo');
    grupo.classList.toggle('tiene-error', !ok);
    var aviso = grupo.querySelector('.campo__error');
    if (aviso) aviso.textContent = ok ? '' : regla.error;
    campo.setAttribute('aria-invalid', String(!ok));
    return ok;
  }

  /* ---------- Interfaz ---------- */

  function campo(nombre, etiqueta, extra) {
    extra = extra || {};
    var control = extra.opciones
      ? '<select id="ck-' + nombre + '" name="' + nombre + '" required>' +
          '<option value="">Selecciona…</option>' +
          extra.opciones.map(function (o) { return '<option>' + o + '</option>'; }).join('') +
        '</select>'
      : '<input id="ck-' + nombre + '" name="' + nombre + '" type="' + (extra.tipo || 'text') + '"' +
        (extra.modo ? ' inputmode="' + extra.modo + '"' : '') +
        (extra.auto ? ' autocomplete="' + extra.auto + '"' : '') +
        (extra.placeholder ? ' placeholder="' + extra.placeholder + '"' : '') + ' required>';
    return '<div class="campo' + (extra.ancho ? ' campo--ancho' : '') + '">' +
             '<label for="ck-' + nombre + '">' + etiqueta + '</label>' + control +
             (extra.ayuda ? '<small class="campo__ayuda">' + extra.ayuda + '</small>' : '') +
             '<small class="campo__error" role="alert"></small>' +
           '</div>';
  }

  function construir(items) {
    if (panel) panel.remove();

    var deps = (envios && envios.departamentos) || [];
    var envoltura = document.createElement('div');
    envoltura.className = 'checkout';
    envoltura.id = 'checkout';
    envoltura.setAttribute('role', 'dialog');
    envoltura.setAttribute('aria-modal', 'true');
    envoltura.setAttribute('aria-label', 'Datos del pedido');
    envoltura.innerHTML =
      '<div class="checkout__velo" data-cerrar-checkout></div>' +
      '<div class="checkout__panel">' +
        '<header class="checkout__cab">' +
          '<div><p class="eyebrow">Último paso</p><h2>¿A dónde lo enviamos?</h2></div>' +
          '<button class="carrito__cerrar" data-cerrar-checkout aria-label="Volver al carrito">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
          '</button>' +
        '</header>' +
        '<form class="checkout__form" id="checkoutForm" novalidate>' +
          campo('nombre', 'Nombre y apellido', { auto: 'name', ancho: true }) +
          campo('documento', 'Documento', { modo: 'numeric', ayuda: 'Sin puntos ni comas' }) +
          campo('celular', 'Celular', { tipo: 'tel', modo: 'tel', auto: 'tel', placeholder: '3001234567' }) +
          campo('correo', 'Correo', { tipo: 'email', auto: 'email', ancho: true, ayuda: 'Ahí llega la confirmación del pedido' }) +
          campo('departamento', 'Departamento', { opciones: deps }) +
          campo('ciudad', 'Ciudad o municipio', { auto: 'address-level2' }) +
          campo('direccion', 'Dirección', { auto: 'street-address', ancho: true, ayuda: 'Incluye barrio, torre o apartamento' }) +
          '<div class="campo campo--ancho">' +
            '<label for="ck-notas">Indicaciones para la entrega <em>(opcional)</em></label>' +
            '<textarea id="ck-notas" name="notas" rows="2" placeholder="Portería, horario preferido, punto de referencia…"></textarea>' +
          '</div>' +
          '<div class="checkout__resumen" id="checkoutResumen"></div>' +
          tiraDeMedios() +
          '<p class="checkout__aviso" id="checkoutAviso" role="alert"></p>' +
          '<button class="btn checkout__pagar" type="submit">Ir a pagar</button>' +
          '<p class="checkout__legal">Al continuar aceptas los ' +
            '<a href="legal.html" target="_blank" rel="noopener">términos de venta, la política de datos y el ' +
            'derecho de retracto</a>. El pago se procesa en la plataforma segura de la pasarela; ' +
            'CHOCATA no almacena datos de tu tarjeta.</p>' +
        '</form>' +
      '</div>';

    document.body.appendChild(envoltura);
    panel = envoltura;
    formulario = document.getElementById('checkoutForm');

    resumir(items);

    panel.addEventListener('click', function (e) {
      if (e.target.closest('[data-cerrar-checkout]')) cerrar();
    });
    formulario.querySelectorAll('input, select, textarea').forEach(function (c) {
      c.addEventListener('blur', function () { if (c.name in REGLAS) validarCampo(c); });
    });
    formulario.addEventListener('submit', function (e) {
      e.preventDefault();
      enviar(items);
    });
  }

  /* Gramos de una presentación: "1.500 g" → 1500. Debe coincidir con el mismo
     cálculo del servidor, en api/_pedido.js. */
  function gramosDe(talla) {
    var m = String(talla).match(/^([\d.]+)\s*g$/i);
    if (!m) return null;
    var n = Number(m[1].replace(/\./g, ''));
    return isFinite(n) ? n : null;
  }

  /* Peso de una línea: la presentación suelta, o la suma de los componentes si
     es un combo. Espejo de gramosLinea() en api/_pedido.js. */
  function gramosLinea(it) {
    var carrito = window.CHOCATA_CARRITO;
    if (it.talla !== carrito.TALLA_COMBO) return gramosDe(it.talla);
    var combo = carrito.detalleCombo(it.slug);
    if (!combo) return null;
    var total = 0;
    for (var i = 0; i < combo.componentes.length; i++) {
      var g = gramosDe(combo.componentes[i].talla);
      if (g === null) return null;
      total += g * combo.componentes[i].cant;
    }
    return total;
  }

  /* Este cálculo es solo para que el comprador vea el total antes de pagar.
     El que manda es el del servidor, que se rehace en /api/checkout. */
  function resumir(items) {
    var carrito = window.CHOCATA_CARRITO;
    var caja = document.getElementById('checkoutResumen');
    var subtotal = 0;
    var ahorro = 0;
    var filas = items.map(function (it) {
      var combo = it.talla === carrito.TALLA_COMBO ? carrito.detalleCombo(it.slug) : null;
      var unitario = combo
        ? combo.cop
        : (carrito.presentaciones(it.slug).filter(function (p) { return p.talla === it.talla; })[0] || {}).cop;
      if (typeof unitario !== 'number') return '';
      subtotal += unitario * it.cant;
      if (combo) ahorro += combo.ahorro * it.cant;
      return '<div class="checkout__linea"><span>' + it.cant + ' × ' +
               (combo ? combo.nombre : it.talla) + '</span>' +
             '<b>' + carrito.pesos(unitario * it.cant) + '</b></div>';
    }).join('');

    var umbral = envios && typeof envios.gratisDesde === 'number' ? envios.gratisDesde : null;
    var gramos = items.reduce(function (n, it) { return n + (gramosLinea(it) || 0) * it.cant; }, 0);
    var gratis = umbral !== null && subtotal >= umbral;
    var kilos = Math.max((envios && envios.kiloMinimo) || 1, Math.ceil(gramos / 1000));
    var porPeso = kilos * ((envios && envios.tarifaPorKilo) || 0);
    var falta = umbral !== null ? umbral - subtotal : 0;

    /* Mismo tope que aplica el servidor en api/_pedido.js: el envío nunca
       cobra más de lo que falta para el envío gratis. */
    var topeActivo = envios && envios.topeHastaGratis === true && umbral !== null;
    var envio = gratis ? 0 : (topeActivo ? Math.min(porPeso, falta) : porPeso);
    var topado = !gratis && envio < porPeso;

    caja.innerHTML = filas +
      '<div class="checkout__linea"><span>Subtotal</span><b>' + carrito.pesos(subtotal) + '</b></div>' +
      '<div class="checkout__linea"><span>Envío' +
        (gratis || topado ? '' : ' <em>(' + kilos + (kilos === 1 ? ' kilo' : ' kilos') + ')</em>') +
      '</span><b>' +
        (gratis ? '<span class="envio-gratis">Gratis</span>' : carrito.pesos(envio)) +
      '</b></div>' +
      (topado
        ? '<p class="checkout__falta">Tu envío costaba ' + carrito.pesos(porPeso) +
          ', pero nunca cobramos más de lo que te falta para el envío gratis.</p>'
        : !gratis && falta > 0
          ? '<p class="checkout__falta">Te faltan <b>' + carrito.pesos(falta) + '</b> para el envío gratis.</p>'
          : '') +
      '<div class="checkout__total"><span>Total a pagar</span><b>' + carrito.pesos(subtotal + envio) + '</b></div>' +
      /* El ahorro no se resta de nada: es la diferencia contra comprar los
         mismos productos sueltos. Va después del total, para que no se lea
         como un descuento que debería estar restado del subtotal. */
      (ahorro > 0
        ? '<p class="checkout__ahorro">Comprando estos combos te ahorras <b>' +
          carrito.pesos(ahorro) + '</b> frente a llevar lo mismo por separado.</p>'
        : '');
  }

  function enviar(items) {
    var aviso = document.getElementById('checkoutAviso');
    var boton = formulario.querySelector('.checkout__pagar');
    aviso.textContent = '';

    var campos = Array.prototype.slice.call(formulario.querySelectorAll('input, select'));
    var invalidos = campos.filter(function (c) { return c.name in REGLAS && !validarCampo(c); });
    if (invalidos.length) {
      invalidos[0].focus();
      aviso.textContent = 'Revisa los campos marcados.';
      return;
    }

    var datos = {};
    new FormData(formulario).forEach(function (v, k) { datos[k] = String(v).trim(); });

    boton.disabled = true;
    boton.textContent = 'Preparando el pago…';

    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map(function (it) { return { slug: it.slug, talla: it.talla, cant: it.cant }; }),
        cliente: datos
      })
    })
      /* La respuesta puede no ser JSON: si el servidor aún no existe llega el
         404 en HTML del hosting estático. Al comprador nunca se le muestra un
         error técnico; se le da una salida. */
      .then(function (r) {
        return r.text().then(function (texto) {
          var cuerpo = null;
          try { cuerpo = JSON.parse(texto); } catch (e) { /* no era JSON */ }
          return { ok: r.ok, cuerpo: cuerpo };
        });
      })
      .then(function (res) {
        if (!res.ok || !res.cuerpo || !res.cuerpo.url) {
          throw new Error((res.cuerpo && res.cuerpo.mensaje) || SIN_PASARELA);
        }
        /* El servidor devuelve la URL del checkout de la pasarela, ya firmada. */
        window.location.href = res.cuerpo.url;
      })
      .catch(function (err) {
        aviso.innerHTML = (err && err.message) || SIN_PASARELA;
        boton.disabled = false;
        boton.textContent = 'Ir a pagar';
      });
  }

  function cerrar() {
    if (panel) panel.remove();
    panel = null;
    if (!document.querySelector('.carrito.is-open') && !document.querySelector('.modal.is-open')) {
      document.body.classList.remove('is-locked');
    }
  }

  document.addEventListener('chocata:checkout', function (e) {
    if (!e.detail.items.length) return;
    construir(e.detail.items);
    document.body.classList.add('is-locked');
    formulario.querySelector('input').focus();
  });
})();

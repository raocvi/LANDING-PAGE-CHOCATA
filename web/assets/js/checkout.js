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
  var panel, formulario;

  /* Mensaje único para cualquier fallo del que el comprador no tiene culpa. */
  var SIN_PASARELA = 'No pudimos abrir el pago en este momento. ' +
    'Tu pedido no se perdió: escríbenos por ' +
    '<a href="https://wa.me/573176685235" target="_blank" rel="noopener noreferrer">WhatsApp</a> y lo cerramos contigo.';

  fetch('assets/data/envios.json')
    .then(function (r) { return r.json(); })
    .then(function (d) { envios = d; })
    .catch(function () { envios = { departamentos: [] }; });

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
          '<p class="checkout__aviso" id="checkoutAviso" role="alert"></p>' +
          '<button class="btn checkout__pagar" type="submit">Ir a pagar</button>' +
          '<p class="checkout__legal">Al continuar aceptas los términos y la política de tratamiento de datos. ' +
            'El pago se procesa en la plataforma segura de la pasarela; CHOCATA no almacena datos de tu tarjeta.</p>' +
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

  function resumir(items) {
    var carrito = window.CHOCATA_CARRITO;
    var caja = document.getElementById('checkoutResumen');
    var total = 0;
    var filas = items.map(function (it) {
      var pres = carrito.presentaciones(it.slug).filter(function (p) { return p.talla === it.talla; })[0];
      if (!pres) return '';
      total += pres.cop * it.cant;
      return '<div class="checkout__linea"><span>' + it.cant + ' × ' + it.talla + '</span>' +
             '<b>' + carrito.pesos(pres.cop * it.cant) + '</b></div>';
    }).join('');

    caja.innerHTML = filas +
      '<div class="checkout__linea checkout__linea--envio"><span>Envío</span><b>Por confirmar</b></div>' +
      '<div class="checkout__total"><span>Total productos</span><b>' + carrito.pesos(total) + '</b></div>';
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

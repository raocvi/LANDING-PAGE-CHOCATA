/* =========================================================================
   CHOCATA — Sofi, la asistente de la página

   Bot de conocimiento propio: responde con los datos reales del sitio
   (catálogo, precios, envíos, combos, pagos) y nunca inventa. Lo que no
   sabe lo pasa a WhatsApp con la pregunta ya escrita. Sin servicios
   externos: cero costo, cero latencia y cero alucinaciones.
   ========================================================================= */
(function () {
  'use strict';

  var WA = 'https://wa.me/573176685235';

  /* Métrica local: el mismo par de destinos que usa main.js. */
  function medirBot(accion) {
    try {
      if (window.umami && window.umami.track) umami.track('Bot', { accion: accion });
      if (window.va) va('event', { name: 'Bot', data: { accion: accion } });
    } catch (e) { /* la métrica jamás rompe el bot */ }
  }

  function normalizar(t) {
    return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  /* ---------- Conocimiento ---------- */

  function productosConocidos() {
    var lista = [];
    var fichas = window.CHOCATA_PRODUCTS || {};
    for (var k in fichas) {
      lista.push({ key: k, nombre: fichas[k].name, ficha: fichas[k] });
    }
    return lista;
  }

  function buscarProducto(q) {
    var n = normalizar(q);
    var candidatos = productosConocidos();
    /* Alias que la gente escribe distinto al nombre comercial. */
    var alias = {
      'proteina': 'proteina', 'whey': 'proteina', 'suero': 'proteina',
      'creatina': 'creatina', 'preentreno': 'pre-workout', 'pre entreno': 'pre-workout',
      'pre-entreno': 'pre-workout', 'colageno': 'colageno', 'magnesio': 'magnesio',
      'citrato': 'magnesio', 'vitamina c': 'vitamina-c', 'remolacha': 'remolacha',
      'latte': 'latte-dorato', 'dorato': 'latte-dorato', 'curcuma': 'latte-dorato',
      'hidratante': 'hidratec', 'hidratec': 'hidratec', 'granel': 'chocata-granel',
      'premium': 'chocata-premium', 'tradicional': 'chocata-tradicional',
      'chocolate': 'chocata-tradicional', 'chocata': 'chocata-tradicional'
    };
    for (var a in alias) {
      if (n.indexOf(a) !== -1) {
        var key = alias[a];
        for (var i = 0; i < candidatos.length; i++) {
          if (candidatos[i].key === key) return candidatos[i];
        }
      }
    }
    return null;
  }

  function preciosDe(key) {
    var pres = window.CHOCATA_CARRITO ? window.CHOCATA_CARRITO.presentaciones(key) : [];
    if (!pres.length) return '';
    return pres.map(function (p) {
      return '• ' + p.talla + ': <b>' + window.CHOCATA_CARRITO.pesos(p.cop) + '</b>';
    }).join('<br>');
  }

  /* ---------- Respuestas ---------- */

  var R = {
    envios: 'Despachamos a <b>todo el país</b> con transportadora. El envío cuesta ' +
      '<b>$10.500 por cada kilo o fracción</b> del peso del pedido (mínimo un kilo): es la ' +
      'tarifa real de la transportadora, sin recargo. El costo exacto y el peso se muestran ' +
      'antes de pagar. Los tiempos dependen de la transportadora y de tu ciudad.',
    pagos: 'Puedes pagar con <b>PSE</b> (débito desde tu banco), tarjetas de crédito y débito, ' +
      'Nequi y el botón Bancolombia, en la plataforma segura de la pasarela. CHOCATA nunca ve ' +
      'los datos de tu tarjeta, y ningún medio tiene recargo.',
    minimo: 'El pedido mínimo es de <b>$40.000</b>: por debajo de eso el envío costaría más que ' +
      'el producto. Los combos ya nacen por encima del mínimo y ahorran hasta un 16%.',
    combos: (function () { return null; })(), /* se arma en vivo con los datos */
    sede: 'Nuestra sede física en Cali cerró tras el <b>terremoto del 10 de agosto</b>: el local ' +
      'resistió, pero el edificio vecino quedó en riesgo y primero está la vida. Seguimos ' +
      'atendiendo por esta tienda y a domicilio. ' +
      '<a href="https://www.instagram.com/reel/Db7C-_Pg-h_/" target="_blank" rel="noopener noreferrer">Aquí está la historia</a>.',
    retracto: 'Tienes <b>5 días hábiles</b> desde la entrega para retractarte, con el producto ' +
      'sin abrir y el sello intacto (son alimentos). Y si algo llega en mal estado o no ' +
      'corresponde, lo reponemos o devolvemos tu dinero sin costo. ' +
      '<a href="legal.html" target="_blank" rel="noopener">Los términos completos están aquí</a>.',
    pedido: 'Tu pedido queda confirmado cuando la pasarela aprueba el pago; te escribimos al ' +
      'correo y al celular que registraste. Si tienes tu número de referencia (CHOCATA-…), ' +
      'escríbenos por WhatsApp y te decimos en qué va.',
    salud: 'Nuestros productos son <b>alimentos</b>, no medicamentos: no diagnostican, tratan ni ' +
      'curan enfermedades. En la ficha de cada producto está la evidencia científica de sus ' +
      'ingredientes, con sus fuentes. Para casos médicos, consulta a tu profesional de salud.'
  };

  function respuestaCombos() {
    var combos = window.CHOCATA_CARRITO ? window.CHOCATA_CARRITO.combos() : [];
    if (!combos.length) return 'Los combos están en la sección <b>Combos</b> de la página.';
    var filas = combos.map(function (c) {
      return '• <b>' + c.nombre + '</b> — ' + window.CHOCATA_CARRITO.pesos(c.cop) +
             ' (ahorras ' + window.CHOCATA_CARRITO.pesos(c.ahorro) + ')';
    }).join('<br>');
    return 'Tenemos ' + combos.length + ' combos, todos más baratos que comprar suelto:<br>' +
      filas + '<br>Están en la sección <b>Combos</b>, listos para agregar al pedido.';
  }

  var INTENTOS = [
    { claves: ['envio', 'domicilio', 'entrega', 'llega', 'demora', 'transportadora', 'ciudad', 'gratis'], r: function () { return R.envios; } },
    { claves: ['pago', 'pagar', 'pse', 'tarjeta', 'nequi', 'bancolombia', 'efectivo', 'contraentrega', 'contra entrega'], r: function () { return R.pagos; } },
    { claves: ['minimo', 'pedido minimo'], r: function () { return R.minimo; } },
    { claves: ['combo', 'kit', 'promocion', 'descuento', 'oferta'], r: respuestaCombos },
    { claves: ['sede', 'local', 'tienda fisica', 'direccion', 'donde estan', 'donde queda', 'terremoto', 'visitar'], r: function () { return R.sede; } },
    { claves: ['devolucion', 'retracto', 'garantia', 'cambio', 'reembolso'], r: function () { return R.retracto; } },
    { claves: ['mi pedido', 'referencia', 'estado', 'confirmacion', 'factura'], r: function () { return R.pedido; } },
    { claves: ['enfermedad', 'medicamento', 'cura', 'diabetes', 'embarazo', 'medico'], r: function () { return R.salud; } }
  ];

  function responder(pregunta) {
    var n = normalizar(pregunta);

    /* Primero: ¿pregunta por un producto? */
    var prod = buscarProducto(n);
    var pidePrecio = /precio|cuanto|vale|cuesta|valor/.test(n);

    if (prod) {
      var precios = preciosDe(prod.key);
      var texto = '<b>' + prod.nombre + '</b><br>' + (precios || 'Consulta la ficha para precios.');
      if (!pidePrecio && prod.ficha.usage) {
        texto += '<br><br>' + prod.ficha.usage;
      }
      medirBot('producto: ' + prod.key);
      return { html: texto, ficha: prod.key };
    }

    for (var i = 0; i < INTENTOS.length; i++) {
      for (var j = 0; j < INTENTOS[i].claves.length; j++) {
        if (n.indexOf(INTENTOS[i].claves[j]) !== -1) {
          medirBot(INTENTOS[i].claves[0]);
          return { html: INTENTOS[i].r() };
        }
      }
    }

    medirBot('sin respuesta');
    return {
      html: 'Esa no me la sé, pero un humano sí. Escríbenos y te respondemos rápido:',
      wa: WA + '?text=' + encodeURIComponent('Hola CHOCATA, tengo una pregunta: ' + pregunta)
    };
  }

  /* ---------- Interfaz ---------- */

  var CHIPS = [
    ['¿Cuánto cuesta el envío?', 'envíos'],
    ['¿Cómo puedo pagar?', 'pagos'],
    ['Ver los combos', 'combos'],
    ['¿Qué pasó con la sede?', 'sede'],
    ['Devoluciones', 'retracto']
  ];

  var panel, hilo, campo;

  function construir() {
    var envoltura = document.createElement('div');
    envoltura.innerHTML =
      '<button class="bot-btn" id="botBtn" aria-label="Abrir el asistente de preguntas">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">' +
          '<path d="M21 12a8 8 0 0 1-8 8H4l2.4-2.4A8 8 0 1 1 21 12Z"/>' +
          '<path d="M8.5 11h.01M12 11h.01M15.5 11h.01" stroke-linecap="round" stroke-width="2.4"/>' +
        '</svg>' +
      '</button>' +
      '<div class="bot" id="bot" role="dialog" aria-modal="false" aria-label="Asistente de preguntas" hidden>' +
        '<header class="bot__cab">' +
          '<div><b>Sofi</b><span>Te ayudo con precios, envíos y pedidos</span></div>' +
          '<button class="bot__cerrar" id="botCerrar" aria-label="Cerrar el asistente">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
          '</button>' +
        '</header>' +
        '<div class="bot__hilo" id="botHilo" data-lenis-prevent></div>' +
        '<div class="bot__chips" id="botChips"></div>' +
        '<form class="bot__form" id="botForm">' +
          '<input id="botCampo" type="text" placeholder="Escribe tu pregunta…" autocomplete="off" maxlength="200">' +
          '<button class="btn" type="submit" aria-label="Enviar">→</button>' +
        '</form>' +
      '</div>';
    while (envoltura.firstChild) document.body.appendChild(envoltura.firstChild);

    panel = document.getElementById('bot');
    hilo = document.getElementById('botHilo');
    campo = document.getElementById('botCampo');

    var chips = document.getElementById('botChips');
    CHIPS.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'bot__chip'; b.textContent = c[0];
      b.addEventListener('click', function () { preguntar(c[0]); });
      chips.appendChild(b);
    });

    document.getElementById('botBtn').addEventListener('click', abrir);
    document.getElementById('botCerrar').addEventListener('click', cerrar);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) cerrar();
    });
    document.getElementById('botForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = campo.value.trim();
      if (!q) return;
      campo.value = '';
      preguntar(q);
    });
  }

  function burbuja(html, mia) {
    var b = document.createElement('div');
    b.className = 'bot__msg' + (mia ? ' bot__msg--mia' : '');
    b.innerHTML = html;
    hilo.appendChild(b);
    hilo.scrollTop = hilo.scrollHeight;
    return b;
  }

  function preguntar(q) {
    burbuja(q.replace(/[<>&]/g, ''), true);
    var r = responder(q);
    var b = burbuja(r.html);

    if (r.ficha) {
      var ver = document.createElement('button');
      ver.className = 'bot__accion'; ver.type = 'button';
      ver.textContent = 'Ver la ficha completa';
      ver.addEventListener('click', function () {
        cerrar();
        var tarjeta = document.querySelector('.card[data-product="' + r.ficha + '"]');
        if (tarjeta) tarjeta.click();
      });
      b.appendChild(ver);
    }
    if (r.wa) {
      var wa = document.createElement('a');
      wa.className = 'bot__accion'; wa.href = r.wa;
      wa.target = '_blank'; wa.rel = 'noopener noreferrer';
      wa.textContent = 'Escribir por WhatsApp';
      b.appendChild(wa);
    }
    hilo.scrollTop = hilo.scrollHeight;
  }

  function abrir() {
    panel.hidden = false;
    medirBot('abrir');
    if (!hilo.childElementCount) {
      burbuja('¡Hola! Soy <b>Sofi</b> 🚴‍♀️. Pregúntame por un producto, el envío, ' +
        'las formas de pago o lo que necesites. Y si no me la sé, te paso con un humano.');
    }
    campo.focus();
  }

  function cerrar() { panel.hidden = true; }

  /* El catálogo llega por fetch: el bot arranca cuando está listo para poder
     responder precios; si algo falla, arranca igual con las respuestas fijas. */
  if (window.CHOCATA_CARRITO && window.CHOCATA_CARRITO.combos().length) construir();
  else document.addEventListener('chocata:catalogo-listo', construir, { once: true });
  setTimeout(function () { if (!document.getElementById('bot')) construir(); }, 4000);
})();

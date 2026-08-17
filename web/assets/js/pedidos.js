/* =========================================================================
   CHOCATA — Central de despachos

   Módulo de control logístico: panel con la antigüedad de los pedidos
   pendientes (semáforo de 24/48 horas), tabla compacta ordenable con una
   fila por pedido, y detalle expandible con los datos de entrega y las
   acciones (despachar, WhatsApp, reenviar correo, imprimir rótulo).
   La clave viaja en cada consulta y el servidor la compara en tiempo
   constante; solo se recuerda en la pestaña (sessionStorage).
   ========================================================================= */
(function () {
  'use strict';

  var LLAVE = 'chocata.admin.clave';
  var puerta = document.getElementById('puerta');
  var tablero = document.getElementById('tablero');
  var lista = document.getElementById('lista');
  var stats = document.getElementById('estadisticas');
  var errorCaja = document.getElementById('puertaError');
  var filtroActivo = 'todos';
  var pedidos = [];
  var expandidas = {};                    /* referencias abiertas, sobreviven al repintado */
  var orden = { campo: 'fecha', dir: -1 }; /* recientes primero */

  var HORA = 3600 * 1000;

  function pesos(n) { return typeof n === 'number' ? '$' + n.toLocaleString('es-CO') : '—'; }

  function fecha(iso) {
    try {
      return new Date(iso).toLocaleString('es-CO', {
        day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true
      });
    } catch (e) { return iso || ''; }
  }

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function horasDesde(iso) {
    var t = Date.parse(iso);
    return isNaN(t) ? 0 : (Date.now() - t) / HORA;
  }

  function unidades(p) {
    return (p.lineas || []).reduce(function (n, l) { return n + (l.cant || 0); }, 0);
  }

  /* El estado que se muestra: el despacho manda sobre el estado del pago. */
  function estadoVisual(p) {
    if (p.despacho) return 'DESPACHADO';
    return p.estado || '—';
  }

  var ESTADOS = {
    DESPACHADO: ['Despachado', 'ok'],
    APPROVED: ['Por despachar', 'atencion'],
    PENDIENTE: ['Pendiente de pago', 'gris'],
    REVISAR_MONTO: ['⚠ Revisar monto', 'alerta'],
    DECLINED: ['Rechazado', 'gris'],
    VOIDED: ['Anulado', 'gris'],
    ERROR: ['Error pasarela', 'gris']
  };

  /* ---------- Panel logístico ---------- */

  function pendientesPorEdad() {
    var r = { ok: [], media: [], alta: [] };
    pedidos.forEach(function (p) {
      if (p.estado !== 'APPROVED' || p.despacho) return;
      var h = horasDesde(p.creado);
      if (h < 24) r.ok.push(p);
      else if (h < 48) r.media.push(p);
      else r.alta.push(p);
    });
    return r;
  }

  function pintarPanel() {
    var edad = pendientesPorEdad();
    var pendientes = edad.ok.length + edad.media.length + edad.alta.length;

    var despachados = pedidos.filter(function (p) { return p.despacho; });
    var hoyTxt = new Date().toDateString();
    var despHoy = 0, desp7 = 0, sumaHoras = 0, conTiempos = 0;
    despachados.forEach(function (p) {
      var f = Date.parse(p.despacho.fecha);
      if (!isNaN(f)) {
        if (new Date(f).toDateString() === hoyTxt) despHoy++;
        if (Date.now() - f < 7 * 24 * HORA) desp7++;
        var c = Date.parse(p.creado);
        if (!isNaN(c) && f > c) { sumaHoras += (f - c) / HORA; conTiempos++; }
      }
    });
    var promedio = conTiempos
      ? (sumaHoras / conTiempos < 48
          ? Math.round(sumaHoras / conTiempos) + ' h'
          : (sumaHoras / conTiempos / 24).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' d')
      : '—';

    var vendido = pedidos
      .filter(function (p) { return p.estado === 'APPROVED'; })
      .reduce(function (n, p) { return n + (p.total || 0); }, 0);

    function ficha(clase, filtro, n, titulo, detalle) {
      return '<button type="button" class="log-ficha log-ficha--' + clase +
        (n ? '' : ' log-ficha--vacia') + '" data-fb="' + filtro + '"' +
        ' aria-pressed="' + String(filtroActivo === filtro) + '">' +
        '<b>' + n + '</b><span>' + titulo + '</span><small>' + detalle + '</small></button>';
    }

    stats.innerHTML =
      '<section class="log-grupo" aria-label="Pedidos por despachar">' +
        '<header><h2>Por despachar</h2><b>' + pendientes + '</b></header>' +
        '<div class="log-fichas">' +
          ficha('verde', 'EDAD_OK', edad.ok.length, 'Recientes', 'menos de 24 h') +
          ficha('ambar', 'EDAD_MEDIA', edad.media.length, 'En plazo', 'entre 24 y 48 h') +
          ficha('roja', 'EDAD_ALTA', edad.alta.length, 'Urgentes', 'más de 48 h') +
        '</div>' +
      '</section>' +
      '<section class="log-grupo" aria-label="Pedidos despachados">' +
        '<header><h2>Despachados</h2><b>' + despachados.length + '</b></header>' +
        '<div class="log-fichas">' +
          ficha('neutra', 'DESP_HOY', despHoy, 'Hoy', 'salieron hoy') +
          ficha('neutra', 'DESP_7', desp7, 'Semana', 'últimos 7 días') +
          '<div class="log-ficha log-ficha--dato"><b>' + promedio + '</b>' +
            '<span>T. de despacho</span><small>promedio pago → envío</small></div>' +
        '</div>' +
      '</section>' +
      '<section class="log-grupo log-grupo--dinero" aria-label="Ventas">' +
        '<header><h2>Vendido</h2></header>' +
        '<p class="log-dinero">' + pesos(vendido) + '</p>' +
        '<a class="log-enlace" href="tablero.html">Ver tablero completo →</a>' +
      '</section>';

    stats.querySelectorAll('[data-fb]').forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-fb');
        filtroActivo = (filtroActivo === f) ? 'todos' : f;
        sincronizarChips();
        pintar();
      });
    });
  }

  function sincronizarChips() {
    document.querySelectorAll('.admin-filtro').forEach(function (x) {
      x.setAttribute('aria-pressed', String(x.getAttribute('data-f') === filtroActivo));
    });
  }

  /* ---------- Filtros ---------- */

  function coincide(p) {
    var h = horasDesde(p.creado);
    var pendiente = p.estado === 'APPROVED' && !p.despacho;
    switch (filtroActivo) {
      case 'todos': return true;
      case 'POR_DESPACHAR': return pendiente;
      case 'DESPACHADO': return !!p.despacho;
      case 'EDAD_OK': return pendiente && h < 24;
      case 'EDAD_MEDIA': return pendiente && h >= 24 && h < 48;
      case 'EDAD_ALTA': return pendiente && h >= 48;
      case 'DESP_HOY': return !!p.despacho && new Date(Date.parse(p.despacho.fecha)).toDateString() === new Date().toDateString();
      case 'DESP_7': return !!p.despacho && Date.now() - Date.parse(p.despacho.fecha) < 7 * 24 * HORA;
      default: return p.estado === filtroActivo;
    }
  }

  /* ---------- Detalle del pedido (la tarjeta de siempre) ---------- */

  function tarjeta(p) {
    var ev = estadoVisual(p);
    var e = ESTADOS[ev] || [ev, 'gris'];
    var c = p.cliente || {};
    var lineas = (p.lineas || []).map(function (l) {
      return '<li>' + l.cant + ' × ' + esc(l.nombre) + ' <em>' + esc(l.talla) + '</em></li>';
    }).join('');
    var direccion = [c.direccion, c.ciudad, c.departamento].filter(Boolean).join(', ');
    var celular = String(c.celular || '').replace(/\D/g, '');

    var bloqueDespacho = '';
    if (p.despacho) {
      bloqueDespacho = '<p class="admin-guia">Guía: <b>' + (esc(p.despacho.guia) || 'sin número') +
        '</b> · ' + fecha(p.despacho.fecha) + '</p>';
    } else if (p.estado === 'APPROVED') {
      bloqueDespacho =
        '<div class="admin-despachar">' +
          '<input type="text" maxlength="60" placeholder="Nº de guía transportadora" data-guia="' + esc(p.referencia) + '">' +
          '<button class="btn" type="button" data-despachar="' + esc(p.referencia) + '">Marcar despachado</button>' +
        '</div>';
    }

    return '<article class="admin-pedido" data-estado="' + esc(ev) + '">' +
      '<header>' +
        '<span class="admin-estado admin-estado--' + e[1] + '">' + e[0] + '</span>' +
        '<time>' + fecha(p.creado) + '</time>' +
      '</header>' +
      '<p class="admin-ref">' + esc(p.referencia) + '</p>' +
      '<ul class="admin-lineas">' + lineas + '</ul>' +
      '<p class="admin-total">Producto ' + pesos(p.subtotal) + ' · Envío ' + pesos(p.envio) +
        ' · <b>Total ' + pesos(p.total) + '</b></p>' +
      (c.nombre
        ? '<div class="admin-cliente">' +
            '<b>' + esc(c.nombre) + '</b> · ' + esc(c.tipoDocumento || 'CC') + ' ' + esc(c.documento || '') + '<br>' +
            (celular ? '📱 ' + esc(celular) : '') +
            (c.correo ? (celular ? ' · ' : '') + '✉️ ' + esc(c.correo) : '') +
            ((celular || c.correo) ? '<br>' : '') +
            esc(direccion) +
            (c.notas ? '<br><em>Notas: ' + esc(c.notas) + '</em>' : '') +
          '</div>' +
          '<div class="admin-acciones">' +
            (celular
              ? '<a class="btn btn--ghost" href="https://wa.me/57' + celular.slice(-10) +
                '?text=' + encodeURIComponent('Hola ' + (c.nombre || '').split(' ')[0] +
                ', te escribimos de CHOCATA por tu pedido ' + p.referencia) +
                '" target="_blank" rel="noopener noreferrer">WhatsApp al cliente</a>'
              : '') +
            '<button class="btn btn--ghost" type="button" data-copiar="' +
              esc(c.nombre + ' — ' + celular + ' — ' + direccion + (c.notas ? ' — ' + c.notas : '')) +
            '">Copiar datos de envío</button>' +
            (p.estado === 'APPROVED' && c.correo
              ? '<button class="btn btn--ghost" type="button" data-reenviar="' + esc(p.referencia) +
                '">Reenviar correo</button>'
              : '') +
            '<button class="btn btn--ghost" type="button" data-rotulo="' + esc(p.referencia) +
              '">Imprimir rótulo</button>' +
          '</div>'
        : '<p class="admin-cliente"><em>Pago huérfano: sin datos de pedido. Buscar en el panel de Wompi.</em></p>') +
      bloqueDespacho +
    '</article>';
  }

  /* ---------- Tabla ---------- */

  var COLUMNAS = [
    { campo: 'fecha', titulo: 'Fecha' },
    { campo: 'cliente', titulo: 'Cliente' },
    { campo: 'ciudad', titulo: 'Ciudad', clase: 'log-oc' },
    { campo: 'items', titulo: 'Ítems', clase: 'log-oc log-num' },
    { campo: 'total', titulo: 'Total', clase: 'log-num' },
    { campo: 'estado', titulo: 'Estado' }
  ];

  function valorDe(p, campo) {
    switch (campo) {
      case 'fecha': return Date.parse(p.creado) || 0;
      case 'cliente': return ((p.cliente || {}).nombre || '').toLowerCase();
      case 'ciudad': return ((p.cliente || {}).ciudad || '').toLowerCase();
      case 'items': return unidades(p);
      case 'total': return p.total || 0;
      case 'estado': return (ESTADOS[estadoVisual(p)] || ['—'])[0];
      default: return 0;
    }
  }

  function filaTabla(p) {
    var ev = estadoVisual(p);
    var e = ESTADOS[ev] || [ev, 'gris'];
    var c = p.cliente || {};
    var abierta = !!expandidas[p.referencia];
    var pendiente = p.estado === 'APPROVED' && !p.despacho;
    var edadClase = '';
    if (pendiente) {
      var h = horasDesde(p.creado);
      edadClase = ' log-fila--pendiente' +
        (h >= 48 ? ' log-fila--urgente' : (h >= 24 ? ' log-fila--enplazo' : ''));
    }

    return '<tr class="log-fila' + edadClase + '" data-ref="' + esc(p.referencia) + '" tabindex="0"' +
        ' aria-expanded="' + String(abierta) + '" title="Ver el detalle del pedido">' +
        '<td>' + fecha(p.creado) + '</td>' +
        '<td class="log-nombre">' + esc(c.nombre || '— huérfano —') + '</td>' +
        '<td class="log-oc">' + esc(c.ciudad || '—') + '</td>' +
        '<td class="log-oc log-num">' + unidades(p) + '</td>' +
        '<td class="log-num log-plata">' + pesos(p.total) + '</td>' +
        '<td><span class="admin-estado admin-estado--' + e[1] + '">' + e[0] + '</span></td>' +
        '<td class="log-mas" aria-hidden="true">' + (abierta ? '−' : '+') + '</td>' +
      '</tr>' +
      '<tr class="log-detalle"' + (abierta ? '' : ' hidden') + '><td colspan="7">' + tarjeta(p) + '</td></tr>';
  }

  function pintar() {
    pintarPanel();

    var visibles = pedidos.filter(coincide).sort(function (a, b) {
      var va = valorDe(a, orden.campo), vb = valorDe(b, orden.campo);
      if (va < vb) return -orden.dir;
      if (va > vb) return orden.dir;
      return 0;
    });

    if (!visibles.length) {
      lista.innerHTML = '<p class="admin-vacio">No hay pedidos ' +
        (filtroActivo === 'todos' ? 'todavía.' : 'en este grupo.') + '</p>';
      return;
    }

    var cabecera = COLUMNAS.map(function (col) {
      var activa = orden.campo === col.campo;
      return '<th' + (col.clase ? ' class="' + col.clase + '"' : '') +
        ' data-orden="' + col.campo + '"' +
        ' aria-sort="' + (activa ? (orden.dir > 0 ? 'ascending' : 'descending') : 'none') + '">' +
        '<button type="button">' + col.titulo + (activa ? (orden.dir > 0 ? ' ↑' : ' ↓') : '') + '</button></th>';
    }).join('') + '<th></th>';

    lista.innerHTML =
      '<div class="log-caja"><table class="log-tabla">' +
        '<thead><tr>' + cabecera + '</tr></thead>' +
        '<tbody>' + visibles.map(filaTabla).join('') + '</tbody>' +
      '</table></div>';

    /* Orden por columna */
    lista.querySelectorAll('th[data-orden] button').forEach(function (b) {
      b.addEventListener('click', function () {
        var campo = b.parentElement.getAttribute('data-orden');
        if (orden.campo === campo) orden.dir = -orden.dir;
        else orden = { campo: campo, dir: campo === 'fecha' ? -1 : 1 };
        pintar();
      });
    });

    /* Expandir y colapsar el detalle */
    lista.querySelectorAll('.log-fila').forEach(function (fila) {
      function alternar() {
        var ref = fila.getAttribute('data-ref');
        expandidas[ref] = !expandidas[ref];
        var detalle = fila.nextElementSibling;
        if (detalle) detalle.hidden = !expandidas[ref];
        fila.setAttribute('aria-expanded', String(!!expandidas[ref]));
        var mas = fila.querySelector('.log-mas');
        if (mas) mas.textContent = expandidas[ref] ? '−' : '+';
      }
      fila.addEventListener('click', alternar);
      fila.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(); }
      });
    });

    /* Acciones dentro del detalle (los clics no colapsan la fila: viven en otra <tr>) */

    lista.querySelectorAll('[data-copiar]').forEach(function (b) {
      b.addEventListener('click', function () {
        navigator.clipboard.writeText(b.getAttribute('data-copiar')).then(function () {
          var t = b.textContent;
          b.textContent = '¡Copiado!';
          setTimeout(function () { b.textContent = t; }, 1400);
        });
      });
    });

    lista.querySelectorAll('[data-rotulo]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = pedidos.filter(function (x) { return x.referencia === b.getAttribute('data-rotulo'); })[0];
        if (p) imprimirRotulo(p);
      });
    });

    lista.querySelectorAll('[data-reenviar]').forEach(function (b) {
      b.addEventListener('click', function () {
        b.disabled = true;
        var t = b.textContent;
        b.textContent = 'Enviando…';
        fetch('/api/reenviar-correo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': sessionStorage.getItem(LLAVE) || ''
          },
          body: JSON.stringify({ referencia: b.getAttribute('data-reenviar') })
        })
          .then(function (r) { return r.json(); })
          .then(function (d) { alert(d.detalle || d.mensaje || 'Sin respuesta.'); })
          .catch(function () { alert('No se pudo reenviar. Intenta de nuevo.'); })
          .then(function () { b.disabled = false; b.textContent = t; });
      });
    });

    lista.querySelectorAll('[data-despachar]').forEach(function (b) {
      b.addEventListener('click', function () {
        var ref = b.getAttribute('data-despachar');
        var campo = lista.querySelector('[data-guia="' + ref + '"]');
        var guia = campo ? campo.value.trim() : '';
        if (!guia && !confirm('¿Marcar como despachado sin número de guía?')) return;
        b.disabled = true;
        b.textContent = 'Guardando…';
        fetch('/api/despachar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': sessionStorage.getItem(LLAVE) || ''
          },
          body: JSON.stringify({ referencia: ref, guia: guia })
        })
          .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
          .then(function (res) {
            if (!res.ok) throw new Error(res.d.mensaje || 'No se pudo registrar.');
            var p = pedidos.filter(function (x) { return x.referencia === ref; })[0];
            if (p) p.despacho = res.d.despacho;
            pintar();
          })
          .catch(function (err) {
            b.disabled = false;
            b.textContent = 'Marcar despachado';
            alert(err.message);
          });
      });
    });
  }

  /* ---------- Rótulo de envío ---------- */

  /* Arma la etiqueta en el nodo #rotulo y abre el diálogo de impresión.
     El CSS de impresión oculta todo lo demás: sale solo la etiqueta. */
  function imprimirRotulo(p) {
    var c = p.cliente || {};
    var celular = String(c.celular || '').replace(/\D/g, '');
    var contenido = (p.lineas || []).map(function (l) {
      return l.cant + ' × ' + l.nombre + ' ' + l.talla;
    }).join(' · ');

    document.getElementById('rotulo').innerHTML =
      '<div class="rotulo__marco">' +
        '<div class="rotulo__cabecera">' +
          '<img class="rotulo__logo" src="assets/img/brand/chocata-logo.png" alt="CHOCATA">' +
          '<p class="rotulo__ref">' + esc(p.referencia) + '</p>' +
        '</div>' +
        '<p class="rotulo__rol">Destinatario</p>' +
        '<p class="rotulo__nombre">' + esc(c.nombre || '') + '</p>' +
        '<p class="rotulo__linea">' + esc(c.tipoDocumento || 'CC') + ' ' + esc(c.documento || '') +
          (celular ? ' · Cel. ' + esc(celular) : '') + '</p>' +
        '<p class="rotulo__direccion">' + esc(c.direccion || '') + '</p>' +
        '<p class="rotulo__ciudad">' + esc([c.ciudad, c.departamento].filter(Boolean).join(', ')) + '</p>' +
        (c.notas ? '<p class="rotulo__linea">Indicaciones: ' + esc(c.notas) + '</p>' : '') +
        '<hr class="rotulo__corte">' +
        '<p class="rotulo__rol">Remitente</p>' +
        '<p class="rotulo__linea"><b>CHOCATA Colombia</b> · Cali, Valle del Cauca</p>' +
        '<p class="rotulo__linea">WhatsApp +57 317 668 5235 · pedidos@chocata.com.co</p>' +
        (contenido ? '<p class="rotulo__contenido">Contenido: ' + esc(contenido) + '</p>' : '') +
      '</div>';

    document.body.classList.add('imprimiendo');
    window.print();
    document.body.classList.remove('imprimiendo');
  }

  /* ---------- Sesión ---------- */

  function cargar(clave) {
    errorCaja.textContent = '';
    return fetch('/api/pedidos', { headers: { 'x-admin-token': clave } })
      .then(function (r) {
        if (r.status === 401) throw new Error('Clave incorrecta.');
        if (!r.ok) throw new Error('No pudimos cargar los pedidos. Intenta de nuevo.');
        return r.json();
      })
      .then(function (d) {
        pedidos = d.pedidos || [];
        try { sessionStorage.setItem(LLAVE, clave); } catch (e) { /* incógnito */ }
        puerta.hidden = true;
        tablero.hidden = false;
        document.getElementById('refrescar').hidden = false;
        document.getElementById('probarCorreo').hidden = false;
        document.getElementById('salir').hidden = false;
        pintar();
      });
  }

  puerta.addEventListener('submit', function (e) {
    e.preventDefault();
    var clave = document.getElementById('clave').value.trim();
    if (!clave) return;
    cargar(clave).catch(function (err) { errorCaja.textContent = err.message; });
  });

  document.getElementById('filtros').addEventListener('click', function (e) {
    var b = e.target.closest('.admin-filtro');
    if (!b) return;
    filtroActivo = b.getAttribute('data-f');
    sincronizarChips();
    pintar();
  });

  document.getElementById('probarCorreo').addEventListener('click', function () {
    var b = this;
    b.disabled = true; b.textContent = 'Enviando…';
    fetch('/api/probar-correo', {
      method: 'POST',
      headers: { 'x-admin-token': sessionStorage.getItem(LLAVE) || '' }
    })
      .then(function (r) { return r.json(); })
      .then(function (d) { alert(d.detalle || 'Sin respuesta.'); })
      .catch(function () { alert('No se pudo probar. Intenta de nuevo.'); })
      .then(function () { b.disabled = false; b.textContent = 'Probar correo'; });
  });

  document.getElementById('refrescar').addEventListener('click', function () {
    var clave = sessionStorage.getItem(LLAVE);
    if (clave) cargar(clave).catch(function (err) { errorCaja.textContent = err.message; });
  });

  document.getElementById('salir').addEventListener('click', function () {
    try { sessionStorage.removeItem(LLAVE); } catch (e) { /* nada */ }
    location.reload();
  });

  var guardada = null;
  try { guardada = sessionStorage.getItem(LLAVE); } catch (e) { /* incógnito */ }
  if (guardada) cargar(guardada).catch(function () { try { sessionStorage.removeItem(LLAVE); } catch (e) {} });
})();

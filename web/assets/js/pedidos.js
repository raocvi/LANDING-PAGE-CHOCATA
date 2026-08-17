/* =========================================================================
   CHOCATA — Central de despachos

   Página privada de la administración: estadísticas del historial, lista de
   pedidos con datos de entrega, y control de despacho con número de guía.
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

  /* El estado que se muestra: el despacho manda sobre el estado del pago. */
  function estadoVisual(p) {
    if (p.despacho) return 'DESPACHADO';
    return p.estado || '—';
  }

  var ESTADOS = {
    DESPACHADO: ['Despachado', 'ok'],
    APPROVED: ['Pagado · por despachar', 'atencion'],
    PENDIENTE: ['Pendiente de pago', 'gris'],
    REVISAR_MONTO: ['⚠ Revisar monto — no despachar', 'alerta'],
    DECLINED: ['Rechazado', 'gris'],
    VOIDED: ['Anulado', 'gris'],
    ERROR: ['Error en la pasarela', 'gris']
  };

  /* ---------- Estadísticas del historial ---------- */

  function pintarEstadisticas() {
    var pagados = pedidos.filter(function (p) { return p.estado === 'APPROVED'; });
    var vendido = pagados.reduce(function (n, p) { return n + (p.total || 0); }, 0);
    var porDespachar = pagados.filter(function (p) { return !p.despacho; }).length;
    var despachados = pagados.length - porDespachar;

    var unidades = {};
    pagados.forEach(function (p) {
      (p.lineas || []).forEach(function (l) {
        unidades[l.nombre] = (unidades[l.nombre] || 0) + l.cant;
      });
    });
    var top = Object.keys(unidades).sort(function (a, b) { return unidades[b] - unidades[a]; })[0];

    stats.innerHTML =
      '<div class="admin-stat"><b>' + pesos(vendido) + '</b><span>Vendido (pagado)</span></div>' +
      '<div class="admin-stat"><b>' + pagados.length + '</b><span>Pedidos pagados</span></div>' +
      '<div class="admin-stat' + (porDespachar ? ' admin-stat--pendiente' : '') + '"><b>' + porDespachar + '</b><span>Por despachar</span></div>' +
      '<div class="admin-stat"><b>' + despachados + '</b><span>Despachados</span></div>' +
      (top ? '<div class="admin-stat admin-stat--ancho"><b>' + esc(top) + '</b><span>Más vendido (' + unidades[top] + ' und)</span></div>' : '');
  }

  /* ---------- Tarjetas ---------- */

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
          '</div>'
        : '<p class="admin-cliente"><em>Pago huérfano: sin datos de pedido. Buscar en el panel de Wompi.</em></p>') +
      bloqueDespacho +
    '</article>';
  }

  function coincide(p) {
    if (filtroActivo === 'todos') return true;
    if (filtroActivo === 'POR_DESPACHAR') return p.estado === 'APPROVED' && !p.despacho;
    if (filtroActivo === 'DESPACHADO') return !!p.despacho;
    return p.estado === filtroActivo;
  }

  function pintar() {
    pintarEstadisticas();
    var visibles = pedidos.filter(coincide);
    lista.innerHTML = visibles.length
      ? visibles.map(tarjeta).join('')
      : '<p class="admin-vacio">No hay pedidos ' +
        (filtroActivo === 'todos' ? 'todavía.' : 'en este estado.') + '</p>';

    lista.querySelectorAll('[data-copiar]').forEach(function (b) {
      b.addEventListener('click', function () {
        navigator.clipboard.writeText(b.getAttribute('data-copiar')).then(function () {
          var t = b.textContent;
          b.textContent = '¡Copiado!';
          setTimeout(function () { b.textContent = t; }, 1400);
        });
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
    document.querySelectorAll('.admin-filtro').forEach(function (x) {
      x.setAttribute('aria-pressed', String(x === b));
    });
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

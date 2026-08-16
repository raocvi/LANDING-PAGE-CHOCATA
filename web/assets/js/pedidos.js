/* =========================================================================
   CHOCATA — Central de despachos

   Página privada de la administración: lista los pedidos con todo lo
   necesario para despachar. La clave nunca se guarda en el servidor de la
   página; viaja en cada consulta y el servidor la compara en tiempo
   constante. Se recuerda solo en este navegador (sessionStorage), así al
   cerrar la pestaña vuelve a pedirla.
   ========================================================================= */
(function () {
  'use strict';

  var LLAVE = 'chocata.admin.clave';
  var puerta = document.getElementById('puerta');
  var tablero = document.getElementById('tablero');
  var lista = document.getElementById('lista');
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

  var ESTADOS = {
    APPROVED: ['Pagado', 'ok'],
    PENDIENTE: ['Pendiente de pago', 'espera'],
    REVISAR_MONTO: ['⚠ Revisar monto — no despachar', 'alerta'],
    DECLINED: ['Rechazado', 'gris'],
    VOIDED: ['Anulado', 'gris'],
    ERROR: ['Error en la pasarela', 'gris']
  };

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function tarjeta(p) {
    var e = ESTADOS[p.estado] || [p.estado || '—', 'gris'];
    var c = p.cliente || {};
    var lineas = (p.lineas || []).map(function (l) {
      return '<li>' + l.cant + ' × ' + esc(l.nombre) + ' <em>' + esc(l.talla) + '</em></li>';
    }).join('');
    var direccion = [c.direccion, c.ciudad, c.departamento].filter(Boolean).join(', ');
    var celular = String(c.celular || '').replace(/\D/g, '');

    return '<article class="admin-pedido" data-estado="' + esc(p.estado) + '">' +
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
            '<button class="btn" type="button" data-copiar="' +
              esc(c.nombre + ' — ' + celular + ' — ' + direccion + (c.notas ? ' — ' + c.notas : '')) +
            '">Copiar datos de envío</button>' +
          '</div>'
        : '<p class="admin-cliente"><em>Pago huérfano: sin datos de pedido. Buscar en el panel de Wompi.</em></p>') +
    '</article>';
  }

  function pintar() {
    var visibles = pedidos.filter(function (p) {
      return filtroActivo === 'todos' || p.estado === filtroActivo;
    });
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
  }

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

  document.getElementById('refrescar').addEventListener('click', function () {
    var clave = sessionStorage.getItem(LLAVE);
    if (clave) cargar(clave).catch(function (err) { errorCaja.textContent = err.message; });
  });

  document.getElementById('salir').addEventListener('click', function () {
    try { sessionStorage.removeItem(LLAVE); } catch (e) { /* nada */ }
    location.reload();
  });

  /* Si la clave quedó de esta misma sesión, entra directo. */
  var guardada = null;
  try { guardada = sessionStorage.getItem(LLAVE); } catch (e) { /* incógnito */ }
  if (guardada) cargar(guardada).catch(function () { try { sessionStorage.removeItem(LLAVE); } catch (e) {} });
})();

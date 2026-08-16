/* =========================================================================
   CHOCATA — Tablero de inteligencia del negocio

   Filtro cruzado al estilo de las herramientas serias: tocar una barra, una
   porción o un día filtra todo lo demás. Cada gráfica de una dimensión se
   dibuja con los datos filtrados por las OTRAS dimensiones —así sus barras
   no desaparecen al tocarlas— y marca la selección propia; los KPI y la
   tabla obedecen a todos los filtros juntos.

   SVG dibujado a mano, sin librerías: la CSP queda intacta y cada marca
   sigue las especificaciones de la guía (barras finas, puntas redondeadas,
   separación de 2px, tooltips en hover). Paleta validada por script contra
   daltonismo y contraste sobre el fondo oscuro.
   ========================================================================= */
(function () {
  'use strict';

  var LLAVE = 'chocata.admin.clave';
  var COLORES = { dorado: '#C68600', rosa: '#DC4B85', azul: '#4C89E8', verde: '#2EA45B', violeta: '#8F7BF2' };
  var ESTADOS_META = {
    DESPACHADO: { nombre: 'Despachado', color: COLORES.verde },
    APPROVED: { nombre: 'Por despachar', color: COLORES.dorado },
    PENDIENTE: { nombre: 'Pendiente de pago', color: '#6E645B' },
    REVISAR_MONTO: { nombre: 'Revisar', color: COLORES.rosa },
    OTRO: { nombre: 'Otros', color: '#4a443d' }
  };

  var pedidos = [];
  var filtros = { producto: null, ciudad: null, estado: null, dia: null, mes: null };

  var puerta = document.getElementById('puerta');
  var tablero = document.getElementById('tablero');
  var errorCaja = document.getElementById('puertaError');
  var tooltip = document.getElementById('tooltip');

  /* ---------- Utilidades ---------- */

  function pesos(n) { return '$' + Math.round(n).toLocaleString('es-CO'); }
  function pesosCortos(n) {
    if (n >= 1000000) return '$' + (n / 1000000).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' M';
    if (n >= 1000) return '$' + Math.round(n / 1000) + ' mil';
    return pesos(n);
  }
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function diaDe(iso) { return String(iso || '').slice(0, 10); }

  function estadoDe(p) {
    if (p.despacho) return 'DESPACHADO';
    return ESTADOS_META[p.estado] ? p.estado : 'OTRO';
  }
  function pagado(p) { return p.estado === 'APPROVED'; }

  /* Filtra por todas las dimensiones activas, excepto la propia. */
  function filtrar(excepto) {
    return pedidos.filter(function (p) {
      if (excepto !== 'producto' && filtros.producto &&
          !(p.lineas || []).some(function (l) { return l.nombre === filtros.producto; })) return false;
      if (excepto !== 'ciudad' && filtros.ciudad &&
          ((p.cliente && p.cliente.ciudad) || '—') !== filtros.ciudad) return false;
      if (excepto !== 'estado' && filtros.estado && estadoDe(p) !== filtros.estado) return false;
      if (excepto !== 'dia' && filtros.dia && diaDe(p.creado) !== filtros.dia) return false;
      if (excepto !== 'mes' && filtros.mes && String(p.creado || '').slice(0, 7) !== filtros.mes) return false;
      return true;
    });
  }

  function alternar(dim, valor) {
    filtros[dim] = filtros[dim] === valor ? null : valor;
    pintar();
  }

  /* ---------- Tooltip ---------- */

  function mostrarTip(ev, html) {
    tooltip.innerHTML = html;
    tooltip.hidden = false;
    var x = Math.min(ev.clientX + 14, window.innerWidth - tooltip.offsetWidth - 10);
    tooltip.style.left = x + 'px';
    tooltip.style.top = (ev.clientY - tooltip.offsetHeight - 10) + 'px';
  }
  function ocultarTip() { tooltip.hidden = true; }

  function conTip(el, html) {
    el.addEventListener('mousemove', function (ev) { mostrarTip(ev, html); });
    el.addEventListener('mouseleave', ocultarTip);
  }

  /* ---------- KPIs ---------- */

  function pintarKpis() {
    var datos = filtrar(null);
    var pagados = datos.filter(pagado);
    var vendido = pagados.reduce(function (n, p) { return n + (p.total || 0); }, 0);
    var unidades = pagados.reduce(function (n, p) {
      return n + (p.lineas || []).reduce(function (m, l) { return m + l.cant; }, 0);
    }, 0);
    var ticket = pagados.length ? vendido / pagados.length : 0;
    var porDespachar = pagados.filter(function (p) { return !p.despacho; }).length;

    document.getElementById('kpis').innerHTML =
      '<div class="tb-kpi"><b>' + pesos(vendido) + '</b><span>Vendido</span></div>' +
      '<div class="tb-kpi"><b>' + pagados.length + '</b><span>Pedidos pagados</span></div>' +
      '<div class="tb-kpi"><b>' + (pagados.length ? pesos(ticket) : '—') + '</b><span>Ticket promedio</span></div>' +
      '<div class="tb-kpi"><b>' + unidades + '</b><span>Unidades</span></div>' +
      '<div class="tb-kpi' + (porDespachar ? ' tb-kpi--alerta' : '') + '"><b>' + porDespachar + '</b><span>Por despachar</span></div>';
  }

  /* ---------- Barras horizontales ---------- */

  function barrasH(cajaId, datos, color, dim, formato, formato2) {
    var caja = document.getElementById(cajaId);
    if (!datos.length) { caja.innerHTML = '<p class="tb-vacio">Sin datos con este filtro.</p>'; return; }

    var max = Math.max.apply(null, datos.map(function (d) { return d.v; }));
    var alto = datos.length * 42;
    var svg = ['<svg viewBox="0 0 560 ' + alto + '" role="img" aria-label="Gráfica de barras">'];

    datos.forEach(function (d, i) {
      var y = i * 42;
      var w = Math.max(6, (d.v / max) * 330);
      var sel = filtros[dim] === d.k;
      var apagada = filtros[dim] && !sel;
      svg.push(
        '<g class="tb-barra' + (apagada ? ' tb-apagada' : '') + (sel ? ' tb-seleccion' : '') + '" data-k="' + esc(d.k) + '">' +
          '<rect class="tb-hit" x="0" y="' + y + '" width="560" height="40" rx="8"/>' +
          '<text class="tb-etiqueta" x="0" y="' + (y + 15) + '">' + esc(d.k.length > 26 ? d.k.slice(0, 25) + '…' : d.k) + '</text>' +
          '<rect class="tb-pista" x="0" y="' + (y + 22) + '" width="330" height="10" rx="4"/>' +
          '<rect class="tb-relleno" x="0" y="' + (y + 22) + '" width="' + w + '" height="10" rx="4" fill="' + color + '"/>' +
          '<text class="tb-valor" x="' + 340 + '" y="' + (y + (formato2 ? 24 : 31)) + '">' + formato(d.v) + '</text>' +
          (formato2 ? '<text class="tb-valor2" x="' + 340 + '" y="' + (y + 37) + '">' + formato2(d) + '</text>' : '') +
        '</g>'
      );
    });
    svg.push('</svg>');
    caja.innerHTML = svg.join('');

    caja.querySelectorAll('.tb-barra').forEach(function (g, i) {
      g.addEventListener('click', function () { alternar(dim, datos[i].k); });
      conTip(g, '<b>' + esc(datos[i].k) + '</b><br>' + formato(datos[i].v) +
        (datos[i].extra ? '<br>' + datos[i].extra : ''));
    });
  }

  function pintarProductos() {
    var datos = filtrar('producto').filter(pagado);
    var conteo = {}, plata = {};
    datos.forEach(function (p) {
      (p.lineas || []).forEach(function (l) {
        conteo[l.nombre] = (conteo[l.nombre] || 0) + l.cant;
        plata[l.nombre] = (plata[l.nombre] || 0) + (l.total || 0);
      });
    });
    var lista = Object.keys(plata)
      .map(function (k) { return { k: k, v: plata[k], extra: conteo[k] + ' unidades' }; })
      .sort(function (a, b) { return b.v - a.v; }).slice(0, 7);
    barrasH('graficaProductos', lista, COLORES.azul, 'producto', pesosCortos, function (d) { return conteo[d.k] + ' und'; });
  }

  function pintarCiudades() {
    var datos = filtrar('ciudad').filter(pagado);
    var suma = {};
    datos.forEach(function (p) {
      var c = (p.cliente && p.cliente.ciudad) || '—';
      suma[c] = (suma[c] || 0) + (p.total || 0);
    });
    var lista = Object.keys(suma)
      .map(function (k) { return { k: k, v: suma[k] }; })
      .sort(function (a, b) { return b.v - a.v; }).slice(0, 7);
    barrasH('graficaCiudades', lista, COLORES.violeta, 'ciudad', pesosCortos);
  }

  /* ---------- Dona de estados ---------- */

  function pintarEstados() {
    var caja = document.getElementById('graficaEstados');
    var datos = filtrar('estado');
    if (!datos.length) { caja.innerHTML = '<p class="tb-vacio">Sin datos con este filtro.</p>'; return; }

    var conteo = {}, plataEstado = {};
    datos.forEach(function (p) {
      var e = estadoDe(p);
      conteo[e] = (conteo[e] || 0) + 1;
      plataEstado[e] = (plataEstado[e] || 0) + (p.total || 0);
    });
    var claves = Object.keys(ESTADOS_META).filter(function (k) { return conteo[k]; });
    var total = datos.length;

    var R = 70, CX = 90, CY = 90, GROSOR = 26;
    var offset = -Math.PI / 2;
    var svg = ['<svg viewBox="0 0 180 180" role="img" aria-label="Pedidos por estado">'];
    var leyenda = [];

    claves.forEach(function (k) {
      var frac = conteo[k] / total;
      var a0 = offset, a1 = offset + frac * Math.PI * 2 - 0.03; /* 2px de aire */
      offset += frac * Math.PI * 2;
      var grande = frac > 0.5 ? 1 : 0;
      var x0 = CX + R * Math.cos(a0), y0 = CY + R * Math.sin(a0);
      var x1 = CX + R * Math.cos(a1), y1 = CY + R * Math.sin(a1);
      var sel = filtros.estado === k;
      var apagada = filtros.estado && !sel;
      svg.push('<path class="tb-arco' + (apagada ? ' tb-apagada' : '') + (sel ? ' tb-seleccion' : '') + '"' +
        ' data-k="' + k + '" d="M ' + x0 + ' ' + y0 + ' A ' + R + ' ' + R + ' 0 ' + grande + ' 1 ' + x1 + ' ' + y1 + '"' +
        ' fill="none" stroke="' + ESTADOS_META[k].color + '" stroke-width="' + GROSOR + '" stroke-linecap="butt"/>');
      leyenda.push('<button class="tb-leyenda' + (apagada ? ' tb-apagada' : '') + '" data-k="' + k + '" type="button">' +
        '<i style="background:' + ESTADOS_META[k].color + '"></i>' + ESTADOS_META[k].nombre +
        ' <b>' + conteo[k] + ' · ' + pesosCortos(plataEstado[k]) + '</b></button>');
    });

    svg.push('<text class="tb-dona-centro" x="90" y="86">' + total + '</text>');
    svg.push('<text class="tb-dona-sub" x="90" y="104">pedidos</text>');
    svg.push('</svg>');

    caja.innerHTML = '<div class="tb-dona">' + svg.join('') +
      '<div class="tb-leyendas">' + leyenda.join('') + '</div></div>';

    caja.querySelectorAll('[data-k]').forEach(function (el) {
      var k = el.getAttribute('data-k');
      el.addEventListener('click', function () { alternar('estado', k); });
      conTip(el, '<b>' + ESTADOS_META[k].nombre + '</b><br>' + conteo[k] + ' pedido' + (conteo[k] === 1 ? '' : 's') +
        ' · ' + Math.round((conteo[k] / total) * 100) + '%<br>' + pesos(plataEstado[k] || 0));
    });
  }

  /* ---------- Ventas por día ---------- */

  function pintarDias() {
    var caja = document.getElementById('graficaDias');
    var datos = filtrar('dia').filter(pagado);

    var hoy = new Date();
    var dias = [];
    for (var i = 29; i >= 0; i--) {
      var d = new Date(hoy); d.setDate(hoy.getDate() - i);
      dias.push(d.toISOString().slice(0, 10));
    }
    var suma = {};
    datos.forEach(function (p) { var k = diaDe(p.creado); suma[k] = (suma[k] || 0) + (p.total || 0); });
    var serie = dias.map(function (k) { return { k: k, v: suma[k] || 0 }; });
    var max = Math.max.apply(null, serie.map(function (s) { return s.v; }).concat([1]));

    var W = 900, H = 190, M = { izq: 8, der: 8, arr: 14, aba: 26 };
    var anchoUtil = W - M.izq - M.der, altoUtil = H - M.arr - M.aba;
    var paso = anchoUtil / (serie.length - 1);
    var px = function (i) { return M.izq + i * paso; };
    var py = function (v) { return M.arr + altoUtil - (v / max) * altoUtil; };

    var linea = serie.map(function (s, i) { return (i ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(s.v).toFixed(1); }).join(' ');
    var area = linea + ' L' + px(serie.length - 1).toFixed(1) + ' ' + (M.arr + altoUtil) + ' L' + M.izq + ' ' + (M.arr + altoUtil) + ' Z';

    var svg = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Ventas por día">'];
    svg.push('<defs><linearGradient id="tbArea" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + COLORES.dorado + '" stop-opacity=".35"/>' +
      '<stop offset="1" stop-color="' + COLORES.dorado + '" stop-opacity="0"/></linearGradient></defs>');
    svg.push('<path d="' + area + '" fill="url(#tbArea)"/>');
    svg.push('<path d="' + linea + '" fill="none" stroke="' + COLORES.dorado + '" stroke-width="2" stroke-linejoin="round"/>');

    serie.forEach(function (s, i) {
      var sel = filtros.dia === s.k;
      var apagado = filtros.dia && !sel;
      svg.push('<g class="tb-punto' + (apagado ? ' tb-apagada' : '') + '" data-i="' + i + '">' +
        '<rect class="tb-hit" x="' + (px(i) - paso / 2) + '" y="0" width="' + paso + '" height="' + H + '"/>' +
        '<circle cx="' + px(i) + '" cy="' + py(s.v) + '" r="' + (sel ? 7 : (s.v ? 4 : 0)) + '"' +
        ' fill="' + (sel ? '#FFD470' : COLORES.dorado) + '" stroke="#171310" stroke-width="2"/>' +
      '</g>');
      if (i % 5 === 0) {
        svg.push('<text class="tb-eje" x="' + px(i) + '" y="' + (H - 8) + '">' + s.k.slice(8) + '/' + s.k.slice(5, 7) + '</text>');
      }
    });
    svg.push('</svg>');
    caja.innerHTML = svg.join('');

    caja.querySelectorAll('.tb-punto').forEach(function (g) {
      var i = +g.getAttribute('data-i');
      g.addEventListener('click', function () { alternar('dia', serie[i].k); });
      conTip(g, '<b>' + serie[i].k + '</b><br>' + pesos(serie[i].v));
    });
  }

  /* ---------- Ventas por mes (barras verticales) ---------- */

  var MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function nombreMes(k) {
    return MESES_CORTOS[+k.slice(5, 7) - 1] + ' ' + k.slice(0, 4);
  }

  function pintarMeses() {
    var caja = document.getElementById('graficaMeses');
    var datos = filtrar('mes').filter(pagado);
    var suma = {};
    datos.forEach(function (p) {
      var k = String(p.creado || '').slice(0, 7);
      if (k) suma[k] = (suma[k] || 0) + (p.total || 0);
    });
    var claves = Object.keys(suma).sort().slice(-12);
    if (!claves.length) { caja.innerHTML = '<p class="tb-vacio">Sin datos con este filtro.</p>'; return; }

    var W = 560, H = 210, ABAJO = 30, ARRIBA = 26;
    var max = Math.max.apply(null, claves.map(function (k) { return suma[k]; }));
    var paso = W / claves.length;
    var anchoBarra = Math.min(64, paso - 14);
    var svg = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Ventas por mes">'];

    claves.forEach(function (k, i) {
      var h = Math.max(5, (suma[k] / max) * (H - ABAJO - ARRIBA));
      var x = i * paso + (paso - anchoBarra) / 2;
      var y = H - ABAJO - h;
      var sel = filtros.mes === k;
      var apagada = filtros.mes && !sel;
      svg.push('<g class="tb-barra' + (apagada ? ' tb-apagada' : '') + (sel ? ' tb-seleccion' : '') + '" data-k="' + k + '">' +
        '<rect class="tb-hit" x="' + (i * paso) + '" y="0" width="' + paso + '" height="' + H + '"/>' +
        '<rect class="tb-relleno" x="' + x + '" y="' + y + '" width="' + anchoBarra + '" height="' + h + '" rx="4" fill="' + COLORES.verde + '"/>' +
        '<text class="tb-valor" text-anchor="middle" x="' + (i * paso + paso / 2) + '" y="' + (y - 8) + '">' + pesosCortos(suma[k]) + '</text>' +
        '<text class="tb-eje" x="' + (i * paso + paso / 2) + '" y="' + (H - 10) + '">' + nombreMes(k) + '</text>' +
      '</g>');
    });
    svg.push('</svg>');
    caja.innerHTML = svg.join('');

    caja.querySelectorAll('.tb-barra').forEach(function (g) {
      var k = g.getAttribute('data-k');
      g.addEventListener('click', function () { alternar('mes', k); });
      conTip(g, '<b>' + nombreMes(k) + '</b><br>' + pesos(suma[k]));
    });
  }

  /* ---------- Dinero por unidad de cada referencia ---------- */

  function pintarUnitario() {
    var datos = filtrar('producto').filter(pagado);
    var conteo = {}, plata = {};
    datos.forEach(function (p) {
      (p.lineas || []).forEach(function (l) {
        conteo[l.nombre] = (conteo[l.nombre] || 0) + l.cant;
        plata[l.nombre] = (plata[l.nombre] || 0) + (l.total || 0);
      });
    });
    var lista = Object.keys(plata)
      .map(function (k) { return { k: k, v: plata[k] / conteo[k], extra: conteo[k] + ' unidades vendidas' }; })
      .sort(function (a, b) { return b.v - a.v; }).slice(0, 7);
    barrasH('graficaUnitario', lista, COLORES.rosa, 'producto', function (v) { return pesos(v) + '/und'; });
  }

  /* ---------- Tabla de detalle ---------- */

  function pintarTabla() {
    var datos = filtrar(null).slice(0, 40);
    var filas = datos.map(function (p) {
      var e = estadoDe(p);
      return '<tr>' +
        '<td>' + esc(diaDe(p.creado)) + '</td>' +
        '<td class="tb-tabla-ref">' + esc(p.referencia) + '</td>' +
        '<td>' + esc((p.cliente && p.cliente.ciudad) || '—') + '</td>' +
        '<td><i class="tb-pepita" style="background:' + ESTADOS_META[e].color + '"></i>' + ESTADOS_META[e].nombre + '</td>' +
        '<td class="tb-num">' + pesos(p.total || 0) + '</td>' +
      '</tr>';
    }).join('');
    document.getElementById('tabla').innerHTML =
      '<thead><tr><th>Fecha</th><th>Referencia</th><th>Ciudad</th><th>Estado</th><th class="tb-num">Total</th></tr></thead>' +
      '<tbody>' + (filas || '<tr><td colspan="5" class="tb-vacio">Sin pedidos con este filtro.</td></tr>') + '</tbody>';
  }

  /* ---------- Chips de filtros activos ---------- */

  function pintarChips() {
    var caja = document.getElementById('filtrosActivos');
    var chips = [];
    if (filtros.mes) chips.push(['mes', nombreMes(filtros.mes)]);
    if (filtros.dia) chips.push(['dia', filtros.dia]);
    if (filtros.estado) chips.push(['estado', ESTADOS_META[filtros.estado].nombre]);
    if (filtros.producto) chips.push(['producto', filtros.producto]);
    if (filtros.ciudad) chips.push(['ciudad', filtros.ciudad]);
    caja.hidden = !chips.length;
    document.getElementById('chipsFiltros').innerHTML = chips.map(function (c) {
      return '<button class="tb-chip" data-dim="' + c[0] + '" type="button">' + esc(c[1]) + ' ×</button>';
    }).join('');
    caja.querySelectorAll('.tb-chip').forEach(function (b) {
      b.addEventListener('click', function () { filtros[b.getAttribute('data-dim')] = null; pintar(); });
    });
  }

  function pintar() {
    pintarChips();
    pintarKpis();
    pintarDias();
    pintarMeses();
    pintarUnitario();
    pintarEstados();
    pintarProductos();
    pintarCiudades();
    pintarTabla();
  }

  document.getElementById('limpiarFiltros').addEventListener('click', function () {
    filtros = { producto: null, ciudad: null, estado: null, dia: null, mes: null };
    pintar();
  });

  /* ---------- Sesión (compartida con /pedidos) ---------- */

  function cargar(clave) {
    errorCaja.textContent = '';
    return fetch('/api/pedidos', { headers: { 'x-admin-token': clave } })
      .then(function (r) {
        if (r.status === 401) throw new Error('Clave incorrecta.');
        if (!r.ok) throw new Error('No pudimos cargar los datos. Intenta de nuevo.');
        return r.json();
      })
      .then(function (d) {
        pedidos = d.pedidos || [];
        try { sessionStorage.setItem(LLAVE, clave); } catch (e) { /* incógnito */ }
        puerta.hidden = true;
        tablero.hidden = false;
        document.getElementById('refrescar').hidden = false;
        pintar();
      });
  }

  puerta.addEventListener('submit', function (e) {
    e.preventDefault();
    var clave = document.getElementById('clave').value.trim();
    if (clave) cargar(clave).catch(function (err) { errorCaja.textContent = err.message; });
  });

  document.getElementById('refrescar').addEventListener('click', function () {
    var clave = sessionStorage.getItem(LLAVE);
    if (clave) cargar(clave).catch(function (err) { errorCaja.textContent = err.message; });
  });

  var guardada = null;
  try { guardada = sessionStorage.getItem(LLAVE); } catch (e) { /* incógnito */ }
  if (guardada) cargar(guardada).catch(function () { try { sessionStorage.removeItem(LLAVE); } catch (e) {} });
})();

/* =========================================================================
   CHOCATA — Estudio (fase 1: textos y aviso)

   La dueña edita aquí los textos de la página. Cada campo conoce su límite
   (viene del servidor), muestra el conteo en vivo y alimenta una vista
   previa. Guardar publica al instante; «volver a la versión anterior»
   deshace el último cambio. La clave es la misma de /pedidos.
   ========================================================================= */
(function () {
  'use strict';

  var LLAVE = 'chocata.admin.clave';
  var puerta = document.getElementById('puerta');
  var taller = document.getElementById('taller');
  var errorCaja = document.getElementById('puertaError');
  var resultado = document.getElementById('resultado');
  var limites = {};

  var CAMPOS = {
    avisoTexto: 'aviso.texto',
    avisoDestacado: 'aviso.destacado',
    avisoEnlaceTexto: 'aviso.enlaceTexto',
    avisoEnlaceUrl: 'aviso.enlaceUrl',
    heroEyebrow: 'hero.eyebrow',
    heroTitulo: 'hero.titulo',
    heroAcento: 'hero.tituloAcento',
    heroLede: 'hero.lede'
  };

  function el(id) { return document.getElementById(id); }

  /* ---------- Vista previa y conteos ---------- */

  function pintarPrevia() {
    var previaAviso = el('previaAviso');
    previaAviso.textContent = '';
    previaAviso.appendChild(document.createTextNode(el('avisoTexto').value + ' '));
    var b = document.createElement('b');
    b.textContent = el('avisoDestacado').value;
    previaAviso.appendChild(b);
    previaAviso.appendChild(document.createTextNode(' '));
    var a = document.createElement('u');
    a.textContent = el('avisoEnlaceTexto').value;
    previaAviso.appendChild(a);
    previaAviso.parentElement.parentElement.style.opacity = el('avisoVisible').checked ? '' : '.35';

    el('previaEyebrow').textContent = el('heroEyebrow').value;
    var t = el('previaTitulo');
    t.textContent = el('heroTitulo').value + ' ';
    var em = document.createElement('em');
    em.textContent = el('heroAcento').value;
    t.appendChild(em);
    t.appendChild(document.createTextNode('.'));
    el('previaLede').textContent = el('heroLede').value;
  }

  function pintarCuentas() {
    Object.keys(CAMPOS).forEach(function (id) {
      var cuenta = document.querySelector('[data-cuenta="' + id + '"]');
      if (!cuenta) return;
      var tope = limites[CAMPOS[id]];
      if (!tope) return;
      var usados = el(id).value.length;
      cuenta.textContent = usados + '/' + tope;
      cuenta.classList.toggle('est-tope', usados >= tope);
    });
  }

  function conectarCampos() {
    Object.keys(CAMPOS).forEach(function (id) {
      var campo = el(id);
      campo.addEventListener('input', function () {
        var tope = limites[CAMPOS[id]];
        if (tope && campo.value.length > tope) campo.value = campo.value.slice(0, tope);
        pintarCuentas();
        pintarPrevia();
      });
    });
    el('avisoVisible').addEventListener('change', function () {
      el('avisoEstadoTxt').textContent = this.checked ? 'Encendido' : 'Apagado';
      el('avisoCampos').style.opacity = this.checked ? '' : '.45';
      pintarPrevia();
    });
  }

  /* ---------- Productos y precios ---------- */

  var catalogoBase = null;   /* precios.json de fábrica */
  var ordenActual = [];      /* slugs en el orden visible */
  var estadoProductos = {};  /* slug -> { oculto, precios:{talla:valor} } */

  function pesosCorto(n) { return '$' + Number(n).toLocaleString('es-CO'); }

  function pintarProductos() {
    var caja = el('listaProductos');
    caja.textContent = '';
    ordenActual.forEach(function (slug, i) {
      var base = catalogoBase[slug];
      var est = estadoProductos[slug];
      var fila = document.createElement('article');
      fila.className = 'est-producto' + (est.oculto ? ' est-producto--oculto' : '');
      fila.draggable = true;
      fila.dataset.slug = slug;

      var cab = document.createElement('div');
      cab.className = 'est-producto__fila';
      cab.innerHTML =
        '<span class="est-producto__asa" title="Arrastra para reordenar" aria-hidden="true">≡</span>' +
        '<button type="button" class="est-producto__nombre" aria-expanded="false"></button>' +
        '<span class="est-producto__resumen"></span>' +
        '<span class="est-producto__flechas">' +
          '<button type="button" data-mover="-1" aria-label="Subir">↑</button>' +
          '<button type="button" data-mover="1" aria-label="Bajar">↓</button>' +
        '</span>' +
        '<label class="est-interruptor est-interruptor--mini">' +
          '<input type="checkbox" ' + (est.oculto ? '' : 'checked') + '>' +
          '<i aria-hidden="true"></i>' +
        '</label>';
      cab.querySelector('.est-producto__nombre').textContent = base.nombre || slug;

      var visibles = (base.presentaciones || []).filter(function (p) { return typeof p.cop === 'number'; });
      var editadas = Object.keys(est.precios).length;
      cab.querySelector('.est-producto__resumen').textContent =
        visibles.length + (visibles.length === 1 ? ' presentación' : ' presentaciones') +
        (editadas ? ' · ' + editadas + ' con precio editado' : '');

      var detalle = document.createElement('div');
      detalle.className = 'est-producto__tallas';
      detalle.hidden = true;
      visibles.forEach(function (p) {
        var campo = document.createElement('label');
        campo.className = 'est-talla';
        var vigente = typeof est.precios[p.talla] === 'number' ? est.precios[p.talla] : p.cop;
        campo.innerHTML =
          '<span></span>' +
          '<input type="number" min="500" max="2000000" step="100" inputmode="numeric">' +
          '<small></small>';
        campo.querySelector('span').textContent = p.talla;
        var input = campo.querySelector('input');
        input.value = vigente;
        var nota = campo.querySelector('small');
        function pintarNota() {
          var v = Number(input.value);
          if (v && v !== p.cop) { nota.textContent = 'fábrica ' + pesosCorto(p.cop); campo.classList.add('est-talla--editada'); }
          else { nota.textContent = ''; campo.classList.remove('est-talla--editada'); }
        }
        pintarNota();
        input.addEventListener('input', function () {
          var v = Math.round(Number(input.value));
          if (v && v !== p.cop && v >= 500 && v <= 2000000) est.precios[p.talla] = v;
          else delete est.precios[p.talla];
          pintarNota();
        });
        detalle.appendChild(campo);
      });

      cab.querySelector('.est-producto__nombre').addEventListener('click', function () {
        detalle.hidden = !detalle.hidden;
        this.setAttribute('aria-expanded', String(!detalle.hidden));
      });
      cab.querySelector('input[type=checkbox]').addEventListener('change', function () {
        est.oculto = !this.checked;
        fila.classList.toggle('est-producto--oculto', est.oculto);
      });
      cab.querySelectorAll('[data-mover]').forEach(function (b) {
        b.addEventListener('click', function () {
          var d = Number(b.getAttribute('data-mover'));
          var j = i + d;
          if (j < 0 || j >= ordenActual.length) return;
          ordenActual.splice(i, 1);
          ordenActual.splice(j, 0, slug);
          pintarProductos();
        });
      });

      /* Arrastrar y soltar (escritorio) */
      fila.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/plain', slug);
        fila.classList.add('est-producto--volando');
      });
      fila.addEventListener('dragend', function () { fila.classList.remove('est-producto--volando'); });
      fila.addEventListener('dragover', function (e) { e.preventDefault(); fila.classList.add('est-producto--destino'); });
      fila.addEventListener('dragleave', function () { fila.classList.remove('est-producto--destino'); });
      fila.addEventListener('drop', function (e) {
        e.preventDefault();
        var quien = e.dataTransfer.getData('text/plain');
        if (!quien || quien === slug) return;
        ordenActual.splice(ordenActual.indexOf(quien), 1);
        ordenActual.splice(ordenActual.indexOf(slug), 0, quien);
        pintarProductos();
      });

      fila.appendChild(cab);
      fila.appendChild(detalle);
      caja.appendChild(fila);
    });
  }

  function cargarProductos(contenido) {
    return fetch('assets/data/precios.json')
      .then(function (r) { return r.json(); })
      .then(function (precios) {
        catalogoBase = precios;
        var ediciones = (contenido && contenido.productos) || {};
        ordenActual = Object.keys(precios).sort(function (a, b) {
          var oa = ediciones[a] && typeof ediciones[a].orden === 'number' ? ediciones[a].orden : 999;
          var ob = ediciones[b] && typeof ediciones[b].orden === 'number' ? ediciones[b].orden : 999;
          return oa - ob;
        });
        estadoProductos = {};
        ordenActual.forEach(function (slug) {
          var e = ediciones[slug] || {};
          estadoProductos[slug] = { oculto: !!e.oculto, precios: Object.assign({}, e.precios || {}) };
        });
        pintarProductos();
      });
  }

  function recogerProductos() {
    var salida = {};
    ordenActual.forEach(function (slug, i) {
      var est = estadoProductos[slug];
      var e = { orden: i };
      if (est.oculto) e.oculto = true;
      if (Object.keys(est.precios).length) e.precios = est.precios;
      salida[slug] = e;
    });
    return salida;
  }

  /* ---------- Imágenes y marca ---------- */

  var ranuras = null;
  var imagenesActuales = {};

  /**
   * Recorta y escala la foto elegida a la medida EXACTA del marco: se toma el
   * trozo central más grande que respete la proporción y se dibuja en un
   * lienzo de ese tamaño. La foto nunca se estira ni desborda su espacio,
   * pase lo que pase con el original.
   */
  function recortarAlMarco(archivo, ranura) {
    return new Promise(function (resolver, rechazar) {
      if (!/^image\//.test(archivo.type)) return rechazar(new Error('Ese archivo no es una imagen.'));
      if (archivo.size > 25 * 1024 * 1024) return rechazar(new Error('La imagen es demasiado grande (máximo 25 MB).'));

      var lector = new FileReader();
      lector.onerror = function () { rechazar(new Error('No pudimos leer el archivo.')); };
      lector.onload = function () {
        var img = new Image();
        img.onerror = function () { rechazar(new Error('No pudimos abrir esa imagen.')); };
        img.onload = function () {
          var proporcion = ranura.w / ranura.h;
          /* Lado del recorte: el rectángulo central más grande con la
             proporción del marco que quepa en el original. */
          var anchoCorte = img.width;
          var altoCorte = Math.round(img.width / proporcion);
          if (altoCorte > img.height) {
            altoCorte = img.height;
            anchoCorte = Math.round(img.height * proporcion);
          }
          var x = Math.round((img.width - anchoCorte) / 2);
          var y = Math.round((img.height - altoCorte) / 2);

          /* No agrandar más allá del original ni del marco: subir una foto
             pequeña no debe inventar píxeles ni pesar de más. */
          var anchoFinal = Math.min(ranura.w, anchoCorte);
          var altoFinal = Math.round(anchoFinal / proporcion);

          var lienzo = document.createElement('canvas');
          lienzo.width = anchoFinal;
          lienzo.height = altoFinal;
          var ctx = lienzo.getContext('2d');
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, x, y, anchoCorte, altoCorte, 0, 0, anchoFinal, altoFinal);

          var datos = lienzo.toDataURL('image/webp', 0.85);
          if (datos.indexOf('data:image/webp') !== 0) {
            return rechazar(new Error('Este navegador no puede optimizar la imagen. Prueba con Chrome o Edge.'));
          }
          var pesoKb = Math.round((datos.length * 3 / 4) / 1024);
          resolver({ datos: datos, ancho: anchoFinal, alto: altoFinal, pesoKb: pesoKb });
        };
        img.src = lector.result;
      };
      lector.readAsDataURL(archivo);
    });
  }

  function enviarImagen(nombreRanura, cuerpo, aviso, tarjeta) {
    aviso.textContent = 'Publicando…';
    aviso.className = 'est-ranura__aviso';
    return fetch('/api/subir-imagen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': sessionStorage.getItem(LLAVE) || ''
      },
      body: JSON.stringify(Object.assign({ ranura: nombreRanura }, cuerpo))
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.d.mensaje || 'No se pudo publicar.');
        imagenesActuales = (res.d.contenido && res.d.contenido.imagenes) || {};
        aviso.textContent = '✓ ' + res.d.mensaje;
        pintarImagenes();
      })
      .catch(function (err) {
        aviso.textContent = err.message;
        aviso.className = 'est-ranura__aviso est-ranura__aviso--error';
        if (tarjeta) tarjeta.classList.remove('est-ranura--trabajando');
      });
  }

  function tarjetaRanura(nombre, ranura) {
    var tarjeta = document.createElement('article');
    tarjeta.className = 'est-ranura';
    var urlActual = imagenesActuales[nombre];

    var marco = document.createElement('div');
    marco.className = 'est-ranura__marco';
    marco.style.aspectRatio = ranura.w + ' / ' + ranura.h;
    var img = document.createElement('img');
    img.alt = '';
    img.loading = 'lazy';
    if (urlActual) img.src = urlActual;
    else img.classList.add('est-ranura__img--vacia');
    marco.appendChild(img);

    var cuerpo = document.createElement('div');
    cuerpo.className = 'est-ranura__cuerpo';

    var titulo = document.createElement('p');
    titulo.className = 'est-ranura__titulo';
    titulo.textContent = ranura.titulo;
    var nota = document.createElement('p');
    nota.className = 'est-ranura__nota';
    nota.textContent = urlActual ? 'Imagen propia · ' + ranura.nota : ranura.nota;

    var acciones = document.createElement('div');
    acciones.className = 'est-ranura__acciones';

    var etiqueta = document.createElement('label');
    etiqueta.className = 'btn btn--ghost est-ranura__elegir';
    etiqueta.textContent = urlActual ? 'Cambiar' : 'Subir imagen';
    var entrada = document.createElement('input');
    entrada.type = 'file';
    entrada.accept = 'image/*';
    entrada.className = 'est-ranura__archivo';
    etiqueta.appendChild(entrada);
    acciones.appendChild(etiqueta);

    if (urlActual) {
      var quitar = document.createElement('button');
      quitar.type = 'button';
      quitar.className = 'btn btn--ghost';
      quitar.textContent = 'Volver a la original';
      quitar.addEventListener('click', function () {
        if (!confirm('¿Volver a la imagen original de la página?')) return;
        tarjeta.classList.add('est-ranura--trabajando');
        enviarImagen(nombre, { quitar: true }, aviso, tarjeta);
      });
      acciones.appendChild(quitar);
    }

    var aviso = document.createElement('p');
    aviso.className = 'est-ranura__aviso';

    entrada.addEventListener('change', function () {
      var archivo = entrada.files && entrada.files[0];
      entrada.value = '';
      if (!archivo) return;
      tarjeta.classList.add('est-ranura--trabajando');
      aviso.textContent = 'Recortando…';
      aviso.className = 'est-ranura__aviso';
      recortarAlMarco(archivo, ranura)
        .then(function (r) {
          /* Vista previa inmediata: se ve el recorte antes de que suba. */
          img.src = r.datos;
          img.classList.remove('est-ranura__img--vacia');
          aviso.textContent = 'Recortada a ' + r.ancho + '×' + r.alto + ' (' + r.pesoKb + ' KB). Publicando…';
          return enviarImagen(nombre, { datos: r.datos }, aviso, tarjeta);
        })
        .catch(function (err) {
          aviso.textContent = err.message;
          aviso.className = 'est-ranura__aviso est-ranura__aviso--error';
          tarjeta.classList.remove('est-ranura--trabajando');
        });
    });

    cuerpo.appendChild(titulo);
    cuerpo.appendChild(nota);
    cuerpo.appendChild(acciones);
    cuerpo.appendChild(aviso);
    tarjeta.appendChild(marco);
    tarjeta.appendChild(cuerpo);
    return tarjeta;
  }

  function pintarImagenes() {
    var caja = el('listaImagenes');
    caja.textContent = '';
    var nombres = Object.keys(ranuras);
    /* Primero marca y fondos; después la retahíla de productos. */
    nombres.filter(function (n) { return !ranuras[n].grupo; })
      .forEach(function (n) { caja.appendChild(tarjetaRanura(n, ranuras[n])); });

    var titulo = document.createElement('p');
    titulo.className = 'est-ranuras__titulo';
    titulo.textContent = 'Fotos de los productos';
    caja.appendChild(titulo);

    nombres.filter(function (n) { return ranuras[n].grupo === 'productos'; })
      .forEach(function (n) { caja.appendChild(tarjetaRanura(n, ranuras[n])); });
  }

  function cargarImagenes(contenido) {
    imagenesActuales = (contenido && contenido.imagenes) || {};
    return fetch('/api/subir-imagen')
      .then(function (r) { return r.json(); })
      .then(function (d) { ranuras = d.ranuras || {}; pintarImagenes(); });
  }

  /* ---------- Cargar y publicar ---------- */

  function volcar(contenido) {
    el('avisoVisible').checked = contenido.aviso.visible !== false;
    el('avisoEstadoTxt').textContent = el('avisoVisible').checked ? 'Encendido' : 'Apagado';
    el('avisoCampos').style.opacity = el('avisoVisible').checked ? '' : '.45';
    el('avisoTexto').value = contenido.aviso.texto || '';
    el('avisoDestacado').value = contenido.aviso.destacado || '';
    el('avisoEnlaceTexto').value = contenido.aviso.enlaceTexto || '';
    el('avisoEnlaceUrl').value = contenido.aviso.enlaceUrl || '';
    el('heroEyebrow').value = contenido.hero.eyebrow || '';
    el('heroTitulo').value = contenido.hero.titulo || '';
    el('heroAcento').value = contenido.hero.tituloAcento || '';
    el('heroLede').value = contenido.hero.lede || '';
    pintarCuentas();
    pintarPrevia();
  }

  function recoger() {
    return {
      aviso: {
        visible: el('avisoVisible').checked,
        texto: el('avisoTexto').value,
        destacado: el('avisoDestacado').value,
        enlaceTexto: el('avisoEnlaceTexto').value,
        enlaceUrl: el('avisoEnlaceUrl').value
      },
      hero: {
        eyebrow: el('heroEyebrow').value,
        titulo: el('heroTitulo').value,
        tituloAcento: el('heroAcento').value,
        lede: el('heroLede').value
      },
      productos: recogerProductos()
    };
  }

  function avisar(texto, esError) {
    resultado.textContent = texto;
    resultado.classList.toggle('est-resultado--error', !!esError);
    if (!esError) setTimeout(function () { resultado.textContent = ''; }, 4000);
  }

  function publicar(deshacer) {
    var b = deshacer ? el('deshacer') : el('publicar');
    b.disabled = true;
    var original = b.textContent;
    b.textContent = deshacer ? 'Restaurando…' : 'Publicando…';
    fetch('/api/contenido' + (deshacer ? '?deshacer=1' : ''), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': sessionStorage.getItem(LLAVE) || ''
      },
      body: deshacer ? '{}' : JSON.stringify(recoger())
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.d.mensaje || 'No se pudo guardar.');
        if (res.d.contenido) {
          volcar(res.d.contenido);
          cargarProductos(res.d.contenido);
        }
        avisar('✓ ' + (res.d.mensaje || 'Listo.') + ' Abre la página para verlo.');
      })
      .catch(function (err) { avisar(err.message, true); })
      .then(function () { b.disabled = false; b.textContent = original; });
  }

  /* ---------- Sesión ---------- */

  function entrar(clave) {
    errorCaja.textContent = '';
    /* La clave se comprueba contra una API admin real antes de abrir el taller. */
    return fetch('/api/pedidos', { headers: { 'x-admin-token': clave } })
      .then(function (r) {
        if (r.status === 401) throw new Error('Clave incorrecta.');
        if (!r.ok) throw new Error('No pudimos entrar. Intenta de nuevo.');
        return fetch('/api/contenido');
      })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        limites = d.limites || {};
        try { sessionStorage.setItem(LLAVE, clave); } catch (e) { /* incógnito */ }
        puerta.hidden = true;
        taller.hidden = false;
        el('salir').hidden = false;
        conectarCampos();
        volcar(d.contenido);
        return cargarProductos(d.contenido).then(function () { return cargarImagenes(d.contenido); });
      });
  }

  puerta.addEventListener('submit', function (e) {
    e.preventDefault();
    var clave = el('clave').value.trim();
    if (!clave) return;
    entrar(clave).catch(function (err) { errorCaja.textContent = err.message; });
  });

  el('publicar').addEventListener('click', function () { publicar(false); });
  el('deshacer').addEventListener('click', function () {
    if (confirm('¿Volver a la versión anterior de los textos?')) publicar(true);
  });
  el('salir').addEventListener('click', function () {
    try { sessionStorage.removeItem(LLAVE); } catch (e) { /* nada */ }
    location.reload();
  });

  var guardada = null;
  try { guardada = sessionStorage.getItem(LLAVE); } catch (e) { /* incógnito */ }
  if (guardada) entrar(guardada).catch(function () { try { sessionStorage.removeItem(LLAVE); } catch (e) {} });
})();

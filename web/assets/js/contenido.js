/* =========================================================================
   CHOCATA — Hidratación del contenido editable

   La página trae sus textos de fábrica escritos en el HTML (si todo lo
   demás falla, se ve perfecta). Este módulo consulta /api/contenido y, si
   la dueña editó algo desde el Estudio, reemplaza los textos al vuelo.
   Solo texto plano (textContent): nada de lo guardado puede inyectar HTML.
   ========================================================================= */
(function () {
  'use strict';

  fetch('/api/contenido')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.contenido) return;
      var c = d.contenido;

      /* ---- Aviso superior ---- */
      var aviso = document.getElementById('avisoSede');
      if (aviso && c.aviso) {
        if (c.aviso.visible === false) {
          aviso.hidden = true;
          aviso.remove();
          document.body.classList.remove('con-aviso');
          document.body.style.removeProperty('--aviso-h');
          document.body.style.paddingTop = '';
        } else {
          var p = aviso.querySelector('p');
          var enlace = document.getElementById('avisoSedeHistoria');
          if (p) {
            /* El párrafo se rearma con nodos de texto: sin HTML del usuario. */
            var b = document.createElement('b');
            b.textContent = c.aviso.destacado || '';
            p.textContent = '';
            p.appendChild(document.createTextNode((c.aviso.texto || '') + ' '));
            p.appendChild(b);
            if (enlace) {
              enlace.textContent = c.aviso.enlaceTexto || 'Ver más';
              if (/^https?:\/\//.test(c.aviso.enlaceUrl || '')) enlace.href = c.aviso.enlaceUrl;
              p.appendChild(document.createTextNode(' '));
              p.appendChild(enlace);
            }
            /* El alto pudo cambiar con el texto nuevo. */
            document.body.style.setProperty('--aviso-h', aviso.offsetHeight + 'px');
          }
        }
      }

      /* ---- Imágenes: logo, fondos y fotos de producto ----
         Cada foto llega ya recortada a la proporción de su marco, así que
         basta cambiar el src: la maqueta no se mueve ni un píxel. */
      if (c.imagenes && Object.keys(c.imagenes).length) {
        var im = c.imagenes;

        if (im.logo) {
          document.querySelectorAll('img[src*="chocata-logo"]').forEach(function (n) { n.src = im.logo; });
        }
        if (im.heroFondo) {
          var fondo = document.querySelector('.hero__bg img');
          if (fondo) { fondo.src = im.heroFondo; fondo.removeAttribute('srcset'); }
        }
        if (im.historiaFondo) {
          var historia = document.querySelector('img[src*="mama-hija"]');
          if (historia) historia.src = im.historiaFondo;
        }

        Object.keys(im).forEach(function (ranura) {
          if (ranura.indexOf('producto.') !== 0) return;
          var slug = ranura.slice('producto.'.length);
          var carta = document.querySelector('.card[data-product="' + slug + '"] img');
          if (carta) carta.src = im[ranura];
          /* El detalle del producto lee su foto de la ficha: se actualiza
             también, para que abrir la tarjeta muestre la nueva. */
          if (window.CHOCATA_PRODUCTS && window.CHOCATA_PRODUCTS[slug]) {
            window.CHOCATA_PRODUCTS[slug].life = im[ranura];
          }
        });
      }

      /* ---- Productos: orden, ocultos y precios ---- */
      window.__CONTENIDO = c;
      document.dispatchEvent(new CustomEvent('chocata:contenido-listo', { detail: c }));
      if (c.productos && Object.keys(c.productos).length) {
        var grid = document.getElementById('grid');
        Object.keys(c.productos).forEach(function (slug) {
          if (!c.productos[slug].oculto) return;
          /* Fuera de la vitrina, del carrusel de beneficios y del recomendador. */
          document.querySelectorAll('[data-product="' + slug + '"]').forEach(function (n) { n.hidden = true; });
        });
        if (grid) {
          Object.keys(c.productos)
            .filter(function (s) { return typeof c.productos[s].orden === 'number'; })
            .sort(function (a, b) { return c.productos[a].orden - c.productos[b].orden; })
            .forEach(function (slug) {
              var carta = grid.querySelector('.card[data-product="' + slug + '"]');
              if (carta) grid.appendChild(carta);
            });
        }
      }


      /* ---- Datos estructurados: los precios editados también se publican ----
         Google renderiza la página antes de indexarla, así que el precio que
         acaba en el buscador es el que la dueña tiene puesto, no el de fábrica.
         Un producto oculto se retira del listado por completo. */
      actualizarDatosEstructurados(c.productos);

      /* ---- Hero ---- */
      if (c.hero) {
        var eyebrow = document.querySelector('.hero__copy .eyebrow');
        if (eyebrow && c.hero.eyebrow) eyebrow.textContent = c.hero.eyebrow;

        var h1 = document.querySelector('.hero__copy h1');
        if (h1 && (c.hero.titulo || c.hero.tituloAcento)) {
          var em = document.createElement('em');
          em.textContent = c.hero.tituloAcento || '';
          h1.textContent = (c.hero.titulo || '') + ' ';
          h1.appendChild(em);
          h1.appendChild(document.createTextNode('.'));
        }

        var lede = document.querySelector('.hero__copy .lede');
        if (lede && c.hero.lede) lede.textContent = c.hero.lede;
      }
    })
    .catch(function () { /* sin red o sin API: la página de fábrica ya está pintada */ });

  /** Reescribe precios y disponibilidad del JSON-LD con lo editado. */
  function actualizarDatosEstructurados(productos) {
    if (!productos || !Object.keys(productos).length) return;
    var etiqueta = document.querySelector('script[type="application/ld+json"]');
    if (!etiqueta) return;
    try {
      var grafo = JSON.parse(etiqueta.textContent);
      var lista = grafo['@graph'] || [];
      var vivos = [];
      lista.forEach(function (nodo) {
        if (nodo['@type'] !== 'Product') { vivos.push(nodo); return; }
        var slug = String(nodo['@id'] || '').split('#producto-')[1];
        var e = slug && productos[slug];
        if (e && e.oculto) return;              /* fuera del catálogo publicado */
        if (e && e.precios) aplicarPrecios(nodo, e.precios);
        vivos.push(nodo);
      });
      grafo['@graph'] = vivos;
      etiqueta.textContent = JSON.stringify(grafo);
    } catch (err) { /* el dato de fábrica ya está publicado: no se toca */ }
  }

  /** Cambia el precio de cada presentación y recalcula el rango del producto. */
  function aplicarPrecios(nodo, precios) {
    var ofertas = nodo.offers && nodo.offers['@type'] === 'AggregateOffer'
      ? nodo.offers.offers : [nodo.offers];
    var montos = [];
    (ofertas || []).forEach(function (oferta) {
      if (!oferta || !oferta.name) return;
      Object.keys(precios).forEach(function (talla) {
        if (oferta.name.indexOf(talla) !== -1) oferta.price = String(precios[talla]);
      });
      var n = Number(oferta.price);
      if (n) montos.push(n);
    });
    if (nodo.offers && nodo.offers['@type'] === 'AggregateOffer' && montos.length) {
      nodo.offers.lowPrice = String(Math.min.apply(null, montos));
      nodo.offers.highPrice = String(Math.max.apply(null, montos));
    }
  }

})();

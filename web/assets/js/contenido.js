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
})();

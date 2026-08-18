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
      }
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
        if (res.d.contenido) volcar(res.d.contenido);
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

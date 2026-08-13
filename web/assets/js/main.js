/* =========================================================================
   CHOCATA — Interacción y animación
   Progressive enhancement: si GSAP no carga, la página sigue siendo legible.
   ========================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animate = hasGSAP && !reduced;

  if (!animate) root.classList.remove('motion');
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Preloader ---------- */
  var preloader = document.getElementById('preloader');
  var fill = document.getElementById('preloaderFill');

  function hidePreloader() {
    preloader.classList.add('is-done');
    setTimeout(function () { preloader.style.display = 'none'; }, 700);
  }

  if (animate) {
    gsap.to(fill, { width: '100%', duration: 1.1, ease: 'power2.inOut' });
    window.addEventListener('load', function () {
      gsap.delayedCall(0.35, function () { hidePreloader(); startHero(); });
    });
    setTimeout(function () { if (preloader.style.display !== 'none') { hidePreloader(); startHero(); } }, 4000);
  } else {
    hidePreloader();
  }

  /* ---------- Lenis (scroll suave) ---------- */
  var lenis = null;
  if (animate && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToHash(hash) {
    var target = document.querySelector(hash);
    if (!target) return;
    if (lenis) lenis.scrollTo(target, { offset: -94 });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var hash = a.getAttribute('href');
      if (hash.length < 2) return;
      if (!document.querySelector(hash)) return;
      e.preventDefault();
      closeDrawer();
      scrollToHash(hash);
    });
  });

  /* ---------- Nav ---------- */
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');

  function onScrollNav() {
    nav.classList.toggle('is-stuck', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  function closeDrawer() {
    drawer.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menú');
  }
  burger.addEventListener('click', function () {
    var open = burger.getAttribute('aria-expanded') === 'true';
    if (open) { closeDrawer(); return; }
    drawer.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Cerrar menú');
  });

  /* ---------- Split de titulares ---------- */
  function splitNode(node, out) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        var parts = child.textContent.split(/(\s+)/);
        var frag = document.createDocumentFragment();
        parts.forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var outer = document.createElement('span');
          outer.className = 'split-w';
          var inner = document.createElement('span');
          inner.textContent = part;
          outer.appendChild(inner);
          frag.appendChild(outer);
          out.push(inner);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') {
        splitNode(child, out);
      }
    });
  }

  var heroWords = [];
  if (animate) {
    document.querySelectorAll('[data-split]').forEach(function (el) { splitNode(el, heroWords); });
    gsap.set(heroWords, { yPercent: 105 });
  }

  /* ---------- Entrada del hero ---------- */
  var heroStarted = false;
  function startHero() {
    if (!animate || heroStarted) return;
    heroStarted = true;
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to(heroWords, { yPercent: 0, duration: 1.05, stagger: 0.055 }, 0)
      .from('.hero .eyebrow', { opacity: 0, y: 18, duration: .8 }, 0.15)
      .from('.hero .lede', { opacity: 0, y: 22, duration: .9 }, 0.45)
      .from('.hero__actions .btn', { opacity: 0, y: 20, duration: .7, stagger: .1 }, 0.6)
      .from('.hero__benefits', { opacity: 0, y: 24, duration: .9 }, 0.75)
      .from('.hero__scroll', { opacity: 0, duration: .6 }, 1.1);
  }

  /* ---------- Reveals ---------- */
  if (animate) {
    gsap.utils.toArray('.reveal').forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: .95, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    /* Parallax de fondos */
    gsap.utils.toArray('[data-parallax]').forEach(function (el) {
      var amount = parseFloat(el.getAttribute('data-parallax')) || 0.15;
      gsap.fromTo(el, { yPercent: -amount * 50 }, {
        yPercent: amount * 50, ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---------- Contadores ---------- */
  function runCounter(el) {
    var end = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var obj = { v: 0 };
    gsap.to(obj, {
      v: end, duration: 1.8, ease: 'power2.out',
      onUpdate: function () {
        var n = obj.v.toFixed(decimals).replace('.', ',');
        el.textContent = n + suffix;
      }
    });
  }
  if (animate) {
    gsap.utils.toArray('[data-count]').forEach(function (el) {
      ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: function () { runCounter(el); } });
    });
  }

  /* ---------- Filtros del catálogo ---------- */
  var filters = document.querySelectorAll('.filter');
  var cards = Array.prototype.slice.call(document.querySelectorAll('#grid .card'));

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filters.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      var f = btn.getAttribute('data-filter');
      cards.forEach(function (card) {
        var show = f === 'all' || card.getAttribute('data-cat') === f;
        card.classList.toggle('is-hidden', !show);
      });
      if (animate) {
        var visible = cards.filter(function (c) { return !c.classList.contains('is-hidden'); });
        gsap.fromTo(visible, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .55, stagger: .04, ease: 'power2.out' });
        ScrollTrigger.refresh();
      }
    });
  });

  /* ---------- Modal de producto ---------- */
  var modal = document.getElementById('modal');
  var modalGrid = document.getElementById('modalGrid');
  var modalPanel = document.getElementById('modalPanel');
  var lastFocused = null;

  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>';
  var LINK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>';

  function buildModal(key) {
    var p = window.CHOCATA_PRODUCTS[key];
    if (!p) return false;

    var facts = p.facts.map(function (f, i) {
      return '<span class="chip' + (i === 0 ? ' chip--gold' : '') + '">' + f + '</span>';
    }).join('');

    var benefits = p.benefits.map(function (b) {
      return '<li>' + CHECK + '<span><strong>' + b.t + '.</strong> ' + b.d + '</span></li>';
    }).join('');

    var sources = p.sources.map(function (s) {
      return '<a href="' + s.u + '" target="_blank" rel="noopener noreferrer">' + LINK + '<span>' + s.l + '</span></a>';
    }).join('');

    var prices = '';
    if (p.prices && p.prices.length) {
      prices = '<div class="modal__block"><h3>Presentaciones y precios</h3>' +
        '<ul class="prices">' + p.prices.map(function (row) {
          return '<li><span>' + row.s + '</span><b>' + (row.p || 'Consultar') + '</b></li>';
        }).join('') + '</ul></div>';
    }

    modalGrid.innerHTML =
      '<div class="modal__visual">' +
        '<img src="' + p.life + '" alt="' + p.lifeAlt + '">' +
      '</div>' +
      '<div class="modal__content">' +
        '<div>' +
          '<p class="eyebrow" style="margin-bottom:.9rem">' + p.kicker + '</p>' +
          '<h2 id="modalTitle">' + p.name + '</h2>' +
        '</div>' +
        '<div class="modal__facts">' + facts + '</div>' +
        '<p class="lede">' + p.description + '</p>' +
        '<div class="modal__block"><h3>Beneficios respaldados</h3><ul class="benefits">' + benefits + '</ul></div>' +
        prices +
        '<div class="modal__block"><h3>Modo de uso</h3><p class="usage">' + p.usage + '</p></div>' +
        (p.note ? '<div class="modal__block"><h3>Ten en cuenta</h3><p style="font-size:.9rem;color:var(--muted)">' + p.note + '</p></div>' : '') +
        '<div class="modal__block"><h3>Fuentes consultadas</h3><div class="sources">' + sources + '</div></div>' +
        '<a class="btn" style="justify-self:start" href="https://wa.me/573176685235?text=' + encodeURIComponent('Hola CHOCATA, quiero informacion de ' + p.name) + '" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a>' +
      '</div>';
    return true;
  }

  function openModal(key, trigger) {
    if (!buildModal(key)) return;
    lastFocused = trigger || document.activeElement;
    modal.classList.add('is-open');
    document.body.classList.add('is-locked');
    if (lenis) lenis.stop();
    modalPanel.scrollTop = 0;
    modal.querySelector('.modal__close').focus();
    if (animate) {
      gsap.fromTo(modalPanel, { opacity: 0, y: 26, scale: .985 }, { opacity: 1, y: 0, scale: 1, duration: .45, ease: 'power3.out' });
    }
  }

  function closeModal() {
    modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    if (lenis) lenis.start();
    if (lastFocused) lastFocused.focus();
  }

  cards.forEach(function (card) {
    card.addEventListener('click', function () { openModal(card.getAttribute('data-product'), card); });
  });

  /* Las pastillas de beneficios del hero abren la misma ficha. */
  document.querySelectorAll('.benefit[data-product]').forEach(function (pill) {
    pill.addEventListener('click', function () { openModal(pill.getAttribute('data-product'), pill); });
  });

  /* ---------- Recomendador por objetivo ---------- */
  var goalBtns = document.querySelectorAll('.goal');
  var goalOut = document.getElementById('goalResults');

  function renderGoal(key) {
    var picks = (window.CHOCATA_GOALS || {})[key] || [];
    goalOut.innerHTML = picks.map(function (pick) {
      var prod = window.CHOCATA_PRODUCTS[pick.p];
      if (!prod) return '';
      return '<button class="goal-card" data-product="' + pick.p + '">' +
               '<span class="goal-card__img"><img src="' + prod.life + '" alt="" loading="lazy"></span>' +
               '<span class="goal-card__body">' +
                 '<b>' + prod.name + '</b>' +
                 '<span>' + pick.w + '</span>' +
                 '<em>Ver ficha completa</em>' +
               '</span>' +
             '</button>';
    }).join('');

    goalOut.querySelectorAll('.goal-card').forEach(function (card) {
      card.addEventListener('click', function () { openModal(card.getAttribute('data-product'), card); });
    });

    if (animate) {
      gsap.fromTo(goalOut.children, { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: .45, stagger: .07, ease: 'power2.out' });
    }
  }

  goalBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      goalBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      renderGoal(btn.getAttribute('data-goal'));
    });
  });
  if (goalOut) renderGoal('fuerza');

  modal.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (modal.classList.contains('is-open')) closeModal();
      else if (drawer.classList.contains('is-open')) closeDrawer();
    }
    if (e.key === 'Tab' && modal.classList.contains('is-open')) {
      var focusables = modal.querySelectorAll('a[href], button');
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Acordeón de ciencia ---------- */
  function setPanel(item, open) {
    var panel = item.querySelector('.acc__panel');
    var inner = panel.querySelector('.acc__inner');
    panel.style.height = open ? inner.offsetHeight + 'px' : '0px';
  }

  document.querySelectorAll('.acc__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.parentElement;
      var open = item.classList.contains('is-open');
      item.parentElement.querySelectorAll('.acc').forEach(function (other) {
        other.classList.remove('is-open');
        other.querySelector('.acc__btn').setAttribute('aria-expanded', 'false');
        setPanel(other, false);
      });
      if (!open) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        setPanel(item, true);
      }
      if (hasGSAP && window.ScrollTrigger) setTimeout(ScrollTrigger.refresh, 460);
    });
  });

  window.addEventListener('resize', function () {
    var open = document.querySelector('.acc.is-open');
    if (open) setPanel(open, true);
  });

  /* ---------- Rituales: scroll horizontal ---------- */
  var viewport = document.getElementById('ritualsViewport');
  var track = document.getElementById('ritualsTrack');
  var horizontalST = null;

  function distance() {
    return Math.max(0, track.scrollWidth - window.innerWidth + 24);
  }

  function setupHorizontal() {
    var wide = window.innerWidth >= 900;
    if (wide && animate) {
      viewport.classList.remove('is-native');
      if (horizontalST) return;
      horizontalST = gsap.to(track, {
        x: function () { return -distance(); },
        ease: 'none',
        scrollTrigger: {
          trigger: viewport,
          start: 'top 12%',
          end: function () { return '+=' + distance(); },
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
    } else {
      viewport.classList.add('is-native');
      if (horizontalST) {
        horizontalST.scrollTrigger.kill(true);
        horizontalST.kill();
        horizontalST = null;
        gsap.set(track, { x: 0 });
      }
    }
  }
  if (animate) {
    setupHorizontal();
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { setupHorizontal(); ScrollTrigger.refresh(); }, 220);
    });
  } else {
    viewport.classList.add('is-native');
  }

})();

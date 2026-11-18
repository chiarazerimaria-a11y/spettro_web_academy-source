/*! spettro-widget.js v1.0 — Botones de SpettroWeb para tu plataforma
  ─────────────────────────────────────────────────────────────────────
  Qué hace:
   • Muestra el botón "🎓 Panel del Profesor" cuando estás en el PERFIL del usuario
   • Muestra el botón "👑 Panel de Administración" cuando estás en el ADMIN de la plataforma
   • Al pulsar, abre el panel en una ventana modal dentro de tu propia web
     (o en pestaña nueva, según config) y expone la API window.SpettroPanel

  API JS (por si prefieres llamarlo desde tus componentes React):
   window.SpettroPanel.open('instructor')   → abre el panel del profesor en modal
   window.SpettroPanel.open('admin')        → abre el panel de administración en modal
   window.SpettroPanel.close()              → cierra el modal
   window.SpettroPanel.config()             → ver/editar la configuración
*/
(function () {
  'use strict';

  /* ══════════ CONFIGURACIÓN ══════════ */
  var CFG = {
    // 'modal' = el panel se abre dentro de tu web (recomendado) | 'tab' = pestaña nueva
    mode: 'modal',
    // Botón flotante contextual (abajo a la derecha) cuando no hay host configurado
    float: true,
    // z-index base del botón (el modal usa +1)
    zIndex: 999998,
    // Texto de la barra superior del modal
    modalTitle: {
      instructor: '🎓 Panel del Profesor — SpettroWeb',
      admin: '👑 Panel de Administración — SpettroWeb'
    },
    pages: {
      // Botón del PROFESOR: aparece en las páginas cuya URL contiene alguna
      // de estas palabras (el perfil del usuario). Añade/quita a tu gusto.
      instructor: {
        urls: ['perfil', 'profile', 'account', 'cuenta', 'usuario', 'user'],
        label: '🎓 Panel del Profesor',
        // SIN barra inicial = relativo a donde esté spettro-widget.js (funciona en
        // file://, en subcarpetas y en la raíz). Con barra = raíz del sitio. Con
        // http(s):// = tal cual.
        url: '/profesor',
        color: '#8b5cf6'
      },
      // Botón del ADMIN: solo en páginas de administración (o con ?admin=1 en la URL)
      admin: {
        urls: ['admin', 'administracion', 'administración', 'gestion'],
        label: '👑 Panel de Administración',
        url: '/admin',
        color: '#ff3d8b'
      }
    },
    // OPCIONAL: selectores CSS donde enclavar el botón en tu propio layout.
    // Ej.: hosts.admin = ['header .nav-right', '#menu-admin']  (el primero que exista gana)
    hosts: {
      instructor: [],
      admin: []
    },
    // ¿Dónde meter el botón dentro del host? 'append' (al final) o 'prepend' (al principio)
    hostPos: 'append'
  };
  /* ══════════════════════════ */

  var injected = { instructor: [], admin: [] };   // botones colocados ahora mismo
  var overlayEl = null;
  var escHandler = null;

  /* carpeta donde vive este widget (para resolver URLs de los paneles) */
  var SCRIPT_DIR = '';
  try {
    var _s = document.currentScript;
    if (_s && _s.src) SCRIPT_DIR = _s.src.substring(0, _s.src.lastIndexOf('/') + 1);
  } catch (e) {}

  /* resuelve la URL del panel: relativa al widget, o raíz del sitio, o absoluta */
  function panelUrl(key) {
    var u = CFG.pages[key].url;
    if (!u) return u;
    if (/^https?:\/\//i.test(u) || u.charAt(0) === '/' || u.charAt(0) === '#') return u;
    return SCRIPT_DIR + u;
  }

  /* ───────────── utilidades ───────────── */
  function pageMatches(key) {
    var url = (location.href || '').toLowerCase();
    try { url += ' ' + (location.search || '').toLowerCase(); } catch (e) {}
    if (key === 'admin' && /(^|[?&])admin=1(&|$)/.test(location.search)) return true;
    var words = CFG.pages[key].urls || [];
    for (var i = 0; i < words.length; i++) {
      if (words[i] && url.indexOf(String(words[i]).toLowerCase()) !== -1) return true;
    }
    return false;
  }

  function css(btn, color) {
    btn.style.cssText =
      'display:inline-flex;align-items:center;gap:8px;font:600 14px/1 "Inter",system-ui,' +
      'Segoe UI,Roboto,Arial,sans-serif;color:#fff;background:linear-gradient(135deg,' +
      color + ',#6d28d9);border:0;border-radius:999px;padding:13px 20px;cursor:pointer;' +
      'box-shadow:0 6px 24px rgba(109,40,217,.45);transition:transform .15s,box-shadow .15s;' +
      'user-select:none;white-space:nowrap';
    btn.addEventListener('mouseenter', function () {
      btn.style.transform = 'translateY(-2px) scale(1.03)';
      btn.style.boxShadow = '0 10px 30px rgba(109,40,217,.6)';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.transform = ''; btn.style.boxShadow = '0 6px 24px rgba(109,40,217,.45)';
    });
  }

  /* ───────────── modal ───────────── */
  function open(key) {
    var p = CFG.pages[key];
    if (!p) return;
    var target = panelUrl(key);
    if (target && target.charAt(0) === '/') {
      try {
        window.history.pushState({}, '', target);
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch (e) {
        window.location.href = target;
      }
      return;
    }
    if (CFG.mode === 'tab') { window.open(target, '_blank', 'noopener'); return; }
    close(); // por si había otro
    document.body.style.overflow = 'hidden';

    overlayEl = document.createElement('div');
    overlayEl.id = 'spettro-overlay';
    overlayEl.style.cssText =
      'position:fixed;inset:0;z-index:' + (CFG.zIndex + 1) + ';background:#0a0a10;' +
      'display:flex;flex-direction:column';

    var bar = document.createElement('div');
    bar.style.cssText =
      'height:46px;flex:none;display:flex;align-items:center;gap:12px;padding:0 14px;' +
      'background:#14141f;border-bottom:1px solid #26263a;color:#e8e8f2;' +
      'font:600 13px/1 system-ui,Segoe UI,Roboto,Arial,sans-serif';
    bar.innerHTML =
      '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
      (CFG.modalTitle[key] || p.label) + '</span>';

    var btnTab = document.createElement('button');
    btnTab.textContent = '↗ Pestaña nueva';
    btnTab.style.cssText =
      'background:none;border:1px solid #33334a;color:#9a9ab0;border-radius:8px;' +
      'padding:6px 10px;cursor:pointer;font:12px system-ui,Segoe UI,Arial,sans-serif';
    btnTab.onclick = function () { window.open(panelUrl(key), '_blank', 'noopener'); };

    var btnX = document.createElement('button');
    btnX.textContent = '✕ Cerrar';
    btnX.style.cssText =
      'background:rgba(255,92,92,.12);border:1px solid rgba(255,92,92,.5);color:#ff5c5c;' +
      'border-radius:8px;padding:6px 10px;cursor:pointer;font:12px system-ui,Segoe UI,Arial,sans-serif';
    btnX.onclick = close;

    var loader = document.createElement('span');
    loader.textContent = 'cargando…';
    loader.style.cssText = 'color:#6a6a80;font:11px monospace';

    var frame = document.createElement('iframe');
    frame.src = panelUrl(key);
    frame.title = CFG.modalTitle[key] || p.label;
    frame.style.cssText = 'flex:1;width:100%;border:0;background:#0a0a10';
    frame.allow = 'fullscreen';
    frame.onload = function () { if (loader.parentNode) loader.parentNode.removeChild(loader); };

    bar.appendChild(loader);
    bar.appendChild(btnTab);
    bar.appendChild(btnX);
    overlayEl.appendChild(bar);
    overlayEl.appendChild(frame);
    document.body.appendChild(overlayEl);

    escHandler = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', escHandler);
  }

  function close() {
    if (escHandler) { document.removeEventListener('keydown', escHandler); escHandler = null; }
    if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
    overlayEl = null;
    document.body.style.overflow = '';
  }

  /* ───────────── colocación de botones ───────────── */
  function clearButtons(key) {
    injected[key].forEach(function (b) { if (b && b.parentNode) b.parentNode.removeChild(b); });
    injected[key] = [];
  }

  function sync() {
    try {
      ['instructor', 'admin'].forEach(function (key) {
        var p = CFG.pages[key];
        var show = pageMatches(key);
        var hostBtn = findInjected(key);
        if (!show) {
          // fuera de la página correspondiente → quitar nuestros botones
          if (hostBtn.length) { clearButtons(key); }
          removeFloat(key);
          return;
        }
        if (hostBtn.length) return; // ya está en su sitio
        removeFloat(key);

        // 1) enclavado en un host configurado
        var hosts = CFG.hosts[key] || [];
        for (var i = 0; i < hosts.length; i++) {
          var el = document.querySelector(hosts[i]);
          if (el) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'spettro-btn-' + key;
            b.textContent = p.label;
            css(b, p.color);
            b.onclick = function () { open(key); };
            if (CFG.hostPos === 'prepend') { el.insertBefore(b, el.firstChild); }
            else { el.appendChild(b); }
            injected[key].push(b);
            return;
          }
        }
        // 2) flotante contextual
        if (CFG.float) addFloat(key);
      });
    } catch (e) { /* nunca romper la web del cliente */ }
  }

  function findInjected(key) {
    return injected[key].filter(function (b) { return b && b.parentNode; });
  }

  function addFloat(key) {
    if (document.getElementById('spettro-float-' + key)) return;
    var p = CFG.pages[key];
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'spettro-float-' + key;
    b.textContent = p.label;
    css(b, p.color);
    b.style.position = 'fixed';
    b.style.right = '20px';
    b.style.bottom = (20 + (key === 'admin' ? 58 : 0)) + 'px';
    b.style.zIndex = String(CFG.zIndex);
    b.onclick = function () { open(key); };
    document.body.appendChild(b);
  }

  function removeFloat(key) {
    var b = document.getElementById('spettro-float-' + key);
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  /* ───────────── API pública ───────────── */
  window.SpettroPanel = {
    open: open,
    close: close,
    version: '1.0',
    config: function () { return CFG; },
    setUrl: function (key, url) { if (CFG.pages[key]) CFG.pages[key].url = url; }
  };

  /* ───────────── arranque + SPA-safe ───────────── */
  function boot() {
    sync();
    setInterval(sync, 1000);
    if (window.MutationObserver) {
      var t = null;
      new MutationObserver(function () {
        clearTimeout(t); t = setTimeout(sync, 250);
      }).observe(document.documentElement, { childList: true, subtree: true });
    }
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

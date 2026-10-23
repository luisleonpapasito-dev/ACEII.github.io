// ===== ÚNICO LUGAR DONDE SE PEGA LA URL DEL APPS SCRIPT =====
const URL_SERVIDOR = 'https://script.google.com/macros/s/AKfycbytYTtsMeI-9Pw-wWZI1WnpBQlM_NLU-wZyVMINCa--uSqKoGgvN9OKTe5ozjlvBPOv/exec';

const $ = function (id) { return document.getElementById(id); };

(function aplicarTemaInmediato() {
  try {
    const tema = localStorage.getItem('caf_tema') || 'auto';
    const html = document.documentElement;
    html.classList.remove('tema-claro', 'tema-oscuro', 'tema-auto');
    html.classList.add('tema-' + tema);
  } catch (e) {
    document.documentElement.classList.add('tema-auto');
  }
})();

function getTema() {
  try { return localStorage.getItem('caf_tema') || 'auto'; } catch (e) { return 'auto'; }
}

function setTema(tema) {
  try { localStorage.setItem('caf_tema', tema); } catch (e) {}
  const html = document.documentElement;
  html.classList.remove('tema-claro', 'tema-oscuro', 'tema-auto');
  html.classList.add('tema-' + tema);
  window.dispatchEvent(new CustomEvent('caf-tema-cambiado', { detail: { tema: tema } }));
}

function siguienteTema() {
  const actual = getTema();
  const orden = ['auto', 'claro', 'oscuro'];
  const idx = orden.indexOf(actual);
  const siguiente = orden[(idx + 1) % orden.length];
  setTema(siguiente);
  return siguiente;
}

function emojiTema(tema) {
  if (tema === 'claro') return '☀️';
  if (tema === 'oscuro') return '🌙';
  return '⚙️';
}

// ===== MENSAJES (toast) =====
let toastTimeout_ = null;
let toastNode_ = null;
let toastEsCarga_ = false;
let toastLimite_ = 0;

function mostrar(texto, clase) {
  const esToast = (clase === 'ok' || clase === 'error' || clase === 'aviso');
  const e = document.getElementById('estado');
  if (e) {
    e.textContent = texto;
    e.className = clase || '';
    e.style.display = esToast ? 'none' : '';
  }
  if (texto && esToast) {
    mostrarToast_(texto, clase);
  } else if (toastEsCarga_) {
    // Si había un "Cargando..." y ahora llega un estado normal, quitarlo
    ocultarToast_();
  }
}

function iconoToast_(clase, cargando) {
  const span = document.createElement('span');
  if (cargando) {
    span.className = 'toast-spinner';
    return span;
  }
  span.className = 'toast-ico';
  const base = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">';
  if (clase === 'ok') {
    span.innerHTML = base + '<path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  } else {
    span.innerHTML = base + '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/></svg>';
  }
  return span;
}

function ocultarToast_() {
  clearTimeout(toastTimeout_);
  toastEsCarga_ = false;
  if (toastNode_) toastNode_.classList.remove('visible');
}

function programarOcultarToast_(esperaMs) {
  clearTimeout(toastTimeout_);
  toastTimeout_ = setTimeout(function () {
    // Si sigue habiendo cargas en curso, el "Cargando..." se queda
    if (toastEsCarga_ && cargasActivas_ > 0 && Date.now() < toastLimite_) {
      programarOcultarToast_(400);
    } else {
      ocultarToast_();
    }
  }, esperaMs);
}

function mostrarToast_(texto, clase) {
  if (!toastNode_) {
    toastNode_ = document.getElementById('toastGlobal');
    if (!toastNode_) {
      toastNode_ = document.createElement('div');
      toastNode_.id = 'toastGlobal';
      document.body.appendChild(toastNode_);
    }
  }
  const cargando = (clase === 'aviso') && /(\.\.\.|…)\s*$/.test(texto);
  toastEsCarga_ = cargando;
  toastLimite_ = Date.now() + 30000;

  // === ESTA ES LA PARTE QUE CAMBIÓ ===
  toastNode_.textContent = '';
  toastNode_.appendChild(iconoToast_(clase, cargando));
  const t = document.createElement('span');
  t.textContent = texto;
  t.style.whiteSpace = 'normal';
  t.style.wordBreak = 'break-word';
  t.style.textAlign = 'left';
  toastNode_.appendChild(t);

  // Se ajusta al texto; solo baja de línea si es muy largo
  toastNode_.style.width = 'max-content';
  toastNode_.style.maxWidth = 'calc(100vw - 32px)';
  toastNode_.style.boxSizing = 'border-box';
  toastNode_.style.whiteSpace = 'normal';
  toastNode_.style.wordBreak = 'break-word';
  toastNode_.style.alignItems = 'center';
  toastNode_.style.borderRadius = '22px';
  toastNode_.style.padding = '12px 18px';

  toastNode_.className = 'toast-global visible ' + (clase || '') + (cargando ? ' cargando' : '');
  programarOcultarToast_(clase === 'error' ? 4000 : 2500);

  if (navigator.vibrate) {
    if (clase === 'ok') navigator.vibrate(60);
    else if (clase === 'error') navigator.vibrate([80, 40, 80]);
  }
}

// ===== BARRA DE CARGA SUPERIOR =====
// Aparece sola cuando hay peticiones al servidor en curso (si tardan más de 200 ms)
let cargasActivas_ = 0;
let barraNode_ = null;
let barraTimer_ = null;

function barraCarga_() {
  if (barraNode_) return barraNode_;
  if (!document.body) return null;
  const st = document.createElement('style');
  st.textContent =
    '#barraCarga{position:fixed;top:0;left:0;right:0;height:3px;z-index:3000;pointer-events:none;opacity:0;overflow:hidden;transition:opacity .25s ease}' +
    '#barraCarga.activa{opacity:1}' +
    '#barraCarga::after{content:"";position:absolute;top:0;bottom:0;left:0;width:40%;background:linear-gradient(90deg,transparent,#60A5FA,#2563EB,transparent);animation:barraCargaMov 1.1s cubic-bezier(.45,0,.2,1) infinite}' +
    '@keyframes barraCargaMov{from{transform:translateX(-100%)}to{transform:translateX(250%)}}';
  document.head.appendChild(st);
  barraNode_ = document.createElement('div');
  barraNode_.id = 'barraCarga';
  document.body.appendChild(barraNode_);
  return barraNode_;
}

function cargaInicio_() {
  cargasActivas_++;
  if (cargasActivas_ === 1) {
    clearTimeout(barraTimer_);
    barraTimer_ = setTimeout(function () {
      const b = barraCarga_();
      if (b) b.classList.add('activa');
    }, 200);
  }
}

function cargaFin_() {
  cargasActivas_ = Math.max(0, cargasActivas_ - 1);
  if (cargasActivas_ === 0) {
    clearTimeout(barraTimer_);
    if (barraNode_) barraNode_.classList.remove('activa');
    // Si había un "Cargando..." esperando, quitarlo al terminar todo
    setTimeout(function () {
      if (cargasActivas_ === 0 && toastEsCarga_) ocultarToast_();
    }, 150);
  }
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getToken() { try { return localStorage.getItem('caf_token') || ''; } catch (e) { return ''; } }
function guardarToken(t) { try { localStorage.setItem('caf_token', t); } catch (e) {} }
function borrarToken() { try { localStorage.removeItem('caf_token'); } catch (e) {} }

function getUsuarioTurno() {
  try {
    const u = JSON.parse(localStorage.getItem('caf_usuario_turno') || 'null');
    return u && u.id ? u : null;
  } catch (e) { return null; }
}
function guardarUsuarioTurno(u) {
  try { localStorage.setItem('caf_usuario_turno', JSON.stringify(u)); } catch (e) {}
}
function borrarUsuarioTurno() {
  try { localStorage.removeItem('caf_usuario_turno'); } catch (e) {}
}

function getTurnoActual() {
  try {
    const t = JSON.parse(localStorage.getItem('caf_turno_caja') || 'null');
    return t && t.id ? t : null;
  } catch (e) { return null; }
}
function guardarTurnoActual(t) {
  try { localStorage.setItem('caf_turno_caja', JSON.stringify(t)); } catch (e) {}
}
function borrarTurnoActual() {
  try { localStorage.removeItem('caf_turno_caja'); } catch (e) {}
}

function exigirSesion() {
  if (!getToken()) { location.href = 'index.html'; return; }
  if (!getUsuarioTurno()) { location.href = 'index.html'; return; }
}

async function exigirTurnoCajaAbierto() {
  const u = getUsuarioTurno();
  if (!u) return false;

  if (u.rol === 'admin') return true;

  // Si hay turno local, confirmar con el servidor que sigue abierto
  const turnoLocal = getTurnoActual();
  if (turnoLocal) {
    try {
      const r = await jsonp({ accion: 'mi_turno', id_usuario: u.id }, 15000);
      if (r && r.ok && r.turno) {
        // Sigue abierto → OK
        guardarTurnoActual(r.turno);
        return true;
      } else {
        // 🚨 El servidor dice que NO hay turno → limpiar local y salir
        borrarTurnoActual();
        location.href = 'index.html';
        return false;
      }
    } catch (e) {
      // Si no hay conexión, confiamos en el local (no bloquear)
      return true;
    }
  }

  // No hay turno local → verificar con el servidor
  try {
    const r = await jsonp({ accion: 'mi_turno', id_usuario: u.id }, 15000);
    if (r && r.ok && r.turno) {
      guardarTurnoActual(r.turno);
      return true;
    }
  } catch (e) {}

  location.href = 'caja.html';
  return false;
}

function pintarUsuarioTurno() {
  const u = getUsuarioTurno();
  const cont = document.getElementById('usuarioTurno');
  if (!cont) return;
  cont.textContent = u ? '👤 ' + (u.nombre || u.id) : '';
}

function cerrarTurno() {
  if (!confirm('¿Cerrar el turno de usuario? Tendrás que identificarte de nuevo.')) return;
  borrarUsuarioTurno();
  borrarTurnoActual();
  location.href = 'index.html';
}

function jsonp(params, limiteMs) {
  return new Promise(function (resolve, reject) {
    cargaInicio_();
    const nombre = 'cb_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
    const s = document.createElement('script');
    let fin = false;
    let timeoutId = null;
    function limpiar() {
      fin = true;
      clearTimeout(timeoutId);
      if (s.parentNode) s.parentNode.removeChild(s);
      delete window[nombre];
      cargaFin_();
    }
    timeoutId = setTimeout(function () {
      if (!fin) { limpiar(); reject(new Error('El servidor no respondió a tiempo')); }
    }, limiteMs || 15000);
    window[nombre] = function (r) { if (!fin) { limpiar(); resolve(r); } };
    s.onerror = function () {
      if (!fin) { limpiar(); reject(new Error('No se pudo conectar con el servidor')); }
    };
    let q = '?callback=' + nombre + '&token=' + encodeURIComponent(getToken());
    Object.keys(params).forEach(function (k) { q += '&' + k + '=' + encodeURIComponent(params[k]); });
    s.src = URL_SERVIDOR + q;
    document.head.appendChild(s);
  });
}

async function post(cuerpo) {
  cargaInicio_();
  const ctrl = new AbortController();
  const timeoutId = setTimeout(function () { ctrl.abort(); }, 120000);
  try {
    const r = await fetch(URL_SERVIDOR, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ token: getToken() }, cuerpo)),
      signal: ctrl.signal
    });
    return await r.json();
  } finally {
    clearTimeout(timeoutId);
    cargaFin_();
  }
}
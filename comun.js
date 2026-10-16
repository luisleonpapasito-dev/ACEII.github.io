// ===== ÚNICO LUGAR DONDE SE PEGA LA URL DEL APPS SCRIPT =====
const URL_SERVIDOR = 'https://script.google.com/macros/s/AKfycbytYTtsMeI-9Pw-wWZI1WnpBQlM_NLU-wZyVMINCa--uSqKoGgvN9OKTe5ozjlvBPOv/exec';

const $ = function (id) { return document.getElementById(id); };

// ============================================================
// TEMA (claro / oscuro / auto)
// Se aplica ANTES de que se renderice el body para evitar "flash"
// ============================================================
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

// ============================================================
// TOASTS GLOBALES
// ============================================================
function mostrar(texto, clase) {
  const e = document.getElementById('estado');
  if (e) {
    e.textContent = texto;
    e.className = clase || '';
    if (clase === 'ok' || clase === 'error' || clase === 'aviso') {
      e.style.display = 'none';
    } else {
      e.style.display = '';
    }
  }

  if (texto && (clase === 'ok' || clase === 'error' || clase === 'aviso')) {
    mostrarToast_(texto, clase);
  }
}

let toastTimeout_ = null;
let toastNode_ = null;

function mostrarToast_(texto, clase) {
  if (!toastNode_) {
    toastNode_ = document.createElement('div');
    toastNode_.id = 'toastGlobal';
    document.body.appendChild(toastNode_);
  }

  let icono = '';
  if (clase === 'ok') icono = '✅ ';
  else if (clase === 'error') icono = '⚠️ ';
  else if (clase === 'aviso') icono = '⏳ ';

  toastNode_.textContent = icono + texto;
  toastNode_.className = 'toast-global visible ' + (clase || '');

  clearTimeout(toastTimeout_);
  toastTimeout_ = setTimeout(function () {
    toastNode_.classList.remove('visible');
  }, clase === 'error' ? 4000 : 2500);

  if (navigator.vibrate) {
    if (clase === 'ok') navigator.vibrate(60);
    else if (clase === 'error') navigator.vibrate([80, 40, 80]);
  }
}

// ============================================================
// UTILIDADES
// ============================================================
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- Token general ----------
function getToken() { try { return localStorage.getItem('caf_token') || ''; } catch (e) { return ''; } }
function guardarToken(t) { try { localStorage.setItem('caf_token', t); } catch (e) {} }
function borrarToken() { try { localStorage.removeItem('caf_token'); } catch (e) {} }

// ---------- Usuario de turno ----------
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

// ---------- Turno de caja ----------
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

  // ⭐ Si es admin, no exigir turno abierto
  if (u.rol === 'admin') return true;

  if (getTurnoActual()) return true;
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

// ---------- JSONP y POST ----------
function jsonp(params, limiteMs) {
  return new Promise(function (resolve, reject) {
    const nombre = 'cb_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
    const s = document.createElement('script');
    let fin = false;
    let t = null;
    function limpiar() {
      fin = true;
      clearTimeout(t);
      if (s.parentNode) s.parentNode.removeChild(s);
      delete window[nombre];
    }
    t = setTimeout(function () {
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
  const ctrl = new AbortController();
  const t = setTimeout(function () { ctrl.abort(); }, 120000);
  try {
    const r = await fetch(URL_SERVIDOR, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ token: getToken() }, cuerpo)),
      signal: ctrl.signal
    });
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}
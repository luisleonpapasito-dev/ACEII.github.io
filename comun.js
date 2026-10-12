// ===== ÚNICO LUGAR DONDE SE PEGA LA URL DEL APPS SCRIPT =====
const URL_SERVIDOR = 'https://script.google.com/macros/s/AKfycbytYTtsMeI-9Pw-wWZI1WnpBQlM_NLU-wZyVMINCa--uSqKoGgvN9OKTe5ozjlvBPOv/exec';

const $ = function (id) { return document.getElementById(id); };

function mostrar(texto, clase) {
  const e = $('estado');
  e.textContent = texto;
  e.className = clase || '';
}

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getToken() { try { return localStorage.getItem('caf_token') || ''; } catch (e) { return ''; } }
function guardarToken(t) { try { localStorage.setItem('caf_token', t); } catch (e) {} }
function borrarToken() { try { localStorage.removeItem('caf_token'); } catch (e) {} }
function exigirSesion() { if (!getToken()) location.href = 'index.html'; }

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
      if (!fin) { limpiar(); reject(new Error('No se pudo conectar con el servidor (revisa internet y que la implementación sea "Cualquier persona")')); }
    };
    let q = '?callback=' + nombre + '&token=' + encodeURIComponent(getToken());
    Object.keys(params).forEach(function (k) { q += '&' + k + '=' + encodeURIComponent(params[k]); });
    s.src = URL_SERVIDOR + q;
    document.head.appendChild(s);
  });
}

async function post(cuerpo) {
  const ctrl = new AbortController();
  const t = setTimeout(function () { ctrl.abort(); }, 25000);
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
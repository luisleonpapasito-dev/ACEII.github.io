// nav.js
(function() {
    if (document.querySelector('.bottom-nav-bar-container')) return;
    if (typeof getUsuarioTurno === 'function' && !getUsuarioTurno()) return;

    const navHTML = `
        <style>
            .bottom-nav-bar-container {
                position: fixed;
                bottom: 0; left: 0; right: 0;
                display: flex; justify-content: center;
                z-index: 1000; pointer-events: none;
                padding-bottom: env(safe-area-inset-bottom, 0);
            }
            .bottom-nav-bar {
                width: 100%; max-width: 520px; height: 84px;
                background: var(--superficie, #fff);
                border-top: 1px solid var(--ac-borde, #E3E9F4);
                border-radius: 24px 24px 0 0;
                box-shadow: 0 -6px 18px rgba(30,60,140,.08);
                display: flex; padding: 10px 10px 0 10px;
                pointer-events: auto; box-sizing: border-box;
            }
            .nav-item {
                flex: 1; display: flex; flex-direction: column;
                align-items: center; gap: 6px;
                text-decoration: none;
                color: var(--ac-texto-suave, #5B6785);
                font-size: 11px; font-weight: 600;
                transition: color 0.2s;
                -webkit-tap-highlight-color: transparent;
            }
            .nav-item.active { color: var(--ac-flecha, #2563EB); font-weight: 700; }
            .nav-item span {
                width: 64px; height: 32px; border-radius: 16px;
                background: transparent;
                display: flex; align-items: center; justify-content: center;
                transition: background 0.2s;
            }
            .nav-item.active span { background: var(--ac-flecha-bg, rgba(37, 99, 235, 0.10)); }
            .nav-item svg {
                width: 24px; height: 24px; fill: none; stroke: currentColor;
                stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
            }
            .nav-item.active svg { stroke-width: 2; }

            /* Fallback oscuro */
            @media (prefers-color-scheme: dark) {
                html:not(.tema-claro) .bottom-nav-bar { background: #121D3A; border-top-color: #223156; }
                html:not(.tema-claro) .nav-item { color: #9AA8CC; }
                html:not(.tema-claro) .nav-item.active { color: #7DB1FF; }
                html:not(.tema-claro) .nav-item.active span { background: rgba(125, 177, 255, 0.14); }
            }
            html.tema-oscuro .bottom-nav-bar { background: #121D3A; border-top-color: #223156; }
            html.tema-oscuro .nav-item { color: #9AA8CC; }
            html.tema-oscuro .nav-item.active { color: #7DB1FF; }
            html.tema-oscuro .nav-item.active span { background: rgba(125, 177, 255, 0.14); }

            @media (max-width: 360px) {
                .bottom-nav-bar { height: 72px; padding: 8px 4px 0 4px; }
                .nav-item span { width: 52px; height: 28px; }
                .nav-item svg { width: 20px; height: 20px; }
                .nav-item { font-size: 10px; }
            }
        </style>
        <div class="bottom-nav-bar-container">
            <div class="bottom-nav-bar">
                <a href="index.html" class="nav-item" data-page="inicio" aria-label="Inicio">
                    <svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>
                    <span>Inicio</span>
                </a>
                <a href="inventario.html" class="nav-item" data-page="inventario" aria-label="Inventario">
                    <svg viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5v8l9 5 9-5V8zM3.3 7.5L12 12.5l8.7-5M12 22v-9.5"/></svg>
                    <span>Inventario</span>
                </a>
                <a href="historial-caja.html" class="nav-item" data-page="historial" aria-label="Historial">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                    <span>Historial</span>
                </a>
                <a href="perfil.html" class="nav-item" data-page="perfil" aria-label="Mi perfil">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
                    <span>Perfil</span>
                </a>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', navHTML);

    const path = window.location.pathname.split('/').pop() || '';
    let activePage = '';
    if (path === '' || path === 'index.html') activePage = 'inicio';
    else if (['inventario.html', 'productos.html', 'categorias.html', 'codigos.html', 'recepcion.html'].includes(path)) activePage = 'inventario';
    else if (['historial-caja.html', 'dashboard.html', 'caja.html', 'ventas.html', 'devoluciones.html'].includes(path)) activePage = 'historial';
    else if (path === 'perfil.html') activePage = 'perfil';

    if (activePage) {
        const activeItem = document.querySelector(`.nav-item[data-page="${activePage}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
            activeItem.setAttribute('aria-current', 'page');
        }
    }
})();
// nav.js
(function() {
    // No mostrar la barra de navegación si no hay sesión o si estamos en la página de login/turno
    if (typeof getUsuarioTurno === 'function' && !getUsuarioTurno()) {
        return;
    }

    const navHTML = `
        <div class="bottom-nav-bar">
            <a href="index.html" class="nav-item" data-page="inicio">
                <svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>
                <span>Inicio</span>
            </a>
            <a href="ventas.html" class="nav-item" data-page="ventas">
                <svg viewBox="0 0 24 24"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.4 11.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 7H6"/></svg>
                <span>Ventas</span>
            </a>
            <a href="inventario.html" class="nav-item" data-page="inventario">
                <svg viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5v8l9 5 9-5V8zM3.3 7.5L12 12.5l8.7-5M12 22v-9.5"/></svg>
                <span>Inventario</span>
            </a>
            <a href="historial-caja.html" class="nav-item" data-page="historial">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                <span>Historial</span>
            </a>
            <a href="index.html#mas" class="nav-item" data-page="mas">
                <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
                <span>Más</span>
            </a>
        </div>
    `;

    // Insertar la barra de navegación al final del body
    document.body.insertAdjacentHTML('beforeend', navHTML);

    // Determinar la página actual
    const path = window.location.pathname.split('/').pop();
    let activePage = '';
    if (path === 'index.html' || path === '') {
        activePage = 'inicio';
    } else if (path === 'ventas.html') {
        activePage = 'ventas';
    } else if (path === 'inventario.html') {
        activePage = 'inventario';
    } else if (path === 'historial-caja.html') {
        activePage = 'historial';
    } else if (window.location.hash === '#mas') {
        activePage = 'mas';
    }

    // Marcar el botón activo
    if (activePage) {
        const activeItem = document.querySelector(`.nav-item[data-page="${activePage}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }
})();
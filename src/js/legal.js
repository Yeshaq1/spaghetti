// Static legal pages (e.g. /untangle/privacy). The copy lives in the HTML so it renders
// without JavaScript; this only wires up the shared header menu and footer year.

(() => {
    const toggle = document.querySelector('[data-menu-toggle]');
    const nav = document.getElementById('site-nav');

    if (toggle && nav) {
        const setState = (isOpen) => {
            document.body.classList.toggle('nav-open', isOpen);
            toggle.setAttribute('aria-expanded', String(isOpen));
            toggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
        };

        toggle.addEventListener('click', () => {
            setState(!document.body.classList.contains('nav-open'));
        });

        nav.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => setState(false));
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') setState(false);
        });
    }

    const year = document.querySelector('[data-footer-year]');
    if (year) year.textContent = String(new Date().getFullYear());
})();

import { COPY, CLIENT_LOGOS, CALENDAR_URL } from './content.js';
import { SceneManager } from './core/SceneManager.js';
import { ScrollManager } from './core/ScrollManager.js';
import { Effects } from './three/Effects.js';

const SUPPORTED_LANGUAGES = ['en', 'ar'];
const DEFAULT_LANGUAGE = 'en';

class App {
    constructor() {
        this.language = this.getInitialLanguage();
        this.sceneManager = null;
        this.scrollManager = null;
        this.effects = null;
        this.clock = new THREE.Clock();
        this.isAnimating = false;
    }

    init() {
        this.renderContent();
        this.setupNavigation();
        this.setupLanguageToggle();

        this.sceneManager = new SceneManager().init();
        this.effects = new Effects(this.sceneManager.getScene()).init();
        this.scrollManager = new ScrollManager().init();
        this.setupScrollCallbacks();
        this.setupResizeHandler();
        this.startAnimation();
    }

    getInitialLanguage() {
        const storedLanguage = window.localStorage.getItem('spaghetti-language');
        if (SUPPORTED_LANGUAGES.includes(storedLanguage)) {
            return storedLanguage;
        }

        const browserLanguage = navigator.language || '';
        return browserLanguage.toLowerCase().startsWith('ar') ? 'ar' : DEFAULT_LANGUAGE;
    }

    get copy() {
        return COPY[this.language] || COPY[DEFAULT_LANGUAGE];
    }

    renderContent() {
        const copy = this.copy;
        const isArabic = this.language === 'ar';

        document.documentElement.lang = this.language;
        document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
        document.body.dataset.language = this.language;
        document.title = copy.meta.title;

        const description = document.querySelector('meta[name="description"]');
        if (description) {
            description.setAttribute('content', copy.meta.description);
        }

        document.querySelectorAll('[data-i18n]').forEach((element) => {
            const value = this.getPath(copy, element.dataset.i18n);
            if (typeof value === 'string') {
                element.textContent = value;
            }
        });

        document.querySelectorAll('a[href*="calendar.app.google"]').forEach((link) => {
            link.href = CALENDAR_URL;
        });

        this.renderMethodSteps(copy.method.steps);
        this.renderWhoList(copy.who.items);
        this.renderSystems(copy.systems.items);
        this.renderLogos();
        this.renderOutcomes(copy.proof.outcomes);
        this.renderFitList(copy.fit.items);
        this.updateLanguageToggle();
        this.updateMenuButton(false);

        if (this.scrollManager) {
            this.scrollManager.refresh();
        }
    }

    getPath(source, path) {
        return path.split('.').reduce((value, key) => {
            if (value && Object.prototype.hasOwnProperty.call(value, key)) {
                return value[key];
            }
            return undefined;
        }, source);
    }

    renderMethodSteps(steps) {
        const list = document.getElementById('method-list');
        if (!list) return;

        list.innerHTML = '';
        steps.forEach((step, index) => {
            const item = document.createElement('li');
            item.className = 'method-card';
            item.innerHTML = `
                <span class="method-card__number">${String(index + 1).padStart(2, '0')}</span>
                <h3>${this.escapeHtml(step.title)}</h3>
                <p>${this.escapeHtml(step.text)}</p>
            `;
            list.appendChild(item);
        });
    }

    renderWhoList(items) {
        const list = document.getElementById('who-list');
        if (!list) return;

        list.innerHTML = '';
        items.forEach((text) => {
            const item = document.createElement('div');
            item.className = 'fit-item';
            item.textContent = text;
            list.appendChild(item);
        });
    }

    renderSystems(items) {
        const grid = document.getElementById('systems-grid');
        if (!grid) return;

        grid.innerHTML = '';
        items.forEach((item) => {
            const article = document.createElement('article');
            article.className = 'system-card';
            article.innerHTML = `
                <h3>${this.escapeHtml(item.title)}</h3>
                <p>${this.escapeHtml(item.text)}</p>
            `;
            grid.appendChild(article);
        });
    }

    renderLogos() {
        const strip = document.getElementById('logo-strip');
        if (!strip) return;

        strip.innerHTML = '';
        CLIENT_LOGOS.forEach((logo) => {
            const item = document.createElement('div');
            item.className = 'logo-tile';
            item.innerHTML = `<img src="${logo.src}" alt="${this.escapeHtml(logo.name)}" loading="lazy">`;
            strip.appendChild(item);
        });
    }

    renderOutcomes(outcomes) {
        const grid = document.getElementById('outcome-grid');
        if (!grid) return;

        grid.innerHTML = '';
        outcomes.forEach((outcome) => {
            const item = document.createElement('div');
            item.className = 'outcome-item';
            item.textContent = outcome;
            grid.appendChild(item);
        });
    }

    renderFitList(items) {
        const list = document.getElementById('fit-list');
        if (!list) return;

        list.innerHTML = '';
        items.forEach((text) => {
            const item = document.createElement('div');
            item.className = 'fit-item';
            item.textContent = text;
            list.appendChild(item);
        });
    }

    setupLanguageToggle() {
        const toggle = document.querySelector('[data-language-toggle]');
        if (!toggle) return;

        toggle.addEventListener('click', () => {
            this.language = this.language === 'en' ? 'ar' : 'en';
            window.localStorage.setItem('spaghetti-language', this.language);
            this.closeMenu();
            this.renderContent();
        });
    }

    updateLanguageToggle() {
        const toggle = document.querySelector('[data-language-toggle]');
        const label = document.querySelector('[data-language-label]');
        if (!toggle || !label) return;

        const nextLanguage = this.language === 'en' ? 'ar' : 'en';
        label.textContent = nextLanguage.toUpperCase();
        toggle.setAttribute(
            'aria-label',
            this.language === 'en' ? this.copy.ui.switchToArabic : this.copy.ui.switchToEnglish
        );
    }

    setupNavigation() {
        const toggle = document.querySelector('[data-menu-toggle]');
        const nav = document.getElementById('site-nav');
        if (!toggle || !nav) return;

        toggle.addEventListener('click', () => {
            const nextState = !document.body.classList.contains('nav-open');
            document.body.classList.toggle('nav-open', nextState);
            this.updateMenuButton(nextState);
        });

        nav.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                this.closeMenu();
            });
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeMenu();
            }
        });
    }

    closeMenu() {
        document.body.classList.remove('nav-open');
        this.updateMenuButton(false);
    }

    updateMenuButton(isOpen) {
        const toggle = document.querySelector('[data-menu-toggle]');
        if (!toggle) return;

        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? this.copy.ui.closeMenu : this.copy.ui.openMenu);
    }

    setupScrollCallbacks() {
        this.scrollManager.on('onScrollProgress', (progress) => {
            this.sceneManager.updateScrollProgress(progress);
            this.effects.updateScrollProgress(progress);
        });

        this.scrollManager.on('onSceneChange', (payload) => {
            this.updateActiveNavigation(payload.scene);
        });

        this.scrollManager.on('onSceneProgress', (payload) => {
            this.effects.updateSceneState(payload);
        });

        this.scrollManager.on('onSectionVisible', ({ section }) => {
            section.classList.add('section-ready');
        });
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.sceneManager.handleResize();
            this.effects.positionRig();
            this.scrollManager.refresh();
        });
    }

    updateActiveNavigation(scene) {
        const nav = document.getElementById('site-nav');
        if (!nav) return;

        nav.querySelectorAll('a').forEach((link) => {
            const href = link.getAttribute('href') || '';
            const targetId = href.startsWith('#') ? href.slice(1) : '';
            const isActive = targetId === scene;
            link.classList.toggle('is-active', isActive);
            link.setAttribute('aria-current', isActive ? 'page' : 'false');
        });
    }

    startAnimation() {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const animate = () => {
            if (!this.isAnimating) return;

            const time = this.clock.getElapsedTime();
            this.sceneManager.updateCamera(time);
            this.effects.animate(time, this.sceneManager.pointer);
            this.sceneManager.render();

            requestAnimationFrame(animate);
        };

        animate();
    }

    escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    const app = new App();
    app.init();
    window.app = app;
});

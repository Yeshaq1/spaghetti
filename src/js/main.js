import { COPY, CLIENT_LOGOS, CALENDAR_URL } from './content.js';
import { SceneManager } from './core/SceneManager.js';
import { ScrollManager } from './core/ScrollManager.js';
import { Effects } from './three/Effects.js';

const SUPPORTED_LANGUAGES = ['en'];
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

        this.sceneManager = new SceneManager().init();
        this.effects = new Effects(this.sceneManager.getScene()).init();
        this.scrollManager = new ScrollManager().init();
        this.setupScrollCallbacks();
        this.setupResizeHandler();
        this.updateThreeBackgroundFromScroll();
        this.startAnimation();
    }

    updateThreeBackgroundFromScroll() {
        const intro = document.getElementById('intro');
        if (!intro || !this.sceneManager) return;
        const rect = intro.getBoundingClientRect();
        const pastIntro = rect.bottom < 0;
        this.sceneManager.setThreeBackgroundVisible(!pastIntro);
    }

    getInitialLanguage() {
        const storedLanguage = window.localStorage.getItem('spaghetti-language');
        if (SUPPORTED_LANGUAGES.includes(storedLanguage)) {
            return storedLanguage;
        }

        return DEFAULT_LANGUAGE;
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
        this.renderSystems(copy.systems.items);
        this.renderLogos();
        this.renderFitList(copy.fit.items);
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

    renderSystems(items) {
        const grid = document.getElementById('systems-grid');
        if (!grid) return;

        grid.innerHTML = '';
        items.forEach((item) => {
            const article = document.createElement('article');
            article.className = 'system-card';
            const tags = Array.isArray(item.tags) ? item.tags : [];
            const tagsMarkup = tags
                .map(
                    (tag) =>
                        `<li><span class="system-card__tag">${this.escapeHtml(tag)}</span></li>`
                )
                .join('');
            article.innerHTML = `
                <p class="system-card__area">${this.escapeHtml(item.area)}</p>
                <h3 class="system-card__headline">${this.escapeHtml(item.headline)}</h3>
                <p class="system-card__body">${this.escapeHtml(item.text)}</p>
                <ul class="system-card__tags">${tagsMarkup}</ul>
            `;
            grid.appendChild(article);
        });
    }

    renderLogos() {
        const strip = document.getElementById('logo-strip');
        if (!strip) return;

        strip.innerHTML = '';

        const reduceMotion =
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const loopDuplicate = CLIENT_LOGOS.length > 0 && !reduceMotion;

        const appendTile = (logo, decorative) => {
            const item = document.createElement('div');
            item.className = 'logo-tile';
            const alt = decorative ? '' : this.escapeHtml(logo.name);
            item.innerHTML = `<img src="${logo.src}" alt="${alt}" loading="lazy"${
                decorative ? ' aria-hidden="true"' : ''
            }>`;
            if (decorative) {
                item.setAttribute('aria-hidden', 'true');
            }
            strip.appendChild(item);
        };

        CLIENT_LOGOS.forEach((logo) => appendTile(logo, false));
        if (loopDuplicate) {
            CLIENT_LOGOS.forEach((logo) => appendTile(logo, true));
        }
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
            this.updateThreeBackgroundFromScroll();
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
            this.updateThreeBackgroundFromScroll();
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
            if (this.sceneManager.isThreeBackgroundVisible()) {
                this.effects.animate(time, this.sceneManager.pointer);
                this.sceneManager.render();
            }

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

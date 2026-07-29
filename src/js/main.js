import { COPY, CLIENT_LOGOS, SYSTEM_LOGOS, CALENDAR_URL, CASE_STUDIES } from './content.js';
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
        this.setupAuditFloat();

        this.sceneManager = new SceneManager().init();
        this.effects = new Effects(this.sceneManager.getScene()).init();
        this.scrollManager = new ScrollManager().init();
        this.setupScrollCallbacks();
        this.setupResizeHandler();
        this.updateThreeBackgroundFromScroll();
        this.startAnimation();
    }

    // The rope is a hero device. It resolves to the right of the viewport, which is exactly
    // where the following sections put their copy — so retire it as soon as the first
    // content section starts rising, not only once the intro has fully cleared the top.
    updateThreeBackgroundFromScroll() {
        const intro = document.getElementById('intro');
        if (!intro || !this.sceneManager) return;

        const pastIntro = intro.getBoundingClientRect().bottom < 0;

        const systems = document.getElementById('systems');
        const systemsRising = systems
            ? systems.getBoundingClientRect().top < window.innerHeight * 0.72
            : false;

        this.sceneManager.setThreeBackgroundVisible(!pastIntro && !systemsRising);
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

        document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
            const value = this.getPath(copy, element.dataset.i18nAria);
            if (typeof value === 'string') {
                element.setAttribute('aria-label', value);
            }
        });

        document.querySelectorAll('a[href*="calendar.app.google"]').forEach((link) => {
            link.href = CALENDAR_URL;
        });

        this.renderMethodSteps(copy.method.steps);
        this.renderSystems(copy.systems.items);
        this.renderLogos();
        this.renderCaseStudies(copy.work);
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
            item.className = step.flag ? 'method-card method-card--flagged' : 'method-card';
            const flagMarkup = step.flag
                ? `<span class="method-card__flag">${this.escapeHtml(step.flag)}</span>`
                : '';
            item.innerHTML = `
                <span class="method-card__number">${String(index + 1).padStart(2, '0')}</span>
                ${flagMarkup}
                <h3>${this.escapeHtml(step.title)}</h3>
                <p>${this.escapeHtml(step.text)}</p>
            `;
            list.appendChild(item);
        });
    }

    // Tabbed capability index: one area's detail at a time, so the section stops being a
    // wall of parallel cards. Tab list is the navigation; the panel carries claim + proof.
    renderSystems(items) {
        const tablist = document.getElementById('systems-tablist');
        const panels = document.getElementById('systems-panels');
        if (!tablist || !panels) return;

        tablist.innerHTML = '';
        panels.innerHTML = '';

        items.forEach((item, index) => {
            const id = `system-${index}`;
            const selected = index === 0;

            const tab = document.createElement('button');
            tab.type = 'button';
            tab.className = 'system-tab';
            tab.id = `${id}-tab`;
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-controls', `${id}-panel`);
            tab.setAttribute('aria-selected', String(selected));
            tab.tabIndex = selected ? 0 : -1;
            tab.innerHTML = `
                <span class="system-tab__index">${String(index + 1).padStart(2, '0')}</span>
                <span class="system-tab__name">${this.escapeHtml(item.area)}</span>
            `;
            tablist.appendChild(tab);

            const tags = Array.isArray(item.tags) ? item.tags : [];
            const tagsMarkup = tags
                .map((tag) => `<li>${this.escapeHtml(tag)}</li>`)
                .join('');

            // A few client marks per area, from the shared index-keyed list.
            const logos = (SYSTEM_LOGOS[index] || [])
                .map((name) => CLIENT_LOGOS.find((logo) => logo.name === name))
                .filter(Boolean);
            const logosMarkup = logos.length
                ? `<ul class="system-panel__logos">${logos
                      .map(
                          (logo) =>
                              `<li><img src="${this.escapeHtml(logo.src)}" alt="${this.escapeHtml(
                                  logo.name
                              )}" loading="lazy"></li>`
                      )
                      .join('')}</ul>`
                : '';

            const panel = document.createElement('div');
            panel.className = 'system-panel';
            panel.id = `${id}-panel`;
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('aria-labelledby', `${id}-tab`);
            panel.classList.toggle('is-active', selected);
            // Media is optional: if the file is not in place yet the figure removes itself
            // and the copy takes the full width, so a missing gif never leaves a dead frame.
            const mediaMarkup = item.media
                ? `<figure class="system-panel__media${item.media.blend === 'soft' ? ' system-panel__media--soft' : ''}">
                        <img src="${this.escapeHtml(item.media.src)}" alt="${this.escapeHtml(item.media.alt || '')}" loading="lazy">
                    </figure>`
                : '';

            panel.innerHTML = `
                <div class="system-panel__copy">
                    <h3 class="system-panel__headline">${this.escapeHtml(item.headline)}</h3>
                    <p class="system-panel__body">${this.escapeHtml(item.text)}</p>
                    <ul class="system-panel__tags">${tagsMarkup}</ul>
                    ${logosMarkup}
                </div>
                ${mediaMarkup}
            `;

            const image = panel.querySelector('.system-panel__media img');
            if (image) {
                image.addEventListener('error', () => {
                    const figure = image.closest('.system-panel__media');
                    if (figure) figure.remove();
                    panel.classList.add('system-panel--no-media');
                });
            }

            panels.appendChild(panel);
        });

        this.bindSystemTabs(tablist, panels);
    }

    bindSystemTabs(tablist, panels) {
        const tabs = Array.from(tablist.querySelectorAll('.system-tab'));
        const views = Array.from(panels.querySelectorAll('.system-panel'));

        const select = (index, focus) => {
            tabs.forEach((tab, i) => {
                const active = i === index;
                tab.setAttribute('aria-selected', String(active));
                tab.tabIndex = active ? 0 : -1;
                views[i].classList.toggle('is-active', active);
            });
            if (focus) tabs[index].focus();
        };

        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => select(index, false));
            tab.addEventListener('keydown', (event) => {
                const isRtl = document.documentElement.dir === 'rtl';
                const forward = isRtl ? 'ArrowLeft' : 'ArrowRight';
                const back = isRtl ? 'ArrowRight' : 'ArrowLeft';

                if (event.key === 'ArrowDown' || event.key === forward) {
                    event.preventDefault();
                    select((index + 1) % tabs.length, true);
                } else if (event.key === 'ArrowUp' || event.key === back) {
                    event.preventDefault();
                    select((index - 1 + tabs.length) % tabs.length, true);
                } else if (event.key === 'Home') {
                    event.preventDefault();
                    select(0, true);
                } else if (event.key === 'End') {
                    event.preventDefault();
                    select(tabs.length - 1, true);
                }
            });
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

    renderCaseStudies(workCopy) {
        const grid = document.getElementById('work-grid');
        if (!grid) return;

        grid.innerHTML = '';
        grid.dataset.count = String(CASE_STUDIES.length);

        CASE_STUDIES.forEach((study) => {
            const card = document.createElement('a');
            card.className = 'work-card';
            card.href = `/work/${encodeURIComponent(study.slug)}`;

            // Year is deliberately card-free; it still shows in the case study hero meta.
            const meta = [study.sector].filter(Boolean).map((value) => this.escapeHtml(value));
            const metricsMarkup = (Array.isArray(study.metrics) ? study.metrics : [])
                .map(
                    (metric) => `
                        <div class="work-card__metric">
                            <span class="work-card__metric-value">${this.escapeHtml(metric.value)}</span>
                            <span class="work-card__metric-label">${this.escapeHtml(metric.label)}</span>
                        </div>
                    `
                )
                .join('');

            const logo = study.logo && study.logo.src
                ? `<img class="work-card__logo" src="${this.escapeHtml(study.logo.src)}" alt="${this.escapeHtml(study.logo.alt || study.client)}" loading="lazy">`
                : '';

            card.innerHTML = `
                ${logo}
                <p class="work-card__client">
                    <span>${this.escapeHtml(study.client)}</span>
                    ${meta.length ? `<span class="work-card__meta">${meta.join(' &middot; ')}</span>` : ''}
                </p>
                <h3 class="work-card__title">${this.escapeHtml(study.title)}</h3>
                <p class="work-card__summary">${this.escapeHtml(study.excerpt || study.summary)}</p>
                ${metricsMarkup ? `<div class="work-card__metrics">${metricsMarkup}</div>` : ''}
                <span class="work-card__cta">${this.escapeHtml(workCopy.cardCta)}</span>
            `;
            grid.appendChild(card);
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

    // Floating audit offer: shows once the hero is behind you, and steps aside over the
    // closing CTA so there are never two competing calls to action on screen.
    setupAuditFloat() {
        const float = document.querySelector('[data-audit-float]');
        if (!float) return;

        if (window.sessionStorage.getItem('spaghetti-audit-dismissed') === '1') {
            float.remove();
            return;
        }

        float.hidden = false;

        const dismiss = float.querySelector('[data-audit-dismiss]');
        if (dismiss) {
            dismiss.addEventListener('click', () => {
                float.classList.remove('is-visible');
                window.sessionStorage.setItem('spaghetti-audit-dismissed', '1');
                window.setTimeout(() => float.remove(), 400);
            });
        }

        const fit = document.getElementById('fit');
        const update = () => {
            const pastHero = window.scrollY > window.innerHeight * 0.85;
            const atClosingCta = fit
                ? fit.getBoundingClientRect().top < window.innerHeight * 0.75
                : false;
            float.classList.toggle('is-visible', pastHero && !atClosingCta);
        };

        let ticking = false;
        window.addEventListener(
            'scroll',
            () => {
                if (ticking) return;
                ticking = true;
                window.requestAnimationFrame(() => {
                    update();
                    ticking = false;
                });
            },
            { passive: true }
        );

        window.addEventListener('resize', update);
        update();
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

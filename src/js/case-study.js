import { COPY, CASE_STUDIES, CALENDAR_URL } from './content.js';
import { SpaghettiRail } from './three/SpaghettiRail.js';

// Below this width there is no margin to give the rail without crowding the prose.
// Kept in step with the `.has-rail` gutter in css/pages/case-study.css.
const RAIL_MIN_WIDTH = 1200;

const SUPPORTED_LANGUAGES = ['en'];
const DEFAULT_LANGUAGE = 'en';

class CaseStudyPage {
    constructor() {
        this.language = this.getInitialLanguage();
        this.study = null;
        this.index = -1;
        this.rail = null;
    }

    get copy() {
        return COPY[this.language] || COPY[DEFAULT_LANGUAGE];
    }

    init() {
        const slug = this.getSlug();
        this.index = CASE_STUDIES.findIndex((study) => study.slug === slug);
        this.study = this.index >= 0 ? CASE_STUDIES[this.index] : null;

        this.applyLanguage();
        this.setupNavigation();
        this.setFooterYear();

        if (!this.study) {
            this.showMissing();
            return;
        }

        this.render();
        this.setupReveal();
        this.setupReadingProgress();
        this.setupRail();
    }

    setupRail() {
        const canvas = document.getElementById('rail-canvas');
        if (!canvas || typeof THREE === 'undefined') return;
        if (window.innerWidth < RAIL_MIN_WIDTH) return;

        this.rail = new SpaghettiRail(canvas).init();
        if (this.rail) {
            document.body.classList.add('has-rail');
            window.csRail = this.rail;
        }
    }

    getInitialLanguage() {
        const stored = window.localStorage.getItem('spaghetti-language');
        return SUPPORTED_LANGUAGES.includes(stored) ? stored : DEFAULT_LANGUAGE;
    }

    getSlug() {
        const parts = window.location.pathname.split('/').filter(Boolean);
        const last = parts[parts.length - 1] || '';
        try {
            return decodeURIComponent(last);
        } catch (error) {
            return last;
        }
    }

    applyLanguage() {
        const isArabic = this.language === 'ar';
        document.documentElement.lang = this.language;
        document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
        document.body.dataset.language = this.language;

        document.querySelectorAll('[data-i18n]').forEach((element) => {
            const value = this.getPath(this.copy, element.dataset.i18n);
            if (typeof value === 'string') {
                element.textContent = value;
            }
        });

        document.querySelectorAll('a[href*="calendar.app.google"]').forEach((link) => {
            link.href = CALENDAR_URL;
        });
    }

    getPath(source, path) {
        return path.split('.').reduce((value, key) => {
            if (value && Object.prototype.hasOwnProperty.call(value, key)) {
                return value[key];
            }
            return undefined;
        }, source);
    }

    // The markup carries a hardcoded year as the no-JS fallback; this keeps it current.
    setFooterYear() {
        const year = document.querySelector('[data-footer-year]');
        if (year) year.textContent = String(new Date().getFullYear());
    }

    showMissing() {
        const missing = document.getElementById('case-study-missing');
        if (missing) missing.hidden = false;
        document.title = `Not found | ${this.copy.meta.title}`;
    }

    render() {
        const study = this.study;
        const work = this.copy.work;
        const main = document.getElementById('case-study');
        if (main) main.hidden = false;

        document.title = `${study.client} | ${this.copy.meta.title}`;
        const description = document.querySelector('meta[name="description"]');
        if (description) description.setAttribute('content', study.summary);

        this.setText('[data-cs-back]', work.backToWork);
        this.setText('[data-cs-client]', study.client);
        this.setText('[data-cs-title]', study.title);
        this.setText('[data-cs-summary]', study.summary);
        this.setText('[data-cs-cta-title]', work.ctaTitle);
        this.setText('[data-cs-cta-body]', work.ctaBody);

        this.renderMeta(study, work);
        this.renderLogo(study);
        this.renderCover(study);
        this.renderMetrics(study);
        this.renderChapters(study);
        this.renderQuote(study);
        this.renderStack(study, work);
        this.renderNext(work);
    }

    setText(selector, value) {
        const element = document.querySelector(selector);
        if (element && typeof value === 'string') {
            element.textContent = value;
        }
    }

    renderMeta(study, work) {
        const list = document.querySelector('[data-cs-meta]');
        if (!list) return;

        const rows = [
            [work.sectorLabel, study.sector],
            [work.yearLabel, study.year],
            [work.durationLabel, study.duration],
            [work.servicesLabel, study.services]
        ].filter(([, value]) => Boolean(value));

        list.innerHTML = '';
        rows.forEach(([label, value]) => {
            const term = document.createElement('dt');
            term.textContent = label;
            const detail = document.createElement('dd');
            detail.textContent = value;
            list.append(term, detail);
        });
    }

    renderLogo(study) {
        const image = document.querySelector('[data-cs-logo]');
        if (!image || !study.logo || !study.logo.src) return;

        image.src = study.logo.src;
        image.alt = study.logo.alt || study.client;
        image.hidden = false;
    }

    renderCover(study) {
        const figure = document.querySelector('[data-cs-cover]');
        const image = document.querySelector('[data-cs-cover-image]');
        if (!figure || !image || !study.cover) return;

        image.src = study.cover;
        image.alt = `${study.client} case study cover`;
        figure.hidden = false;
    }

    renderMetrics(study) {
        const container = document.querySelector('[data-cs-metrics]');
        const metrics = Array.isArray(study.metrics) ? study.metrics : [];
        if (!container || !metrics.length) return;

        container.innerHTML = '';
        metrics.forEach((metric) => {
            const item = document.createElement('div');
            item.className = 'cs-metric';

            const value = document.createElement('span');
            value.className = 'cs-metric__value';
            value.textContent = metric.value;

            const label = document.createElement('span');
            label.className = 'cs-metric__label';
            label.textContent = metric.label;

            item.append(value, label);
            container.appendChild(item);
        });
        container.hidden = false;
    }

    renderChapters(study) {
        const container = document.querySelector('[data-cs-chapters]');
        const chapters = Array.isArray(study.chapters) ? study.chapters : [];
        if (!container) return;

        container.innerHTML = '';
        chapters.forEach((chapter, index) => {
            const section = document.createElement('section');
            section.className = 'cs-chapter reveal';
            section.dataset.index = String(index + 1);

            const aside = document.createElement('div');
            aside.className = 'cs-chapter__aside';
            const label = document.createElement('span');
            label.className = 'cs-chapter__label';
            label.textContent = chapter.label || '';
            const number = document.createElement('span');
            number.className = 'cs-chapter__number';
            number.textContent = String(index + 1).padStart(2, '0');
            aside.append(number, label);

            const body = document.createElement('div');
            body.className = 'cs-chapter__body';

            if (chapter.title) {
                const heading = document.createElement('h2');
                heading.textContent = chapter.title;
                body.appendChild(heading);
            }

            this.appendParagraphs(body, chapter.body);
            this.appendPoints(body, chapter.points);
            this.appendParagraphs(body, chapter.outro);

            if (chapter.image && chapter.image.src) {
                const figure = document.createElement('figure');
                figure.className = 'cs-figure';

                const image = document.createElement('img');
                image.src = chapter.image.src;
                image.alt = chapter.image.alt || '';
                image.loading = 'lazy';
                figure.appendChild(image);

                if (chapter.image.caption) {
                    const caption = document.createElement('figcaption');
                    caption.textContent = chapter.image.caption;
                    figure.appendChild(caption);
                }
                body.appendChild(figure);
            }

            section.append(aside, body);
            container.appendChild(section);
        });
    }

    appendParagraphs(container, value) {
        const paragraphs = Array.isArray(value) ? value : [value].filter(Boolean);
        paragraphs.forEach((text) => {
            const paragraph = document.createElement('p');
            paragraph.textContent = text;
            container.appendChild(paragraph);
        });
    }

    appendPoints(container, value) {
        const points = Array.isArray(value) ? value : [];
        if (!points.length) return;

        const list = document.createElement('ul');
        list.className = 'cs-points';

        points.forEach((point) => {
            const item = document.createElement('li');
            item.className = 'cs-point';

            if (point.title) {
                const heading = document.createElement('h3');
                heading.className = 'cs-point__title';
                heading.textContent = point.title;
                item.appendChild(heading);
            }

            this.appendParagraphs(item, point.text);
            list.appendChild(item);
        });

        container.appendChild(list);
    }

    renderQuote(study) {
        const figure = document.querySelector('[data-cs-quote]');
        if (!figure || !study.quote || !study.quote.text) return;

        this.setText('[data-cs-quote-text]', study.quote.text);
        this.setText('[data-cs-quote-attribution]', study.quote.attribution || '');
        figure.hidden = false;
        figure.classList.add('reveal');
    }

    renderStack(study, work) {
        const section = document.querySelector('[data-cs-stack]');
        const list = document.querySelector('[data-cs-stack-list]');
        const stack = Array.isArray(study.stack) ? study.stack : [];
        if (!section || !list || !stack.length) return;

        this.setText('[data-cs-stack-label]', work.stackLabel);
        list.innerHTML = '';
        stack.forEach((entry) => {
            const item = document.createElement('li');
            item.textContent = entry;
            list.appendChild(item);
        });
        section.hidden = false;
        section.classList.add('reveal');
    }

    renderNext(work) {
        const link = document.querySelector('[data-cs-next]');
        if (!link || CASE_STUDIES.length < 2) return;

        const next = CASE_STUDIES[(this.index + 1) % CASE_STUDIES.length];
        link.href = `/work/${encodeURIComponent(next.slug)}`;
        this.setText('[data-cs-next-label]', work.nextLabel);
        this.setText('[data-cs-next-client]', next.client);
        this.setText('[data-cs-next-title]', next.title);
        link.hidden = false;
    }

    setupReveal() {
        const targets = document.querySelectorAll('.reveal');
        if (!targets.length) return;

        const reduceMotion =
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (reduceMotion || typeof IntersectionObserver !== 'function') {
            targets.forEach((target) => target.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
        );

        targets.forEach((target) => observer.observe(target));
    }

    setupReadingProgress() {
        const bar = document.querySelector('[data-reading-progress]');
        if (!bar) return;

        const update = () => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
            bar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
        };

        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    }

    setupNavigation() {
        const toggle = document.querySelector('[data-menu-toggle]');
        const nav = document.getElementById('site-nav');
        if (!toggle || !nav) return;

        const setState = (isOpen) => {
            document.body.classList.toggle('nav-open', isOpen);
            toggle.setAttribute('aria-expanded', String(isOpen));
            toggle.setAttribute('aria-label', isOpen ? this.copy.ui.closeMenu : this.copy.ui.openMenu);
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

        setState(false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CaseStudyPage().init();
});

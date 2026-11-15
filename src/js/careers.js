// /careers: the careers landing page and the full-screen application flow.
// Questions live in bench-questions.js; this file renders them, validates each screen,
// keeps a draft in localStorage, and posts the finished profile to /api/careers/apply.
import { EXPERIENCE_LOGOS } from './content.js';
import { STEPS } from './bench-questions.js';
import { SpaghettiRail } from './three/SpaghettiRail.js';

const RAIL_MIN_WIDTH = 1200; // Matches gist-rail.js and the #rail-canvas rule in careers.css.
const DRAFT_KEY = 'spaghetti.bench.draft.v1';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Small helpers ----------

const h = (tag, attrs = {}, ...children) => {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        if (value === undefined || value === null || value === false) continue;
        if (key === 'class') node.className = value;
        else if (key === 'text') node.textContent = value;
        else if (key === 'html') node.innerHTML = value;
        else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
        else node.setAttribute(key, value === true ? '' : value);
    }
    children.flat().filter((child) => child !== null && child !== undefined && child !== false).forEach((child) => {
        node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    });
    return node;
};

const storage = {
    read() {
        try {
            return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
        } catch {
            return null;
        }
    },
    write(value) {
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
        } catch {
            /* Private mode or full storage: the flow still works, it just won't resume. */
        }
    },
    clear() {
        try {
            localStorage.removeItem(DRAFT_KEY);
        } catch {
            /* ignore */
        }
    }
};

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isLinkish = (value) => /^(https?:\/\/)?[^\s/]+\.[^\s]+$/i.test(value);
const pad = (number) => String(number).padStart(2, '0');
const firstName = (name = '') => name.trim().split(/\s+/)[0] || '';

const stepKeys = (step) => {
    switch (step.type) {
        case 'fields':
        case 'links':
            return [...step.fields.map((field) => field.key), ...(step.file ? [step.file.key] : [])];
        case 'segments':
            return [...step.rows.map((row) => row.key), ...(step.multi ? [step.multi.key] : [])];
        case 'multi':
            return [step.key, ...(step.followUp ? [step.followUp.key] : [])];
        case 'long':
            return [step.key, ...(step.link ? [step.link.key] : [])];
        case 'terms':
            return [step.rate.key, step.rate.currencyKey, step.rate.unitKey, step.entity.key];
        case 'finish':
            return [step.source.key, step.consent.key];
        default:
            return step.key ? [step.key] : [];
    }
};

// ---------- Landing page ----------

const renderLogos = () => {
    const container = document.getElementById('careers-logos');
    if (!container) return;
    EXPERIENCE_LOGOS.forEach((logo) => {
        const img = h('img', { src: `/${logo.src}`, alt: logo.name, title: logo.name, loading: 'lazy' });
        img.addEventListener('load', () => {
            const aspect = img.naturalWidth / img.naturalHeight || 1;
            img.style.height = `${Math.round(Math.min(38, Math.max(16, 40 / Math.pow(aspect, 0.4))))}px`;
        });
        container.append(h('span', { class: 'careers-logos__item' }, img));
    });
};

// Photos fade in as they scroll into view. The hiding class is added here, so without
// JavaScript (or with reduced motion) the images simply show.
const setupReveal = () => {
    const targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length || reduceMotion || !('IntersectionObserver' in window)) return;
    document.body.classList.add('reveal-ready');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
        });
    }, { rootMargin: '0px 0px -12% 0px' });
    targets.forEach((target) => observer.observe(target));
};

const setupRail = () => {
    const canvas = document.getElementById('rail-canvas');
    if (!canvas || typeof THREE === 'undefined' || window.innerWidth < RAIL_MIN_WIDTH) return null;
    const rail = new SpaghettiRail(canvas).init();
    if (!rail) return null;
    document.body.classList.add('has-rail');

    // The team grid sits where the rope would be, so the rope fades in only once
    // most of the hero has scrolled out of view.
    const hero = document.querySelector('.careers-hero');
    if (hero && 'IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
            document.body.classList.toggle('rail-on', entry.intersectionRatio < 0.25);
        }, { threshold: [0, 0.25, 0.5] }).observe(hero);
    } else {
        document.body.classList.add('rail-on');
    }
    return rail;
};

// ---------- The untangling progress strand ----------

class Strand {
    // Drawn in real pixels (the viewBox tracks the SVG's width) so the dash that shows
    // progress can be measured with getTotalLength() and never stretches.
    constructor(svg) {
        this.svg = svg;
        this.track = svg.querySelector('[data-strand-track]');
        this.fill = svg.querySelector('[data-strand-fill]');
        this.width = 1000;
        this.target = 0;
        this.value = 0;
        this.phase = 0;
        this.frame = null;
        this.tick = this.tick.bind(this);
    }

    // A knotted, high-frequency wave at 0 that relaxes into a straight line at 1.
    path(progress) {
        const amplitude = 9 * Math.pow(1 - progress, 1.3);
        const frequency = 0.035 - progress * 0.02;
        const step = this.width / 160;
        let d = '';
        for (let i = 0; i <= 160; i += 1) {
            const x = i * step;
            const u = (x / this.width) * 1000; // Wave shape stays the same at every screen width.
            const y = 12
                + amplitude * Math.sin(u * frequency + this.phase)
                + amplitude * 0.35 * Math.sin(u * frequency * 2.7 - this.phase * 1.4);
            d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(2)} `;
        }
        return d;
    }

    set(progress) {
        this.target = progress;
        if (reduceMotion) {
            this.value = progress;
            this.draw();
        }
    }

    draw() {
        const width = Math.round(this.svg.clientWidth) || 1000;
        if (width !== this.width) {
            this.width = width;
            this.svg.setAttribute('viewBox', `0 0 ${width} 24`);
        }
        const d = this.path(this.value);
        this.track.setAttribute('d', d);
        this.fill.setAttribute('d', d);
        const length = this.fill.getTotalLength();
        this.fill.style.strokeDasharray = `${(length * this.value).toFixed(1)} ${Math.ceil(length) + 1}`;
    }

    tick() {
        this.value += (this.target - this.value) * 0.08;
        this.phase += 0.012 * (1 - this.value);
        this.draw();
        this.frame = requestAnimationFrame(this.tick);
    }

    start() {
        if (reduceMotion) return this.draw();
        if (!this.frame) this.frame = requestAnimationFrame(this.tick);
    }

    stop() {
        cancelAnimationFrame(this.frame);
        this.frame = null;
    }
}

// ---------- The application flow ----------

class ApplicationFlow {
    constructor(root, { onOpen, onClose } = {}) {
        this.root = root;
        this.form = root.querySelector('[data-flow-form]');
        this.stage = root.querySelector('[data-flow-stage]');
        this.error = root.querySelector('[data-flow-error]');
        this.count = root.querySelector('[data-flow-count]');
        this.nav = root.querySelector('[data-flow-nav]');
        this.backButton = root.querySelector('[data-flow-back]');
        this.nextButton = root.querySelector('[data-flow-next]');
        this.keyHint = root.querySelector('[data-flow-keyhint]');
        this.trap = root.querySelector('.flow__trap');
        this.strand = new Strand(root.querySelector('.flow__strand'));
        this.onOpen = onOpen;
        this.onClose = onClose;

        // welcome, every question, review. Success is rendered separately.
        this.screens = [{ type: 'welcome', id: 'welcome' }, ...STEPS, { type: 'review', id: 'review' }];
        this.questionCount = STEPS.length;

        const draft = storage.read();
        this.answers = (draft && draft.answers) || {};
        // A returning visitor sees "Welcome back" first, then jumps to where they stopped.
        this.index = 0;
        this.resumeIndex = draft && Number.isInteger(draft.index) ? Math.min(draft.index, this.screens.length - 1) : 0;
        this.swapToken = 0;
        this.startedAt = (draft && draft.startedAt) || null;
        this.cv = null; // Files don't survive in localStorage; only the file name is kept in memory.
        this.isOpen = false;
        this.isSubmitting = false;
        this.done = false;
        this.autoAdvance = null;

        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.next();
        });
        this.backButton.addEventListener('click', () => this.go(this.index - 1, -1));
        root.querySelectorAll('[data-flow-close]').forEach((button) => button.addEventListener('click', (event) => {
            event.preventDefault();
            this.requestClose();
        }));
        document.addEventListener('keydown', (event) => {
            if (this.isOpen) this.handleKey(event);
        });
        window.addEventListener('popstate', () => {
            if (this.isOpen && location.hash !== '#apply') this.close();
            else if (!this.isOpen && location.hash === '#apply') this.open({ fromHistory: true });
        });
    }

    get hasDraft() {
        return this.resumeIndex > 0 || Object.keys(this.answers).length > 0;
    }

    get screen() {
        return this.screens[this.index];
    }

    persist() {
        if (this.done) return;
        storage.write({ answers: this.answers, index: this.index, startedAt: this.startedAt });
    }

    // ----- open / close -----

    open({ fromHistory = false } = {}) {
        if (this.isOpen) return;
        this.isOpen = true;
        this.lastFocus = document.activeElement;
        if (!fromHistory && location.hash !== '#apply') history.pushState(null, '', '#apply');

        document.querySelectorAll('body > header, body > main, body > footer').forEach((node) => node.setAttribute('inert', ''));
        document.body.classList.add('flow-open');
        this.root.hidden = false;
        requestAnimationFrame(() => this.root.classList.add('is-visible'));

        this.strand.start();
        if (this.done) this.renderSuccess(this.doneId);
        else this.render(0);
        if (this.onOpen) this.onOpen();
    }

    requestClose() {
        if (location.hash === '#apply') history.back();
        else this.close();
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        clearTimeout(this.autoAdvance);
        this.root.classList.remove('is-visible');
        document.querySelectorAll('[inert]').forEach((node) => node.removeAttribute('inert'));
        document.body.classList.remove('flow-open');
        window.setTimeout(() => {
            if (!this.isOpen) this.root.hidden = true;
        }, reduceMotion ? 0 : 360);
        this.strand.stop();
        if (this.lastFocus && this.lastFocus.focus) this.lastFocus.focus({ preventScroll: true });
        if (this.onClose) this.onClose();
    }

    // ----- navigation -----

    next() {
        if (this.isSubmitting) return;
        if (this.done) return this.requestClose();
        const problem = this.validate(this.screen);
        if (problem) return this.showError(problem);
        if (this.screen.type === 'welcome') {
            if (!this.startedAt) this.startedAt = Date.now();
            if (this.resumeIndex > 0) {
                const target = this.resumeIndex;
                this.resumeIndex = 0;
                return this.go(target, 1);
            }
        }
        if (this.screen.type === 'review') return this.submit();
        this.go(this.index + 1, 1);
    }

    go(index, direction = 1) {
        clearTimeout(this.autoAdvance);
        if (index < 0 || index >= this.screens.length) return;
        this.index = index;
        this.persist();
        this.render(direction);
    }

    jumpToKey(key) {
        const target = this.screens.findIndex((screen) => stepKeys(screen).includes(key));
        if (target >= 0) this.go(target, target < this.index ? -1 : 1);
        return target;
    }

    handleKey(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            return this.requestClose();
        }

        const target = event.target;
        const typing = target instanceof HTMLTextAreaElement || (target instanceof HTMLInputElement && !['checkbox', 'radio', 'file'].includes(target.type));

        if (event.key === 'Enter' && target instanceof HTMLTextAreaElement && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            return this.next();
        }

        // Typeform-style: A, B, C… pick an option on single-choice screens.
        if (!typing && !event.metaKey && !event.ctrlKey && !event.altKey && this.screen.type === 'single' && /^[a-z]$/i.test(event.key)) {
            const option = this.stage.querySelectorAll('.q-option')[LETTERS.indexOf(event.key.toUpperCase())];
            if (option) {
                event.preventDefault();
                option.click();
            }
        }

        // Enter means "continue" unless something focused owns it: text inputs submit the
        // form themselves, textareas need ⌘/Ctrl+Enter, and some buttons (options, Edit,
        // Back, Save & exit) do their own thing. Chips, <body> and everything else continue.
        if (event.key !== 'Enter' || event.isComposing || event.defaultPrevented) return;
        if (typing || target instanceof HTMLSelectElement) return;
        if (target instanceof HTMLAnchorElement) return;
        if (target instanceof HTMLButtonElement && (target.matches('[data-enter-clicks]') || !target.closest('[data-flow-stage]'))) return;
        event.preventDefault();
        this.next();
    }

    // ----- validation -----

    validate(screen) {
        const a = this.answers;
        const filled = (key) => {
            const value = a[key];
            return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && String(value).trim() !== '';
        };

        switch (screen.type) {
            case 'fields':
                for (const field of screen.fields) {
                    if (field.required && !filled(field.key)) return { key: field.key, message: `Add your ${field.label.toLowerCase()} to continue.` };
                    if (field.type === 'email' && filled(field.key) && !isEmail(a[field.key].trim())) return { key: field.key, message: 'That email doesn’t look quite right.' };
                }
                return null;
            case 'single':
                return filled(screen.key) ? null : { message: 'Pick the one that fits best.' };
            case 'segments':
                for (const row of screen.rows) {
                    if (!filled(row.key)) return { key: row.key, message: `Choose one for “${row.label.toLowerCase()}”.` };
                }
                return null;
            case 'multi':
                if ((a[screen.key] || []).length < (screen.min || 0)) return { message: 'Pick at least one.' };
                return null;
            case 'long': {
                const length = (a[screen.key] || '').trim().length;
                if (!screen.optional && length === 0) return { key: screen.key, message: 'This one matters most to us. Take your time.' };
                if (screen.min && length > 0 && length < screen.min) return { key: screen.key, message: `A little more detail, please. ${screen.min - length} more characters gets you there.` };
                if (screen.link && filled(screen.link.key) && !isLinkish(a[screen.link.key].trim())) return { key: screen.link.key, message: 'That link doesn’t look right.' };
                return null;
            }
            case 'links': {
                if (!screen.requireOneOf.some(filled)) return { key: screen.requireOneOf[0], message: 'Add LinkedIn or GitHub so we can see your work.' };
                const bad = screen.fields.find((field) => filled(field.key) && !isLinkish(a[field.key].trim()));
                return bad ? { key: bad.key, message: `Your ${bad.label.split(',')[0]} link doesn’t look right.` } : null;
            }
            case 'terms':
                if (filled(screen.rate.key) && !/^\d+([.,]\d{1,2})?$/.test(String(a[screen.rate.key]).trim())) return { key: screen.rate.key, message: 'Use a plain number for your rate, like 95.' };
                if (!filled(screen.entity.key)) return { key: screen.entity.key, message: 'Let us know how you invoice.' };
                return null;
            case 'finish':
                return a[screen.consent.key] === true ? null : { key: screen.consent.key, message: 'We need your OK to keep your profile on file.' };
            default:
                return null;
        }
    }

    showError(problem) {
        this.error.textContent = problem.message;
        this.error.classList.remove('is-shaking');
        void this.error.offsetWidth;
        this.error.classList.add('is-shaking');
        const field = problem.key && this.stage.querySelector(`[data-key="${problem.key}"]`);
        if (field) {
            field.classList.add('is-invalid');
            const focusable = field.matches('input, textarea, button') ? field : field.querySelector('input, textarea, button');
            if (focusable) focusable.focus();
        }
    }

    clearError() {
        this.error.textContent = '';
        this.stage.querySelectorAll('.is-invalid').forEach((node) => node.classList.remove('is-invalid'));
    }

    // ----- answers -----

    set(key, value) {
        this.answers[key] = value;
        this.clearError();
        this.persist();
    }

    // ----- rendering -----

    render(direction = 1) {
        const screen = this.screen;
        this.clearError();

        const questionNumber = this.screens.slice(1, this.index + 1).filter((item) => item.type !== 'review').length;
        const progress = screen.type === 'welcome' ? 0.02 : screen.type === 'review' ? 0.96 : questionNumber / (this.questionCount + 1);
        this.strand.set(progress);
        this.count.textContent = screen.type === 'welcome' ? '' : screen.type === 'review' ? 'Review' : `${pad(questionNumber)} / ${pad(this.questionCount)}`;

        this.backButton.hidden = this.index === 0;
        this.nav.hidden = false;
        this.nextButton.textContent = screen.type === 'welcome' ? (this.resumeIndex > 0 ? 'Pick up where I left off' : 'Let’s start')
            : screen.type === 'review' ? 'Send my profile'
                : questionNumber === this.questionCount ? 'Review my answers' : (screen.optional && !(this.answers[screen.key] || '').trim() ? 'Skip' : 'Continue');
        const multiline = screen.type === 'long';
        this.keyHint.innerHTML = multiline ? 'press <kbd>⌘ + Enter ↵</kbd>' : 'press <kbd>Enter ↵</kbd>';
        this.keyHint.hidden = screen.type === 'review';

        let content;
        switch (screen.type) {
            case 'welcome': content = this.renderWelcome(); break;
            case 'fields': content = this.renderFields(screen); break;
            case 'single': content = this.renderSingle(screen); break;
            case 'segments': content = this.renderSegments(screen); break;
            case 'multi': content = this.renderMulti(screen); break;
            case 'long': content = this.renderLong(screen); break;
            case 'links': content = this.renderLinks(screen); break;
            case 'terms': content = this.renderTerms(screen); break;
            case 'finish': content = this.renderFinish(screen); break;
            case 'review': content = this.renderReview(); break;
            default: content = h('div');
        }

        const head = screen.title ? h('header', { class: 'q-head' },
            screen.type !== 'welcome' && screen.type !== 'review'
                ? h('p', { class: 'q-num' }, h('span', { text: pad(questionNumber) }), h('span', { class: 'q-num__arrow', 'aria-hidden': 'true', text: '→' }))
                : null,
            h('h2', { class: 'q-title', id: 'flow-question', text: screen.title }),
            screen.hint ? h('p', { class: 'q-hint', text: screen.hint }) : null
        ) : null;

        this.swap(h('div', { class: `q q--${screen.type}` }, head, content), direction);
    }

    swap(node, direction) {
        const previous = this.stage.firstElementChild;
        const token = ++this.swapToken;
        this.stage.style.setProperty('--dir', direction >= 0 ? 1 : -1);
        const mount = () => {
            if (token !== this.swapToken) return;
            this.stage.replaceChildren(node);
            this.stage.scrollTop = 0;
            this.root.scrollTop = 0;
            node.classList.add('is-entering');
            requestAnimationFrame(() => {
                const focusTarget = node.querySelector('[data-autofocus]') || node.querySelector('input:not([type=file]):not([type=checkbox]), textarea, .q-option[aria-checked="true"], .q-option, .q-chip');
                // Skip on touch screens so the keyboard doesn't jump up on every step.
                if (focusTarget && window.matchMedia('(hover: hover)').matches) focusTarget.focus({ preventScroll: true });
            });
        };
        if (!previous || reduceMotion) return mount();
        previous.classList.add('is-leaving');
        window.setTimeout(mount, 200);
    }

    renderWelcome() {
        const resuming = Object.keys(this.answers).length > 0;
        const name = firstName(this.answers.fullName);
        return h('div', { class: 'q-welcome' },
            h('h2', { class: 'q-welcome__title', id: 'flow-question', text: resuming && name ? `Welcome back, ${name}.` : 'Show us what you’ve shipped.' }),
            h('p', { class: 'q-welcome__body', text: resuming
                ? 'Your answers were saved in this browser. Pick up where you left off, or go back and change anything.'
                : `${STEPS.length} questions. The one we read most closely is about the hardest AI system you’ve put in front of real users, so have that story ready.` }),
            h('ul', { class: 'q-welcome__facts' },
                h('li', {}, h('strong', { text: '~12 min' }), h('span', { text: 'Saved as you go' })),
                h('li', {}, h('strong', { text: 'No cover letter' }), h('span', { text: 'No take-home' })),
                h('li', {}, h('strong', { text: 'Read by an engineer' }), h('span', { text: 'Every profile' }))
            ),
            resuming ? h('button', {
                type: 'button',
                class: 'q-welcome__restart',
                'data-enter-clicks': true,
                text: 'Start over instead',
                onclick: () => {
                    this.answers = {};
                    this.resumeIndex = 0;
                    this.startedAt = null;
                    this.cv = null;
                    storage.clear();
                    this.render(0);
                }
            }) : null
        );
    }

    input(field, { multiline = false } = {}) {
        let value = this.answers[field.key];
        if ((value === undefined || value === '') && field.defaultValue) {
            value = typeof field.defaultValue === 'function' ? field.defaultValue() : field.defaultValue;
            if (value) this.answers[field.key] = value;
        }
        const attrs = {
            class: multiline ? 'q-input q-input--area' : 'q-input',
            name: field.key,
            id: `q-${field.key}`,
            'data-key': field.key,
            placeholder: field.placeholder || '',
            maxlength: field.max || 300,
            autocomplete: field.autocomplete || 'off',
            oninput: (event) => this.set(field.key, event.target.value)
        };
        if (multiline) {
            const area = h('textarea', { ...attrs, rows: 2 });
            area.value = value || '';
            return area;
        }
        const input = h('input', { ...attrs, type: field.type === 'email' ? 'email' : field.inputmode ? 'text' : 'text', inputmode: field.inputmode || (field.type === 'email' ? 'email' : null) });
        input.value = value || '';
        return input;
    }

    renderFields(screen) {
        return h('div', { class: 'q-fields' }, screen.fields.map((field) => h('label', { class: 'q-field', for: `q-${field.key}` },
            h('span', { class: 'q-field__label' }, field.label, field.required ? null : h('em', { text: ' optional' })),
            this.input(field)
        )));
    }

    renderSingle(screen) {
        const group = h('div', { class: 'q-options', role: 'radiogroup', 'aria-labelledby': 'flow-question', 'data-key': screen.key });
        screen.options.forEach((option, index) => {
            const selected = this.answers[screen.key] === option.value;
            group.append(h('button', {
                type: 'button',
                class: 'q-option',
                role: 'radio',
                'data-enter-clicks': true,
                'aria-checked': String(selected),
                onclick: (event) => {
                    this.set(screen.key, option.value);
                    group.querySelectorAll('.q-option').forEach((node) => node.setAttribute('aria-checked', String(node === event.currentTarget)));
                    event.currentTarget.classList.add('is-picked');
                    clearTimeout(this.autoAdvance);
                    this.autoAdvance = window.setTimeout(() => this.next(), reduceMotion ? 0 : 420);
                }
            },
            h('kbd', { class: 'q-option__key', text: LETTERS[index] }),
            h('span', { class: 'q-option__text' },
                h('span', { class: 'q-option__label', text: option.label }),
                option.note ? h('span', { class: 'q-option__note', text: option.note }) : null
            ),
            h('span', { class: 'q-option__check', 'aria-hidden': 'true', text: '✓' })
            ));
        });
        return group;
    }

    segmentRow(row) {
        const group = h('div', { class: 'q-segment__options', role: 'radiogroup', 'aria-label': row.label });
        row.options.forEach((option) => {
            group.append(h('button', {
                type: 'button',
                class: 'q-seg',
                role: 'radio',
                'aria-checked': String(this.answers[row.key] === option),
                onclick: (event) => {
                    this.set(row.key, option);
                    group.querySelectorAll('.q-seg').forEach((node) => node.setAttribute('aria-checked', String(node === event.currentTarget)));
                },
                text: option
            }));
        });
        return h('div', { class: 'q-segment', 'data-key': row.key }, h('p', { class: 'q-field__label', text: row.label }), group);
    }

    chips(key, options, { max, exclusive } = {}, counter) {
        const selected = () => this.answers[key] || [];
        const wrap = h('div', { class: 'q-chips', 'data-key': key });
        options.forEach((option) => {
            const chip = h('button', {
                type: 'button',
                class: `q-chip${option === exclusive ? ' q-chip--muted' : ''}`,
                'aria-pressed': String(selected().includes(option)),
                onclick: () => {
                    let next = [...selected()];
                    if (next.includes(option)) {
                        next = next.filter((item) => item !== option);
                    } else {
                        if (exclusive) next = option === exclusive ? [] : next.filter((item) => item !== exclusive);
                        if (max && next.length >= max) {
                            if (counter) {
                                counter.classList.remove('is-shaking');
                                void counter.offsetWidth;
                                counter.classList.add('is-shaking');
                            }
                            return;
                        }
                        next.push(option);
                    }
                    this.set(key, next);
                    const root = wrap.closest('.q') || wrap;
                    root.querySelectorAll(`[data-key="${key}"] .q-chip`).forEach((node) => node.setAttribute('aria-pressed', String(next.includes(node.dataset.value))));
                    if (counter) counter.textContent = max ? `${next.length} / ${max}` : `${next.length} selected`;
                }
            }, h('span', { class: 'q-chip__tick', 'aria-hidden': 'true' }), option);
            chip.dataset.value = option;
            wrap.append(chip);
        });
        return wrap;
    }

    renderSegments(screen) {
        const rows = screen.rows.map((row) => this.segmentRow(row));
        if (screen.multi) {
            rows.push(h('div', { class: 'q-segment' },
                h('p', { class: 'q-field__label' }, screen.multi.label, h('em', { text: ' optional' })),
                this.chips(screen.multi.key, screen.multi.options)
            ));
        }
        return h('div', { class: 'q-segments' }, rows);
    }

    renderMulti(screen) {
        const count = (this.answers[screen.key] || []).length;
        const counter = h('span', { class: 'q-counter', 'aria-live': 'polite', text: screen.max ? `${count} / ${screen.max}` : `${count} selected` });
        const body = screen.groups
            ? h('div', { class: 'q-groups' }, screen.groups.map((group) => h('div', { class: 'q-group' },
                h('p', { class: 'q-group__label', text: group.label }),
                this.chips(screen.key, group.items, {}, counter)
            )))
            : this.chips(screen.key, screen.options, { max: screen.max, exclusive: screen.exclusive }, counter);

        return h('div', { class: 'q-multi' },
            h('div', { class: 'q-multi__meta' }, counter),
            body,
            screen.followUp ? h('label', { class: 'q-field q-field--follow', for: `q-${screen.followUp.key}` },
                h('span', { class: 'q-field__label' }, screen.followUp.label, h('em', { text: ' optional' })),
                this.input(screen.followUp, { multiline: screen.followUp.max > 300 })
            ) : null
        );
    }

    renderLong(screen) {
        const area = this.input({ key: screen.key, placeholder: screen.placeholder, max: screen.max }, { multiline: true });
        area.rows = 7;
        area.setAttribute('data-autofocus', '');
        const meter = h('span', { class: 'q-meter' });
        const bar = h('span', { class: 'q-meter__bar' }, h('i'));
        const update = () => {
            const length = area.value.trim().length;
            if (screen.min) {
                const ratio = Math.min(1, length / screen.min);
                bar.firstChild.style.transform = `scaleX(${ratio})`;
                bar.classList.toggle('is-done', ratio >= 1);
                meter.textContent = ratio >= 1 ? `${length} characters. Keep going if there’s more.` : `${screen.min - length} characters to go`;
            } else {
                meter.textContent = `${length} / ${screen.max}`;
            }
            if (screen.optional) this.nextButton.textContent = length ? 'Continue' : 'Skip';
        };
        area.addEventListener('input', update);
        update();

        return h('div', { class: 'q-long' },
            screen.prompts ? h('ul', { class: 'q-prompts' }, screen.prompts.map((prompt) => h('li', { text: prompt }))) : null,
            area,
            h('div', { class: 'q-long__foot' }, screen.min ? bar : null, meter),
            screen.link ? h('label', { class: 'q-field q-field--follow', for: `q-${screen.link.key}` },
                h('span', { class: 'q-field__label', text: screen.link.label }),
                this.input({ ...screen.link, max: 500 })
            ) : null
        );
    }

    renderLinks(screen) {
        const fields = screen.fields.map((field) => h('label', { class: 'q-field', for: `q-${field.key}` },
            h('span', { class: 'q-field__label', text: field.label }),
            this.input({ ...field, max: 300, autocomplete: 'url' })
        ));
        return h('div', { class: 'q-fields' }, fields, screen.file ? this.renderFile(screen.file) : null);
    }

    renderFile(spec) {
        const zone = h('div', { class: 'q-file', 'data-key': spec.key });
        const picker = h('input', { type: 'file', accept: 'application/pdf,.pdf', id: `q-${spec.key}`, class: 'q-file__input' });

        const paint = () => {
            zone.replaceChildren(picker);
            zone.classList.toggle('has-file', Boolean(this.cv));
            if (this.cv) {
                zone.append(
                    h('span', { class: 'q-file__icon', 'aria-hidden': 'true', text: 'PDF' }),
                    h('span', { class: 'q-file__name', text: this.cv.name }),
                    h('span', { class: 'q-file__size', text: this.cv.size < 1024 * 1024 ? `${Math.max(1, Math.round(this.cv.size / 1024))} KB` : `${(this.cv.size / 1024 / 1024).toFixed(1)} MB` }),
                    h('button', { type: 'button', class: 'q-file__remove', 'data-enter-clicks': true, onclick: () => { this.cv = null; paint(); }, text: 'Remove' })
                );
            } else {
                zone.append(h('label', { class: 'q-file__drop', for: `q-${spec.key}` },
                    h('span', { class: 'q-file__icon', 'aria-hidden': 'true', text: '↑' }),
                    h('span', {}, h('strong', { text: 'Drop your CV here' }), ' or click to choose a PDF'),
                    h('span', { class: 'q-file__size', text: spec.label })
                ));
            }
        };

        const accept = (file) => {
            if (!file) return;
            if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) return this.showError({ key: spec.key, message: 'CVs need to be PDFs.' });
            if (file.size > spec.maxBytes) return this.showError({ key: spec.key, message: 'That file is over 5 MB. Try exporting a lighter PDF.' });
            const reader = new FileReader();
            reader.onload = () => {
                this.cv = { name: file.name, size: file.size, data: String(reader.result) };
                this.clearError();
                paint();
            };
            reader.readAsDataURL(file);
        };

        picker.addEventListener('change', () => accept(picker.files[0]));
        zone.addEventListener('dragover', (event) => {
            event.preventDefault();
            zone.classList.add('is-dragging');
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('is-dragging'));
        zone.addEventListener('drop', (event) => {
            event.preventDefault();
            zone.classList.remove('is-dragging');
            accept(event.dataTransfer.files[0]);
        });
        paint();
        return h('div', { class: 'q-field' }, h('span', { class: 'q-field__label' }, 'CV', h('em', { text: ' optional' })), zone);
    }

    renderTerms(screen) {
        const { rate, entity } = screen;
        if (!this.answers[rate.currencyKey]) this.answers[rate.currencyKey] = rate.currencies[0];
        if (!this.answers[rate.unitKey]) this.answers[rate.unitKey] = rate.units[0];

        const rateInput = this.input({ key: rate.key, placeholder: '95', max: 9, inputmode: 'decimal' });
        rateInput.classList.add('q-input--rate');

        return h('div', { class: 'q-segments' },
            h('div', { class: 'q-segment' },
                h('label', { class: 'q-field__label', for: `q-${rate.key}` }, 'Your rate', h('em', { text: ' optional; leave blank to discuss' })),
                h('div', { class: 'q-rate' },
                    rateInput,
                    this.segmentRow({ key: rate.currencyKey, label: 'Currency', options: rate.currencies }).lastChild,
                    this.segmentRow({ key: rate.unitKey, label: 'Unit', options: rate.units }).lastChild
                )
            ),
            h('div', { class: 'q-segment', 'data-key': entity.key },
                h('p', { class: 'q-field__label', text: entity.label }),
                this.segmentRow({ key: entity.key, label: entity.label, options: entity.options }).lastChild
            )
        );
    }

    renderFinish(screen) {
        const { source, consent } = screen;
        const box = h('input', {
            type: 'checkbox',
            id: `q-${consent.key}`,
            class: 'q-consent__box',
            onchange: (event) => this.set(consent.key, event.target.checked)
        });
        box.checked = this.answers[consent.key] === true;

        return h('div', { class: 'q-segments' },
            h('div', { class: 'q-segment', 'data-key': source.key },
                h('p', { class: 'q-field__label', text: source.label }),
                this.segmentRow({ key: source.key, label: source.label, options: source.options }).lastChild
            ),
            h('label', { class: 'q-consent', for: `q-${consent.key}`, 'data-key': consent.key },
                box,
                h('span', { class: 'q-consent__mark', 'aria-hidden': 'true' }),
                h('span', { class: 'q-consent__text', text: consent.label })
            )
        );
    }

    summarise(step) {
        const a = this.answers;
        const list = (value) => (Array.isArray(value) && value.length ? value.join(', ') : '');
        switch (step.type) {
            case 'fields':
                return step.fields.map((field) => [field.label, a[field.key]]);
            case 'single':
                return [['', (step.options.find((option) => option.value === a[step.key]) || {}).label]];
            case 'segments':
                return [...step.rows.map((row) => [row.label, a[row.key]]), ...(step.multi ? [[step.multi.label, list(a[step.multi.key])]] : [])];
            case 'multi':
                return [['', list(a[step.key])], ...(step.followUp ? [[step.followUp.label, a[step.followUp.key]]] : [])];
            case 'long':
                return [['', a[step.key]], ...(step.link ? [['Link', a[step.link.key]]] : [])];
            case 'links':
                return [...step.fields.map((field) => [field.label, a[field.key]]), ['CV', this.cv ? this.cv.name : '']];
            case 'terms':
                return [
                    ['Rate', a[step.rate.key] ? `${a[step.rate.key]} ${a[step.rate.currencyKey]} ${a[step.rate.unitKey]}` : 'To discuss'],
                    [step.entity.label, a[step.entity.key]]
                ];
            case 'finish':
                return [['Heard about us via', a[step.source.key]]];
            default:
                return [];
        }
    }

    renderReview() {
        const items = STEPS.map((step) => {
            const rows = this.summarise(step).filter(([, value]) => value);
            const index = this.screens.indexOf(step);
            return h('section', { class: 'q-review__item' },
                h('header', {},
                    h('h3', { text: step.title }),
                    h('button', { type: 'button', class: 'q-review__edit', 'data-enter-clicks': true, onclick: () => this.go(index, -1), text: 'Edit' })
                ),
                rows.length
                    ? h('dl', {}, rows.map(([label, value]) => h('div', { class: label ? '' : 'is-bare' },
                        label ? h('dt', { text: label }) : null,
                        h('dd', { text: value })
                    )))
                    : h('p', { class: 'q-review__empty', text: 'Skipped' })
            );
        });
        return h('div', { class: 'q-review' },
            h('header', { class: 'q-head' },
                h('h2', { class: 'q-title', id: 'flow-question', text: 'One look before it’s sent.' }),
                h('p', { class: 'q-hint', text: 'This is your profile as we’ll see it. Edit anything, then send.' })
            ),
            items
        );
    }

    async submit() {
        this.isSubmitting = true;
        this.nextButton.disabled = true;
        this.nextButton.classList.add('is-loading');
        this.nextButton.textContent = 'Sending…';

        const payload = { ...this.answers, startedAt: this.startedAt, company_url: this.trap.value };
        if (payload.rate) payload.rate = Number(String(payload.rate).replace(',', '.'));
        else {
            delete payload.rate;
            delete payload.rateCurrency;
            delete payload.rateUnit;
        }
        if (this.cv) payload.cv = { name: this.cv.name, data: this.cv.data };

        try {
            const response = await fetch('/api/careers/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.ok) {
                const message = result.error || 'We couldn’t send that. Your answers are saved here, so try again in a moment.';
                if (result.field && this.jumpToKey(result.field) >= 0) {
                    window.setTimeout(() => this.showError({ key: result.field, message }), 260);
                } else {
                    this.showError({ message });
                }
                return;
            }
            this.done = true;
            this.doneId = result.id;
            storage.clear();
            this.renderSuccess(result.id);
        } catch {
            this.showError({ message: 'Looks like you’re offline. Your answers are saved here, so try again when you’re back.' });
        } finally {
            this.isSubmitting = false;
            this.nextButton.disabled = false;
            this.nextButton.classList.remove('is-loading');
            if (!this.done && this.screen.type === 'review') this.nextButton.textContent = 'Send my profile';
        }
    }

    renderSuccess(id) {
        this.strand.set(1);
        this.count.textContent = 'Sent';
        this.nav.hidden = true;
        this.error.textContent = '';
        const name = firstName(this.answers.fullName);
        const shareUrl = `${location.origin}/careers`;
        const copyButton = h('button', {
            type: 'button',
            class: 'button button--secondary',
            'data-enter-clicks': true,
            onclick: async (event) => {
                try {
                    await navigator.clipboard.writeText(shareUrl);
                    event.currentTarget.textContent = 'Link copied';
                } catch {
                    event.currentTarget.textContent = shareUrl;
                }
            },
            text: 'Share with a friend'
        });

        this.swap(h('div', { class: 'q q--success', tabindex: '-1' },
            h('div', { class: 'q-success__mark', 'aria-hidden': 'true' },
                h('svg', { viewBox: '0 0 52 52', html: '<circle cx="26" cy="26" r="24" /><path d="M15 27l7 7 15-16" />' })
            ),
            h('p', { class: 'q-welcome__eyebrow' }, 'Application ', h('span', { class: 'q-success__id', text: id })),
            h('h2', { class: 'q-welcome__title', id: 'flow-question', text: name ? `Thank you, ${name}. It’s in.` : 'Thank you. It’s in.' }),
            h('p', { class: 'q-welcome__body', text: 'We’re looking forward to reading about what you’ve built. When a project lines up with your expertise, you’ll hear from us with a clear brief and a timeline.' }),
            h('ol', { class: 'q-success__next' },
                h('li', {}, h('strong', { text: 'Next' }), h('span', { text: 'An engineer on our team reads your application.' })),
                h('li', {}, h('strong', { text: 'Then' }), h('span', { text: 'A relaxed conversation about something you’re proud of.' })),
                h('li', {}, h('strong', { text: 'After that' }), h('span', { text: 'Projects matched to what you know and love.' }))
            ),
            h('div', { class: 'q-success__actions' },
                h('a', { class: 'button button--primary', href: '/#work', text: 'See what we build' }),
                copyButton
            ),
            h('p', { class: 'q-success__note' }, 'Something changes? Email ', h('a', { href: 'mailto:info@spgti.com', text: 'info@spgti.com' }), ' and we’ll update your application.')
        ), 1);
    }
}

// ---------- Boot ----------

const init = () => {
    renderLogos();
    setupReveal();
    const rail = setupRail();

    const root = document.getElementById('apply-flow');
    if (!root) return;

    const flow = new ApplicationFlow(root, {
        onOpen: () => rail && rail.stop(),
        onClose: () => rail && !document.hidden && rail.start()
    });

    if (flow.hasDraft) {
        const answered = STEPS.filter((step) => stepKeys(step).some((key) => flow.answers[key] !== undefined)).length;
        document.querySelectorAll('[data-apply-cta-label]').forEach((label) => { label.textContent = 'Continue your application'; });
        const time = document.querySelector('[data-apply-time]');
        if (time && answered) time.textContent = `${answered} of ${STEPS.length} answered · saved in this browser`;
    }

    document.querySelectorAll('[data-apply-open]').forEach((button) => button.addEventListener('click', () => flow.open()));
    if (location.hash === '#apply') flow.open({ fromHistory: true });
};

init();

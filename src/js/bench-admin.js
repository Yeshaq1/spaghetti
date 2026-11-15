// /careers/bench: the private talent directory. Served behind basic auth by server.js
// (at /careers/bench/app.js); option lists come from the public question file.
import { STEPS, SKILLS, DOMAINS, NO_DOMAIN } from '/src/js/bench-questions.js';

const roleStep = STEPS.find((step) => step.key === 'role');
const ROLE_LABELS = Object.fromEntries(roleStep.options.map((option) => [option.value, option.label]));
const START_OPTIONS = STEPS.find((step) => step.id === 'availability').rows.find((row) => row.key === 'start').options;

const $ = (selector) => document.querySelector(selector);
const esc = (value = '') => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const date = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const shortDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();
const linkText = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const link = (url) => (url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(linkText(url))}</a>` : '—');
const role = (profile) => ROLE_LABELS[profile.role] || profile.role || '';

let profiles = [];
let statuses = [];
let activeId = location.hash.slice(1) || null;
const filters = { q: '', domain: '', skill: '', role: '', start: '', status: '' };

const fill = (name, values, label = (value) => value) => {
    const select = $(`[data-filter="${name}"]`);
    values.forEach((value) => select.append(new Option(label(value), value)));
};

const haystack = (profile) => [
    profile.fullName, profile.email, profile.location, profile.hardestSystem, profile.opinion, profile.domainNote,
    profile.stackOther, (profile.stack || []).join(' '), (profile.skills || []).join(' '), (profile.domains || []).join(' '),
    (profile.languages || []).join(' '), profile.review.notes
].join(' ').toLowerCase();

const matches = (profile, ignoreStatus = false) => (
    (!filters.q || haystack(profile).includes(filters.q.toLowerCase()))
    && (!filters.domain || (profile.domains || []).includes(filters.domain))
    && (!filters.skill || (profile.skills || []).includes(filters.skill))
    && (!filters.role || profile.role === filters.role)
    && (!filters.start || profile.start === filters.start)
    && (ignoreStatus || !filters.status || profile.review.status === filters.status)
);

const visible = () => profiles.filter((profile) => matches(profile));

// Status pills double as the status filter, with counts that respect the other filters.
const renderStats = () => {
    const pool = profiles.filter((profile) => matches(profile, true));
    const count = (status) => pool.filter((profile) => profile.review.status === status).length;
    $('[data-stats]').innerHTML = [
        `<button class="t-stat" type="button" data-status-filter="" aria-pressed="${!filters.status}">All <b>${pool.length}</b></button>`,
        ...statuses.map((status) => `<button class="t-stat" type="button" data-status-filter="${status}" data-s="${status}" aria-pressed="${filters.status === status}"><span class="dot"></span>${status[0].toUpperCase() + status.slice(1)} <b>${count(status)}</b></button>`)
    ].join('');
    const anyFilter = ['q', 'domain', 'skill', 'role', 'start', 'status'].some((key) => filters[key]);
    $('[data-clear]').hidden = !anyFilter;
    document.querySelectorAll('.t-select').forEach((select) => select.classList.toggle('is-set', Boolean(select.value)));
};

const renderList = () => {
    renderStats();
    const list = visible();
    if (!profiles.length) {
        $('[data-list]').innerHTML = '<div class="empty"><div><strong>No applications yet</strong>Share spgti.com/careers and they’ll show up here.</div></div>';
        return;
    }
    $('[data-list]').innerHTML = list.length ? list.map((profile) => `
        <button class="row${profile.id === activeId ? ' is-active' : ''}" type="button" data-id="${profile.id}">
            <span class="avatar" aria-hidden="true">${esc(initials(profile.fullName))}</span>
            <span class="row__name">${esc(profile.fullName)}</span>
            <span class="row__date">${shortDate(profile.submittedAt)}</span>
            <span class="row__meta">${esc(role(profile))} · ${esc(profile.location)}</span>
            <span class="row__foot">
                <span class="status" data-s="${profile.review.status}"><span class="dot"></span>${profile.review.status}</span>
                ${(profile.domains || []).map((domain) => `<span class="tag">${esc(domain)}</span>`).join('')}
            </span>
        </button>`).join('') : '<div class="empty"><div><strong>No matches</strong>Try removing a filter.</div></div>';
};

const renderDetail = () => {
    const profile = profiles.find((item) => item.id === activeId);
    const detail = $('[data-detail]');
    if (!profile) {
        detail.innerHTML = `<div class="empty"><div><strong>${profiles.length ? 'Pick someone from the list' : 'Nothing here yet'}</strong>${profiles.length ? 'Their full application opens here.' : 'Applications from the careers page land here.'}</div></div>`;
        return;
    }
    const first = profile.fullName.split(/\s+/)[0];
    const mail = `mailto:${encodeURIComponent(profile.email)}?subject=${encodeURIComponent('Spaghetti: a project that fits your background')}&body=${encodeURIComponent(`Hi ${first},\n\n`)}`;
    const rate = profile.rate ? `${profile.rate} ${profile.rateCurrency || ''} ${profile.rateUnit || ''}` : 'To discuss';
    const fact = (label, value) => `<div><dt>${label}</dt><dd>${value || '—'}</dd></div>`;
    const tags = (items, strong) => (items && items.length ? `<div class="tags">${items.map((item) => `<span class="tag${strong ? ' tag--strong' : ''}">${esc(item)}</span>`).join('')}</div>` : '<p class="prose">—</p>');

    detail.innerHTML = `<div class="d">
        <div class="d-head">
            <span class="avatar avatar--lg" aria-hidden="true">${esc(initials(profile.fullName))}</span>
            <div>
                <h2>${esc(profile.fullName)}</h2>
                <p class="d-sub">${esc(role(profile))} · ${esc(profile.location)} · ${esc(profile.timezone)}</p>
            </div>
        </div>
        <div class="d-actions">
            <a class="t-btn t-btn--primary" href="${mail}">Email ${esc(first)}</a>
            ${profile.cv ? `<a class="t-btn" href="/api/careers/bench/${profile.id}/cv" target="_blank" rel="noopener">CV ↗</a>` : ''}
            ${profile.linkedin ? `<a class="t-btn" href="${esc(profile.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>` : ''}
            ${profile.github ? `<a class="t-btn" href="${esc(profile.github)}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>` : ''}
            ${profile.website ? `<a class="t-btn" href="${esc(profile.website)}" target="_blank" rel="noopener noreferrer">Website ↗</a>` : ''}
        </div>

        <div class="d-status">
            <div class="seg" role="group" aria-label="Status">${statuses.map((status) => `<button type="button" data-set-status="${status}" data-s="${status}" aria-pressed="${profile.review.status === status}"><span class="dot"></span>${status}</button>`).join('')}</div>
            <textarea class="notes" data-notes placeholder="Private notes: call summary, which client this fits, rate discussed…">${esc(profile.review.notes)}</textarea>
            <p class="saved" data-saved></p>
        </div>

        <div class="block">
            <p class="label">Hardest system they’ve shipped</p>
            <p class="story">${esc(profile.hardestSystem)}</p>
            ${profile.hardestLink ? `<p class="prose" style="margin-top:10px">${link(profile.hardestLink)}</p>` : ''}
        </div>

        <div class="cols">
            <div><p class="label">Industries</p>${tags(profile.domains, true)}</div>
            <div><p class="label">Strongest at</p>${tags(profile.skills)}</div>
            <div><p class="label">Languages</p>${tags(profile.languages)}</div>
        </div>
        ${profile.domainNote ? `<div class="block"><p class="label">Where the industry knowledge comes from</p><p class="prose">${esc(profile.domainNote)}</p></div>` : ''}

        <dl class="facts">
            ${fact('Email', esc(profile.email))}
            ${fact('AI in production', esc(profile.yearsAi))}
            ${fact('Building software', esc(profile.yearsSoftware))}
            ${fact('Hours / week', esc(profile.hours))}
            ${fact('Earliest start', esc(profile.start))}
            ${fact('Prefers', esc(profile.shape))}
            ${fact('Rate', esc(rate))}
            ${fact('Invoices', esc(profile.entity))}
            ${fact('Heard via', esc(profile.source))}
            ${fact('Applied', `${date(profile.submittedAt)}${profile.fillSeconds ? ` · ${Math.max(1, Math.round(profile.fillSeconds / 60))} min` : ''}`)}
        </dl>

        <div class="block"><p class="label">Stack</p>${tags(profile.stack)}${profile.stackOther ? `<p class="prose" style="margin-top:10px">${esc(profile.stackOther)}</p>` : ''}</div>
        ${profile.opinion ? `<div class="block"><p class="label">A view most engineers would disagree with</p><p class="prose">${esc(profile.opinion)}</p></div>` : ''}
        ${profile.previousIds && profile.previousIds.length ? `<p class="saved">Applied before; earlier application ids: ${profile.previousIds.join(', ')}</p>` : ''}
    </div>`;

    detail.querySelectorAll('[data-set-status]').forEach((button) => button.addEventListener('click', () => save(profile, { status: button.dataset.setStatus })));
    const notes = detail.querySelector('[data-notes]');
    let timer;
    notes.addEventListener('input', () => {
        clearTimeout(timer);
        detail.querySelector('[data-saved]').textContent = 'Saving…';
        timer = setTimeout(() => save(profile, { notes: notes.value }, { rerender: false }), 700);
    });
};

const save = async (profile, patch, { rerender = true } = {}) => {
    const response = await fetch(`/api/careers/bench/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
    });
    if (!response.ok) {
        const saved = document.querySelector('[data-saved]');
        if (saved) saved.textContent = 'Couldn’t save. Check your connection and try again.';
        return;
    }
    const { review } = await response.json();
    profile.review = review;
    renderList();
    if (rerender) renderDetail();
    const label = document.querySelector('[data-saved]');
    if (label) label.textContent = `Saved ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const exportCsv = () => {
    const columns = ['id', 'submittedAt', 'fullName', 'email', 'location', 'timezone', 'role', 'yearsSoftware', 'yearsAi', 'domains', 'skills', 'stack',
        'hours', 'start', 'shape', 'languages', 'rate', 'rateCurrency', 'rateUnit', 'entity', 'linkedin', 'github', 'website', 'status', 'notes', 'hardestSystem'];
    const cell = (value) => `"${String(Array.isArray(value) ? value.join('; ') : value ?? '').replace(/"/g, '""')}"`;
    const rows = visible().map((p) => columns.map((column) => cell(column === 'status' ? p.review.status : column === 'notes' ? p.review.notes : p[column])).join(','));
    const blob = new Blob([[columns.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `spaghetti-talent-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(a.href);
};

const init = async () => {
    const response = await fetch('/api/careers/bench');
    if (!response.ok) {
        $('[data-detail]').innerHTML = '<div class="empty"><div><strong>Couldn’t load applications</strong>Refresh the page to try again.</div></div>';
        return;
    }
    ({ profiles, statuses } = await response.json());

    fill('domain', [...DOMAINS, NO_DOMAIN]);
    fill('skill', SKILLS);
    fill('role', Object.keys(ROLE_LABELS), (value) => ROLE_LABELS[value]);
    fill('start', START_OPTIONS);

    document.querySelectorAll('[data-filter]').forEach((control) => control.addEventListener('input', () => {
        filters[control.dataset.filter] = control.value;
        renderList();
    }));
    $('[data-stats]').addEventListener('click', (event) => {
        const pill = event.target.closest('[data-status-filter]');
        if (!pill) return;
        filters.status = pill.dataset.statusFilter;
        renderList();
    });
    $('[data-clear]').addEventListener('click', () => {
        Object.keys(filters).forEach((key) => { filters[key] = ''; });
        document.querySelectorAll('[data-filter]').forEach((control) => { control.value = ''; });
        renderList();
    });
    $('[data-list]').addEventListener('click', (event) => {
        const row = event.target.closest('[data-id]');
        if (!row) return;
        activeId = row.dataset.id;
        history.replaceState(null, '', `#${activeId}`);
        renderList();
        renderDetail();
        // On narrow screens the profile sits under the list, so bring it into view.
        if (window.matchMedia('(max-width: 900px)').matches) $('[data-detail]').scrollIntoView({ behavior: 'smooth' });
    });
    $('[data-export]').addEventListener('click', exportCsv);

    if (!profiles.some((profile) => profile.id === activeId)) activeId = profiles[0] ? profiles[0].id : null;
    renderList();
    renderDetail();
};

init();

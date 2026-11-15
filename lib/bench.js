// Careers applications from /careers: validation, spam guard, notifications and the
// talent page API. Storage (MySQL + bucket in production, local files in development)
// lives in ./bench-store.js.
//
// Optional notifications (both are skipped when unset):
//   RESEND_API_KEY + BENCH_NOTIFY_TO   email to you, and a confirmation to the applicant
//   BENCH_NOTIFY_FROM                  sender, default "Spaghetti <bench@spgti.com>"
//   BENCH_WEBHOOK_URL                  Slack-compatible incoming webhook ({ text })

const crypto = require('crypto');
const { records, files } = require('./bench-store');

const CV_MAX_BYTES = 5 * 1024 * 1024;
const MIN_FILL_MS = 45 * 1000; // Nobody answers this honestly in under 45 seconds.
const REVIEW_STATUSES = ['new', 'shortlisted', 'contacted', 'engaged', 'pass'];

// key -> rule. Arrays are lists of short strings. Anything not listed here is dropped.
const SCHEMA = {
    fullName: { type: 'string', required: true, max: 120 },
    email: { type: 'email', required: true, max: 200 },
    location: { type: 'string', required: true, max: 120 },
    timezone: { type: 'string', required: true, max: 64 },
    role: { type: 'string', required: true, max: 40 },
    yearsSoftware: { type: 'string', required: true, max: 20 },
    yearsAi: { type: 'string', required: true, max: 20 },
    skills: { type: 'list', required: true, max: 6 },
    domains: { type: 'list', required: true, max: 3 },
    domainNote: { type: 'string', max: 600 },
    stack: { type: 'list', required: true, max: 60 },
    stackOther: { type: 'string', max: 300 },
    hardestSystem: { type: 'string', required: true, min: 280, max: 5000 },
    hardestLink: { type: 'url', max: 500 },
    opinion: { type: 'string', max: 1500 },
    linkedin: { type: 'url', max: 300 },
    github: { type: 'url', max: 300 },
    website: { type: 'url', max: 300 },
    hours: { type: 'string', required: true, max: 20 },
    start: { type: 'string', required: true, max: 30 },
    shape: { type: 'string', required: true, max: 30 },
    languages: { type: 'list', max: 20 },
    rate: { type: 'number', max: 100000 },
    rateCurrency: { type: 'string', max: 3 },
    rateUnit: { type: 'string', max: 10 },
    entity: { type: 'string', required: true, max: 60 },
    source: { type: 'string', max: 40 }
};

const LABELS = {
    fullName: 'your name', email: 'your email', location: 'where you work from', timezone: 'your timezone',
    role: 'which role fits you', yearsSoftware: 'years building software', yearsAi: 'years shipping AI',
    skills: 'your strongest skills', domains: 'the industries you know', domainNote: 'where your domain knowledge comes from',
    stack: 'your stack', stackOther: 'the rest of your stack', hardestSystem: 'the hardest system you’ve shipped',
    hardestLink: 'the link to that system', opinion: 'your opinion', linkedin: 'your LinkedIn', github: 'your GitHub',
    website: 'your website', hours: 'hours per week', start: 'your earliest start', shape: 'the engagements you prefer',
    languages: 'your languages', rate: 'your rate', entity: 'how you invoice', source: 'how you heard about us'
};
const label = (key) => LABELS[key] || key;

class BenchError extends Error {
    constructor(status, message, field) {
        super(message);
        this.status = status;
        this.field = field;
    }
}

const clean = (value) => String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();

const normaliseUrl = (value) => {
    const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(withScheme);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.')) throw new Error('bad url');
    return url.toString();
};

const validate = (body) => {
    if (!body || typeof body !== 'object') throw new BenchError(400, 'Expected a JSON body.');
    const profile = {};

    for (const [key, rule] of Object.entries(SCHEMA)) {
        const raw = body[key];
        const empty = raw === undefined || raw === null || raw === '' || (Array.isArray(raw) && raw.length === 0);
        if (empty) {
            if (rule.required) throw new BenchError(400, `Please tell us ${label(key)}.`, key);
            continue;
        }

        if (rule.type === 'list') {
            if (!Array.isArray(raw)) throw new BenchError(400, `Something went wrong with ${label(key)}. Please pick again.`, key);
            const items = [...new Set(raw.map(clean).filter(Boolean).map((item) => item.slice(0, 80)))];
            if (items.length > rule.max) throw new BenchError(400, `Pick at most ${rule.max} for ${label(key)}.`, key);
            profile[key] = items;
            continue;
        }

        if (rule.type === 'number') {
            const number = Number(raw);
            if (!Number.isFinite(number) || number < 0 || number > rule.max) throw new BenchError(400, `Use a plain number for ${label(key)}.`, key);
            profile[key] = Math.round(number * 100) / 100;
            continue;
        }

        if (typeof raw !== 'string') throw new BenchError(400, `Something went wrong with ${label(key)}. Please re-enter it.`, key);
        const value = clean(raw);
        if (value.length > rule.max) throw new BenchError(400, `That’s a little long for ${label(key)}.`, key);
        if (rule.min && value.length < rule.min) throw new BenchError(400, `Please add a little more detail about ${label(key)}.`, key);

        if (rule.type === 'email') {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new BenchError(400, 'That email address doesn’t look right.', key);
            profile[key] = value.toLowerCase();
        } else if (rule.type === 'url') {
            try {
                profile[key] = normaliseUrl(value);
            } catch {
                throw new BenchError(400, `The link for ${label(key)} doesn’t look right.`, key);
            }
        } else {
            profile[key] = value;
        }
    }

    if (!profile.linkedin && !profile.github) throw new BenchError(400, 'Add a LinkedIn or GitHub link.', 'linkedin');
    if (body.consent !== true) throw new BenchError(400, 'Please confirm we can keep your profile on file.', 'consent');

    return profile;
};

const decodeCv = (cv) => {
    if (!cv) return null;
    if (typeof cv !== 'object' || typeof cv.data !== 'string') throw new BenchError(400, 'The CV upload was malformed.', 'cv');
    const buffer = Buffer.from(cv.data.replace(/^data:[^,]*,/, ''), 'base64');
    if (buffer.length > CV_MAX_BYTES) throw new BenchError(400, 'CVs need to be under 5 MB.', 'cv');
    if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') throw new BenchError(400, 'CVs need to be PDFs.', 'cv');
    return { buffer, name: clean(cv.name || 'cv.pdf').slice(0, 120) };
};

// ---------- Spam guard ----------

const recentByIp = new Map();
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 5;

const checkRate = (ip) => {
    const now = Date.now();
    const hits = (recentByIp.get(ip) || []).filter((time) => now - time < RATE_WINDOW_MS);
    if (hits.length >= RATE_LIMIT) throw new BenchError(429, 'Too many applications from this connection. Try again in an hour.');
    hits.push(now);
    recentByIp.set(ip, hits);
    if (recentByIp.size > 5000) recentByIp.clear();
};

// Bots fill the hidden field or post instantly. They get a normal-looking success so they
// don't learn what tripped them, and nothing is stored.
const looksAutomated = (body) => Boolean(body.company_url) || (Number(body.startedAt) > 0 && Date.now() - Number(body.startedAt) < MIN_FILL_MS);

// ---------- Ids ----------

const makeId = () => `B${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
const isId = (id) => /^B[A-Z0-9]+$/.test(String(id));

// ---------- Notifications ----------

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

const sendEmail = async ({ to, subject, html, replyTo }) => {
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from: process.env.BENCH_NOTIFY_FROM || 'Spaghetti <bench@spgti.com>',
            to,
            subject,
            html,
            ...(replyTo ? { reply_to: replyTo } : {})
        })
    });
    if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
};

const summaryLine = (profile) => [profile.role, profile.yearsAi && `${profile.yearsAi} AI`, profile.location].filter(Boolean).join(' · ');

const notify = async (profile, origin) => {
    const tasks = [];
    const adminLink = `${origin}/careers/bench#${profile.id}`;

    if (process.env.RESEND_API_KEY && process.env.BENCH_NOTIFY_TO) {
        tasks.push(sendEmail({
            to: process.env.BENCH_NOTIFY_TO.split(',').map((item) => item.trim()),
            replyTo: profile.email,
            subject: `New application: ${profile.fullName} (${(profile.domains || []).join(', ')})`,
            html: `<p><strong>${escapeHtml(profile.fullName)}</strong> &middot; ${escapeHtml(summaryLine(profile))}</p>
<p><strong>Domains:</strong> ${escapeHtml((profile.domains || []).join(', '))}<br>
<strong>Skills:</strong> ${escapeHtml((profile.skills || []).join(', '))}<br>
<strong>Availability:</strong> ${escapeHtml([profile.hours, profile.start, profile.shape].join(' · '))}</p>
<p><strong>Hardest system shipped</strong></p>
<p style="white-space:pre-wrap">${escapeHtml(profile.hardestSystem)}</p>
<p><a href="${escapeHtml(adminLink)}">Open in the talent directory</a></p>`
        }));

        const firstName = profile.fullName.split(/\s+/)[0];
        tasks.push(sendEmail({
            to: [profile.email],
            subject: 'Thanks for applying to Spaghetti',
            html: `<p>Hi ${escapeHtml(firstName)},</p>
<p>Thank you for applying to work with Spaghetti. Your application is in, and an engineer on our team will read it.</p>
<p>We match every project to the engineer’s expertise, so when one lines up with what you know and love, you’ll hear from us with a clear brief and a timeline. It’s fully remote, and you choose what you take on.</p>
<p>If anything changes (your availability or a new system you’re proud of), just reply to this email.</p>
<p>Spaghetti<br><a href="https://www.spgti.com">spgti.com</a></p>`
        }));
    }

    if (process.env.BENCH_WEBHOOK_URL) {
        tasks.push(fetch(process.env.BENCH_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: `New careers application: *${profile.fullName}* (${summaryLine(profile)})\nDomains: ${(profile.domains || []).join(', ')}\nSkills: ${(profile.skills || []).join(', ')}\n${adminLink}`
            })
        }).then((response) => {
            if (!response.ok) throw new Error(`Webhook ${response.status}`);
        }));
    }

    const results = await Promise.allSettled(tasks);
    results.filter((result) => result.status === 'rejected').forEach((result) => console.error('[bench] notification failed:', result.reason));
};

// ---------- Public API ----------

const submitApplication = async (body, { ip, origin }) => {
    if (looksAutomated(body || {})) return { id: makeId(), ignored: true };

    // Validate first so someone fixing a typo isn't counted against the rate limit.
    const profile = validate(body);
    const cv = decodeCv(body.cv);
    checkRate(ip || 'unknown');
    const id = makeId();

    const record = {
        id,
        submittedAt: new Date().toISOString(),
        ...profile,
        cv: cv ? { name: cv.name, bytes: cv.buffer.length } : null,
        fillSeconds: Number(body.startedAt) > 0 ? Math.round((Date.now() - Number(body.startedAt)) / 1000) : null
    };

    // CV first: if the upload fails, no record points at a missing file.
    if (cv) await files.putCv(id, cv.buffer);
    await records.insertApplication(record);

    notify(record, origin).catch((error) => console.error('[bench] notify error:', error));
    return { id };
};

const listProfiles = async () => {
    const applications = await records.listApplications();
    // A re-application from the same email replaces the older one in the directory.
    const latest = new Map();
    for (const application of applications) {
        const previous = latest.get(application.email);
        latest.set(application.email, { ...application, previousIds: previous ? [...(previous.previousIds || []), previous.id] : [] });
    }
    return [...latest.values()].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
};

const updateReview = async (id, { status, notes }) => {
    if (!isId(id)) throw new BenchError(400, 'Unknown profile.');
    if (status !== undefined && !REVIEW_STATUSES.includes(status)) throw new BenchError(400, 'Unknown status.');
    if (notes !== undefined && (typeof notes !== 'string' || notes.length > 5000)) throw new BenchError(400, 'Notes are too long.');

    const review = await records.updateReview(id, { status, notes });
    if (!review) throw new BenchError(404, 'Unknown profile.');
    return review;
};

const readCv = (id) => (isId(id) ? files.getCv(id) : Promise.resolve(null));

// ---------- Admin auth ----------

// HTTP Basic auth against BENCH_ADMIN_PASSWORD (any username). Without the env var the
// directory doesn't exist at all, so an unconfigured deploy can't leak profiles.
const requireAdmin = (req, res, next) => {
    const password = process.env.BENCH_ADMIN_PASSWORD;
    if (!password) return res.sendStatus(404);

    const [scheme, encoded] = String(req.headers.authorization || '').split(' ');
    const supplied = scheme === 'Basic' && encoded ? Buffer.from(encoded, 'base64').toString('utf8').split(':').slice(1).join(':') : '';
    const a = crypto.createHash('sha256').update(supplied).digest();
    const b = crypto.createHash('sha256').update(password).digest();

    if (supplied && crypto.timingSafeEqual(a, b)) {
        res.set('Cache-Control', 'no-store');
        res.set('X-Robots-Tag', 'noindex');
        return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="Spaghetti bench", charset="UTF-8"');
    return res.sendStatus(401);
};

module.exports = {
    BenchError,
    REVIEW_STATUSES,
    submitApplication,
    listProfiles,
    updateReview,
    readCv,
    requireAdmin
};

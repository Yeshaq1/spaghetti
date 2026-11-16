// Local development reads .env; on Railway the real environment wins (dotenv never overrides).
require('dotenv').config();
const express = require('express');
const path = require('path');
const { GIST_ORIGIN } = require('./lib/gist');
const { renderGistPage } = require('./lib/gist-page');
const bench = require('./lib/bench');

const app = express();
const PORT = process.env.PORT || 8002;
const HOST = process.env.HOST;
const rootDir = __dirname;
const indexPath = path.join(rootDir, 'index.html');
const caseStudyPath = path.join(rootDir, 'case-study.html');
const untanglePrivacyPath = path.join(rootDir, 'untangle-privacy.html');
const careersPath = path.join(rootDir, 'careers.html');
const benchAdminPath = path.join(rootDir, 'bench-admin.html');

// Railway sits behind one proxy; this makes req.ip and req.protocol the visitor's.
app.set('trust proxy', 1);

// Keep the raw template, server code, stored applications and the admin page out of static serving.
app.use('/gist.html', (_req, res) => res.redirect(301, '/gist'));
app.use('/recover.html', (_req, res) => res.redirect(301, '/recover'));
app.use('/careers.html', (_req, res) => res.redirect(301, '/careers'));
app.use(['/lib', '/.data', '/bench-admin.html', '/src/js/bench-admin.js'], (_req, res) => res.sendStatus(404));
// Scripts and styles have no version in their URLs, so browsers must revalidate them
// (a cheap 304 when unchanged) instead of running last deploy's code from cache.
app.use(express.static(rootDir, {
    setHeaders: (res, filePath) => {
        if (/\.(js|css|html)$/.test(filePath)) res.setHeader('Cache-Control', 'no-cache');
    }
}));

app.get('/api/features', (_req, res) => {
  res.json({ webrtcEnabled: false });
});

app.get(['/', '/index.html'], (_req, res) => {
  res.sendFile(indexPath);
});

app.get('/recover', (_req, res) => {
  res.sendFile(path.join(rootDir, 'recover.html'));
});

// Case study pages resolve their slug client-side from the URL.
app.get('/work/:slug', (_req, res) => {
  res.sendFile(caseStudyPath);
});

app.get('/work', (_req, res) => {
  res.redirect(301, '/#work');
});

// Linked from the Chrome Web Store listing; must stay public.
app.get('/untangle/privacy', (_req, res) => {
  res.sendFile(untanglePrivacyPath);
});

// The Gist (aigist.co): /gist shows today's podcast episode and brief under the Spaghetti brand.
app.get('/gist', async (_req, res, next) => {
  try {
    res.set('Cache-Control', process.env.NODE_ENV === 'production' ? 'public, max-age=600' : 'no-store');
    res.type('html').send(await renderGistPage());
  } catch (error) {
    next(error);
  }
});

// Branded short links for posts, e.g. /gist/digests/1183 -> aigist.co/digests/1183.
// UTM tags let The Gist's analytics show which signups came from Spaghetti / LinkedIn.
app.get('/gist/*', (req, res) => {
  const target = new URL(req.path.replace(/^\/gist/, '') || '/', GIST_ORIGIN);
  for (const [key, value] of Object.entries(req.query)) {
    target.searchParams.set(key, String(value));
  }
  if (!target.searchParams.has('utm_source')) {
    target.searchParams.set('utm_source', 'spaghetti');
    target.searchParams.set('utm_medium', 'redirect');
  }
  res.redirect(302, target.toString());
});

// Careers: the Spaghetti bench. Engineers apply once; we match them to contract work later.
app.get('/careers', (_req, res) => {
    res.sendFile(careersPath);
});

// A CV travels inside the JSON as base64, hence the larger limit on this route only.
app.post('/api/careers/apply', express.json({ limit: '8mb' }), async (req, res) => {
    try {
        const { id } = await bench.submitApplication(req.body, {
            ip: req.ip,
            origin: `${req.protocol}://${req.get('host')}`
        });
        res.status(201).json({ ok: true, id });
    } catch (error) {
        if (error instanceof bench.BenchError) {
            return res.status(error.status).json({ ok: false, error: error.message, field: error.field });
        }
        console.error('[bench] submit failed:', error);
        return res.status(500).json({ ok: false, error: 'Something went wrong on our side. Your answers are saved in this browser, so try again in a minute.' });
    }
});

// Bench directory: password-protected (BENCH_ADMIN_PASSWORD), 404 when the password is unset.
app.get('/careers/bench', bench.requireAdmin, (_req, res) => {
    res.sendFile(benchAdminPath);
});

app.get('/careers/bench/app.js', bench.requireAdmin, (_req, res) => {
    res.sendFile(path.join(rootDir, 'src', 'js', 'bench-admin.js'));
});

app.get('/api/careers/bench', bench.requireAdmin, async (_req, res, next) => {
    try {
        res.json({ profiles: await bench.listProfiles(), statuses: bench.REVIEW_STATUSES });
    } catch (error) {
        next(error);
    }
});

app.patch('/api/careers/bench/:id', bench.requireAdmin, express.json(), async (req, res, next) => {
    try {
        res.json({ ok: true, review: await bench.updateReview(req.params.id, req.body || {}) });
    } catch (error) {
        if (error instanceof bench.BenchError) return res.status(error.status).json({ ok: false, error: error.message });
        return next(error);
    }
});

app.get('/api/careers/bench/:id/cv', bench.requireAdmin, async (req, res, next) => {
    try {
        const cv = await bench.readCv(req.params.id);
        if (!cv) return res.sendStatus(404);
        return res.type('application/pdf').set('Content-Disposition', `inline; filename="cv-${req.params.id}.pdf"`).send(cv);
    } catch (error) {
        return next(error);
    }
});

app.get('*', (_req, res) => {
  res.sendFile(indexPath);
});

const onListen = () => {
  const hostLabel = HOST || 'localhost';
  console.log(`Server running at http://${hostLabel}:${PORT}`);
};

if (HOST) {
  app.listen(PORT, HOST, onListen);
} else {
  app.listen(PORT, onListen);
}

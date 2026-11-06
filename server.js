const express = require('express');
const path = require('path');
const { GIST_ORIGIN } = require('./lib/gist');
const { renderGistPage } = require('./lib/gist-page');

const app = express();
const PORT = process.env.PORT || 8002;
const HOST = process.env.HOST;
const rootDir = __dirname;
const indexPath = path.join(rootDir, 'index.html');
const caseStudyPath = path.join(rootDir, 'case-study.html');
const untanglePrivacyPath = path.join(rootDir, 'untangle-privacy.html');

// Keep the raw template and server code out of static serving.
app.use('/gist.html', (_req, res) => res.redirect(301, '/gist'));
app.use('/lib', (_req, res) => res.sendStatus(404));
app.use(express.static(rootDir));

app.get('/api/features', (_req, res) => {
  res.json({ webrtcEnabled: false });
});

app.get(['/', '/index.html'], (_req, res) => {
  res.sendFile(indexPath);
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

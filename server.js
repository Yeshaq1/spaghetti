const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const { GIST_ORIGIN, getTodaysGist } = require('./lib/gist');

const app = express();
const PORT = process.env.PORT || 8002;
const HOST = process.env.HOST;
const rootDir = __dirname;
const indexPath = path.join(rootDir, 'index.html');
const caseStudyPath = path.join(rootDir, 'case-study.html');
const untanglePrivacyPath = path.join(rootDir, 'untangle-privacy.html');
const gistPath = path.join(rootDir, 'gist.html');

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

// The Gist (aigist.co), Spaghetti's daily AI briefing.
// /gist is a branded page showing today's edition; it's rendered on the server so
// LinkedIn link previews pick up today's headline.
const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatGistDate = (isoDate) => {
  if (!isoDate) return 'Today';
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
  });
};

const gistLink = (gistPath, medium) => {
  const url = new URL(gistPath, GIST_ORIGIN);
  url.searchParams.set('utm_source', 'spaghetti');
  url.searchParams.set('utm_medium', medium);
  return escapeHtml(url.toString());
};

const renderGistEdition = (edition) => {
  if (!edition) {
    return `<section class="gist-edition gist-edition--empty">
            <p>Today's edition is on its way. <a href="${gistLink('/', 'gist_page')}" target="_blank" rel="noopener">Read it on aigist.co</a>.</p>
        </section>`;
  }

  const items = edition.items.map((item) => `
                <li>
                    <a class="gist-item" href="${gistLink(item.path, 'gist_page')}" target="_blank" rel="noopener">
                        ${item.tag ? `<span class="gist-item__tag">${escapeHtml(item.tag)}</span>` : ''}
                        <h3 class="gist-item__title">${escapeHtml(item.title)}</h3>
                        <p class="gist-item__summary">${escapeHtml(item.summary)}</p>
                        <span class="gist-item__more">Read the brief &rarr;</span>
                    </a>
                </li>`).join('');

  return `<section class="gist-edition" aria-labelledby="gist-edition-title">
            <p class="gist-edition__date">Today's edition &middot; ${escapeHtml(formatGistDate(edition.date))}</p>
            <h2 class="gist-edition__title" id="gist-edition-title">${escapeHtml(edition.briefTitle || "Today's top developments")}</h2>
            ${edition.briefSummary ? `<p class="gist-edition__summary">${escapeHtml(edition.briefSummary)}</p>` : ''}
            <a class="button" href="${gistLink(edition.briefPath, 'gist_page')}" target="_blank" rel="noopener">Read today's full brief</a>
            <ul class="gist-items">${items}
            </ul>
        </section>`;
};

app.get('/gist', async (_req, res) => {
  const edition = await getTodaysGist();
  const headline = edition && (edition.briefTitle || (edition.items[0] && edition.items[0].title));
  const pageTitle = headline ? `${headline} · The Gist by Spaghetti` : 'The Gist · Daily AI briefing by Spaghetti';
  const pageDescription = (edition && edition.briefSummary)
    || 'What moved in AI today, and why it matters. A free daily briefing from Spaghetti.';

  const template = await fs.readFile(gistPath, 'utf8');
  const html = template
    .replace(/{{pageTitle}}/g, escapeHtml(pageTitle))
    .replace(/{{pageDescription}}/g, escapeHtml(pageDescription))
    .replace('{{edition}}', renderGistEdition(edition));

  res.set('Cache-Control', 'public, max-age=600');
  res.type('html').send(html);
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

// Renders /gist: today's episode of The Gist podcast plus a line about today's brief.
// Built on the server so link previews (LinkedIn etc.) show the day's episode.

const fs = require('fs/promises');
const path = require('path');
const { GIST_ORIGIN, getTodaysGist, getPodcast } = require('./gist');

const templatePath = path.join(__dirname, '..', 'gist.html');

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const longDate = (isoDate) => (isoDate
    ? new Date(`${isoDate}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })
    : '');

const gistLink = (gistPath, medium) => {
    const url = new URL(gistPath, GIST_ORIGIN);
    url.searchParams.set('utm_source', 'spaghetti');
    url.searchParams.set('utm_medium', medium);
    return escapeHtml(url.toString());
};

const firstSentence = (text = '') => {
    const match = text.match(/^.+?[.!?](?=\s|$)/);
    return match ? match[0] : text;
};

const renderBriefLine = (edition) => {
    if (!edition) return '';
    const lead = edition.items[0];
    const line = lead ? firstSentence(lead.summary) : edition.briefSummary;
    return `<a class="gist-brief" href="${gistLink(edition.briefPath, 'gist_page')}" target="_blank" rel="noopener">
            <span class="gist-label">Today's brief</span>
            <span class="gist-brief__title">${escapeHtml(edition.briefTitle || "Today's top developments")}</span>
            ${line ? `<span class="gist-brief__line">${escapeHtml(line)}</span>` : ''}
            <span class="gist-brief__more">Read the brief &rarr;</span>
        </a>`;
};

const renderEpisode = (episode) => `<section class="gist-episode" aria-labelledby="gist-title" data-gist-player>
            <div class="gist-cover" aria-hidden="true">
                <img class="gist-cover__logo" src="/assets/logo.png" alt="">
                <span class="gist-cover__the">The</span>
                <span class="gist-cover__word">Gist</span>
                <span class="gist-cover__rule"></span>
                <span class="gist-cover__tag">AI, in perspective.</span>
                <span class="gist-cover__bars"><i></i><i></i><i></i><i></i><i></i></span>
            </div>
            <div class="gist-episode__main">
                <p class="gist-label"><span class="gist-live" aria-hidden="true"></span>The Gist &middot; ${escapeHtml(longDate(episode.date))}</p>
                <h1 class="gist-episode__title" id="gist-title">${escapeHtml(episode.title)}</h1>
                <div class="gist-player">
                    <button class="gist-player__toggle" type="button" data-player-toggle aria-label="Play episode">
                        <svg class="gist-player__icon gist-player__icon--play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>
                        <svg class="gist-player__icon gist-player__icon--pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
                    </button>
                    <input class="gist-player__seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Seek" data-player-seek>
                    <span class="gist-player__time"><span data-player-elapsed>0:00</span> / <span data-player-duration>${escapeHtml(episode.duration)}</span></span>
                </div>
                <audio preload="none" src="${escapeHtml(episode.audioUrl)}" data-player-audio></audio>
            </div>
        </section>`;

const renderFallback = () => `<section class="gist-episode gist-episode--empty">
            <p class="gist-label">The Gist &middot; by Spaghetti</p>
            <h1 class="gist-episode__title">Today's episode is on its way.</h1>
            <p><a href="${gistLink('/', 'gist_page')}" target="_blank" rel="noopener">Listen on aigist.co &rarr;</a></p>
        </section>`;

const renderGistPage = async () => {
    const [edition, podcast] = await Promise.all([getTodaysGist(), getPodcast()]);
    const episode = podcast && podcast.episodes[0];

    const pageTitle = episode
        ? `${episode.title} · The Gist by Spaghetti`
        : 'The Gist · Daily AI podcast by Spaghetti';
    const pageDescription = (episode && episode.description)
        || 'What moved in AI today, and why it matters. A daily podcast and briefing from Spaghetti.';
    const ogImage = (podcast && podcast.coverUrl) || 'https://www.spgti.com/assets/logo.png';

    const today = `${episode ? renderEpisode(episode) : renderFallback()}

        ${renderBriefLine(edition)}`;

    const template = await fs.readFile(templatePath, 'utf8');
    return template
        .replace(/{{pageTitle}}/g, escapeHtml(pageTitle))
        .replace(/{{pageDescription}}/g, escapeHtml(pageDescription))
        .replace(/{{ogImage}}/g, escapeHtml(ogImage))
        .replace('{{today}}', () => today);
};

module.exports = { renderGistPage };

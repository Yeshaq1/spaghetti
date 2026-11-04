// Reads today's edition of The Gist (aigist.co) so /gist can show it under the Spaghetti brand.
// aigist.co has no feed or API, so this parses its server-rendered HTML:
//   - homepage: "From Today's Brief" cards (a.mk-article) and the "Today's Brief" nav link
//   - brief page: og:title / og:description
// Results are cached in memory; if aigist.co is down or its markup changes, the last good
// edition is served, and the page falls back to plain links when there has never been one.

const GIST_ORIGIN = 'https://aigist.co';
const CACHE_MS = 30 * 60 * 1000;
const FETCH_TIMEOUT_MS = 5000;

let cache = null; // { edition, fetchedAt }
let inflight = null;

const decode = (text) => text
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');

const clean = (fragment = '') => decode(fragment.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

const pick = (html, pattern) => {
    const match = html.match(pattern);
    return match ? match[1] : '';
};

const fetchText = async (path) => {
    const response = await fetch(new URL(path, GIST_ORIGIN), {
        headers: { 'User-Agent': 'SpaghettiSite/1.0 (+https://www.spgti.com/gist)' },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
    if (!response.ok) throw new Error(`aigist.co ${path} responded ${response.status}`);
    return response.text();
};

const parseHome = (html) => {
    const items = [];
    const cardPattern = /<a class="mk-article mk-article--link" href="([^"]+)">([\s\S]*?)<\/a>/g;
    let match;
    while ((match = cardPattern.exec(html))) {
        const [, href, inner] = match;
        const title = clean(pick(inner, /<h3 class="mk-article__title">([\s\S]*?)<\/h3>/));
        if (!title) continue;
        items.push({
            path: href,
            tag: clean(pick(inner, /<span class="mk-article__tag">([\s\S]*?)<\/span>/)),
            title,
            summary: clean(pick(inner, /<p class="mk-article__body">([\s\S]*?)<\/p>/))
        });
    }
    const briefPath = pick(html, /href="(\/briefs\/[^"]+)"/);
    return { items, briefPath };
};

// og:description is cut off with "..."; keep only the complete sentences.
const toWholeSentences = (text) => {
    if (!/(\.\.\.|…)$/.test(text)) return text;
    const lastStop = text.slice(0, -3).lastIndexOf('. ');
    return lastStop > 0 ? text.slice(0, lastStop + 1) : '';
};

const parseBrief = (html) => ({
    title: decode(pick(html, /<meta property="og:title"\s+content="([^"]*)"/)),
    summary: toWholeSentences(decode(pick(html, /<meta property="og:description"\s+content="([^"]*)"/)))
});

const loadEdition = async () => {
    const { items, briefPath } = parseHome(await fetchText('/'));
    if (!items.length || !briefPath) throw new Error('aigist.co homepage markup not recognised');

    let brief = { title: '', summary: '' };
    try {
        brief = parseBrief(await fetchText(briefPath));
    } catch (error) {
        console.warn('[gist] brief page fetch failed:', error.message);
    }

    return {
        date: pick(briefPath, /\/briefs\/(\d{4}-\d{2}-\d{2})\//),
        briefPath,
        briefTitle: brief.title,
        briefSummary: brief.summary,
        items
    };
};

const getTodaysGist = async () => {
    if (cache && Date.now() - cache.fetchedAt < CACHE_MS) return cache.edition;
    if (!inflight) {
        inflight = loadEdition()
            .then((edition) => {
                cache = { edition, fetchedAt: Date.now() };
                return edition;
            })
            .catch((error) => {
                console.warn('[gist] using cached edition:', error.message);
                return cache ? cache.edition : null;
            })
            .finally(() => {
                inflight = null;
            });
    }
    return inflight;
};

module.exports = { GIST_ORIGIN, getTodaysGist };

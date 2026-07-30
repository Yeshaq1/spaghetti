export const CALENDAR_URL = 'https://calendar.app.google/XXZGJ4ewqK1f9YPC7';

// Order matters: the carousel renders this list twice back-to-back and loops, so the
// last entry sits next to the first. Google and General Motors are kept as far apart as
// a loop allows — three tiles forward, two back. Keep at least two entries between them
// on both sides when reordering.
// piti-logo.png is a recolour of the supplied black-on-transparent artwork: strokes moved
// to #f5f5f2 to match the Monks mark, heart left at its original salmon. The source
// black version is invisible against the dark logo tiles.
export const CLIENT_LOGOS = [
    { name: 'Google', src: 'assets/Google__G__logo.svg.webp' },
    { name: 'Winimo', src: 'assets/winimo.png' },
    { name: 'AI DimosNET', src: 'assets/ai-dimosnet.png' },
    { name: 'Piti', src: 'assets/piti-logo.png' },
    { name: 'General Motors', src: 'assets/GM2.png' },
    { name: 'Majles', src: 'assets/majles.png' },
    { name: 'Dot monks', src: 'assets/dot-monks-logo.svg' }
];

// Client marks shown under each "What We Build" area, by area index (order matches
// `systems.items`). Kept outside the copy blocks so both languages share one list.
// Names must match a CLIENT_LOGOS entry; anything unmatched is skipped.
export const SYSTEM_LOGOS = [
    ['AI DimosNET', 'Google', 'Dot monks'],
    ['Majles'],
    ['AI DimosNET', 'Winimo', 'General Motors'],
    ['Winimo', 'Majles']
];

// Each entry becomes a card in the homepage #work section and a page at /work/<slug>.
// Only `slug`, `client`, `title`, `summary` and `chapters` are required.
// `excerpt` is the one line the homepage card shows; `summary` is the longer hero paragraph.
// A chapter renders `body` paragraphs, then `points` (a titled list), then `outro` paragraphs.
// Logo paths are absolute so they resolve from /work/<slug> as well as from /.
export const CASE_STUDIES = [
    {
        slug: 'dimosnet',
        client: 'Dimosnet',
        logo: { src: '/assets/ai-dimosnet.png', alt: 'AI DimosNET' },
        sector: 'GovTech · Legal knowledge',
        year: '2026',
        // duration: '', // fill in the real engagement length; the row is hidden while this is empty.
        title: 'Turning a legal library into the AI product that generic chatbots could not copy.',
        excerpt: 'Years of proprietary legal commentary, made AI-native and read by hybrid retrieval tuned for Greek law.',
        summary:
            'Dimosnet sells expert interpretation of Greek municipal law to public bodies. When general-purpose AI threatened to commoditise that expertise, the moat turned out to be the data itself — years of proprietary legal commentary that no model had. We cleaned, restructured and made that corpus AI-native, then built the hybrid retrieval that reads it accurately. It now answers 300+ municipalities in seconds and turned a defensive risk into roughly €500K in new annual revenue.',
        tags: [
            'Data & knowledge systems',
            'Hybrid retrieval (RAG)',
            'Greek-language legal search',
            'Document intelligence'
        ],
        cover: '',
        metrics: [
            { value: '300+', label: 'Greek municipalities answered daily' },
            { value: '€500K', label: 'New annual revenue unlocked' },
            { value: 'Seconds', label: 'From a legal question to a cited answer' }
        ],
        chapters: [
            {
                label: 'The problem',
                title: 'Their expertise was about to be commoditised by AI.',
                body: [
                    'Dimosnet’s value to municipalities was the interpretation layer on top of Greek administrative law: not the statute text, but what it means for a clerk about to sign off a procurement, a permit, or a payment. General-purpose chatbots suddenly looked like they could answer those questions for free — and if they could, the subscription reason-to-exist was gone.',
                    'The counter-move was obvious and hard at the same time: the one thing the models did not have was Dimosnet’s own corpus of expert explainers. But that corpus was written for humans in WordPress, not for machines — full of historical versions, superseded clauses, tab-based layouts and inconsistent structure. Pointing an LLM at it as-is produced confident, wrong, out-of-date answers, which for legal guidance is worse than no answer at all.'
                ]
            },
            {
                label: 'The approach',
                title: 'Make the data AI-ready before touching retrieval.',
                body: [
                    'We treated the data as the product, not the model. First we mapped the corpus and defined what "correct" retrieval had to mean for law: current text only, the right thematic scope, and a citation back to the source every time.',
                    'That meant an ingestion pipeline that cleans each explainer, strips historical and repealed versions so only the law in force survives, normalises the structure, and splits it into overlapping passages sized for retrieval (1,600 characters, with 200-character overlap). Only once the corpus was clean and consistent did we design how to read it back out.'
                ]
            },
            {
                label: 'What we built',
                title: 'Two-stage hybrid retrieval tuned for Greek legal language.',
                body: [
                    'Answers run through a two-stage search. A lightweight routing layer (one summary vector per explainer) first narrows thousands of documents down to the handful that actually govern the question; only then does a second pass search the passages inside those documents. This keeps answers on-topic and fast instead of dredging the whole library on every query.',
                    'Each stage is hybrid: dense semantic embeddings run alongside sparse keyword vectors built by a custom Greek tokeniser (accent-folding, Greek-specific handling), blended 70/30 in favour of meaning while still catching exact terms — law numbers, article references, thresholds. Before any search runs, an LLM query-expansion step rewrites the user’s question into five Greek variations covering different legal angles — the governing provision, the underlying doctrine, monetary thresholds, procedure and exceptions — so a plainly-worded question still reaches the right law.',
                    'Under the hood: Pinecone vector search (dense + sparse), OpenAI embeddings (text-embedding-3-small), an LLM query-expansion strategist, per-document routing summaries, and citations resolved back to the live dimosnet.gr source on every answer.'
                ]
            },
            {
                label: 'The result',
                title: 'A defensive risk turned into a revenue line — and it stays current on its own.',
                body: [
                    'The same expertise that AI threatened to erode is now the thing AI can only deliver through Dimosnet, because only Dimosnet has the clean, structured, current corpus behind it. More than 300 municipalities use it to get sourced answers to administrative-law questions in seconds instead of hours of manual lookup, and the product added roughly €500K in new annual revenue.',
                    'Crucially, it does not decay. A nightly sync reconciles the search index with every change published to the source library — additions, edits, removals — and a change-detection pipeline flags when new legislation repeals or affects existing guidance. The knowledge base the assistant answers from is always the current one, with no manual re-indexing.'
                ]
            }
        ],
        stack: [
            'Next.js',
            'Pinecone (hybrid dense + sparse)',
            'OpenAI embeddings (text-embedding-3-small)',
            'LLM query expansion',
            'Custom Greek tokeniser (BM25-style)',
            'Nightly auto-sync + change detection',
            'WordPress as source of record'
        ]
    },
    {
        slug: 'winimo',
        client: 'Winimo',
        logo: { src: '/assets/winimo.png', alt: 'Winimo' },
        sector: 'ConsumerTech · Parenting · Health-adjacent AI',
        year: '2025–2026',
        // duration: '', // fill in the real build length; the row is hidden while this is empty.
        services: 'End-to-end product architecture & AI engineering',
        title:
            'An AI trusted by 10,000+ families — built on durable memory, multimodal records, and a deterministic safety floor.',
        excerpt: 'An AI companion for parents, and an architecture that transfers to any sensitive record.',
        summary:
            'Winimo is an AI companion for parents, from pregnancy to preschool. The interesting part wasn’t the chat surface — it was everything behind it: giving an AI durable per-family memory, teaching it to read a photo or a scanned clinic note as data, having it reach out proactively when something drifts across weeks, and engineering it so it can be trusted with something as sensitive as a newborn. We designed and built the whole system — agent orchestration, a longitudinal record modeled on how clinicians actually think, multimodal ingestion, and a code/LLM/state safety split. The product reached roughly 15% of new parents in its launch market and more than 10,000 families.',
        tags: [
            'Agentic architecture',
            'Longitudinal memory',
            'Multimodal (vision + voice)',
            'Proactive intelligence',
            'Safety-critical LLM engineering'
        ],
        cover: '',
        metrics: [
            { value: '~15%', label: 'Of new parents reached in the launch market' },
            { value: '10K+', label: 'Families, from pregnancy to preschool' },
            { value: '24/7', label: 'Proactive — concerns surfaced without the noise' }
        ],
        chapters: [
            {
                label: 'The challenge',
                title: 'Anyone can wrap a model. The hard part is trust over time.',
                body: [
                    'Standing up a model that answers parenting questions is a weekend. The reasons that doesn’t make a product are exactly the hard engineering problems, and they’re the ones that recur across serious AI builds in any domain.'
                ],
                points: [
                    {
                        title: 'Memory that persists and stays honest.',
                        text: 'The system has to remember durable facts about each family across every conversation — and never confuse its own past advice for something the user actually did.'
                    },
                    {
                        title: 'Multimodal inputs that become structured data.',
                        text: 'Not just captions — a photo, a voice note, a scanned document folded into a record the rest of the system can reason over.'
                    },
                    {
                        title: 'Reasoning that’s context-gated.',
                        text: 'The same data point means opposite things in different contexts (38.2°C is an emergency at six weeks, unremarkable at three years). Ungated, a model confidently gives the wrong one.'
                    },
                    {
                        title: 'Proactivity without noise.',
                        text: 'Value comes from catching slow drifts nobody queried — but a system that pings constantly gets muted in a week.'
                    },
                    {
                        title: 'Safety you can’t leave to a probabilistic model.',
                        text: 'For sensitive guidance, a confident wrong answer is worse than none. Some things must be deterministic.'
                    }
                ],
                outro: ['These were the problems worth solving. Here’s how we architected each one.']
            },
            {
                label: 'The organizing principle',
                title: 'A strict three-way split.',
                body: [
                    'The design borrows from how medicine solved the same problem decades ago: no clinician reconstructs a patient from raw chronological notes — they read the problem list (active problems, plus explicit "history of"). We applied that everywhere, with a clean division of labour that kept the system both smart and safe.'
                ],
                points: [
                    {
                        title: 'Code catches the known red flags — deterministically.',
                        text: 'A white-stool photo never depends on the model having a good day.'
                    },
                    {
                        title: 'The LLM connects the unknowns across time and vocabulary.',
                        text: 'The things no rule could ever enumerate.'
                    },
                    {
                        title: 'A state layer keeps every consumer honest.',
                        text: 'What’s active, what just closed, and what’s history — so no part of the app re-alarms over an episode that already resolved.'
                    }
                ],
                outro: ['Every component below sits inside that split.']
            },
            {
                label: 'What we built',
                title: 'The system that shipped.',
                points: [
                    {
                        title: 'Agent orchestration — one agent, many tools.',
                        text: 'A single orchestrating agent (OpenAI Agents SDK) handles every request and calls domain tools as needed — milestones, development, meal planning, product suggestions, document and photo analysis, routines, local places, record updates. The challenge: an earlier design used a router plus four specialist agents — more moving parts, more latency, more failure surface. What we did: consolidated to one agent with a tool belt, which was simpler, faster, and materially easier to keep safe and reason about.'
                    },
                    {
                        title: 'Longitudinal memory — durable, and provenance-strict.',
                        text: 'A dedicated long-term memory layer (Mem0, self-hosted and in-process) remembers facts about each family, keyed to the user and recalled into any future conversation. The challenge: naive memory quickly poisons itself — the model starts treating its own prior suggestions as user facts. What we did: enforced strict provenance, separating what the user said from what Winimo suggested, so recall stays trustworthy over months of history.'
                    },
                    {
                        title: 'Multimodal ingestion — a photo becomes a record.',
                        text: 'Upload a photo or a scanned clinic note and a vision pipeline transcribes it, captions it, backfills the log entry, embeds it, and hands the enriched entry to an investigator that decides whether it’s worth surfacing and how urgently. The challenge: enrichment must never corrupt the thing the user already saved, and it can’t block them. What we did: made the entire pipeline best-effort and asynchronous — any failure leaves the original entry exactly as the user left it.'
                    },
                    {
                        title: 'Context-gated reasoning.',
                        text: 'Every consumer of the data receives the subject’s exact context band, and retrieval is shaped by the kind of signal being read — a trajectory question pulls the whole series (a single reading is meaningless), while a baseline question is read against that individual’s own history, not a generic norm. The challenge: the "right" retrieval window is different for every question type. What we did: built retrieval archetypes so the system asks the right question of the data every time.'
                    },
                    {
                        title: 'Proactive intelligence — signal, never filler.',
                        text: 'A periodic "trend sweep" catches what no single entry can — a metric quietly slowing, a cadence drifting, a logged routine that just stopped. The challenge: proactive systems either miss the slow stuff or drown the user in digests. What we did: code computes the signals deterministically and the LLM only runs when a signal exists — purely to judge whether it’s worth saying and to say it well. A quiet week produces zero messages and zero model calls.'
                    },
                    {
                        title: 'The delight layer.',
                        text: 'On top of the core system we also built the things that make a product loved rather than just used — generated keepsakes, personalized audio, local recommendations, on-the-fly voice transcription — proof the same team ships polish, not just plumbing.'
                    }
                ]
            },
            {
                label: 'What it demonstrates',
                title: 'The architecture is the product — and it travels.',
                body: [
                    'The value isn’t any one model — models are rented. It’s the architecture around them: a per-entity longitudinal record, provenance-clean memory, async multimodal ingestion, context-gated retrieval, and a deterministic safety floor under a probabilistic system.',
                    'That pattern is domain-agnostic — the same backbone that reasons about a child works for a patient, a case file, a portfolio, or any product where an AI has to be trusted with sensitive data over time. Winimo is what it looks like when it’s built for real, at scale, for more than 10,000 families.'
                ]
            }
        ],
        stack: [
            'FastAPI (Python)',
            'Next.js (React)',
            'Expo (iOS/Android)',
            'MongoDB',
            'OpenAI Agents SDK',
            'GPT-4o-mini',
            'text-embedding-3-small',
            'Whisper',
            'Mem0 long-term memory (Qdrant / Pinecone)',
            'ElevenLabs',
            'Replicate + OpenAI (image generation)',
            'AWS S3',
            'Deterministic red-flag rules + problem-list state layer'
        ]
    },
    {
        slug: 'majles',
        client: 'Majles',
        // Padding-trimmed crop of assets/majles.png — the source has wide black margins that
        // shrink the mark inside the shared logo box.
        logo: { src: '/assets/majles-mark.png', alt: 'Majles' },
        sector: 'MarketTech · Consumer research · Arabic-first AI',
        year: '2026',
        // duration: '', // fill in the real build length; the row is hidden while this is empty.
        services: 'End-to-end product architecture & AI engineering',
        title: 'Synthetic Saudi audiences that answer like people — and show the data behind every word.',
        excerpt:
            'An Arabic-first research platform where a persona’s opinion always arrives with the segment data that explains it.',
        summary:
            'Majles lets a brand ask a Saudi consumer segment a question and get an answer in minutes instead of fielding a focus group for weeks. The easy version of that is a chatbot in a costume. The hard version — the one we built — is a persona that stays in character, adjusts how much cultural and religious framing it applies based on what was actually asked, remembers its own life across sessions, can watch your ad and react to it, and attaches real Saudi demographic sources to every claim it makes. We designed and built the whole system: the persona data model, the cultural-sensitivity gate, the evidence layer, the multimodal stimulus pipeline, and an OAuth-secured MCP server that puts all seven of its research tools directly inside ChatGPT and Claude.',
        tags: [
            'Agentic architecture',
            'Grounded retrieval with source whitelisting',
            'Arabic-first (RTL) product',
            'Multimodal stimulus testing',
            'MCP server (OAuth 2.1)'
        ],
        cover: '',
        metrics: [
            { value: 'Minutes', label: 'From a question to a sourced, multi-segment readout' },
            { value: '7 tools', label: 'Research workflows callable from ChatGPT and Claude' },
            { value: '34 sources', label: 'Saudi government and national data domains, whitelisted' }
        ],
        chapters: [
            {
                label: 'The problem',
                title: 'A general model asked to "be a Saudi consumer" gives you a stereotype with a helpful tone.',
                body: [
                    'Market research in Saudi Arabia is slow and expensive in exactly the places where brands move fastest: concept testing, ad copy, offers, positioning. The obvious shortcut — ask a frontier model what a 34-year-old woman in Jeddah would think of this campaign — fails in four specific ways, and each one is an engineering problem rather than a prompting one.'
                ],
                points: [
                    {
                        title: 'It answers as an assistant, not a person.',
                        text: 'Ask it whether it would buy something and it advises you about the purchase instead of telling you what it would do.'
                    },
                    {
                        title: 'Its cultural knowledge is flat.',
                        text: 'Najdi and Hijazi norms are not interchangeable; formality with family, at work, and with strangers are three different numbers; "why aren’t you married yet" and "how was the wedding" are the same keyword and completely different questions.'
                    },
                    {
                        title: 'It cannot show its work.',
                        text: 'For research that feeds a media budget, an ungrounded opinion is not evidence — it’s a guess with good grammar.'
                    },
                    {
                        title: 'It’s monolingual in practice.',
                        text: 'Arabic gets treated as a translation target rather than the language the product thinks in.'
                    }
                ]
            },
            {
                label: 'The approach',
                title: 'Model the person as data first, then decide how much culture the question actually needs.',
                body: [
                    'We treated a persona as a validated record, not a paragraph of backstory. A strict schema covers seven dimensions — demographic, professional, financial, psychology, cultural/religious, communication, and a narrative summary — including the fields that make an answer feel like a specific person rather than a segment average: hidden tensions, primary life anxieties, defense mechanisms, self-perception versus how they’re actually perceived, prayer frequency, dialect, accent characteristics, and formality scored 1–10 separately for work, family and strangers.',
                    'Personas are generated against that schema under structured outputs, in one of two modes: a deep-research mode that runs web search plus file search over a curated Saudi reference corpus, or a high-effort reasoning mode. Because research-grade generation takes minutes rather than seconds, generation runs as a tracked background job with polling and batch support. Nothing reaches a user until a human approves it — personas stay in draft until reviewed, and chat, the REST API and the MCP tools all refuse to serve anything unapproved.',
                    'From that record we extract a fifteen-field core identity — who this person is and how they speak — and build the roleplay prompt around it, with explicit rules: first person only, answer from your own reality, only offer help if your background actually gives you that skill, never invent a fact that isn’t in your identity or your memories, never break character.'
                ]
            },
            {
                label: 'What we built',
                title: 'Five systems behind one conversation.',
                points: [
                    {
                        title: 'A cultural-sensitivity gate that runs before every reply.',
                        text: 'Each incoming message is classified — at low temperature, against eight worked examples — into a sensitivity level, a set of cultural dimensions (religious, familial, economic, gender, tradition, social), a reasoning string and a confidence score. The challenge: heavy cultural framing on every message makes the persona a caricature and burns latency on "what’s your favourite coffee shop"; no framing makes it hollow on the questions that matter. What we did: three tiers. Low leaves the prompt untouched. Medium adds regional norms and financial pressures as light background. High injects a required four-layer response structure — religious and cultural framing, the persona’s own economic and psychological reality, the tension between what society expects and what they can actually afford or do, and the communication style to deliver it in (Najdi: indirect, private, never criticise family openly; Hijazi: warm and direct but honour-conscious) — with the instruction that the answer must still read as natural speech, not a list. The classifier also accepts images and PDFs, so an uploaded ad is classified on its content, not just its caption.'
                    },
                    {
                        title: 'An evidence layer — "the data behind this answer."',
                        text: 'After the persona speaks, a second pass works out why someone in this segment would say that. The challenge: the answer has to be grounded in Saudi reality specifically, and a fabricated citation is worse than no citation. What we did: a two-stage search with a hard Saudi filter. It searches a curated vector store of Saudi demographic and behavioural material first; only if that returns nothing does it fall back to web search restricted to a whitelist of roughly thirty-four Saudi government, statistical and national-media domains — GASTAT, SDAIA, SAMA, Monsha’at, Vision 2030, the ministries, the major newspapers — with every returned source re-checked against that whitelist before it’s allowed through. Placeholder non-answers are filtered out rather than shown, greetings short-circuit the pipeline entirely, and every result is labelled by provenance and stored on the message itself — which is what makes the reporting layer possible.'
                    },
                    {
                        title: 'Per-persona memory as a knowledge graph.',
                        text: 'Every persona owns a dedicated graph. Memories go in as natural-language text and come back out per query — the most relevant facts plus the most relevant entities — assembled into a context block injected into the roleplay prompt. The challenge: a persona who forgets their own life between sessions isn’t a research instrument. What we did: made retrieval query-scoped rather than dumping the whole history, and made graph search best-effort — if it fails, the persona still answers from its core identity instead of the session dying.'
                    },
                    {
                        title: 'Multimodal stimulus testing.',
                        text: 'You can show a persona the actual artefact: the image, the PDF, the video, or a YouTube link. Files upload straight to object storage from the browser and reach the model as short-lived signed URLs. The challenge: video doesn’t fit the same path as an image, and a video that only exists on the turn it was uploaded is useless for a follow-up question. What we did: video routes through a separate file API with upload-and-poll handling, and the resulting file reference is persisted on the session and re-injected on every later turn — so "what did you think of the second half?" still works three questions later. When video is in play the system switches model families; when an upload fails it falls back rather than erroring out.'
                    },
                    {
                        title: 'Sessions that come out as research, not transcripts.',
                        text: 'A report generator rebuilds the conversation as an annotated transcript — each persona response interleaved with the sourced data points captured alongside it — and produces an executive summary, three to six key findings each carrying its statistic and source, the standout quotes with why they matter, and two to five recommendations built on what the data actually showed. In Arabic or English.'
                    }
                ]
            },
            {
                label: 'Distribution',
                title: 'The research tools live inside ChatGPT and Claude, not just inside the app.',
                body: [
                    'Majles is also a remote MCP server, which means a strategist can run a study from the assistant they already work in. Seven tools: list and filter personas, ask one persona, ask up to five in parallel, compare segments, evaluate a stimulus, and generate a report.',
                    'The two that matter most are the synthesis tools. compare_segments runs one question across several personas and returns common ground, tensions between segments, marketer implications, recommended next questions — and, deliberately, evidence gaps: where the answer isn’t backed by data. evaluate_stimulus takes an ad, concept, message, offer, landing page or script and returns per-segment reactions plus a six-axis scorecard — clarity, relevance, credibility, distinctiveness, cultural fit, motivation — with strengths, risks, objections and recommended changes.',
                    'The plumbing is the standards-compliant version rather than an API key in a header: OAuth 2.1 authorization code with PKCE, dynamic client registration, refresh-token rotation, token revocation, and both authorization-server and protected-resource metadata documents so ChatGPT and Claude discover and connect on their own. Every tool returns structured output alongside its text summary, so the calling agent reasons over fields instead of scraping prose. Parallel asks are settled independently — one persona failing never takes down the run. API keys still work for REST, n8n and scripted clients, and there’s a stdio server for local use.'
                ]
            },
            {
                label: 'What it demonstrates',
                title: 'Grounding, gating, and provenance — the pattern travels.',
                body: [
                    'Majles is Arabic-first by construction, not by translation: Arabic is the default locale, the interface is RTL, the persona prompts and dialect handling are written in Arabic, and reports render in Modern Standard Arabic. It ships as a real SaaS product — subscriptions, trial, billing portal, webhooks, an admin console for persona generation, review, memory and corpus management, and user-issued API keys.',
                    'The transferable part isn’t the personas. It’s three decisions.'
                ],
                points: [
                    {
                        title: 'Grounding.',
                        text: 'An opinion is only worth something if the system can show the data underneath it, and a source filter that refuses everything outside the market is what keeps that honest.'
                    },
                    {
                        title: 'Gating.',
                        text: 'Deciding per request how much expensive reasoning a question actually deserves, instead of paying for maximum depth on every message.'
                    },
                    {
                        title: 'Provenance.',
                        text: 'Storing the evidence on the record at the moment it’s produced, so a report generated weeks later can still cite it.'
                    }
                ],
                outro: [
                    'That backbone works for any market where an AI has to speak for a population with real cultural specificity and be believed while doing it. Saudi Arabia is where we proved it.'
                ]
            }
        ],
        // Named vendors are deliberately absent — the draft describes these by capability only.
        stack: [
            'Remote MCP server (OAuth 2.1 + PKCE, dynamic client registration)',
            'Schema-validated persona generation (structured outputs)',
            'Curated Saudi reference corpus (vector + file search)',
            'Whitelisted web search across 34 Saudi data domains',
            'Per-persona knowledge-graph memory',
            'Multimodal stimulus pipeline (image, PDF, video, YouTube)',
            'Background generation jobs with polling + batch',
            'Object storage with short-lived signed URLs',
            'Arabic-first RTL interface, MSA reporting',
            'Subscriptions, billing portal + webhooks',
            'REST API keys + stdio MCP server'
        ]
    },
    {
        slug: 'monks-flow',
        client: 'Monks.Flow',
        logo: { src: '/assets/dot-monks-logo.svg', alt: 'Monks' },
        sector: 'MarTech · Enterprise marketing intelligence',
        // year: '', // fill in the real range; the row is hidden while this is empty.
        // duration: '',
        services: 'Product direction, AI architecture, and the team that built it',
        title:
            'Catching a trend while it is still a trend — millions of social signals, read against what the brand actually needs.',
        excerpt:
            'A continuous sweep of social platforms, joined to a brand’s own numbers, that returns activatable opportunities instead of another dashboard.',
        summary:
            'Monks.Flow is the AI marketing platform our team builds inside Monks. This is the part of it that goes looking for the diamond in the rough: a high-volume pipeline that continuously reads Reddit, X, YouTube and Meta’s platforms, correlates what it finds against a brand’s own reality — quarterly reports, financial position, market data, campaign history, current targets — and hands back specific opportunities an agent can act on, plus the early warning when sentiment turns. Before it existed this was analysts reading threads by hand: slow, partial, and structurally unable to cover millions of data points. It ran inside Monks first, then went to global brands who now run it directly.',
        tags: [
            'Automation workflows',
            'Large-scale data pipelines',
            'Ontology-based knowledge graphs',
            'GraphRAG',
            'Multi-agent flows',
            'Brand safety'
        ],
        cover: '',
        metrics: [
            { value: 'Millions', label: 'Social signals swept continuously, not sampled' },
            { value: 'Near-real-time', label: 'Trend detection, down from weeks of manual research' },
            { value: 'Global brands', label: 'Running it themselves, after rollout inside Monks' }
        ],
        chapters: [
            {
                label: 'The problem',
                title: 'The trend was always findable. Nobody could read fast enough to find it.',
                body: [
                    'Brands operate on quarterly targets and campaign calendars. The conversation about them moves hourly, across platforms none of them own. The gap between those two clocks is where the money is: a trend caught in its first days is a campaign, and the same trend caught in week six is a press release about how you also noticed.',
                    'The way this got done before was manual — strategists reading Reddit threads, scrolling X, watching comment sections, writing up what they saw. That work is genuinely skilled and it still fails in two structural ways. It cannot cover the volume, because the signal that matters is almost never in the first thousand posts someone reads; it is somewhere in the millions they did not. And it has no reliable way to connect what it finds back to whether this particular brand should care. An interesting cultural moment is worth nothing if it points nowhere near this quarter’s targets, this product line, or this market.',
                    'The same blindness is a risk problem, not only a missed-opportunity one. If it takes six weeks to notice a conversation building, it takes six weeks to notice the conversation is angry.'
                ]
            },
            {
                label: 'The approach',
                title: 'Two halves — everything being said, and everything the brand needs. The product is the join.',
                body: [
                    'We built it as one pipeline with two very different inputs. The first is the outside: continuous, high-volume ingest of public conversation across Reddit, X, YouTube and Meta’s platforms. Not keyword alerts on a watchlist — the stream, normalised into something a machine can actually reason over.',
                    'The second is the inside, which is the half most social listening never touches. Quarterly reports, financial position, market and category data, the performance history of previous campaigns, stated goals and live targets. Google’s reasons to care and GM’s reasons to care are not the same reasons and never will be, and a system that cannot tell the difference produces the same generic trend deck for both.',
                    'Everything valuable is in the join. A trend is not an opportunity until it lines up with something a specific brand is actually trying to do — and once it does, it stops being an insight and becomes a brief.'
                ]
            },
            {
                label: 'What we built',
                title: 'The pipeline, and the agents that read it.',
                points: [
                    {
                        title: 'High-volume ingestion, orchestrated as explicit DAGs.',
                        text: 'A connector per platform, each with its own rate limits, schema, pagination and failure behaviour, feeding staged transformation into a common representation. The challenge: sources fail independently and constantly, and a naive scheduler quietly loses a day of coverage without telling anyone. What we did: modelled the whole thing as dependency graphs with per-stage retries, idempotent re-runs and backfill, so one platform going down degrades coverage visibly instead of dropping data silently.'
                    },
                    {
                        title: 'An ontology, so the same thing counts as the same thing.',
                        text: 'Entity resolution against a domain ontology — brands, product lines, model years, competitors, categories, markets, people. The challenge: social text refers to one product in dozens of ways, including misspellings, nicknames and abbreviations, and without resolution a "spike" is just an artefact of whichever spelling you happened to track. What we did: resolved mentions onto ontology entities before any counting happens, so volume and sentiment are measured against a real thing rather than a string.'
                    },
                    {
                        title: 'GraphRAG over the resolved graph.',
                        text: 'The resolved entities and their relationships form a knowledge graph, and retrieval traverses it as well as the embedding space. The challenge: flat vector search returns passages that sound similar, but what mattered was structural — how a conversation connects to a product, to its competitors, to the market it sits in, to what was already run against it last year. What we did: graph traversal plus embeddings, so a question about one model pulls its category, its rivals and its campaign history along with it.'
                    },
                    {
                        title: 'Multi-agent detection, not one big prompt.',
                        text: 'A flow of narrow agents: detect a rising signal, qualify it against the brand’s own data, check it for safety and reputational risk, then draft the activation. The challenge: a single model asked to "find opportunities" reliably produces confident, unfalsifiable strategy language — it always finds something, and none of it can be checked. What we did: split the job into steps that each have something concrete to verify against, and required every surfaced opportunity to arrive carrying both the signal that triggered it and the brand-side reason it qualified.'
                    },
                    {
                        title: 'Brand safety on the same rails as opportunity.',
                        text: 'The same resolved stream that finds a trend worth joining also finds the one worth getting ahead of. The challenge: in most stacks opportunity and risk are separate vendors on separate latencies, so the good news arrives daily and the bad news arrives in a monthly report. What we did: ran both off one pipeline, so a sentiment turn on a resolved product entity surfaces on the same clock as a trend — hours, with the underlying conversation attached.'
                    },
                    {
                        title: 'Output that lands in a workflow, not a dashboard.',
                        text: 'This is the part that decided whether any of it got used. An opportunity arrives as a briefed, activatable item inside Monks.Flow, next to the create-and-scale machinery that can act on it. The challenge: insight products die as a tab nobody opens. What we did: made the output an input to work that was already happening, so acting on it was the path of least resistance rather than an extra meeting.'
                    }
                ]
            },
            {
                label: 'The result',
                title: 'Used inside the agency first, then handed to the brands.',
                body: [
                    'It went to Monks’ own strategy teams before it went anywhere else, which is the fastest possible way to find out whether an "opportunity" is real — the people receiving it pitch for a living and will say so when it is filler. What survived that went to clients directly, including GM and Google, who run it against their own brands.',
                    'The change is a change in clock speed. Research that took weeks, and could only ever cover the fraction one person can read, now runs continuously across millions of signals and surfaces in near-real-time, with the sentiment side of it watching on the same cycle.',
                    'What it does not do is decide. It takes a volume of conversation no team could read and shortens it to a handful of things worth a human’s attention, each one carrying the evidence and the reason it qualified. The judgement stays with the strategist; what changed is that the strategist is now looking at the right handful.'
                ]
            },
            {
                label: 'What it demonstrates',
                title: 'Resolve the entities, then join the outside to the inside.',
                body: [
                    'The transferable part is not social listening. It is three decisions that made a firehose usable: an ontology, so volume becomes countable instead of merely large; a graph, so retrieval understands structure and not just similarity; and a hard join against the organisation’s own numbers, so "interesting" has to prove it is relevant before it reaches a person.',
                    'That shape holds anywhere external signal has to be reconciled with internal priorities — competitor moves against a product roadmap, regulatory chatter against a compliance posture, support volume against an engineering backlog. Enterprise marketing is where we proved it, at the scale where doing it by hand had already stopped working.'
                ]
            }
        ],
        // Named vendors are deliberately absent — described by capability, as with Majles.
        stack: [
            'Multi-source social ingestion (Reddit, X, YouTube, Meta platforms)',
            'DAG-orchestrated pipelines with retries, idempotency and backfill',
            'Entity resolution against a domain ontology',
            'Ontology-backed knowledge graph',
            'GraphRAG retrieval (graph traversal + embeddings)',
            'Multi-agent detection, qualification and drafting flows',
            'Correlation against brand financials, campaign history and targets',
            'Brand-safety classification on the same pipeline',
            'Opportunity scoring and ranking',
            'Delivery into the Monks.Flow activation workflow'
        ]
    }
];

export const COPY = {
    en: {
        meta: {
            title: 'Spaghetti | AI systems for real operations',
            description: 'Spaghetti designs and ships AI workflows, internal tools, and retrieval systems for teams buried in manual operational work.'
        },
        nav: {
            method: 'How we work',
            systems: 'What We Build',
            proof: 'Track record',
            work: 'Case studies',
            fit: 'Talk to us',
            call: 'Book a call'
        },
        hero: {
            title: 'We turn messy workflows into reliable AI systems.',
            annotation:
                'This is the part AI does not fix for you: tangled data, unclear workflows, and rushed builds.',
            primaryCta: 'Book a call',
            secondaryCta: 'What We Build'
        },
        proof: {
            title: 'We have built inside companies like these.'
        },
        audit: {
            flag: 'Free',
            title: 'Three-day AI audit',
            body: 'We find where automation is worth it in your operation, and hand you the report. No cost.',
            cta: 'Book the audit',
            dismiss: 'Dismiss'
        },
        work: {
            title: 'Case studies',
            body: 'A few of the systems we have built, written up in full: what was breaking, how we scoped it, what shipped, and how it behaves once real usage starts.',
            cardCta: 'Read the case study',
            backToWork: 'All case studies',
            nextLabel: 'Next case study',
            sectorLabel: 'Sector',
            yearLabel: 'Year',
            durationLabel: 'Timeline',
            servicesLabel: 'What we did',
            stackLabel: 'What it runs on',
            ctaTitle: 'Have a workflow that looks like one of these?',
            ctaBody: 'The best starting point is a single workflow with real volume and real friction.'
        },
        problem: {
            title: 'The hard part is not generating output. It is making the system usable inside the business.',
            body: 'Most AI efforts fail in the gap between prototype and operations: unclear inputs, poor routing, no review path, weak integrations, and no plan for how the team will actually use the thing.'
        },
        systems: {
            title: 'What We Build',
            body: 'AI that does real work — from automating a process that repeats every week to carrying an entire product. No AI for the sake of AI. We build where the cost, speed, or quality problem is clear.',
            items: [
                {
                    area: 'Automation Workflows',
                    headline: 'Agents that take repetitive work off your team.',
                    text: 'The work that runs the same way every week, handled without anyone retyping it.',
                    media: {
                        src: 'assets/systems/automation-workflows.gif',
                        alt: 'The tools an automation workflow moves between: lead form, CRM record, database, AI agent, Jira, Slack and email.'
                    },
                    tags: ['Sales intake', 'Document generation', 'Onboarding', 'Reporting', 'Follow-ups']
                },
                {
                    area: 'Voice Agents',
                    headline: 'AI phone agents for inbound and outbound calls.',
                    text: 'Not every call — the ones your team should never have had to take manually.',
                    media: {
                        src: 'assets/systems/voice-agents.png',
                        alt: 'A voice agent surrounded by the jobs it handles: lead qualification, customer support, info collection and appointment scheduling.'
                    },
                    tags: [
                        'Inbound support',
                        'Outbound follow-up',
                        'Appointment booking',
                        'Lead qualification',
                        'Call summaries'
                    ]
                },
                {
                    area: 'Data & Knowledge Systems',
                    headline: 'Make your business data usable by AI.',
                    text: 'Your documents, structured and permissioned, so the answer comes back with the clause it came from.',
                    media: {
                        src: 'assets/systems/data-knowledge.gif',
                        // Source has a navy canvas rather than a black one — needs a deeper
                        // edge fade to sit on the page instead of reading as a pasted panel.
                        blend: 'soft',
                        alt: 'A knowledge graph linking entities and topics drawn out of a document corpus.'
                    },
                    tags: [
                        'Secure search',
                        'Document intelligence',
                        'Permission-aware answers',
                        'Regulated workflows',
                        'Client portals'
                    ]
                },
                {
                    area: 'Product Builds',
                    headline: 'Whole products, built and shipped end to end.',
                    text: 'Not a workflow inside an existing company — the product itself, architecture through launch.',
                    media: {
                        src: 'assets/systems/product-builds.gif',
                        alt: 'An agent workflow canvas wiring a chat model, memory and tools into a running product.'
                    },
                    tags: [
                        'Product architecture',
                        'Agentic systems',
                        'Multimodal (vision + voice)',
                        'Durable memory',
                        'Web and mobile'
                    ]
                }
            ]
        },
        method: {
            title: 'How we work',
            body: 'It starts with a free three-day audit. From there we design the workflow, build the system, connect it, and stay through rollout until it behaves under real use.',
            steps: [
                {
                    flag: 'Free',
                    title: 'Three-day AI audit',
                    text: 'Three days finding the repeat work, routing problems, document churn, and human bottlenecks worth automating. You get the written report either way.'
                },
                {
                    title: 'Design the workflow',
                    text: 'Define the inputs, outputs, approvals, failure states, permissions, and system behavior before the build starts.'
                },
                {
                    title: 'Build the system',
                    text: 'Ship the agent workflow, retrieval layer, internal tool, or automation required for the work.'
                },
                {
                    title: 'Connect it',
                    text: 'Wire it into the channels, documents, CRMs, support systems, and business rules already in use.'
                },
                {
                    title: 'Roll it out',
                    text: 'Give the team a clear operating model for how to use it, review it, and step in when needed.'
                },
                {
                    title: 'Keep it stable',
                    text: 'Measure it, tune it, and maintain it once real usage starts exposing the edge cases.'
                }
            ]
        },
        fit: {
            title: 'A good starting point is one workflow with real volume and real friction.',
            body: 'Not an AI brainstorm. Not a slide deck. One workflow that is slow, messy, expensive, or fragile enough to be worth fixing properly.',
            cta: 'Book a call',
            items: [
                'A team is drowning in requests, tickets, documents, approvals, or repeated updates.',
                'A prototype looked good but broke as soon as real business conditions showed up.',
                'Knowledge is spread across systems and the same people keep answering the same questions.',
                'Leadership wants useful AI inside operations, not another isolated experiment.'
            ]
        },
        footer: {
            cta: 'Book a call',
            linkedin: 'LinkedIn'
        },
        ui: {
            openMenu: 'Open navigation',
            closeMenu: 'Close navigation'
        }
    },
    ar: {
        meta: {
            title: 'Spaghetti | أنظمة ذكاء اصطناعي للعمليات الحقيقية',
            description: 'تصمم Spaghetti وتبني أنظمة وسير عمل واسترجاع معرفة بالذكاء الاصطناعي للفرق الغارقة في العمل التشغيلي اليدوي.'
        },
        nav: {
            method: 'كيف نعمل',
            systems: 'ماذا نبني',
            proof: 'سجل أعمالنا',
            work: 'دراسات حالة',
            fit: 'تواصل معنا',
            call: 'احجز مكالمة'
        },
        hero: {
            title: 'نحوّل سير العمل الفوضوي إلى أنظمة ذكاء اصطناعي يمكن الاعتماد عليها.',
            annotation:
                'هذا ما لا يعالجه الذكاء الاصطناعي عنك: بيانات متشابكة، وسير عمل غير واضح، وتنفيذ متسرّع.',
            primaryCta: 'احجز مكالمة',
            secondaryCta: 'ماذا نبني'
        },
        proof: {
            title: 'بنينا داخل شركات مثل هذه.'
        },
        audit: {
            flag: 'مجاني',
            title: 'تدقيق ذكاء اصطناعي في ثلاثة أيام',
            body: 'نحدد أين تستحق الأتمتة داخل عملياتك، ونسلمك التقرير. بلا مقابل.',
            cta: 'احجز التدقيق',
            dismiss: 'إغلاق'
        },
        work: {
            title: 'دراسات حالة',
            body: 'بعض الأنظمة التي بنيناها، مكتوبة بالكامل: ما الذي كان معطلا، وكيف حددنا النطاق، وما الذي تم إطلاقه، وكيف يتصرف النظام عند الاستخدام الحقيقي.',
            cardCta: 'اقرأ دراسة الحالة',
            backToWork: 'كل دراسات الحالة',
            nextLabel: 'دراسة الحالة التالية',
            sectorLabel: 'القطاع',
            yearLabel: 'السنة',
            durationLabel: 'المدة',
            servicesLabel: 'ما الذي قمنا به',
            stackLabel: 'ما الذي يعمل عليه',
            ctaTitle: 'هل لديك سير عمل يشبه أحد هذه؟',
            ctaBody: 'أفضل نقطة بداية هي سير عمل واحد له حجم حقيقي واحتكاك حقيقي.'
        },
        problem: {
            title: 'المشكلة ليست في توليد المخرجات. المشكلة في جعل النظام قابلا للاستخدام داخل الشركة.',
            body: 'تفشل معظم جهود الذكاء الاصطناعي في المسافة بين النموذج التجريبي والعمليات: مدخلات غير واضحة، توجيه ضعيف، غياب مسار مراجعة، تكاملات هشة، ولا خطة واضحة لكيف سيستخدمه الفريق فعلا.'
        },
        systems: {
            title: 'ماذا نبني',
            body: 'ذكاء اصطناعي يؤدي عملا حقيقيا — من أتمتة عملية تتكرر كل أسبوع إلى حمل منتج كامل. لا نبني ذكاء اصطناعيا لمجرد الموضة—نبني حيث تكون مشكلة التكلفة أو السرعة أو الجودة واضحة.',
            items: [
                {
                    area: 'مسارات عمل الأتمتة',
                    headline: 'وكلاء يزيلون عن فريقكم العمل المتكرر.',
                    text: 'العمل الذي يتكرر كل أسبوع بنفس الخطوات، يُنجز دون أن يعيد أحد كتابته.',
                    media: {
                        src: 'assets/systems/automation-workflows.gif',
                        alt: 'الأدوات التي ينتقل بينها سير العمل الآلي: نموذج العميل، وسجل العملاء، وقاعدة البيانات، والوكيل، وجيرا، وسلاك، والبريد.'
                    },
                    tags: ['قبول مبيعات', 'توليد مستندات', 'تهيئة دخول', 'تقارير', 'متابعات']
                },
                {
                    area: 'وكلاء صوتيون',
                    headline: 'وكلاء ذكاء اصطناعي للهاتف—وارد وصادر.',
                    text: 'ليست كل مكالمة — بل المكالمات التي ما كان ينبغي لفريقك أن يتولاها يدويا.',
                    media: {
                        src: 'assets/systems/voice-agents.png',
                        alt: 'وكيل صوتي تحيط به المهام التي يتولاها: تأهيل العملاء، والدعم، وجمع المعلومات، وحجز المواعيد.'
                    },
                    tags: [
                        'دعم وارد',
                        'متابعات صادرة',
                        'حجز مواعيد',
                        'تأهيل عملاء محتملين',
                        'ملخصات مكالمات'
                    ]
                },
                {
                    area: 'أنظمة بيانات ومعرفة',
                    headline: 'اجعلوا بيانات الشركة صالحة لاستخدام ذكاء اصطناعي مفيد.',
                    text: 'مستنداتكم، مهيكلة ومضبوطة الصلاحيات، فتعود الإجابة ومعها النص الذي جاءت منه.',
                    media: {
                        src: 'assets/systems/data-knowledge.gif',
                        // Source has a navy canvas rather than a black one — needs a deeper
                        // edge fade to sit on the page instead of reading as a pasted panel.
                        blend: 'soft',
                        alt: 'رسم بياني معرفي يربط الكيانات والمواضيع المستخرجة من مجموعة المستندات.'
                    },
                    tags: [
                        'بحث آمن',
                        'ذكاء في المستندات',
                        'إجابات مع مراعاة الصلاحيات',
                        'سير عمل تنظيمي',
                        'بوابات عملاء'
                    ]
                },
                {
                    area: 'بناء المنتجات',
                    headline: 'منتجات كاملة، نبنيها ونطلقها من البداية للنهاية.',
                    text: 'ليس سير عمل داخل شركة قائمة — بل المنتج نفسه، من البنية حتى الإطلاق.',
                    media: {
                        src: 'assets/systems/product-builds.gif',
                        alt: 'لوحة سير عمل توصل نموذج المحادثة والذاكرة والأدوات داخل منتج يعمل.'
                    },
                    tags: [
                        'بنية المنتج',
                        'أنظمة وكلاء',
                        'وسائط متعددة (رؤية وصوت)',
                        'ذاكرة دائمة',
                        'ويب وموبايل'
                    ]
                }
            ]
        },
        method: {
            title: 'كيف نعمل',
            body: 'تبدأ الرحلة بتدقيق مجاني خلال ثلاثة أيام. بعدها نصمم سير العمل، ونحدد قواعد التشغيل، ونبني النظام، ونربطه، ونبقى حتى يعمل تحت الاستخدام الحقيقي.',
            steps: [
                {
                    flag: 'مجاني',
                    title: 'تدقيق ذكاء اصطناعي في ثلاثة أيام',
                    text: 'ثلاثة أيام نبحث فيها عن العمل المتكرر ومشاكل التوجيه وفوضى المستندات والعوائق البشرية التي تستحق الأتمتة. وتحصل على التقرير مكتوبا في كل الأحوال.'
                },
                {
                    title: 'نصمم سير العمل',
                    text: 'نحدد المدخلات والمخرجات والموافقات وحالات الفشل والصلاحيات وسلوك النظام قبل أن يبدأ البناء.'
                },
                {
                    title: 'نبني النظام',
                    text: 'نطلق سير عمل الوكلاء أو طبقة الاسترجاع أو الأداة الداخلية أو الأتمتة المطلوبة للمهمة.'
                },
                {
                    title: 'نربطه بالواقع',
                    text: 'نوصله بالقنوات والمستندات وأنظمة العملاء وأنظمة الدعم وقواعد العمل الموجودة فعلا.'
                },
                {
                    title: 'نطلقه داخل الفريق',
                    text: 'نعطي الفريق طريقة تشغيل واضحة لكيفية استخدامه ومراجعته والتدخل عند الحاجة.'
                },
                {
                    title: 'نحافظ على ثباته',
                    text: 'نقيسه ونضبطه ونصونه عندما تبدأ الحالات الحقيقية بكشف التفاصيل الصعبة.'
                }
            ]
        },
        fit: {
            title: 'أفضل نقطة بداية هي سير عمل واحد له حجم حقيقي واحتكاك حقيقي.',
            body: 'ليست جلسة أفكار عن الذكاء الاصطناعي، وليست عرض شرائح. بل سير عمل واحد بطيء أو فوضوي أو مكلف أو هش ويستحق أن يعالج بشكل صحيح.',
            cta: 'احجز مكالمة',
            items: [
                'فريق يغرق في الطلبات أو التذاكر أو المستندات أو الموافقات أو التحديثات المتكررة.',
                'نموذج أولي بدا جيدا ثم انهار عندما ظهرت ظروف العمل الحقيقية.',
                'المعرفة موزعة بين أنظمة مختلفة والأشخاص أنفسهم يجيبون عن الأسئلة نفسها طوال الوقت.',
                'القيادة تريد ذكاء اصطناعيا مفيدا داخل العمليات، لا تجربة معزولة أخرى.'
            ]
        },
        footer: {
            cta: 'احجز مكالمة',
            linkedin: 'لينكد إن'
        },
        ui: {
            openMenu: 'افتح القائمة',
            closeMenu: 'أغلق القائمة'
        }
    }
};

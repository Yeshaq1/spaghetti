// The careers application: every question, in order. careers.js renders whatever is here,
// so adding, reordering or rewording a question is an edit to this file only.
//
// Step types
//   fields    one or more short inputs on one screen
//   single    pick one; options get A/B/C keyboard shortcuts
//   segments  several small single-choice rows on one screen
//   multi     chips; `max` caps the selection, `groups` splits chips under labels
//   long      a textarea with optional writing prompts and a `min` character count
//   links     profile links plus an optional CV (PDF)
//   finish    optional source question plus the consent checkbox
//
// `key` is the field name sent to /api/careers/apply and stored on the profile, and the
// admin directory (src/js/bench-admin.js) reads those same keys, so rename with care.

export const SKILLS = [
    'RAG & retrieval',
    'Agents & tool use',
    'Evals & quality',
    'Fine-tuning & post-training',
    'Voice agents',
    'Document AI & OCR',
    'Workflow automation',
    'MCP & integrations',
    'Data pipelines',
    'LLMOps & observability',
    'Guardrails & safety',
    'Multimodal & vision',
    'Classical ML & forecasting',
    'AI product front-ends',
    'Search & ranking',
    'Inference & cost tuning'
];

export const DOMAINS = [
    'Legal',
    'Banking & fintech',
    'Insurance',
    'Healthcare',
    'Pharma & life sciences',
    'Retail & CPG',
    'Marketing & media',
    'Logistics & supply chain',
    'Manufacturing & automotive',
    'Energy & utilities',
    'Real estate & construction',
    'Government & public sector',
    'Telecoms',
    'Education',
    'HR & recruiting',
    'Consumer apps'
];

export const NO_DOMAIN = 'No deep domain yet';

export const STACK_GROUPS = [
    { label: 'Languages', items: ['Python', 'TypeScript', 'Go', 'Rust', 'Java / Kotlin', 'C#'] },
    { label: 'Models', items: ['OpenAI', 'Anthropic', 'Gemini', 'Open-weight (Llama, Qwen, Mistral)', 'Speech (Whisper, ElevenLabs)'] },
    { label: 'Frameworks', items: ['LangGraph', 'LlamaIndex', 'Agents SDKs', 'DSPy', 'Vercel AI SDK', 'n8n / Make', 'PyTorch', 'Hugging Face'] },
    { label: 'Data & retrieval', items: ['Postgres + pgvector', 'Pinecone', 'Weaviate / Qdrant', 'Elasticsearch / OpenSearch', 'BigQuery / Snowflake'] },
    { label: 'Cloud & ops', items: ['AWS', 'Google Cloud', 'Azure', 'Vertex AI', 'Bedrock', 'Docker / Kubernetes', 'Langfuse / LangSmith'] }
];

export const LANGUAGES = ['English', 'Arabic', 'French', 'German', 'Spanish', 'Greek', 'Italian', 'Portuguese', 'Dutch', 'Turkish', 'Hindi / Urdu'];

const guessTimezone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch {
        return '';
    }
};

export const STEPS = [
    {
        id: 'who',
        type: 'fields',
        title: 'First, who are we talking to?',
        hint: 'We reply to every application from a real inbox, so use the one you read.',
        fields: [
            { key: 'fullName', label: 'Full name', placeholder: 'Ada Lovelace', autocomplete: 'name', required: true, max: 120 },
            { key: 'email', label: 'Email', placeholder: 'you@domain.com', type: 'email', autocomplete: 'email', required: true, max: 200 }
        ]
    },
    {
        id: 'where',
        type: 'fields',
        title: 'Where do you work from?',
        hint: 'Our clients are in the US, Europe and the Gulf. Overlapping hours matter more than your postcode.',
        fields: [
            { key: 'location', label: 'City and country', placeholder: 'Lisbon, Portugal', autocomplete: 'address-level2', required: true, max: 120 },
            { key: 'timezone', label: 'Timezone', placeholder: 'Europe/Lisbon', required: true, max: 64, defaultValue: guessTimezone }
        ]
    },
    {
        id: 'role',
        type: 'single',
        key: 'role',
        title: 'Which of these sounds most like you?',
        hint: 'Pick the closest one. Your skills come next.',
        options: [
            { value: 'applied-ai', label: 'Applied AI / LLM engineer', note: 'I put models into products and workflows' },
            { value: 'ml', label: 'Machine learning engineer', note: 'I train, tune and serve models' },
            { value: 'fullstack-ai', label: 'Full-stack engineer who ships AI', note: 'Product end to end, with AI at the core' },
            { value: 'data', label: 'Data engineer', note: 'Pipelines, warehouses, getting data AI-ready' },
            { value: 'platform', label: 'AI platform / MLOps engineer', note: 'Infra, evals, observability, cost' },
            { value: 'research', label: 'Research engineer', note: 'Papers to working code' },
            { value: 'architect', label: 'Solutions architect / tech lead', note: 'I design systems and lead the team that builds them' }
        ]
    },
    {
        id: 'experience',
        type: 'segments',
        title: 'How long have you been at it?',
        hint: 'Honest numbers. A sharp two years beats a sleepy ten.',
        rows: [
            { key: 'yearsSoftware', label: 'Building software professionally', options: ['1–3 yrs', '4–6 yrs', '7–10 yrs', '10+ yrs'] },
            { key: 'yearsAi', label: 'Shipping ML or LLM systems to production', options: ['< 1 yr', '1–2 yrs', '3–4 yrs', '5+ yrs'] }
        ]
    },
    {
        id: 'skills',
        type: 'multi',
        key: 'skills',
        title: 'Where are you strongest?',
        hint: 'Up to six. Pick what you’d be confident being paid for tomorrow, not what you’ve read about.',
        options: SKILLS,
        min: 1,
        max: 6
    },
    {
        id: 'domains',
        type: 'multi',
        key: 'domains',
        title: 'Which industries do you know from the inside?',
        hint: 'This is how we match you to work. Up to three where you could sit with the client’s operators and speak their language.',
        options: [...DOMAINS, NO_DOMAIN],
        exclusive: NO_DOMAIN,
        min: 1,
        max: 3,
        followUp: {
            key: 'domainNote',
            label: 'Where does that knowledge come from?',
            placeholder: 'Four years building claims tooling at a mid-size insurer, so I know what adjusters actually do all day.',
            max: 600
        }
    },
    {
        id: 'stack',
        type: 'multi',
        key: 'stack',
        title: 'What do you reach for?',
        hint: 'Tap everything you’ve used in production. Nothing here is a requirement.',
        groups: STACK_GROUPS,
        min: 1,
        followUp: { key: 'stackOther', label: 'Anything else worth knowing?', placeholder: 'Temporal, Modal, vLLM…', max: 300 }
    },
    {
        id: 'proof',
        type: 'long',
        key: 'hardestSystem',
        title: 'Tell us about the hardest AI system you’ve put in front of real users.',
        hint: 'This is the answer we read most closely. Be specific: numbers, failure modes, trade-offs.',
        prompts: ['What did it do, and who depended on it?', 'What broke once real usage started?', 'How did you know it was working?'],
        placeholder: 'It was a…',
        min: 280,
        max: 5000,
        link: { key: 'hardestLink', label: 'Link to it, a write-up or the repo (optional)', placeholder: 'https://' }
    },
    {
        id: 'opinion',
        type: 'long',
        key: 'opinion',
        title: 'What do you believe about building with LLMs that most engineers would disagree with?',
        hint: 'Optional, and there’s no right answer. We like working with engineers who have opinions.',
        placeholder: 'Most agent frameworks…',
        optional: true,
        max: 1500
    },
    {
        id: 'links',
        type: 'links',
        title: 'Where can we see your work?',
        hint: 'LinkedIn or GitHub is required. A CV is optional but saves us asking for it later.',
        fields: [
            { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/…' },
            { key: 'github', label: 'GitHub', placeholder: 'github.com/…' },
            { key: 'website', label: 'Website, portfolio or Hugging Face', placeholder: 'https://' }
        ],
        requireOneOf: ['linkedin', 'github'],
        file: { key: 'cv', label: 'CV (PDF, up to 5 MB)', maxBytes: 5 * 1024 * 1024 }
    },
    {
        id: 'availability',
        type: 'segments',
        title: 'How would you like to work?',
        hint: 'This helps us bring you the right projects. You can change it whenever life does.',
        rows: [
            { key: 'hours', label: 'Hours per week', options: ['Under 10', '10–20', '20–30', '30–40'] },
            { key: 'start', label: 'Earliest start', options: ['Now', 'Within 2 weeks', 'Within a month', 'Later'] },
            { key: 'shape', label: 'Engagements you prefer', options: ['2–4 week sprints', 'Multi-month builds', 'Either'] }
        ],
        multi: { key: 'languages', label: 'Languages you can work in with a client', options: LANGUAGES }
    },
    {
        id: 'terms',
        type: 'terms',
        title: 'Let’s talk terms.',
        hint: 'Projects are contract-based, so you keep your independence. Your rate stays between you and us and is never shared with clients.',
        rate: { key: 'rate', currencyKey: 'rateCurrency', unitKey: 'rateUnit', currencies: ['USD', 'EUR', 'GBP', 'AED'], units: ['per hour', 'per day'] },
        entity: {
            key: 'entity',
            label: 'How do you invoice?',
            options: ['Through my own company', 'As an individual freelancer', 'I’d need help setting this up']
        }
    },
    {
        id: 'finish',
        type: 'finish',
        title: 'Last thing.',
        hint: 'Then you can check everything once before it’s sent.',
        source: {
            key: 'source',
            label: 'How did you hear about Spaghetti? (optional)',
            options: ['LinkedIn', 'A friend or colleague', 'The Gist', 'A client', 'Search', 'Other']
        },
        consent: {
            key: 'consent',
            label: 'Spaghetti can keep my profile on file and contact me about contract work that fits. I can ask for it to be deleted at any time by emailing info@spgti.com.'
        }
    }
];

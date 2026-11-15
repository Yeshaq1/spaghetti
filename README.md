# Spaghetti Consulting Site

A cinematic bilingual homepage for Spaghetti, built with vanilla JavaScript, Express, and Three.js.

## What is included

- Full-bleed Three.js background with restrained black, white, and charcoal styling
- English and Arabic copy from a single content layer in `src/js/content.js`
- RTL layout support and persisted language preference
- Editorial homepage sections for positioning, method, systems, proof, and fit
- Responsive layout for desktop and mobile

## Run locally

```bash
npm start
```

Open `http://localhost:8002`.

## Content updates

Most page copy lives in `src/js/content.js`.

- Update `COPY.en` and `COPY.ar` together when changing visible text.
- Keep client logos in `CLIENT_LOGOS`.
- The calendar URL is defined once as `CALENDAR_URL`.

## Case studies

Case studies live in `CASE_STUDIES` in `src/js/content.js`. Adding an entry is the only
step: it renders a card in the homepage `#work` section and a page at `/work/<slug>`.

- `slug`, `client`, `title`, `summary` and `chapters` are required; everything else
  (`sector`, `year`, `duration`, `cover`, `metrics`, `tags`, `stack`, `quote`) is optional
  and its block is hidden when absent.
- `chapters` drive the scroll narrative. Each is `{ label, title, body: [paragraphs] }`
  with an optional `image: { src, alt, caption }`.
- Surrounding labels ("Next case study", "What it runs on") live under `COPY.<lang>.work`.
- The page template is `case-study.html`, rendered by `src/js/case-study.js` and styled by
  `css/pages/case-study.css`.

### The spaghetti rope

One rope powers both the homepage hero and the case study pages, so they are visibly the
same spaghetti untangling in both places.

- `src/js/three/SpaghettiRope.js` is the rope itself: strands knotted at progress 0,
  straight at progress 1, resolving on a stagger so they untangle one after another. It
  builds into a `THREE.Group` the caller adds to any scene.
- `src/js/three/PastaSurface.js` generates the procedural pasta albedo/normal/roughness
  maps once and shares them across every strand on the site.
- `src/js/three/SpaghettiRail.js` is the case study harness: its own canvas, renderer and
  lights, rope parked in the page margin, progress driven by document scroll.
- `src/js/three/Effects.js` is the homepage harness: the same rope inside the existing hero
  scene, leaning `HERO_TILT_DEGREES` while knotted so the handwritten annotation has a mess
  to point at, righting itself to vertical as the reader scrolls into the intro headline.

Placement is per breakpoint in each harness. On the homepage, `getLayoutTier()` holds the
knotted and resolved positions; below 720px there is no margin beside the intro copy, so
the rope finishes straightening early (`resolveBy`) and fades out (`fadeFrom`/`fadeTo`)
instead of parking over the text. The homepage canvas still hides entirely once `#intro`
scrolls away, which is handled in `src/js/main.js`.

The case study rail only runs at 1200px and up. `RAIL_MIN_WIDTH` in `src/js/case-study.js`
must stay in step with the `.has-rail` gutter and the `max-width: 1199px` rule in
`css/pages/case-study.css`. Its render loop pauses when the tab is hidden, and idle sway is
dropped under `prefers-reduced-motion`.

## Careers: the bench

`/careers` is the bench landing page plus a full-screen application (one question per
screen, keyboard-driven, drafts saved in the browser). Applications post to
`/api/careers/apply` and land in a private directory at `/careers/bench`.

- Questions live in `src/js/bench-questions.js`. Reword, reorder or add steps there; the
  flow (`src/js/careers.js`) renders whatever it finds. If you add a field, also add it to
  `SCHEMA` in `lib/bench.js` or the server will drop it.
- Storage lives in `lib/bench-store.js`. In production, applications, statuses and notes go
  to **Postgres** (one `careers_applications` table, created automatically) and CVs go to an
  **S3-compatible bucket** under `careers/cv/<id>.pdf`. With neither configured, local dev
  falls back to files in `.data/bench/` (git-ignored). Nothing is kept in app memory.
- Spam: hidden honeypot field, a 45-second minimum fill time, and 5 submissions per IP per hour.

| Env var | Purpose |
| --- | --- |
| `BENCH_ADMIN_PASSWORD` | Required for `/careers/bench` (HTTP basic auth, any username). Unset = page returns 404. |
| `DATABASE_URL` | Postgres connection string. On Railway, reference the Postgres service's `DATABASE_URL`. |
| `S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | The bucket for CVs (Railway Buckets, R2, S3, GCS). `S3_REGION` defaults to `auto`; set `S3_FORCE_PATH_STYLE=true` only if your provider needs it. |
| `RESEND_API_KEY`, `BENCH_NOTIFY_TO` | Optional. Emails you each new application and sends the applicant a confirmation. |
| `BENCH_NOTIFY_FROM` | Optional sender, default `Spaghetti <bench@spgti.com>` (domain must be verified in Resend). |
| `BENCH_WEBHOOK_URL` | Optional Slack-compatible webhook for new-application pings. |

## Deployment

The app serves static files from Express and falls back to `index.html` for all routes.

Set `PORT` if the host provides a custom port. No build step is required.

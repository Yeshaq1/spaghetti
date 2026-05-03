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

## Deployment

The app serves static files from Express and falls back to `index.html` for all routes.

Set `PORT` if the host provides a custom port. No build step is required.

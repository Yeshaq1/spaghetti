# Deployment Guide

## Railway or any Node host

1. Install dependencies with `npm install`.
2. Set the start command to `npm start`.
3. Expose the host-provided `PORT` environment variable.

## Static hosts

The site is mostly static, but `npm start` is the recommended path because the Express fallback serves `index.html` for direct route loads.

## Before deploying

- Test `http://localhost:8002` locally.
- Verify the English and Arabic language toggle.
- Check the calendar booking link.
- Confirm the browser console has no missing asset errors.

# Brown-Kopel Study Room Reservations Prototype

Mobile-first clickable prototype for a refreshed Auburn Engineering Brown-Kopel study room reservation experience.

## What This Demonstrates

- Fast room discovery for students on phones
- Brown-Kopel room cards with capacity, floor, status, and quick time slots
- Mock reservation confirmation and upcoming reservations
- Special event request form with validation
- Communication and default-site preferences
- Multi-site switcher for the broader Engineering reservations platform

## Local Development

```bash
npm install
npm run dev
```

Then open `http://127.0.0.1:5173`.

## Build

```bash
npm run build
```

## GitHub Pages

The site is configured to publish at:

https://fernando-ace.github.io/Study-Room-Reservations/

Pushing to `main` runs `.github/workflows/deploy-pages.yml`, builds the Vite app, and deploys the `dist` folder through GitHub Pages. In the repository settings, set Pages to use **GitHub Actions** as the source.

This prototype uses local mock data only. It does not connect to AUthenticate, production APIs, or real reservation services.

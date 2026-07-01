# Aura Twin

AI-based digital twin for wind turbine condition monitoring, autonomous control, and report generation.

## Run locally

**Prerequisites:** Node.js

1. Install dependencies with `npm install`.
2. Set `GEMINI_API_KEY` in [.env.local](.env.local) or your shell.
3. Start the app with `npm run dev`.

The app runs on `http://localhost:3000`.

## Screenshot pages

Use these routes in the browser for clean, separate screenshots:

| Page | URL | Best use |
| --- | --- | --- |
| Overview | `http://localhost:3000/overview` | Landing page and high-level system view |
| 3D turbine | `http://localhost:3000/turbine` | Full scene capture |
| Metrics | `http://localhost:3000/metrics` | Dashboard cards and trend chart |
| Controls | `http://localhost:3000/controls` | Sliders, mode switch, and brake control |
| AI | `http://localhost:3000/ai` | Health score, analysis, and recommendation |
| Reports | `http://localhost:3000/reports` | Session statistics, alerts, and AI summary |

If you open the root URL, it will land on the overview page.

## Build

1. Run `npm run build`.
2. Preview the production build with `npm run start` after the build completes.

## Notes

- The backend reads `GEMINI_API_KEY` for the Gemini integration.
- Runtime telemetry is written to `.runtime/` so the dev server stays stable.

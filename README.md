# ⚡ Factory Energy Monitoring (Prototype)

ระบบเฝ้าระวังการใช้พลังงานไฟฟ้าในโรงงาน — a single-page dashboard prototype for monitoring factory electricity usage by zone.

![status](https://img.shields.io/badge/status-prototype-orange)

## Features

- **Summary cards** — total energy usage today, critical alert count (highlighted red when > 0), and number of monitored zones
- **Hourly trend chart** — 24-hour total usage line with a dashed total-threshold line (Chart.js)
- **Zone status table** — per-zone current usage, threshold, % of threshold, and a status badge:
  - ● **Normal** — below 80% of threshold
  - ▲ **Warning** — at or above 80% of threshold
  - ✖ **Critical** — over threshold

Status badges use icon + text (not color alone) for accessibility.

## Tech Stack

| Layer | Tool | Loaded via |
|---|---|---|
| Styling | [Tailwind CSS 4](https://tailwindcss.com) + [daisyUI 5](https://daisyui.com) (dark theme) | CDN |
| Charts | [Chart.js 4](https://www.chartjs.org) | CDN |
| Logic | Vanilla JavaScript | [app.js](app.js) |

No build step, no dependencies to install.

## Running

Open [index.html](index.html) directly in a browser, or serve the folder:

```sh
python -m http.server 8000
# then open http://localhost:8000
```

## Data

All data is mock data defined in [app.js](app.js) (`zones` array) — there is no backend or database connection. Zone status is computed from `currentUsage` vs `maxThreshold`, not hardcoded.

## Notes

- The Tailwind browser CDN is for prototyping only; switch to a proper Tailwind build for production.

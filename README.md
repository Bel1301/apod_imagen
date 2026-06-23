# Horizon <img src="logo.png" alt="Horizon preview" width="200">


**Newsletter** — A web app that centralizes data obtained from the NASA API, offering new features such as a manual search by date and topic of interest.

Horizon transforms NASA's raw APOD API into a polished, bilingual, installable web app — built from scratch as a personal project to explore frontend design, security best practices, and serverless architecture.
The application aims to facilitate the exploration of astronomical data for any user, sparking curiosity in the field.

🔗 **Live app:** [apod-imagen.vercel.app](https://horizon.vercel.app)

---

## Features

- **Data & Image** Full NASA APOD metadata (title, explanation, credit, date)
- **Smart search** — Search by topic of interest (galaxy, moon, mars) for images from the last 30 days
- **Bilingual** — Complete translation of the information in Spanish or English
- **Installable PWA** — Add to home screen on Android & iOS, works offline via Service Worker

---

## 🛠️ Tech stack

| Category | Technology | Purpose |
|---|---|---|
| Frontend | HTML + CSS + JavaScript (vanilla) | Everything in `index.html`, no framework, no build step |
| Typography | Google Fonts — Space Grotesk | Horizon wordmark |
| Graphics | Canvas API | Procedural starfield background |
| Animation | CSS keyframes + parallax (mouse events) | Splash screen, interactive Earth |
| Backend | Vercel Serverless Functions (Node.js 24, ES Modules) | `api/apod.js`, `api/gallery.js` |
| Data source | [NASA APOD API](https://api.nasa.gov/) | Daily image + date-range search |
| PWA | `manifest.json` + Service Worker | Installable, offline-first cache |
| Performance | Client-side cache (`localStorage`, stale-while-revalidate) | Instant render, no waiting on the API |
| Hosting / CI | Vercel + GitHub | Auto-deploy on every push |

---

## 🔒 Security (OWASP)

| Measure | Implementation |
|---|---|
| Content-Security-Policy | Restricts scripts, styles, and `connect-src` to NASA / Translate / flagcdn / fonts only |
| XSS prevention | `textContent` for NASA data + dedicated `esc()` helper in the search gallery |
| API key protection | `NASA_API_KEY` stays server-side only, never exposed to the client |
| Security headers | HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, Referrer-Policy, Permissions-Policy |
| Input validation | Date validated via regex, search query capped at 100 chars, `limit` parameter clamped |
| No SSRF / injection | Fixed base URL to `api.nasa.gov`; search filtering happens locally |
| Information disclosure | API errors never leak `e.message`; generic client errors + server-side logging |
| Safe external links | `rel="noopener noreferrer"` on all `target="_blank"` links |
| HTTP method | `GET` only; all other methods return `405` |

---

## 📁 Project structure

```
apod_imagen/
├── api/
│   ├── apod.js        # GET /api/apod — daily image (with date param + fallback)
│   └── gallery.js      # GET /api/gallery — search across the last N days
├── index.html          # Entire frontend: markup, styles, JS
├── manifest.json        # PWA manifest
├── sw.js                # Service Worker (network-first, no API caching)
├── icon-192.png / icon-512.png
├── package.json         # Node 24 engine spec
└── vercel.json          # Rewrites + security headers
```

---

## 🌐 API endpoints

### `GET /api/apod`
Returns today's (or a specific date's) Astronomy Picture of the Day.

| Param | Type | Description |
|---|---|---|
| `date` | `YYYY-MM-DD` (optional) | Specific date. Defaults to today, with automatic fallback to yesterday if NASA hasn't published yet. |

### `GET /api/gallery`
Searches APOD entries from the last 30 days by keyword.

| Param | Type | Description |
|---|---|---|
| `q` | string (optional) | Search term (matched against title + explanation) |
| `limit` | number (optional, max 40) | Max results to return |

---
## Backend serverless (/api/)

| File | Function |
|---|---|
| api/apod.js | Image of the day — calls NASA APOD, parses JSON, returns normalized data with fallback to yesterday if today fails |
| api/gallery.js | Search engine — query NASA APOD by date range and filter by keyword; use start_date/end_date (no count, which exceeds the timeout) |
| api/home.js | Health/home auxiliary endpoint |
| api/vercel.json | Config for internal paths of the /api/ folder |

## Fonts

- [NASA APOD API](https://api.nasa.gov/) for the daily astronomy content
- [Solar System Scope](https://www.solarsystemscope.com/textures/) for Earth textures (CC BY 4.0)
This project uses the public NASA APOD API. Astronomical images and content belong to their respective authors.
---

## 📬 Contact

**María Belén Peña**
[LinkedIn](https://www.linkedin.com/in/mar%C3%ADa-bel%C3%A9n-pe%C3%B1a/)

---

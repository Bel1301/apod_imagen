# Horizon
<img src="logo.png" alt="Horizon preview" width="800">

**Daily views of the cosmos** — A reimagined interface for NASA's Astronomy Picture of the Day (APOD) API.

Horizon transforms NASA's raw APOD API into a polished, bilingual, installable web app — built from scratch as a personal project to explore frontend design, security best practices, and serverless architecture.

🔗 **Live app:** [apod-imagen.vercel.app](https://apod-imagen.vercel.app)

---

## Features

- **Daily astronomy picture** with full NASA APOD metadata (title, explanation, credit, date)
- **Smart search** — search in Spanish ("luna", "marte", "nebulosa") and the app maps it to the right English term for the API
- **Bilingual** — full ES/EN toggle with on-the-fly translation
- **Installable PWA** — add to home screen on Android & iOS, works offline via Service Worker


---

## Preview



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
| Translation | Google Translate (unofficial) | ES translation of titles/descriptions |
| PWA | `manifest.json` + Service Worker | Installable, offline-first cache |
| Performance | Client-side cache (`localStorage`, stale-while-revalidate) | Instant render, no waiting on the API |
| Hosting / CI | Vercel + GitHub | Auto-deploy on every push |

---

## 🔒 Security (OWASP-aligned)

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

## 🙏 Acknowledgments

- [NASA APOD API](https://api.nasa.gov/) for the daily astronomy content
- [Solar System Scope](https://www.solarsystemscope.com/textures/) for Earth textures (CC BY 4.0)
- Built as a personal learning project to explore secure, framework-free frontend architecture

---

## 📬 Contact

**María Belén Peña**
[LinkedIn](https://www.linkedin.com/in/mar%C3%ADa-bel%C3%A9n-pe%C3%B1a/)

---

## 📄 License

This project uses the public NASA APOD API. Astronomical images and content belong to their respective authors. Code in this repository is shared for educational and portfolio purposes.

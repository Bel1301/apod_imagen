export default function handler(req, res) {
  // Anti-cache fuerte (browser + CDN)
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Vercel-CDN-Cache-Control", "no-store");

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>APOD • V2 BEIGE</title>
  <style>
    :root{
      --bg:#f6f1e7; --bg2:#efe7d8; --text:#2b2b2b; --muted:#6b6b6b; --accent:#8b6b3d; --border:rgba(0,0,0,.12);
      --card:rgba(255,255,255,.55); --card2:rgba(255,255,255,.35);
    }
    body{ margin:0; background:radial-gradient(1200px 600px at 20% 0%, var(--bg2) 0%, var(--bg) 60%); color:var(--text);
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; }
    .wrap{ max-width: 980px; margin: 0 auto; padding: 28px 18px 60px; }
    .badgeV2{ position:fixed; top:12px; right:12px; z-index:9999; background:#b91c1c; color:#fff; padding:8px 10px; border-radius:10px; font-size:12px; }
    .card{ background: linear-gradient(180deg, var(--card), var(--card2)); border:1px solid var(--border); border-radius:18px; overflow:hidden;
      box-shadow: 0 20px 50px rgba(0,0,0,.18); }
    .hero{ padding: 22px 22px 0; }
    h1{ margin: 10px 0 8px; font-size: clamp(26px, 4vw, 42px); line-height:1.05; }
    .content{ display:grid; grid-template-columns: 1.4fr .9fr; gap: 18px; padding: 18px 22px 22px; }
    @media (max-width: 900px){ .content{ grid-template-columns: 1fr; } }
    .figure{ border:1px solid var(--border); border-radius: 14px; overflow:hidden; background: rgba(255,255,255,.40); min-height:320px;
      display:flex; align-items:center; justify-content:center; }
    .figure img{ width:100%; height:auto; display:block; }
    .figure iframe{ width:100%; aspect-ratio:16/9; border:0; display:block; }
    .copy{ border:1px solid var(--border); border-radius:14px; padding:16px; background: rgba(255,255,255,.45); }
    .copy p{ margin:0; line-height:1.55; font-size:15px; white-space: pre-wrap; }
    .muted{ color:var(--muted); font-size:12px; }
    .row{ display:flex; gap:8px; align-items:center; justify-content:flex-end; padding: 0 22px 16px; }
    .flagBtn{ width:38px; height:38px; border-radius:999px; border:1px solid var(--border); background: rgba(255,255,255,.55);
      cursor:pointer; font-size:18px; display:flex; align-items:center; justify-content:center; }
    .flagBtn.active{ outline:2px solid rgba(139,107,61,.35); border-color: rgba(139,107,61,.55); }
    .dateInput{ padding:6px 10px; border-radius:999px; border:1px solid rgba(0,0,0,.18); background:rgba(255,255,255,.75); }
    .dateBtn{ padding:6px 12px; border-radius:999px; border:1px solid rgba(139,107,61,.55); background:rgba(139,107,61,.12); cursor:pointer; }
    .err{ color:#9b2c2c; font-size:12px; padding: 0 22px 10px; }
  </style>
</head>
<body>
  <div class="badgeV2">V2 BEIGE OK</div>

  <div class="wrap">
    <div class="card">
      <div class="hero">
        <div class="muted">NASA Daily • APOD</div>
        <h1 id="title">Cargando…</h1>
        <div class="muted"><span id="dateText">—</span> · <a id="nasaLink" href="#" target="_blank" rel="noopener">Abrir en NASA</a></div>
      </div>

      <div class="row">
        <button id="btnES" class="flagBtn" title="Español" onclick="setLang('es')">🇦🇷</button>
        <button id="btnEN" class="flagBtn" title="English" onclick="setLang('en')">🇺🇸</button>
        <input id="d" class="dateInput" type="date">
        <button class="dateBtn" onclick="go()">Ver</button>
      </div>

      <div id="err" class="err"></div>

      <div class="content">
        <div class="figure" id="mediaBox"></div>
        <div class="copy">
          <p id="explanation"></p>
        </div>
      </div>
    </div>
  </div>

  <script>
    let LANG = localStorage.getItem('lang') || 'en';
    const tCache = new Map();
    let ORIGINAL = null;

    function setLang(l){
      LANG = l;
      localStorage.setItem('lang', l);
      syncLangUI();
      renderText();
    }

    function syncLangUI(){
      document.getElementById('btnES').classList.toggle('active', LANG === 'es');
      document.getElementById('btnEN').classList.toggle('active', LANG === 'en');
    }

    function go(){
      const d = document.getElementById('d').value;
      const u = new URL(window.location.href);
      if (d) u.searchParams.set('date', d);
      else u.searchParams.delete('date');
      u.searchParams.set('t', Date.now().toString());
      window.location.href = u.toString();
    }

    function getDateFromUrl(){
      const u = new URL(window.location.href);
      return u.searchParams.get('date') || '';
    }

    async function translateEnToEs(text){
      const key = 'en->es|' + text;
      if (tCache.has(key)) return tCache.get(key);
      const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=' + encodeURIComponent(text);
      const r = await fetch(url);
      const data = await r.json();
      const out = (data?.[0] || []).map(x => x[0]).join('') || text;
      tCache.set(key, out);
      return out;
    }

    function renderMedia(){
      const mediaBox = document.getElementById('mediaBox');
      mediaBox.innerHTML = '';
      if (!ORIGINAL) return;

      if (ORIGINAL.media_type === 'video'){
        const iframe = document.createElement('iframe');
        iframe.src = ORIGINAL.url;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        mediaBox.appendChild(iframe);
      } else {
        const img = document.createElement('img');
        img.src = ORIGINAL.url;
        img.alt = ORIGINAL.title || '';
        mediaBox.appendChild(img);
      }
    }

    async function renderText(){
      if (!ORIGINAL) return;

      document.getElementById('dateText').textContent = ORIGINAL.date || '—';
      const link = ORIGINAL.url || '#';
      document.getElementById('nasaLink').href = link;

      let title = ORIGINAL.title || '—';
      let explanation = ORIGINAL.explanation || '';

      if (LANG === 'es'){
        try{
          title = await translateEnToEs(title);
          explanation = await translateEnToEs(explanation);
        }catch(e){}
      }

      document.getElementById('title').textContent = title;
      document.getElementById('explanation').textContent = explanation;
    }

    async function load(){
      syncLangUI();
      const date = getDateFromUrl();
      document.getElementById('d').value = date || '';

      const apiUrl = new URL('/api/apod', window.location.origin);
      if (date) apiUrl.searchParams.set('date', date);

      const errBox = document.getElementById('err');
      errBox.textContent = '';

      const r = await fetch(apiUrl.toString(), { cache: 'no-store' });
      const data = await r.json();

      if (!r.ok || data?.error){
        errBox.textContent = data?.error || 'Error consultando APOD';
        document.getElementById('title').textContent = 'Error';
        return;
      }

      ORIGINAL = data;
      renderMedia();
      await renderText();
    }

    load();
  </script>
</body>
</html>`;

  res.status(200).send(html);
}

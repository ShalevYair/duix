/* ════════════════════════════════════════════════════════════
   STATE
════════════════════════════════════════════════════════════ */
let articles     = [];
let currentView  = 'list';
let newsLoaded   = false;
let currentSource = null;   // שם המקור הפעיל
let articleLimit  = 30;     // כמות כתבות להצגה
const LS_KEY     = 'duix_preferred_view';
const LS_SOURCE  = 'duix_last_source';
const ALL_VIEWS  = ['list','cards','magazine','ticker'];

/* ════════════════════════════════════════════════════════════
   SOURCES — 8 מקורות חדשות עם RSS + HTML fallback
════════════════════════════════════════════════════════════ */
const SOURCES = [
  { name:'ynet',        label:'ynet',        rss:'https://www.ynet.co.il/Integration/StoryRss1854.xml',                                                          url:'https://www.ynet.co.il/' },
  { name:'walla',       label:'וואלה',        rss:'https://rss.walla.co.il/feed/1',                                                                               url:'https://news.walla.co.il/' },
  { name:'mako',        label:'mako',         rss:'https://rcs.mako.co.il/rss/31750a2610f26110VgnVCM1000005201000aRCRD.xml',                                      url:'https://www.mako.co.il/' },
  { name:'haaretz',     label:'הארץ',         rss:'https://www.haaretz.co.il/cmlink/1.1473859',                                                                   url:'https://www.haaretz.co.il/' },
  { name:'globes',      label:'גלובס',        rss:'https://www.globes.co.il/webservice/rss/rssfeeds.aspx?fid=585',                                                url:'https://www.globes.co.il/' },
  { name:'israelhayom', label:'ישראל היום',   rss:'https://www.israelhayom.co.il/rss.xml',                                                                        url:'https://www.israelhayom.co.il/' },
];

const PROXIES = [
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  u => `https://thingproxy.freeboard.io/fetch/${u}`,
];

/* ════════════════════════════════════════════════════════════
   SOURCE BAR — בניית כפתורי מקורות
════════════════════════════════════════════════════════════ */
function buildSourceButtons() {
  const container = document.getElementById('source-buttons');
  SOURCES.forEach(src => {
    const btn = document.createElement('button');
    btn.className = 'source-btn';
    btn.textContent = src.label;
    btn.dataset.name = src.name;
    btn.addEventListener('click', () => selectSource(src));
    container.appendChild(btn);
  });
}

function selectSource(src) {
  currentSource = src.name;
  localStorage.setItem(LS_SOURCE, src.name);
  // עדכון כפתור active
  document.querySelectorAll('.source-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.name === src.name)
  );
  newsLoaded = false;
  loadNews(src);
}

/* ════════════════════════════════════════════════════════════
   LOAD NEWS — RSS ראשון, HTML fallback
════════════════════════════════════════════════════════════ */
async function loadNews(src) {
  // קריאה ללא ארגומנט (retry / onboarding) — מצא מקור נוכחי
  if (!src) {
    src = SOURCES.find(s => s.name === currentSource) || SOURCES[0];
  }
  setAppState('loading');

  // ניסיון RSS
  try {
    const rss = await fetchViaProxy(src.rss);
    const parsed = parseRSS(rss);
    if (parsed.length >= 2) {
      return applyArticles(parsed);
    }
  } catch(e) { /* נסה HTML */ }

  // ניסיון HTML
  try {
    const html = await fetchViaProxy(src.url);
    const { articles: parsed } = parseGeneric(html, src.url);
    if (parsed.length >= 2) {
      return applyArticles(parsed);
    }
  } catch(e) { /* נכשל */ }

  setAppState('error', `שגיאה בטעינת ${src.label}.\nנסה מקור אחר.`);
}

/* URL BAR — מושבת זמנית, קוד שמור
function handleUrlSubmit(e) {
  e.preventDefault();
  const raw = document.getElementById('url-input').value.trim();
  const url = normalizeUrl(raw);
  if (!url) { alert('כתובת URL לא תקינה'); return; }
  currentUrl = url;
  localStorage.setItem(LS_URL, url);
  newsLoaded = false;
  loadNews({ name:'custom', label:getHostname(url), rss:'', url });
}
*/

/* ════════════════════════════════════════════════════════════
   STATE HELPERS
════════════════════════════════════════════════════════════ */
function applyArticles(parsed) {
  articles = parsed;
  newsLoaded = true;
  renderAll();
  setAppState('content');
}

function setAppState(state, msg) {
  document.getElementById('loading').style.display      = state === 'loading' ? 'flex'  : 'none';
  document.getElementById('error-screen').style.display = state === 'error'   ? 'block' : 'none';
  document.getElementById('main-content').style.display = state === 'content' ? 'block' : 'none';
  if (msg) document.getElementById('error-msg').textContent = msg;
}

/* ════════════════════════════════════════════════════════════
   ARTICLE LIMIT — dropdown כמות כתבות
════════════════════════════════════════════════════════════ */
document.getElementById('article-limit').addEventListener('change', function() {
  articleLimit = parseInt(this.value, 10);
  if (newsLoaded) renderAll();
});

/* ════════════════════════════════════════════════════════════
   VIEW TOGGLE
════════════════════════════════════════════════════════════ */
function switchView(view) {
  currentView = view;
  ALL_VIEWS.forEach(v => {
    document.getElementById(`btn-${v}`)?.classList.toggle('active', v === view);
    const el = document.getElementById(`${v}-view`); if (el) el.style.display = 'none';
  });
  const target = document.getElementById(`${view}-view`); if (!target) return;
  if      (view === 'list')  target.style.display = 'flex';
  else if (view === 'cards') { target.style.display = 'grid'; target.style.gridTemplateColumns = window.innerWidth <= 600 ? '1fr' : window.innerWidth <= 900 ? 'repeat(2,1fr)' : 'repeat(3,1fr)'; }
  else                       target.style.display = 'block';
}
window.addEventListener('resize', () => { if (currentView === 'cards') switchView('cards'); });
document.addEventListener('keydown', e => {
  if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') return;
  const map = { '1':'list', '2':'cards', '3':'magazine', '4':'ticker' };
  if (map[e.key]) switchView(map[e.key]);
});

/* ════════════════════════════════════════════════════════════
   UTILS
════════════════════════════════════════════════════════════ */
function firstSentence(text) {
  if (!text || text.length < 4) return '';
  const m = text.match(/^[^.!?؟]{4,}[.!?؟]/);
  return m ? m[0].trim() : text.substring(0, 90);
}
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ════════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════════ */
buildOnboarding();
buildSourceButtons();

const savedView   = localStorage.getItem(LS_KEY);
const savedSource = localStorage.getItem(LS_SOURCE);

// בחר מקור שמור — או ברירת מחדל (ynet)
const initSrc = SOURCES.find(s => s.name === savedSource) || SOURCES[0];
currentSource = initSrc.name;
document.querySelectorAll('.source-btn').forEach(b =>
  b.classList.toggle('active', b.dataset.name === initSrc.name)
);

if (savedView && ALL_VIEWS.includes(savedView)) {
  // משתמש חוזר — דלג על onboarding
  document.getElementById('onboarding').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  switchView(savedView);
  loadNews(initSrc);
}
// else: onboarding מוצג כברירת מחדל

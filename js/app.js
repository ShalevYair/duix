/* ════════════════════════════════════════════════════════════
   STATE
════════════════════════════════════════════════════════════ */
let articles    = [];
let currentView = 'list';
let newsLoaded  = false;
let currentUrl  = '';
const LS_KEY    = 'duix_preferred_view';
const LS_URL    = 'duix_last_url';
const ALL_VIEWS = ['list','cards','magazine','ticker'];

/* ════════════════════════════════════════════════════════════
   DEFAULT SOURCES (RSS preferred, HTML fallback)
════════════════════════════════════════════════════════════ */
const SOURCES = [
  { name:'ynet.co.il',  rss:'https://www.ynet.co.il/Integration/StoryRss1854.xml', url:'https://www.ynet.co.il/' },
  { name:'walla.co.il', rss:'https://rss.walla.co.il/feed/1',                     url:'https://www.walla.co.il/' },
  { name:'mako.co.il',  rss:'https://rcs.mako.co.il/rss/31750a2610f26110VgnVCM1000005201000aRCRD.xml', url:'https://www.mako.co.il/' },
];

const PROXIES = [
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  u => `https://thingproxy.freeboard.io/fetch/${u}`,
];

/* ════════════════════════════════════════════════════════════
   LOAD NEWS
════════════════════════════════════════════════════════════ */
async function loadNews(customUrl) {
  setAppState('loading');
  const target = customUrl || currentUrl || '';

  if (target) {
    /* Custom / remembered URL → generic HTML parser only */
    try {
      const html=await fetchViaProxy(target);
      const {articles:parsed,method}=parseGeneric(html,target);
      if (parsed.length<2) {
        setAppState('error',`חולצו רק ${parsed.length} כתבות מ-${getHostname(target)}.\nנסה URL ישיר של עמוד החדשות הראשי.`);
        return;
      }
      showReport(target,method,parsed);
      return applyArticles(parsed,getHostname(target));
    } catch(e) {
      setAppState('error',`שגיאה בטעינת ${getHostname(target)}:\n${e.message}`);
      return;
    }
  }

  /* Default: try each source — RSS first, HTML second */
  for (const src of SOURCES) {
    try {
      const rss=await fetchViaProxy(src.rss);
      const parsed=parseRSS(rss);
      if (parsed.length>=4) {
        document.getElementById('url-input').value=src.url;
        currentUrl=src.url;
        showReport(src.url,'RSS',parsed);
        return applyArticles(parsed,src.name);
      }
    } catch(e) { /* next */ }

    try {
      const html=await fetchViaProxy(src.url);
      const {articles:parsed,method}=parseGeneric(html,src.url);
      if (parsed.length>=4) {
        document.getElementById('url-input').value=src.url;
        currentUrl=src.url;
        showReport(src.url,method,parsed);
        return applyArticles(parsed,src.name);
      }
    } catch(e) { /* next */ }
  }
  setAppState('error','לא הצלחנו לטעון חדשות מאף מקור.\nנסה להזין URL ידנית.');
}

function handleUrlSubmit(e) {
  e.preventDefault();
  const raw=document.getElementById('url-input').value.trim();
  const url=normalizeUrl(raw);
  if (!url) { alert('כתובת URL לא תקינה'); return; }
  currentUrl=url;
  localStorage.setItem(LS_URL,url);
  newsLoaded=false;
  loadNews(url);
}

/* ════════════════════════════════════════════════════════════
   STATE
════════════════════════════════════════════════════════════ */
function applyArticles(parsed,name) {
  articles=parsed; newsLoaded=true;
  document.getElementById('count-badge').textContent=`${articles.length} כתבות`;
  renderAll();
  setAppState('content');
}
function setAppState(state,msg) {
  document.getElementById('loading').style.display     =state==='loading'?'flex':'none';
  document.getElementById('error-screen').style.display=state==='error'  ?'block':'none';
  document.getElementById('main-content').style.display=state==='content'?'block':'none';
  if (msg) document.getElementById('error-msg').textContent=msg;
}

/* ════════════════════════════════════════════════════════════
   VIEW TOGGLE
════════════════════════════════════════════════════════════ */
function switchView(view) {
  currentView=view;
  ALL_VIEWS.forEach(v=>{
    document.getElementById(`btn-${v}`)?.classList.toggle('active',v===view);
    const el=document.getElementById(`${v}-view`); if(el) el.style.display='none';
  });
  const target=document.getElementById(`${view}-view`); if(!target) return;
  if      (view==='list')  target.style.display='flex';
  else if (view==='cards') { target.style.display='grid'; target.style.gridTemplateColumns=window.innerWidth<=600?'1fr':window.innerWidth<=900?'repeat(2,1fr)':'repeat(3,1fr)'; }
  else                     target.style.display='block';
}
window.addEventListener('resize',()=>{if(currentView==='cards') switchView('cards');});
document.addEventListener('keydown',e=>{
  if(document.activeElement?.tagName==='INPUT') return;
  const map={'1':'list','2':'cards','3':'magazine','4':'ticker'};
  if(map[e.key]) switchView(map[e.key]);
});

/* ════════════════════════════════════════════════════════════
   UTILS
════════════════════════════════════════════════════════════ */
function firstSentence(text) {
  if(!text||text.length<4) return '';
  const m=text.match(/^[^.!?؟]{4,}[.!?؟]/);
  return m?m[0].trim():text.substring(0,90);
}
function esc(str) {
  if(!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ════════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════════ */
buildOnboarding();

const savedView = localStorage.getItem(LS_KEY);
const savedUrl  = localStorage.getItem(LS_URL);

if (savedUrl) {
  currentUrl=savedUrl;
  document.getElementById('url-input').value=savedUrl;
}

if (savedView && ALL_VIEWS.includes(savedView)) {
  document.getElementById('onboarding').style.display='none';
  document.getElementById('app').style.display='block';
  switchView(savedView);
  loadNews(currentUrl||null);
}
// else: onboarding shown by default

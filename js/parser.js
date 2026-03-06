/* ════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
════════════════════════════════════════════════════════════ */
function getOrigin(url) {
  try { return new URL(url).origin; } catch(e) { return ''; }
}
function getHostname(url) {
  try { return new URL(url).hostname; } catch(e) { return url; }
}
function normalizeUrl(raw) {
  raw = raw.trim();
  if (!raw) return '';
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
  try { return new URL(raw).href; } catch(e) { return ''; }
}
function fixUrl(href, base) {
  if (!href || typeof href !== 'string') return null;
  href = href.trim();
  if (href.startsWith('//'))   return 'https:' + href;
  if (href.startsWith('/'))    return base + href;
  if (href.startsWith('http')) return href;
  return null;
}
function guessCategory(url, explicit) {
  if (explicit && typeof explicit==='string' && explicit.length>1 && explicit.length<25) return explicit;
  if (!url) return 'חדשות';
  const u=url.toLowerCase();
  if (/sport|ספורט|football|basketball/.test(u)) return 'ספורט';
  if (/economy|money|finance|כלכלה|שוק/.test(u))  return 'כלכלה';
  if (/politi|פוליטיק|knesset/.test(u))           return 'פוליטיקה';
  if (/tech|טכנולוגי|digital|cyber/.test(u))       return 'טכנולוגיה';
  if (/culture|art|תרבות|בידור/.test(u))           return 'תרבות';
  if (/health|בריאות|medical/.test(u))             return 'בריאות';
  if (/world|עולם|international/.test(u))          return 'עולם';
  if (/security|ביטחון|צבא|army/.test(u))         return 'ביטחון';
  return 'חדשות';
}
function dedupe(arr) {
  const seen=new Set();
  return arr.filter(a=>{ if(!a.title||a.title.length<5||seen.has(a.title)) return false; seen.add(a.title); return true; });
}
function getT(el,tag) { return (el.querySelector(tag)?.textContent||'').trim(); }

/* ════════════════════════════════════════════════════════════
   GENERIC MULTI-STRATEGY PARSER
════════════════════════════════════════════════════════════ */
function parseGeneric(htmlText, pageUrl) {
  const doc = new DOMParser().parseFromString(htmlText,'text/html');
  const base = getOrigin(pageUrl);
  const fix = (href) => fixUrl(href, base);

  /* ── Strategy 1: JSON-LD structured data ── */
  {
    const arts = parseJsonLD(doc, fix);
    if (arts.length >= 3) return { articles: dedupe(arts).slice(0,30), method:'JSON-LD' };
  }

  /* ── Strategy 2: OG / meta tags (single-article pages) ── */
  {
    const arts = parseMetaTags(doc, fix, pageUrl);
    if (arts.length >= 1 && arts[0].title.length > 10) {
      const isArticlePage = /\/article|\/story|\/news\/\w|\/\d{6,}/.test(pageUrl);
      if (isArticlePage) return { articles: arts, method:'OG-meta' };
    }
  }

  /* ── Strategy 3: <article> semantic tags ── */
  {
    const arts = parseArticleTags(doc, fix);
    if (arts.length >= 3) return { articles: dedupe(arts).slice(0,30), method:'article-tags' };
  }

  /* ── Strategy 4: common news container classes ── */
  {
    const arts = parseContainers(doc, fix);
    if (arts.length >= 3) return { articles: dedupe(arts).slice(0,30), method:'containers' };
  }

  /* ── Strategy 5: h + p + img proximity ── */
  {
    const arts = parseProximity(doc, fix);
    if (arts.length >= 3) return { articles: dedupe(arts).slice(0,30), method:'proximity' };
  }

  /* ── Strategy 6: fallback — all significant heading links ── */
  {
    const arts = parseFallback(doc, fix);
    return { articles: dedupe(arts).slice(0,30), method:'fallback' };
  }
}

/* ── 1. JSON-LD ── */
function parseJsonLD(doc, fix) {
  const arts = [];
  doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
    try {
      const data = JSON.parse(script.textContent.replace(/[\u0000-\u001F]/g,' '));
      extractLD(data, arts, fix);
    } catch(e) {}
  });
  return arts;
}
function extractLD(data, arts, fix) {
  if (!data) return;
  if (Array.isArray(data)) { data.forEach(d=>extractLD(d,arts,fix)); return; }
  if (data['@graph']) extractLD(data['@graph'], arts, fix);
  const type = data['@type'] || '';
  if (type==='ItemList' && data.itemListElement) {
    data.itemListElement.forEach(el => {
      const a=ldToArticle(el.item||el, fix); if(a) arts.push(a);
    });
  }
  if (/Article|NewsArticle|BlogPosting|WebPage|ReportageNewsArticle/.test(type)) {
    const a=ldToArticle(data,fix); if(a) arts.push(a);
  }
}
function ldToArticle(item, fix) {
  if (!item) return null;
  const title = (item.headline || item.name || '').toString().trim();
  if (!title || title.length<6 || title.length>300) return null;
  const summary = (item.description || item.abstract || '').toString().substring(0,250);
  const link = fix(item.url || item['@id']) || '#';
  let image = null;
  if (item.image) {
    if (typeof item.image==='string') image=fix(item.image);
    else if (item.image.url) image=fix(item.image.url);
    else if (Array.isArray(item.image)) image=fix(typeof item.image[0]==='string'?item.image[0]:item.image[0]?.url);
  }
  if (!image && item.thumbnailUrl) image=fix(item.thumbnailUrl);
  const catRaw = (item.articleSection || (Array.isArray(item.keywords)?item.keywords[0]:item.keywords) || '').toString();
  return { title, summary, link, image, category:guessCategory(link,catRaw) };
}

/* ── 2. OG / meta tags (single article) ── */
function parseMetaTags(doc, fix, pageUrl) {
  const get = (name) =>
    doc.querySelector(`meta[property="${name}"]`)?.getAttribute('content') ||
    doc.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || '';
  const title = get('og:title') || get('twitter:title') || doc.title || '';
  if (!title || title.length<5) return [];
  const summary = get('og:description') || get('twitter:description') || get('description') || '';
  const image   = fix(get('og:image') || get('twitter:image')) || null;
  const link    = get('og:url') || pageUrl;
  return [{ title:title.trim(), summary:summary.substring(0,250), image, link, category:guessCategory(link) }];
}

/* ── 3. <article> semantic tags ── */
function parseArticleTags(doc, fix) {
  const arts=[];
  doc.querySelectorAll('article').forEach(el => {
    const h   = el.querySelector('h1,h2,h3,h4');
    const p   = el.querySelector('p');
    const img = el.querySelector('img[src],img[data-src],img[data-lazy-src]');
    const a   = h?.querySelector('a') || el.querySelector('a[href]');
    const title = h?.textContent?.trim();
    if (!title||title.length<6) return;
    let image = img?.getAttribute('src')||img?.getAttribute('data-src')||img?.getAttribute('data-lazy-src')||null;
    image = fix(image);
    let link = fix(a?.getAttribute('href'))||'#';
    arts.push({ title, summary:(p?.textContent?.trim()||'').substring(0,250), image, link, category:guessCategory(link) });
  });
  return arts;
}

/* ── 4. Container heuristics (news-site class patterns) ── */
function parseContainers(doc, fix) {
  const arts=[];
  const CONTAINERS=[
    // ynet-specific
    '.slotView','.MagicItemComponent','[class*="slotView"]',
    // mako-specific
    '[class*="BlockLink"]','[class*="block-link"]',
    // generic patterns
    '[class*="ArticleItem"]','[class*="article-item"]','[class*="news-item"]',
    '[class*="story-item"]','[class*="story_item"]','[class*="post-item"]',
    '[class*="card-item"]','[class*="list-item"]','[class*="feed-item"]',
    '[data-type="article"]','[data-testid*="article"]','[data-testid*="story"]',
    '.article-item','.news-item','.story','.post',
  ];
  const TITLES=[
    '.slotTitle','[class*="slotTitle"]','[class*="article-title"]',
    '[class*="story-title"]','[class*="post-title"]','[class*="card-title"]',
    '[class*="ArticleTitle"]','[class*="Title"]','.title','h2','h3','h4',
  ];
  const SUBS=[
    '.slotSubTitle','[class*="SubTitle"]','[class*="subtitle"]',
    '[class*="summary"]','[class*="description"]','[class*="excerpt"]','p',
  ];
  const IMGS=[
    'img[src]:not([src=""])',
    'img[data-src]:not([data-src=""])',
    'img[data-lazy-src]',
    'img[data-original]',
  ];

  for (const cSel of CONTAINERS) {
    const nodes = doc.querySelectorAll(cSel);
    if (nodes.length < 3) continue;
    nodes.forEach(c => {
      const te=c.querySelector(TITLES.join(','));
      const se=c.querySelector(SUBS.join(','));
      const ie=c.querySelector(IMGS.join(','));
      const le=c.querySelector('a[href]');
      const title=te?.textContent?.trim();
      if (!title||title.length<6) return;
      const imgSrc=ie?.getAttribute('src')||ie?.getAttribute('data-src')||ie?.getAttribute('data-lazy-src')||ie?.getAttribute('data-original')||null;
      const image=fix(imgSrc);
      const link=fix(le?.getAttribute('href'))||'#';
      arts.push({ title, summary:(se?.textContent?.trim()||'').substring(0,250), image, link, category:guessCategory(link) });
    });
    if (arts.length>=5) break;
  }
  return arts;
}

/* ── 5. h + p + img proximity ── */
function parseProximity(doc, fix) {
  const SKIP='header,footer,nav,aside,[class*="nav"],[class*="menu"],[class*="sidebar"],[class*="footer"],[class*="header"],[class*="breadcrumb"],[role="navigation"]';
  const arts=[];
  const headings=Array.from(doc.querySelectorAll('h2,h3,h1'));

  headings.forEach(h => {
    if (h.closest(SKIP)) return;
    const title=h.textContent.trim();
    if (!title||title.length<10||title.length>220) return;

    let container=h.parentElement;
    for (let i=0;i<4;i++) {
      if (!container||container.tagName==='BODY') break;
      if (container.querySelectorAll('h2,h3').length>4 && i>1) break;
      container=container.parentElement;
    }
    container=container||h.parentElement;

    const img=container.querySelector('img[src],img[data-src],img[data-lazy-src]');
    const p  =container.querySelector('p');
    const a  =h.querySelector('a')||container.querySelector('a[href]');

    const imgSrc=img?.getAttribute('src')||img?.getAttribute('data-src')||img?.getAttribute('data-lazy-src')||null;
    const image=fix(imgSrc);
    const link=fix(a?.getAttribute('href'))||'#';

    if (link==='#'||/\/(search|tag|category|page|author|login|register)\//i.test(link)) {
      if (!image&&!p) return;
    }

    arts.push({ title, summary:(p?.textContent?.trim()||'').substring(0,250), image, link, category:guessCategory(link) });
  });
  return arts;
}

/* ── 6. Fallback: all heading-links ── */
function parseFallback(doc, fix) {
  const arts=[];
  const SKIP='header,footer,nav,aside,[class*="nav"],[class*="menu"],[class*="sidebar"],[role="navigation"]';
  doc.querySelectorAll('h1 a[href],h2 a[href],h3 a[href]').forEach(a => {
    if (a.closest(SKIP)) return;
    const title=a.textContent.trim();
    if (!title||title.length<10||title.length>220) return;
    const href=a.getAttribute('href')||'';
    if (/^(javascript:|mailto:|tel:|#)/.test(href)) return;
    const link=fix(href)||'#';
    const parent=a.closest('li,div,section,article')||a.parentElement;
    const img=parent?.querySelector('img[src],img[data-src]');
    const p  =parent?.querySelector('p');
    const imgSrc=img?.getAttribute('src')||img?.getAttribute('data-src')||null;
    arts.push({ title, summary:(p?.textContent?.trim()||'').substring(0,250), image:fix(imgSrc), link, category:guessCategory(link) });
  });
  return arts;
}

/* ════════════════════════════════════════════════════════════
   RSS PARSER (for known sources)
════════════════════════════════════════════════════════════ */
function parseRSS(xmlText) {
  const xml=new DOMParser().parseFromString(xmlText,'application/xml');
  if (xml.querySelector('parsererror')) throw new Error('XML שגוי');
  const items=Array.from(xml.querySelectorAll('item'));
  if (!items.length) throw new Error('אין פריטים');
  return items.slice(0,30).map(item => {
    const title =getT(item,'title');
    const link  =getT(item,'link')||getT(item,'guid');
    const catRaw=getT(item,'category');
    const raw   =getT(item,'description')||'';
    let image=null;
    const enc=item.querySelector('enclosure');
    if (enc&&(enc.getAttribute('type')||'').startsWith('image')) image=enc.getAttribute('url');
    if (!image) {
      for (const el of item.querySelectorAll('*')) {
        const tag=el.tagName.toLowerCase();
        if (tag.includes('content')||tag.includes('thumbnail')) {
          const u=el.getAttribute('url')||'';
          if (u.match(/\.(jpe?g|png|webp|gif)/i)){image=u;break;}
        }
      }
    }
    if (!image){const m=raw.match(/<img[^>]+src=["']([^"']+)["']/i);if(m)image=m[1];}
    const summary=raw.replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim().substring(0,250);
    return {title,summary,link,image,category:guessCategory(link,catRaw)};
  }).filter(a=>a.title&&a.title.length>3);
}

/* ════════════════════════════════════════════════════════════
   EXTRACTION REPORT — מושבת זמנית (source-bar הוחלף ב-url-bar)
════════════════════════════════════════════════════════════ */
/*
const METHOD_COLORS={
  'JSON-LD':'#10b981','RSS':'#10b981','OG-meta':'#3b82f6',
  'article-tags':'#3b82f6','containers':'#8b5cf6',
  'proximity':'#f59e0b','fallback':'#94a3b8',
};
function showReport(url, method, arts) {
  const withImg=arts.filter(a=>a.image).length;
  const pct=arts.length?Math.round(withImg/arts.length*100):0;
  const color=METHOD_COLORS[method]||'#94a3b8';
  const warn=arts.length<5?`<span class="report-warn">⚠ רק ${arts.length} כתבות</span><span class="report-sep">•</span>`:'';
  const hostname=getHostname(url);
  document.getElementById('extraction-report').innerHTML=`
    <span class="method-badge" style="background:${color}">${method}</span>
    ${warn}
    <span>${arts.length} כתבות</span>
    <span class="report-sep">•</span>
    <span>תמונות ${withImg}/${arts.length} (${pct}%)</span>
    <span class="report-sep">•</span>
    <a href="${esc(url)}" target="_blank" rel="noopener" style="color:var(--primary);text-decoration:none;">${esc(hostname)}</a>
  `;
}
*/

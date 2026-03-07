/* ════════════════════════════════════════════════════════════
   ELEMENT FACTORIES — נוצרות ע"י render ו-append כאחד
════════════════════════════════════════════════════════════ */
function createListItem(article, i) {
  const item = document.createElement('div'); item.className = 'list-item'; item.id = `item-${i}`;
  const has = article.summary && article.summary.length > 4;
  const hl  = article.link && article.link !== '#';
  item.innerHTML = `
    <div class="list-header" role="button" tabindex="0" aria-expanded="false">
      <div class="list-title">${esc(article.title)}</div>
      ${has ? '<span class="chevron">▾</span>' : ''}
    </div>
    ${has ? `<div class="list-body"><div class="list-body-inner">
      <p class="list-summary-text">${esc(article.summary)}</p>
      ${hl ? `<a class="read-more" href="${esc(article.link)}" target="_blank" rel="noopener">לקריאת הכתבה ←</a>` : ''}
    </div></div>` : ''}`;
  const hdr = item.querySelector('.list-header');
  if (has) {
    const toggle = () => { const o = item.classList.toggle('open'); hdr.setAttribute('aria-expanded', o.toString()); };
    hdr.addEventListener('click', toggle);
    hdr.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  } else if (hl) { hdr.addEventListener('click', () => window.open(article.link, '_blank', 'noopener')); }
  return item;
}

function createCardEl(article, i) {
  const card = document.createElement('a');
  card.className = 'card fade-in'; card.href = article.link || '#'; card.target = '_blank'; card.rel = 'noopener noreferrer';
  card.style.animationDelay = `${Math.min(i * 25, 350)}ms`;
  card.innerHTML = `
    ${article.image ? `<div class="card-media"><img src="${esc(article.image)}" alt="${esc(article.title)}" loading="lazy"></div>` : ''}
    <div class="card-body">
      <div class="card-title">${esc(article.title)}</div>
      ${article.summary ? `<div class="card-summary">${esc(article.summary.substring(0, 130))}</div>` : ''}
    </div>`;
  const img = card.querySelector('img');
  if (img) img.addEventListener('error', () => { const m = card.querySelector('.card-media'); if (m) m.remove(); });
  return card;
}

function createMagItem(article, i) {
  const item = document.createElement('a');
  item.className = 'mag-item fade-in'; item.href = article.link || '#'; item.target = '_blank'; item.rel = 'noopener noreferrer';
  item.style.animationDelay = `${Math.min(i * 40, 400)}ms`;
  item.innerHTML = `${article.image ? `<div class="mag-item-imgwrap"><img src="${esc(article.image)}" alt="${esc(article.title)}" loading="lazy"></div>` : ''}
    <div class="mag-item-text"><div class="mag-item-cat">${esc(article.category || '')}</div><div class="mag-item-title">${esc(article.title)}</div></div>`;
  const img = item.querySelector('img'); if (img) img.addEventListener('error', () => { const m = item.querySelector('.mag-item-imgwrap'); if (m) m.remove(); });
  return item;
}

function createTickerItem(article, i) {
  const snip = firstSentence(article.summary);
  const item = document.createElement('a'); item.className = 'ticker-item'; item.href = article.link || '#'; item.target = '_blank'; item.rel = 'noopener noreferrer';
  item.innerHTML = `<span class="ticker-num">${i + 1}</span><span class="ticker-cat">${esc(article.category || 'חדשות')}</span><span class="ticker-title">${esc(article.title)}</span>${snip ? `<span class="ticker-sep">│</span><span class="ticker-snippet">${esc(snip)}</span>` : ''}`;
  return item;
}

/* ════════════════════════════════════════════════════════════
   FULL RENDER — מחיקה ובנייה מחדש (החלפת תצוגה / ריענון)
════════════════════════════════════════════════════════════ */
function renderAll() { renderListView(); renderCardsView(); renderMagazineView(); renderTickerView(); }

function renderListView() {
  const c = document.getElementById('list-view'); c.innerHTML = '';
  articles.forEach((article, i) => c.appendChild(createListItem(article, i)));
}

function renderCardsView() {
  const c = document.getElementById('cards-view'); c.innerHTML = '';
  articles.forEach((article, i) => c.appendChild(createCardEl(article, i)));
}

function renderMagazineView() {
  const c = document.getElementById('magazine-view'); c.innerHTML = '';
  if (!articles.length) return;
  const [hero, ...rest] = articles;
  const heroEl = document.createElement('a');
  heroEl.className = 'mag-hero fade-in'; heroEl.href = hero.link || '#'; heroEl.target = '_blank'; heroEl.rel = 'noopener noreferrer';
  heroEl.innerHTML = `<div class="mag-hero-imgwrap">${hero.image ? `<img src="${esc(hero.image)}" alt="${esc(hero.title)}" loading="eager">` : ''}
    <div class="mag-hero-text"><div class="mag-eyebrow"><span class="mag-label">${esc(hero.category || 'ראשי')}</span></div>
      <div class="mag-hero-title">${esc(hero.title)}</div>
      ${hero.summary ? `<div class="mag-hero-subtitle">${esc(hero.summary.substring(0, 180))}</div>` : ''}
    </div></div>`;
  const hi = heroEl.querySelector('img'); if (hi) hi.addEventListener('error', () => { hi.style.display = 'none'; });
  c.appendChild(heroEl);
  const div = document.createElement('div'); div.className = 'mag-section-title'; div.innerHTML = '<span>עוד כתבות</span>'; c.appendChild(div);
  const grid = document.createElement('div'); grid.className = 'mag-grid';
  rest.forEach((article, i) => grid.appendChild(createMagItem(article, i)));
  c.appendChild(grid);
}

function renderTickerView() {
  const c = document.getElementById('ticker-view'); c.innerHTML = '';
  const hdr = document.createElement('div'); hdr.className = 'ticker-header';
  hdr.innerHTML = `<div class="ticker-header-label"><div class="ticker-pulse"></div><span>שורה תחתונה</span></div><span class="ticker-header-total">${articles.length} כתבות</span>`;
  c.appendChild(hdr);
  const list = document.createElement('div'); list.className = 'ticker-list';
  articles.forEach((article, i) => list.appendChild(createTickerItem(article, i)));
  c.appendChild(list);
}

/* ════════════════════════════════════════════════════════════
   PROGRESSIVE APPEND — הוספה מדורגת ממקורות מקבילים
════════════════════════════════════════════════════════════ */
function appendToViews(fresh, startIdx) {
  appendToListView(fresh, startIdx);
  appendToCardsView(fresh, startIdx);
  appendToMagazineView(fresh, startIdx);
  appendToTickerView(fresh, startIdx);
}

function appendToListView(fresh, startIdx) {
  const c = document.getElementById('list-view');
  fresh.forEach((article, i) => c.appendChild(createListItem(article, startIdx + i)));
}

function appendToCardsView(fresh, startIdx) {
  const c = document.getElementById('cards-view');
  fresh.forEach((article, i) => c.appendChild(createCardEl(article, startIdx + i)));
}

function appendToMagazineView(fresh, startIdx) {
  const c = document.getElementById('magazine-view');
  if (startIdx === 0) {
    // קבוצה ראשונה — ציור מחדש מלא כולל hero
    renderMagazineView();
    return;
  }
  // קבוצות הבאות — הוסף לגריד הקיים
  let grid = c.querySelector('.mag-grid');
  if (!grid) {
    const div = document.createElement('div'); div.className = 'mag-section-title'; div.innerHTML = '<span>עוד כתבות</span>'; c.appendChild(div);
    grid = document.createElement('div'); grid.className = 'mag-grid'; c.appendChild(grid);
  }
  const offset = grid.children.length;
  fresh.forEach((article, i) => grid.appendChild(createMagItem(article, offset + i)));
}

function appendToTickerView(fresh, startIdx) {
  const c = document.getElementById('ticker-view');
  const totalEl = c.querySelector('.ticker-header-total');
  if (totalEl) totalEl.textContent = `${articles.length} כתבות`;
  let list = c.querySelector('.ticker-list');
  if (!list) {
    const hdr = document.createElement('div'); hdr.className = 'ticker-header';
    hdr.innerHTML = `<div class="ticker-header-label"><div class="ticker-pulse"></div><span>שורה תחתונה</span></div><span class="ticker-header-total">${articles.length} כתבות</span>`;
    c.appendChild(hdr);
    list = document.createElement('div'); list.className = 'ticker-list'; c.appendChild(list);
  }
  fresh.forEach((article, i) => list.appendChild(createTickerItem(article, startIdx + i)));
}

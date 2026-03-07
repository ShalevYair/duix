/* ════════════════════════════════════════════════════════════
   ONBOARDING SAMPLE DATA
════════════════════════════════════════════════════════════ */
const SAMPLE = [
  { title:'מגעים לעסקת חטופים: פריצת דרך', category:'חדשות',    summary:'פקידים בכירים מסרו על התקדמות.' },
  { title:'הבורסה קפצה 3% — שיא חדש',      category:'כלכלה',    summary:'מדד ת"א 35 בביצועים הטובים מתחילת השנה.' },
  { title:'מכבי ת"א גברה 2-1 על הפועל',    category:'ספורט',    summary:'גול מנצח בדקה ה-88.' },
  { title:'AI ישראלי מזהה סרטן ב-95%',      category:'טכנולוגיה', summary:'מערכת חדשה מ-Technion.' },
];

function miniList(items) {
  return `<div style="display:flex;flex-direction:column;">${items.map(a=>`<div style="padding:5px 0;border-bottom:1px solid #e2e8f0;display:flex;align-items:flex-start;justify-content:space-between;gap:6px;"><div style="font-size:8.5px;font-weight:600;line-height:1.4;flex:1;color:#1e293b;">${esc(a.title)}</div><div style="font-size:8px;color:#94a3b8;">▾</div></div>`).join('')}</div>`;
}
function miniCards(items) {
  const c=['#3b82f6','#8b5cf6','#f59e0b','#10b981'];
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">${items.map((a,i)=>`<div style="background:#fff;border-radius:5px;box-shadow:0 1px 3px rgba(0,0,0,0.1);overflow:hidden;"><div style="height:30px;background:${c[i]};opacity:0.65;"></div><div style="padding:4px;font-size:7.5px;font-weight:600;line-height:1.3;color:#1e293b;">${esc(a.title.substring(0,28))}</div></div>`).join('')}</div>`;
}
function miniMagazine(items) {
  const [h,...rest]=items;
  return `<div><div style="height:62px;background:linear-gradient(135deg,#1e293b,#1e4080);border-radius:5px;display:flex;align-items:flex-end;padding:6px;margin-bottom:5px;position:relative;overflow:hidden;"><div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent,rgba(0,0,0,0.72));"></div><div style="position:relative;z-index:1;"><div style="font-size:6px;color:#60a5fa;font-weight:700;letter-spacing:1px;margin-bottom:2px;">ראשי</div><div style="font-size:8.5px;font-weight:800;color:#fff;font-family:serif;line-height:1.2;">${esc(h.title.substring(0,38))}</div></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">${rest.slice(0,2).map(a=>`<div style="background:#fff;border:1px solid #e2e8f0;border-radius:3px;padding:4px;display:flex;gap:3px;align-items:flex-start;"><div style="width:22px;height:17px;background:#e2e8f0;border-radius:2px;flex-shrink:0;"></div><div style="font-size:7px;font-weight:700;color:#1e293b;font-family:serif;line-height:1.3;">${esc(a.title.substring(0,22))}</div></div>`).join('')}</div></div>`;
}
function miniTicker(items) {
  return `<div style="border:1px solid #e2e8f0;border-radius:5px;overflow:hidden;"><div style="background:#1e293b;padding:3px 7px;display:flex;align-items:center;gap:5px;"><div style="width:5px;height:5px;background:#ef4444;border-radius:50%;"></div><div style="font-size:6.5px;color:#fff;font-weight:700;letter-spacing:1px;">שורה תחתונה</div></div>${items.map((a,i)=>`<div style="display:flex;align-items:center;gap:4px;padding:3.5px 7px;border-bottom:1px solid #f1f5f9;background:${i%2===0?'#fff':'rgba(0,0,0,0.015)'};"><span style="font-size:6px;color:#94a3b8;min-width:10px;text-align:center;">${i+1}</span><span style="font-size:6px;background:rgba(59,130,246,0.12);color:#3b82f6;padding:0 3px;border-radius:2px;font-weight:700;">${esc(a.category)}</span><span style="font-size:7.5px;font-weight:600;color:#1e293b;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(a.title.substring(0,22))}</span></div>`).join('')}</div>`;
}

function buildOnboarding() {
  const CARDS = [
    {id:'list',icon:'≡',name:'כותרות',desc:'רשימה נקייה עם הרחבה בלחיצה',render:miniList},
    {id:'cards',icon:'⊞',name:'כרטיסיות',desc:'גריד כרטיסים עם תמונות',render:miniCards},
    {id:'magazine',icon:'🗞',name:'מגזין',desc:'כתבה ראשית + רשת עיתונאית',render:miniMagazine},
    {id:'ticker',icon:'⚡',name:'תחתונה',desc:'שורה אחת לכתבה, מקסימום מידע',render:miniTicker},
  ];
  const container = document.getElementById('ob-cards');
  CARDS.forEach(cfg => {
    const card=document.createElement('div');
    card.className='ob-card'; card.dataset.view=cfg.id;
    card.innerHTML=`<div class="ob-card-header"><span class="ob-card-icon">${cfg.icon}</span><span class="ob-card-name">${cfg.name}</span></div><div class="ob-card-preview">${cfg.render(SAMPLE)}</div><div class="ob-card-desc">${cfg.desc}</div>`;
    card.addEventListener('click',()=>selectView(cfg.id));
    container.appendChild(card);
  });
}

/* ════════════════════════════════════════════════════════════
   ONBOARDING FLOW
════════════════════════════════════════════════════════════ */
function showOnboarding() {
  document.getElementById('onboarding').style.display='flex';
  document.getElementById('app').style.display='none';
}
function selectView(view) {
  localStorage.setItem(LS_KEY,view);
  document.getElementById('onboarding').style.display='none';
  document.getElementById('app').style.display='block';
  switchView(view);
  if (!newsLoaded) loadAllSources();
}

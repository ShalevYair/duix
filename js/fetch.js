/* ════════════════════════════════════════════════════════════
   NETWORK — CORS proxy waterfall
════════════════════════════════════════════════════════════ */
async function fetchViaProxy(targetUrl) {
  for (const makeUrl of PROXIES) {
    try {
      const ctrl=new AbortController(), timer=setTimeout(()=>ctrl.abort(),13000);
      const res=await fetch(makeUrl(targetUrl),{signal:ctrl.signal});
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text=await res.text();
      if (text.length<200) throw new Error('ריק');
      return text;
    } catch(e) { /* try next proxy */ }
  }
  throw new Error('כל הפרוקסי נכשלו');
}

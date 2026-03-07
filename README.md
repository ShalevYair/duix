# חדשות — קורא חדשות ישראלי חכם

> אפליקציית חדשות סטטית שטוענת 8 אתרי חדשות ישראלים במקביל ומציגה אותם בחוויית קריאה מותאמת אישית —
> ללא שרת, ללא framework, ללא התקנה. פועל מ-GitHub Pages.

🔗 **https://shalevyair.github.io/duix/**

---

## תיאור הפרויקט

קורא חדשות מבוסס קבצים סטטיים בלבד.
הרעיון המרכזי: אותו תוכן, ארבעה אופני תצוגה שונים — המשתמש בוחר את הסגנון שמתאים לו,
והמערכת זוכרת את הבחירה לפגישה הבאה.

בניגוד לאפליקציות חדשות קלאסיות שמחייבות API key, back-end, או הרשמה —
האפליקציה פועלת ישירות מהדפדפן, טוענת תוכן מ-8 מקורות ישראלים במקביל, ומציגה אותו בתצוגה נקייה.

---

## ארבעה מצבי תצוגה

| מצב | אופי | מתאים ל |
|-----|------|---------|
| **כותרות** | רשימה נקייה + accordion | קריאת חדשות מהירה, סקירה ראשונית |
| **כרטיסיות** | Grid עם תמונות | גלישה ויזואלית, בחירת כתבות |
| **מגזין** | Hero + רשת עיתונאית | קריאה מעמיקה, עיתון איכותי |
| **שורה תחתונה** | שורה אחת לכתבה | מקסימום מידע, מינימום מקום |

---

## חוויית המשתמש

**Onboarding**: בכניסה ראשונה — מסך בחירה עם תצוגות מקדימות חיות של כל סגנון.
הבחירה נשמרת ב-`localStorage`. לחיצה על "חדשות" בפינה מחזירה למסך זה.

**טעינה מקבילה**: כל 8 המקורות נטענים בו-זמנית. כתבות מופיעות על המסך ברגע שהמקור הראשון מסיים —
ניתן לגלול ולקרוא בזמן שהשאר נטענים. כפתורי המקורות מציגים סטטוס חי (pulse / ירוק / אדום).

**גלילה אינסופית**: אין הגבלת כמות — כל הכתבות מוצגות, מוסיפות לתחתית הדף ככל שמקורות מסיימים.

---

## מקורות חדשות — 8 מקורות ישראלים

| שם | label | RSS |
|----|-------|-----|
| ynet | ynet | `StoryRss1854.xml` |
| walla | וואלה | `rss.walla.co.il/feed/1` |
| mako | mako | RSS ייעודי |
| haaretz | הארץ | `cmlink/1.1473859` |
| globes | גלובס | `rssfeeds.aspx?fid=585` |
| israelhayom | ישראל היום | `rss.xml` |
| maariv | מעריב | `Rss/RssChadashot` |
| davar | דבר | `davar1.co.il/feed/` |

לכל מקור: ניסיון RSS ראשון → HTML fallback עם פרסור גנרי אם RSS נכשל.

---

## ארכיטקטורה

```
duix/
├── index.html          shell (HTML structure + CSS/JS imports)
├── css/
│   ├── base.css        variables, reset, logo
│   ├── onboarding.css  #onboarding, .ob-*
│   ├── header.css      header, source-bar, loading, error, #main-content
│   ├── list.css        #list-view, .list-*, accordion
│   ├── cards.css       #cards-view, .card, .card-*
│   ├── magazine.css    #magazine-view, .mag-*
│   └── ticker.css      #ticker-view, .ticker-*
├── js/
│   ├── fetch.js        fetchViaProxy — CORS proxy waterfall
│   ├── parser.js       parseGeneric + 6 strategies + parseRSS
│   ├── views.js        renderAll + 4 render functions + appendToViews
│   ├── onboarding.js   buildOnboarding, showOnboarding, selectView
│   └── app.js          state, SOURCES, loadAllSources, switchView, INIT
├── README.md
└── .gitignore
```

**אין תלויות חיצוניות** מעבר לפונט אחד מ-Google Fonts (`Noto Serif Hebrew`).
אין React, אין npm, אין build process.

---

## אלגוריתמים מרכזיים

### טעינה מקבילה עם Progressive Rendering

```
loadAllSources()
  ├─ SOURCES.map(src => loadOneSource(src))  ← Promise.allSettled (מקבילי)
  └─ כל מקור שמסיים → addArticlesFromSource(parsed)
       ├─ סינון כפילויות לפי title (Set)
       ├─ הוספה ל-articles[]
       └─ appendToViews(fresh, prevCount)  ← מוסיף רק כתבות חדשות לכל 4 תצוגות
```

### CORS Proxy Waterfall

```
ניסיון 1 — allorigins.win (timeout 13s)
ניסיון 2 — corsproxy.io
ניסיון 3 — thingproxy.freeboard.io
```

### פרסור גנרי — 6 שכבות (waterfall)

```
שכבה 1 — JSON-LD structured data
שכבה 2 — OG / meta tags (עמוד כתבה בודד)
שכבה 3 — <article> semantic tags
שכבה 4 — Container class heuristics
שכבה 5 — h2/h3 + p + img proximity
שכבה 6 — Fallback: heading-links
```

---

## מגבלות ידועות

1. **CORS** — תלוי בזמינות שרתי proxy ציבוריים חינמיים.
2. **אתרי SPA** — אתרים שמרנדרים ב-JS בלבד יחזירו פחות תוכן.
3. **תמונות** — אתרים עם `Referrer-Policy` יחסמו טעינת תמונות; כתבות ללא תמונה מוצגות ללא placeholder.

---

*פרויקט סטטי — GitHub Pages ready, zero dependencies.*

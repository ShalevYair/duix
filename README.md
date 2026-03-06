# DUIX — Dynamic UI/UX News Reader

> אפליקציית חדשות סטטית שהופך 8 אתרי חדשות ישראלים לחוויית קריאה מותאמת אישית —
> ללא שרת, ללא framework, ללא התקנה. פועל מ-GitHub Pages.

🔗 **https://shalevyair.github.io/duix/**

---

## תיאור הפרויקט

DUIX (ראשי תיבות: **D**ynamic **UI**/**UX**) הוא קורא חדשות שמבוסס על קבצים סטטיים בלבד.
הרעיון המרכזי: אותו תוכן, ארבעה אופני תצוגה שונים — המשתמש בוחר את הסגנון שמתאים לו,
והמערכת זוכרת את הבחירה לפגישה הבאה.

בניגוד לאפליקציות חדשות קלאסיות שמחייבות API key, back-end, או הרשמה —
DUIX פועל ישירות מהדפדפן, מחלץ תוכן מ-8 מקורות ידועים, ומציג אותו בתצוגה נקייה.

---

## אפיון כללי — הרמה הרעיונית

### הבעיה שנפתרת

אתרי חדשות מלאים בפרסומות, צבעים צועקים, autoplay, ועיצוב שמיועד למשוך קליקים ולא לקריאה.
כל אתר נראה אחרת — חלק מעדיפים כרטיסיות, אחרים רשימות, מישהו רוצה כותרות בלבד.
אין כיום כלי שמאפשר לצרוך תוכן מ**כל** אתר חדשות בסגנון שהמשתמש בחר.

### הפתרון

DUIX מפריד בין **תוכן** (מה) ל**תצוגה** (איך):

```
בחירת מקור → חילוץ מובנה → 4 מצבי תצוגה → בחירת משתמש
```

המשתמש בוחר מקור חדשות בלחיצה אחת. המערכת מסנכרנת עם האתר בכל טעינה.

### ארבעה מצבי תצוגה

| מצב | אופי | מתאים ל |
|-----|------|---------|
| **כותרות** | רשימה נקייה + accordion | קריאת חדשות מהירה, סקירה ראשונית |
| **כרטיסיות** | Grid עם תמונות | גלישה ויזואלית, בחירת כתבות |
| **מגזין** | Hero + רשת עיתונאית | קריאה מעמיקה, עיתון איכותי |
| **שורה תחתונה** | שורה אחת לכתבה | מקסימום מידע, מינימום מקום |

### חוויית המשתמש (Onboarding)

בכניסה ראשונה: מסך בחירה עם **תצוגות מקדימות חיות** של כל אחד מארבעת הסגנונות —
המשתמש רואה בדיוק מה הוא בוחר לפני שהוא בוחר.
הבחירה נשמרת ב-`localStorage` ולא מוצגת שוב.
לחיצה על לוגו **DUIX** בכל עת מחזירה למסך זה.

---

## אפיון ברמת האלגוריתם

### זרימת הנתונים הראשית

```
1. טעינה
       ↓
2. בדיקת localStorage
   ├─ יש העדפה שמורה → דלג לשלב 5 (טען מקור אחרון שנבחר)
   └─ אין → הצג מסך Onboarding → המשתמש בוחר סגנון → שמור
       ↓
3. בחירת מקור מ-source bar (8 כפתורים)
   ├─ ניסיון RSS (XML מובנה, מהיר ואמין)
   └─ נכשל → ניסיון HTML עם פרסור גנרי
       ↓
4. פרסור תוכן — 6 שכבות (ראה מטה)
       ↓
5. הצגה ב-4 תצוגות מקבילות (מרונדרות כולן, מוחלפות ב-DOM)
       ↓
6. מיתוג תצוגה — toggle/switchView
```

### אלגוריתם הפרסור הגנרי — 6 שכבות

מנגנון ה"נפילה חופשית" (waterfall): כל שכבה רצה, ואם החזירה ≥ 3 כתבות — עוצרים שם.

```
שכבה 1 — JSON-LD (structured data)
    ↓ אם < 3 כתבות
שכבה 2 — OG / meta tags (עמוד כתבה בודד)
    ↓ אם < 3 כתבות
שכבה 3 — <article> tags (HTML סמנטי)
    ↓ אם < 3 כתבות
שכבה 4 — Container class heuristics (אם יש 3+ elements מאותה class)
    ↓ אם < 3 כתבות
שכבה 5 — h2/h3 + p + img proximity (ניתוח DOM שכנות)
    ↓ אם < 3 כתבות
שכבה 6 — Fallback: כל heading-links משמעותיים
```

**עקרון ה-Deduplication**: אחרי כל שכבה, רשימת הכתבות עוברת סינון כפילויות לפי שדה `title` (Set).

**עקרון ה-URL Normalization**: כתובות יחסיות (`/article/123`) ופרוטוקול-יחסיות (`//cdn.example.com/img.jpg`) מומרות ל-URL מלא על בסיס `origin` של הדף המקורי.

### אלגוריתם ה-Proxy Fallback

DUIX נדרש לעקוף מגבלות CORS (דפדפן מונע קריאה ישירה לאתרים אחרים).
הפתרון: שרתי proxy ציבוריים שמחזירים את ה-HTML של האתר המבוקש.

```
ניסיון פרוקסי 1 (allorigins.win)
    ├─ הצלח → החזר text
    └─ נכשל (timeout 13 שניות / HTTP error / תגובה ריקה)
           ↓
ניסיון פרוקסי 2 (corsproxy.io)
    ├─ הצלח → החזר text
    └─ נכשל
           ↓
ניסיון פרוקסי 3 (thingproxy.freeboard.io)
    ├─ הצלח → החזר text
    └─ נכשל → זרוק שגיאה
```

### אלגוריתם ניחוש הקטגוריה

כל כתבה מקבלת קטגוריה לפי סדר עדיפויות:
1. שדה `category` מפורש ב-RSS / JSON-LD
2. ניחוש מה-URL באמצעות regex (sport → ספורט, economy → כלכלה, וכו')
3. ברירת מחדל: "חדשות"

---

## אפיון טכני

### ארכיטקטורה

```
duix/
├── index.html          shell (HTML structure + CSS/JS imports)
├── css/
│   ├── base.css        variables, reset, logo, fade-in
│   ├── onboarding.css  #onboarding, .ob-*
│   ├── header.css      header, source-bar, limit-select, loading, error, #main-content
│   ├── list.css        #list-view, .list-*, accordion
│   ├── cards.css       #cards-view, .card, .card-*
│   ├── magazine.css    #magazine-view, .mag-*
│   └── ticker.css      #ticker-view, .ticker-*, @keyframes pulse
├── js/
│   ├── fetch.js        fetchViaProxy — CORS proxy waterfall
│   ├── parser.js       parseGeneric + 6 strategies + parseRSS + utils
│   ├── views.js        renderAll + 4 render functions (with articleLimit slice)
│   ├── onboarding.js   SAMPLE, mini* generators, buildOnboarding, showOnboarding, selectView
│   └── app.js          state, SOURCES, PROXIES, buildSourceButtons, selectSource,
│                       loadNews, switchView, esc, firstSentence, INIT
├── README.md
├── .gitignore
└── LICENSE
```

**אין תלויות חיצוניות** מעבר לפונט אחד מ-Google Fonts (`Noto Serif Hebrew`) לצורך מצב המגזין.
אין React, אין npm, אין build process — פרוס ב-GitHub Pages ופועל מכל דפדפן.

---

### מקורות חדשות — 8 מקורות ישראלים

| שם | label | RSS | HTML fallback |
|----|-------|-----|--------------|
| ynet | ynet | `StoryRss1854.xml` | ynet.co.il |
| walla | וואלה | `rss.walla.co.il/feed/1` | news.walla.co.il |
| mako | mako | RSS ייעודי | mako.co.il |
| haaretz | הארץ | `cmlink/1.1473859` | haaretz.co.il |
| globes | גלובס | `rssfeeds.aspx?fid=585` | globes.co.il |
| israelhayom | ישראל היום | `rss.xml` | israelhayom.co.il |

לכל מקור: ניסיון RSS ראשון → HTML fallback עם פרסור גנרי.
המקור האחרון שנבחר נשמר ב-`localStorage` ונטען אוטומטית בכניסה הבאה.

---

### מבנה הנתונים — אובייקט כתבה

```js
{
  title:    string,      // כותרת הכתבה (חובה)
  summary:  string,      // תקציר (אופציונלי, עד 250 תווים)
  link:     string,      // URL לכתבה המלאה
  image:    string|null, // URL לתמונה
  category: string,      // קטגוריה ("חדשות" כברירת מחדל)
}
```

---

### שכבת הנטוורק

**`fetchViaProxy(url)`** — מנסה 3 proxies בסדר, timeout 13 שניות לכל ניסיון.
מחזיר `Promise<string>` (HTML/XML גולמי) או זורק שגיאה.

---

### שכבת הפרסור — פירוט טכני

#### שכבה 1: JSON-LD

```js
doc.querySelectorAll('script[type="application/ld+json"]')
```

תומך ב: `ItemList`, `NewsArticle`, `Article`, `BlogPosting`, `WebPage`, `ReportageNewsArticle`, `@graph`.
שדות מחולצים: `headline/name`, `description/abstract`, `url/@id`, `image/thumbnailUrl`, `articleSection/keywords`.

#### שכבה 2: OG / Meta Tags

```js
doc.querySelector('meta[property="og:title"]')
doc.querySelector('meta[property="og:description"]')
doc.querySelector('meta[property="og:image"]')
```

פעיל רק כאשר ה-URL נראה כמו עמוד כתבה בודדת (regex: `/\/article|\/story|\/news\/\w|\/\d{6,}/`).

#### שכבה 3: `<article>` Semantic Tags

מחפש בכל `<article>`: `h1/h2/h3/h4` (כותרת), `p` ראשון (תקציר), `img` (תמונה), `a[href]` (קישור).

#### שכבה 4: Container Class Heuristics

מריץ רשימה של ~20 CSS selectors לזיהוי containers חוזרים:

```
.slotView, .MagicItemComponent,          ← ynet
[class*="BlockLink"],                    ← mako
[class*="ArticleItem"], [class*="story-item"], [class*="post-item"],
[class*="card-item"], [class*="feed-item"],
[data-type="article"], [data-testid*="article"]
```

תנאי הפעלה: ≥ 3 elements מאותו selector קיימים בדף.

#### שכבה 5: DOM Proximity

```
1. querySelectorAll('h2, h3, h1')
2. דחיית כותרות בתוך header/footer/nav/aside
3. לכל כותרת: climb up עד 4 רמות (עצירה אם יש > 4 heading אחים)
4. חיפוש img + p + a בתוך ה-container שנמצא
5. דחיית links שנראים כ-navigation (/search, /tag, /category, /author)
```

#### שכבה 6: Fallback

```js
doc.querySelectorAll('h1 a[href], h2 a[href], h3 a[href]')
```

מסנן: כותרות ≥ 10 תווים, אינן בתוך nav/header/footer, אינן `javascript:` / `mailto:`.

---

### שכבת ה-UI

#### Source Bar — בחירת מקור

שורת כפתורי pill מתחת ל-header. לחיצה על כפתור:
1. מסמן אותו כ-`active` (כחול)
2. שומר שם המקור ב-`localStorage`
3. קורא ל-`loadNews(src)` — RSS ראשון, HTML fallback

#### Article Limit Dropdown

Dropdown בפינה הימנית של ה-header. אפשרויות: 10 / 30 / 50 / 100 כתבות.
בשינוי: מעדכן את `articleLimit` וקורא ל-`renderAll()` ללא fetch נוסף.
כל פונקציות ה-render משתמשות ב-`articles.slice(0, articleLimit)`.

#### מצב כותרות — Accordion

```
click → classList.toggle('open')
       ↓
CSS: .list-item.open .list-body { max-height: 260px }
     transition: max-height 0.32s ease  ← אנימציה ב-CSS בלבד, ללא JS
```

#### מצב כרטיסיות — Responsive Grid

```js
gridTemplateColumns =
  window.innerWidth <= 600 ? '1fr' :
  window.innerWidth <= 900 ? 'repeat(2,1fr)' :
                             'repeat(3,1fr)';
```
מעודכן גם ב-`resize` event.

#### מצב מגזין — Typography

- כותרת Hero: `font-family: 'Noto Serif Hebrew'`, `clamp(1.5rem, 3.5vw, 2.2rem)` — fluid typography
- Overlay: `linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.82) 100%)`
- גריד משנה: CSS Grid 1fr 1fr עם `border: 1px solid var(--border)` בין תאים

#### מצב שורה תחתונה — Density

```
כל שורה: 1 line-height × font-size 0.8rem × padding 0.3rem = ~28px
30 כתבות = ~840px גובה כולל
```

Zebra striping: `:nth-child(even)` ← CSS בלבד.

---

### ניהול מצב (State Management)

```js
// גלובלים (app.js)
let articles      = [];      // מערך כל הכתבות שנטענו
let currentView   = 'list';  // מצב תצוגה פעיל
let newsLoaded    = false;   // מניעת reload כפול
let currentSource = null;    // שם המקור הפעיל ('ynet', 'walla', ...)
let articleLimit  = 30;      // כמה כתבות להציג (10/30/50/100)

// localStorage keys
'duix_preferred_view'  // 'list' | 'cards' | 'magazine' | 'ticker'
'duix_last_source'     // שם המקור האחרון שנבחר
```

**`renderAll()`** — מרנדר את **כל ארבע התצוגות** בבת אחת עם כל טעינת תוכן.
זה מאפשר מיתוג מיידי בין תצוגות ללא fetch נוסף.

---

### דוח החילוץ (שמור בהערות — ניתן להפעיל מחדש)

הקוד קיים ב-`parser.js` ו-`header.css` אך מוסתר. כשיופעל מחדש יציג:

```
[method-badge] • X כתבות • תמונות Y/X (Z%) • hostname
```

| שיטה | צבע |
|------|-----|
| JSON-LD / RSS | `#10b981` ירוק |
| OG-meta / article-tags | `#3b82f6` כחול |
| containers | `#8b5cf6` סגול |
| proximity | `#f59e0b` ענבר |
| fallback | `#94a3b8` אפור |

---

### Onboarding — Preview Cards

הכרטיסים ב-Onboarding מייצגים mini-render של כל תצוגה עם נתוני Sample קבועים.
הרינדור הוא HTML/CSS inline (לא canvas, לא SVG) — גנרטורים JS שמחזירים `innerHTML` string.

```js
miniList(items)     → div + div × 4 (כותרות עם ▾)
miniCards(items)    → CSS Grid 2×2 עם colored headers
miniMagazine(items) → hero gradient + 2×1 grid
miniTicker(items)   → bordered table עם pulse dot
```

---

### ניווט מקלדת

| מקש | פעולה |
|-----|-------|
| `1` | מצב כותרות |
| `2` | מצב כרטיסיות |
| `3` | מצב מגזין |
| `4` | מצב שורה תחתונה |

פעיל רק כאשר `document.activeElement` אינו `<input>` או `<select>`.

---

### מגבלות ידועות

1. **CORS** — תלוי בזמינות של שרתי proxy ציבוריים חינמיים (rate-limited).
2. **אתרי SPA** — אתרים שמרנדרים תוכן ב-JavaScript בלבד (React/Vue/Next.js) יחזירו HTML ריק; הפרסור יפעיל שכבות נמוכות שיחלצו פחות כתבות.
3. **תמונות** — חלק מאתרים מגדירים `Referrer-Policy` שמונע טעינת תמונות מ-origin אחר; במקרה כזה מוצג placeholder.
4. **קטגוריות** — הניחוש מה-URL הוא heuristic בלבד ואינו מדויק לכל אתר.

---

### סביבת ריצה נדרשת

- דפדפן מודרני עם תמיכה ב: `fetch`, `DOMParser`, `AbortController`, `localStorage`, CSS Grid, CSS Custom Properties
- חיבור אינטרנט לטעינת תוכן (ואופציונלית: Google Fonts)
- **GitHub Pages** — פרוס ישירות, ללא שרת מקומי
- **אין** Node.js, **אין** build process, **אין** תלויות

---

*נבנה כ-POC ל-Dynamic UI/UX — zero-dependency, GitHub Pages ready.*

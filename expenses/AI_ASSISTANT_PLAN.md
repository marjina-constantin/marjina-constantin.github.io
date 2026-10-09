# Plan: AI Assistant pentru Expenses App

> Status: **Faza 0 + Faza 1 implementate, cu varianta C+** (cheia în profilul Drupal și în localStorage, apel direct la Gemini).
> Secțiunile marcate cu **[DECIZIE]** au nevoie de confirmarea ta.
>
> **Ce e implementat:**
> - Profile → *AI assistant*: salvare, test, schimbare și ștergere a cheii; toggle "Share descriptions"; contor de requesturi și tokeni pe zi.
> - Ruta `/expenses/assistant` (tab ✨ în navbar), lazy-loaded: chat cu streaming, Stop, New chat, Copy, tokeni per răspuns, sugestii de întrebări.
> - Sumar compact (~2k tokeni pentru 5 ani) și 4 tools locale: `aggregate`, `query_transactions`, `get_month_summary`, `compare_periods`.
> - Modele: `gemini-3.8-flash` (fallback `gemini-3.5-flash`), `thinkingLevel: low`. Cheia și istoricul de chat se șterg la logout.
>
> - **Faza 2–3 (insight-uri):** buton ✨ pe Home (*Month summary* pentru luna selectată, *All-time overview*), pe Income (*This month*, *All-time income*, plus grafice) și *Explain* pe fiecare grafic din Charts. Detalii:
>   - un singur request, fără tools, cu cifre calculate local (~400–800 tokeni input) și JSON structurat;
>   - respectă filtrele active;
>   - cache local, cu indicatorul "Data changed" și Refresh;
>   - întrebările de continuare deschid chat-ul;
>   - limba insight-urilor se alege în Profile.
>
> - **Fallback de modele:** `gemini-3.8-flash` → `3.5-flash` → `3.5-flash-lite` → `3.1-flash-lite`. Fiecare model are cota lui pe free tier.
>   - La 429, modelul primește un cooldown salvat în localStorage: până la miezul nopții Pacific pentru limita zilnică, sau `retryDelay` pentru limita pe minut.
>   - Când cooldown-ul expiră, se revine la primul model.
>
> **Simplificări față de plan:**
> - Cache-ul de insight-uri stă în localStorage (max 40 intrări), nu în IndexedDB.
> - Sumarul se calculează pe main thread, memoizat (durează câteva ms la ~5k iteme, deci un Web Worker nu merită încă).
> - Istoricul de chat stă în memorie pe durata sesiunii, nu în IndexedDB.

---

## 1. Overview: ce avem acum

### Arhitectura actuală

| Strat | Ce este |
|---|---|
| Frontend | React 18 + TypeScript + Vite, PWA (`vite-plugin-pwa`), SCSS (`App.scss`, ~2600 linii, teme prin CSS vars `--accent-color`, `--bg-color` etc.), iconițe `lucide-react`, grafice Highcharts |
| Hosting | **GitHub Pages** (static). Build-ul se face în GitHub Actions (`.github/workflows/node.js.yml`) și se împinge pe branch-ul `prod` |
| Backend | **Drupal pe Pantheon** (`https://dev-expenses-api.pantheonsite.io`). Login cu Google (`/user/login/google`), apoi JWT trimis în header-ul `JWT-Authorization: Bearer …` |
| Date | `GET /api/expenses` întoarce **toate** itemele (cheltuieli + venituri) într-un singur JSON |
| Offline | IndexedDB (`expenses-db`, v2: store-uri `expenses`, coada offline, metadata de sync). Sync cu rezolvare de conflicte "last updated wins" |
| Procesare | `processData` (Web Worker) calculează `groupedData` pe luni, `totals`, `incomeTotals`, `categoryTotals`, `totalsPerYearAndMonth`, `totalPerYear` etc. Totul ajunge în `DataContext` |

### Modelul de date (`TransactionOrIncomeItem`)

```ts
{ id, dt: '2026-10-08', sum: '125.50', type: 'transaction' | 'incomes',
  cat?: '3', dsc?: 'kaufland #lunch', cr, updated }
```

- 13 categorii fixe (`constants.ts`: Clothing, Food, Housing, Utilities, Travel, Investment…)
- Descrierile sunt mai ales în română, cu **hashtag-uri** (`#happy hour`, `#car service`)
- O singură monedă per user (`currency` în profil)

### Pagini și blocuri existente (unde pot apărea butoanele AI)

| Pagină | Blocuri |
|---|---|
| **Home** (`/expenses`) | Titlu lună, `Filters` (categorie + text), StatCards (Spent / Income / Profit), `TransactionList`, pager lună ← → |
| **Charts** | `TotalTransactionsCount`, `MonthlyTotals`, `YearAverageTrend`, `AllTimeSpendings`, `MonthlyAverage`, `MonthlyAverageTrend`, `SavingsHistory`, `DailyAverage`, `DailyAverageTrend`, `LastTwoMonthsAverage` |
| **Income** | `TotalIncomeCount`, `IncomeFilters`, StatCards (Total / Average), `IncomeList`, `IncomeSources`, `YearIncomeAverageTrend` |
| **Add transaction** | `TransactionForm` (dată, sumă, categorie, descriere + sugestii) |
| **Profile** | Monedă, temă, logout |

### Constrângerea care contează cel mai mult

Aplicația e **statică pe GitHub Pages**. Orice lucru pus în bundle (inclusiv variabilele `VITE_*`) devine **public**. Deci cheia API **nu poate** sta în frontend. Avem nevoie de un mic backend/proxy care ține cheia.

---

## 2. Decizii tehnice

### 2.1 Modelul AI **[DECIZIE]**

**Recomandare: Google Gemini prin Gemini API (Google AI Studio), free tier.**

- **Default: `gemini-3.8-flash`** (cel mai nou Flash GA la data implementării, free tier). Rapid, context de ~1M tokeni, function calling, structured output (JSON schema), streaming.
- **Pentru întrebări grele (opțional): `gemini-2.5-pro`**. Singurul model Pro pe free tier; limitele sunt mult mai mici.
- **Pentru task-uri mici (categorisire, căutare în limbaj natural): `gemini-3.5-flash-lite`**. Cea mai mare cotă gratuită.
- Numele modelelor stau **în config-ul proxy-ului**, nu hardcodate în app, ca să schimbăm modelul fără deploy de frontend.

> ⚠️ **Privacy, important:** pe **free tier**, Google poate folosi prompturile și răspunsurile ca să-și îmbunătățească produsele (inclusiv cu review uman). Pentru date financiare personale e un compromis real. Variante:
> 1. Acceptăm free tier și trimitem doar ce trebuie (vezi 2.4: descrieri opționale, fără ID-uri, fără nume).
> 2. Activăm billing pe proiectul Google Cloud (paid tier = datele **nu** sunt folosite la antrenare). La volumul unei aplicații personale costul e de obicei câțiva cenți pe lună, plus un buget/alertă setat la $1–2.
>
> Limitele free tier (RPM / RPD / TPM) se schimbă des, așa că le verificăm în AI Studio la implementare.

### 2.2 Unde stă API key-ul **[DECIZIE]**

| Opțiune | Cum | Pro | Contra |
|---|---|---|---|
| **A. Cloudflare Worker proxy (RECOMANDAT)** | Worker mic (`ai-proxy/`), cheia e un secret (`wrangler secret put GEMINI_API_KEY`) | Gratuit (100k req/zi), rapid (edge), streaming SSE nativ, nu atinge Drupal, deploy separat | Încă un serviciu de întreținut (dar e ~150 linii) |
| B. Endpoint custom în Drupal (`/api/ai/chat`) | Modul PHP, cheia în Pantheon Secrets | Un singur backend, auth deja existentă | Pantheon dev "adoarme" (de-aia avem ping la 45 min), streaming greu din PHP, timeouts, cold start lent |
| C. BYOK ("bring your own key") | Userul pune cheia în Profile, stocată în `localStorage` | Zero infrastructură | Cheia e expusă la orice XSS și pe orice device, nu merge pentru alți useri |
| ❌ D. `VITE_GEMINI_KEY` în `.env` | — | — | **Cheia ajunge publică în bundle. Exclus.** |

**Recomandare: A**, cu C eventual ca mod de dezvoltare locală.

#### Varianta C+ (pragmatică): cheia în profilul userului (Drupal + localStorage)

Un câmp nou `field_gemini_api_key` pe user în Drupal, editabil în Profile la fel ca `currency` (`PATCH /user/{uid}`), salvat și în `localStorage`. Browserul cheamă **direct** Gemini API (header `x-goog-api-key`), fără proxy.

**De ce e acceptabil pentru o aplicație personală:**
- JWT-ul de sesiune stă **deja** în `localStorage`. Un XSS care ar fura cheia ar fura și sesiunea, deci expunerea e la același nivel cu ce avem acum.
- Pe un proiect Google **fără billing**, cel mai rău scenariu dacă cheia scapă: cineva îți consumă cota gratuită sau Google suspendă cheia pentru abuz. **Nu există cost financiar.** Cheia se regenerează în 1 minut.
- Fiecare user își folosește propria cheie și cotă (dacă aplicația are mai mulți useri).
- Prin Drupal, cheia se sincronizează pe toate device-urile după login.

**Condiții obligatorii (altfel nu e OK):**
1. **Proiect Google Cloud dedicat, fără billing activat.** Asta e cea mai importantă condiție: cu billing activ, o cheie furată înseamnă bani reali.
2. **Cheia restricționată** în Google Cloud Console la **Generative Language API**, plus restricție de **HTTP referrer** pe `marjina-constantin.github.io/*` și `localhost:3000/*`. Restricția se poate ocoli în afara browserului, dar oprește abuzul ocazional.
3. **Acces la câmp în Drupal:** câmpul e vizibil și editabil **doar de userul însuși** (și admin). Se verifică faptul că `GET /user/{uid}` nu-l expune altor useri. Dacă vrem un pas în plus, valoarea se poate cripta la nivel de câmp (modulele `key` + `encrypt`).
4. Cheia se șterge din `localStorage` la logout (o adăugăm în `logout()` din `actions.ts`).
5. În UI, câmpul e de tip password (mascat), cu buton "Test key".
6. Nu loghăm niciodată cheia (`console.log`, notificări, mesaje de eroare).

**Ce pierdem față de proxy (A):**
- Rate limit central și whitelist de modele (le aplicăm doar în client, unde se pot ocoli; pentru uz personal nu contează).
- System prompt-urile stau în bundle, deci sunt publice. Nu conțin nimic secret, deci nu e o problemă.
- Cheia apare în DevTools (Network) și ajunge în backup-urile DB de pe Pantheon (păstrate 60 de zile, prin workflow-ul de backup).

**Ce câștigăm:** zero infrastructură nouă, nimic de deployat sau întreținut. Doar un câmp în Drupal și câteva linii în Profile. Se poate implementa din prima zi.

**Design care permite migrarea ulterioară:** tot codul AI trece printr-un singur `aiTransport` (`src/ai/client.ts`). Transportul are două implementări:
- `direct`: Gemini cu cheia din profil (C+)
- `proxy`: Cloudflare Worker (A)

Dacă mai târziu vrei proxy-ul, se schimbă doar transportul. Restul (context builder, tools, UI, cache) rămâne identic.

> **Recomandare actualizată:** pornim cu **C+** (simplu, suficient de sigur pentru uz personal pe free tier, cu condițiile de mai sus), iar arhitectura rămâne pregătită pentru **A** dacă activezi billing sau aplicația are mai mulți useri.

#### Securitatea proxy-ului (Cloudflare Worker)

1. **CORS strict:** se acceptă doar `https://marjina-constantin.github.io` și `http://localhost:3000`.
2. **Autentificare:** fiecare request vine cu JWT-ul Drupal deja existent (același header `JWT-Authorization`). Worker-ul îl validează:
   - **Varianta rapidă (preferată):** verifică semnătura JWT local, cu cheia JWT a Drupal-ului salvată tot ca secret în Worker (de verificat ce algoritm/cheie folosește modulul `jwt` din Drupal).
   - **Varianta fallback:** worker-ul cheamă un endpoint Drupal ușor (ex. `/user/{uid}?_format=json`) cu tokenul și cache-uiește rezultatul în KV câteva minute.
3. **Allowlist de user ID-uri** (`ALLOWED_UIDS`), dacă vrem să-l limităm la familie.
4. **Rate limiting per user** (Cloudflare Rate Limiting binding sau un counter în KV): ex. 30 req/min, 500 req/zi. Protejează cota free.
5. **Limită de mărime pe request** (ex. 2 MB) și **whitelist de modele** (clientul cere `model: 'flash' | 'pro' | 'lite'`, nu nume arbitrare).
6. Worker-ul **nu loghează** conținutul prompturilor.
7. **Prompt-ul de sistem stă în proxy**, nu în client. Clientul nu-l poate suprascrie, doar trimite `feature` + date + întrebare.

### 2.3 Cum curge un request

Principiul cheie: **datele rămân în browser, iar calculele exacte se fac local în JS. Modelul interpretează, nu adună.** LLM-urile greșesc la aritmetică pe mii de rânduri, iar tu vrei răspunsuri **exacte**.

```
┌──────────────── Browser (React) ────────────────┐
│ DataContext / IndexedDB (toate tranzacțiile)    │
│        │                                        │
│  1. Context Builder: agregate exacte + rânduri  │
│     filtrate, în format compact                 │
│        │                                        │
│  2. POST /chat  {feature, messages, context}    │──► Cloudflare Worker ──► Gemini API
│        │                                        │      (cheie, auth,      (streaming SSE)
│  3a. Stream text → randat live (markdown)       │◄──    rate limit)
│  3b. functionCall → executat LOCAL pe date      │
│      → rezultat trimis înapoi (loop, max ~5)    │
└─────────────────────────────────────────────────┘
```

Avem două mecanisme complementare:

**(a) Context pre-calculat (pentru insight-uri pe blocuri).** Pentru "AI month recap", "Explain this chart" etc., clientul calculează **exact** cifrele relevante (totaluri, medii, comparații, top categorii, outliers) și le trimite împreună cu un prompt specific. Un singur request, răspuns rapid.

**(b) Function calling cu execuție locală (pentru chat liber).** Modelul primește un **sumar compact** (vezi 2.4) și o listă de "tools". Când are nevoie de detalii, cere un tool call, **browserul îl execută pe datele locale** și trimite rezultatul înapoi. Proxy-ul rămâne stateless, doar retransmite. Avantaje:
- răspunsuri exacte (sumele le calculează JS-ul)
- trimitem doar datele necesare, nu tot istoricul la fiecare întrebare
- merge oricât de mare ar fi istoricul

Tools propuse (executate în `src/ai/tools/`):

| Tool | Ce face |
|---|---|
| `query_transactions` | Filtre: `from`, `to`, `type`, `categories[]`, `text`/`hashtag`, `minAmount`, `maxAmount`, `sort`, `limit`. Întoarce rânduri |
| `aggregate` | `groupBy`: `month` / `year` / `category` / `hashtag` / `weekday` / `description`. `metric`: `sum` / `count` / `avg` / `max`, plus filtre |
| `compare_periods` | Două intervale, diferențe pe categorie (absolut și %) |
| `get_month_summary` | Totaluri, income, profit, top categorii, vs media pe 3/12 luni |
| `find_recurring` | Plăți recurente / abonamente (aceeași descriere și sumă similară, lunar) |
| `find_anomalies` | Outliers (z-score / IQR pe categorie) |
| `forecast_month` | Proiecția lunii curente (ritm zilnic și recurente cunoscute) |
| `render_chart` *(UI tool)* | Modelul cere un grafic (`type`, `series`), noi îl randăm cu Highcharts în chat |
| `prefill_transaction` *(UI tool)* | Pregătește un formular de adăugare, **userul confirmă** (nu scrie nimic singur) |

### 2.4 Formatul datelor trimise și optimizarea tokenilor (Context Builder)

> **Principiu:** trimitem **cel mai mic set de date care permite un răspuns exact**. Nu trimitem niciodată JSON-ul brut.

#### Cât costă datele tale actuale (5 ani, JSON ~730 KB)

Estimări, cu ~3–4 caractere/token pentru JSON/cifre. Le măsurăm exact în Faza 1 cu endpoint-ul `countTokens` din Gemini.

Un item din API arată cam așa (~130 caractere):
`{"id":"12345","dt":"2024-01-01","sum":"125.5","type":"transaction","cat":"3","dsc":"kaufland","cr":1700000000,"upd":1700000000}`
deci ~730 KB înseamnă **~5.000–6.000 de iteme**.

| Ce trimitem | Mărime | Tokeni / request | Verdict |
|---|---|---|---|
| JSON brut complet | ~730 KB | **~180–250k** | ❌ Exclus. Free tier-ul Flash are câteva sute de mii de tokeni pe minut, deci 1–2 întrebări ar umple cota pe minut. Plus latență mare (secunde doar pentru citirea input-ului) |
| Toate rândurile în format compact `date\|sum\|cat\|desc` | ~150–180 KB | ~45–60k | ⚠️ Merge tehnic, dar e risipă pentru 95% din întrebări |
| Toate rândurile compact + comprimat (grupat pe lună, doar ziua, dicționar de descrieri) | ~80–110 KB | ~25–35k | ⚠️ Doar ca fallback, pentru analize "pe tot" foarte specifice |
| **Doar agregate** (60 luni × 13 categorii + venituri + top descrieri/hashtag-uri) | ~8–15 KB | **~2–4k** | ✅ Suficient pentru majoritatea întrebărilor |
| **Agregate + rezultate de tools la cerere** (chat) | — | **~4–10k** total pe întrebare | ✅ **Recomandat** |
| Insight pe un bloc (month recap, explain chart) | ~1–3 KB | **~0.8–2k** | ✅ |

**Concluzie:** cu strategia pe niveluri de mai jos, o întrebare tipică costă de **~20–50 ori mai puțin** decât JSON-ul brut, iar răspunsurile sunt **mai exacte**, pentru că sumele le calculează JS-ul, nu modelul.

#### Strategia pe niveluri (de la cel mai ieftin la cel mai scump)

| Nivel | Când | Ce trimitem | Cost |
|---|---|---|---|
| **0. Fără AI** | Calcule pure (totaluri, medii, proiecții, auto-categorie din istoric, recurente evidente) | Nimic, se face local | 0 |
| **1. Cache** | Același insight, aceleași date (hash neschimbat) | Nimic, se citește din IndexedDB | 0 |
| **2. Context pre-calculat** | Insight-uri pe blocuri (recap lună, explain chart, income insights) | Doar cifrele acelui bloc, deja calculate | ~1–2k |
| **3. Sumar + tools** | Chat liber | Sumar compact (~2–4k), apoi doar rezultatele tool-urilor cerute de model | ~4–10k |
| **4. Rânduri brute filtrate** | Modelul chiar are nevoie de text (ex. "ce tipuri de cheltuieli am la Personal?") | Doar rândurile filtrate, cu limită (`limit`, max ~300 rânduri per tool call) | +2–10k |
| **5. Tot istoricul compact** | Excepție rară, cu confirmare ("Analiză completă, durează mai mult") | Format comprimat | ~25–35k |

#### Formatul compact

```
CUR:MDL TODAY:2026-10-09
CAT:1=Clothing 2=Entertainment 3=Food ... 13=Investment

M(month|spent|income|cat:sum,...):
2610|8420|25000|3:3100,6:2500,9:900
2609|...

T 2610 (day|sum|cat|desc):
08|125.5|3|kaufland #lunch
07|500|9|benzina
```

Tehnicile de compresie care contează:
- **Fără chei JSON repetate.** Header-ul de coloane apare o singură dată. Cheile repetate sunt ~60% din JSON-ul actual.
- **Fără câmpuri inutile:** `id`, `cr`, `upd`, `updated`, `failed`, `type` (separăm cheltuieli și venituri în secțiuni).
- **Date scurte:** lună `2610`, apoi doar ziua `08` în cadrul lunii.
- **Sume normalizate:** `125.5`, nu `"125.50"`. Rotunjite la întreg în agregatele mari.
- **Categorii ca ID numeric**, cu dicționar o singură dată.
- **Dicționar de descrieri repetate** (doar la nivelul 5): `kaufland` apare de sute de ori, deci îl trimitem ca `d1` în dicționar și refolosim codul.
- **Ordine deterministă și stabilă** (sortare fixă, fără timestamp-uri variabile în prefix), ca să funcționeze **implicit caching** în Gemini (vezi 2.9).

#### Reguli de context

- **Sumarul** e calculat local, memoizat după hash-ul datelor și recalculat doar după sync, nu la fiecare întrebare.
- **Rândurile detaliate** se trimit doar pentru scope-ul activ (luna sau filtrul curent) sau la cererea modelului prin tools.
- **Tool results limitate:** fiecare tool are `limit` (default 50, max 300) și întoarce agregate în loc de rânduri când se poate. Dacă rezultatul depășește limita, întoarcem `{truncated: true, total: N}` și modelul își rafinează filtrul.
- **Buget de tokeni** (`tokenBudget.ts`): plafon per request (ex. 15k input în chat, 3k pentru insight-uri). Dacă e depășit, coborâm automat la un nivel mai agregat.
- **Fără** nume, email sau `uid`.
- **[DECIZIE]** Toggle în Profile: *"Trimite descrierile la AI"*. Dacă e off, trimitem doar dată, sumă, categorie și hashtag-uri.

### 2.5 Răspunsuri: format și randare

- **Chat:** markdown cu streaming. Randăm cu `react-markdown` + `remark-gfm` (tabele), **lazy-loaded** ca să nu crească bundle-ul principal. Stilizat cu clasele existente (`.stat-card`, `--accent-color`, `$border-radius-lg`).
- **Insight cards (pe blocuri):** **structured output** (JSON schema), ca să le randăm consistent, nu ca text liber:

```ts
{
  headline: string,              // "Octombrie: cu 12% sub medie"
  bullets: { icon: 'up'|'down'|'warn'|'tip'|'info', text: string }[],
  highlights?: { label: string, value: number }[],   // randate cu NumberDisplay
  suggestions?: string[],
  followUps?: string[]           // chip-uri "Ask more" care deschid chat-ul
}
```

- **Grafice în chat:** prin tool-ul `render_chart`, folosind tema existentă (`chartTheme.ts`).
- **Limba [DECIZIE]:** răspunde în limba în care întrebi (RO/EN), cu default setabil în Profile.

### 2.6 Cache, istoric, cotă

- **Cache insight-uri** în IndexedDB (store nou `aiCache`, `DB_VERSION` 2 → 3). Cheia e `feature + period + hash(datele folosite)`. Dacă datele lunii nu s-au schimbat, nu mai cheltuim un request. Butonul "Regenerate" forțează un request nou.
- **Istoric chat** în IndexedDB (store `aiChats`): conversații salvate, cu ștergere.
- **Generare la cerere (on-click), nu automat** la fiecare deschidere de pagină, ca să protejăm cota free. Excepție posibilă: recap-ul lunii curente, generat automat o dată pe zi din cache.
- La **logout** se șterg și `aiCache`/`aiChats` (extindem `clearExpensesDB`).

### 2.7 Offline / PWA

- AI-ul cere internet. Butoanele AI sunt `disabled` cu tooltip "Needs connection" când `navigator.onLine === false` (folosim logica existentă din `syncService`).
- Insight-urile din cache **se afișează și offline**.
- URL-ul proxy-ului **nu** se cache-uiește în service worker.

### 2.9 Optimizare tokeni (input și output) și performanță

#### Tokeni de input

- **Strategia pe niveluri** din 2.4: întâi local, apoi cache, apoi context minim, abia apoi tools.
- **Istoricul conversației se taie inteligent.** La fiecare tură, Gemini primește din nou tot istoricul, deci:
  - păstrăm ultimele ~6 ture complete
  - **rezultatele vechi de tools nu se mai retrimit**, rămâne doar răspunsul final al modelului
  - turele mai vechi se comprimă într-un rezumat scurt (generat cu Flash-Lite, ~200 tokeni)
- **Sumarul se trimite o singură dată per conversație**, la început, ca prefix stabil.
- **Implicit caching (Gemini 2.5+):** când începutul request-ului e identic cu unul recent, Gemini îl reutilizează din cache (mai rapid, iar pe paid tier și mai ieftin). Pentru asta, ordinea e mereu: system prompt, definițiile tool-urilor, sumarul (determinist), istoricul, întrebarea nouă. Partea variabilă stă **la final**.
- **Definițiile tool-urilor sunt scurte** (descrieri concise, fără exemple lungi), ~1–1.5k tokeni în total. Pentru insight-uri **nu** trimitem tools deloc.
- **System prompt-uri scurte și specifice per feature**, păstrate în Worker, nu un prompt mare generic.

#### Tokeni de output (și "thinking")

- **`maxOutputTokens` per feature:** insight card ~400, căutare în limbaj natural ~150, chat ~1200.
- **Thinking budget controlat:** modelele Gemini 2.5 "gândesc" înainte de răspuns, iar tokenii de thinking se numără și ei în cotă.
  - `thinkingBudget: 0` pentru task-uri simple (categorisire, căutare în limbaj natural, quick add)
  - buget mic (~512–1024) pentru insight-uri
  - dinamic doar pentru întrebări complexe în chat
- **Structured output (JSON schema)** pentru carduri. Răspunsul e mai scurt și fără "umplutură" de text.
- **Prompt-ul cere concizie:** "Max 5 bullets, no preamble, no repeating the numbers already shown in the UI".

#### Alegerea modelului (ieftin în mod implicit)

| Task | Model |
|---|---|
| Categorisire, căutare în limbaj natural, quick add, rezumat de istoric | Flash-Lite |
| Insight-uri, chat normal | Flash |
| "Deep analysis" (buton explicit) | Pro |

#### Protecția cotei

- Insight-urile se generează **la click**, nu automat, cu excepția opțiunii configurabile din 2.6.
- **Debounce** pe căutarea în limbaj natural (doar la Enter, nu la fiecare tastă).
- **Deduplicare de request-uri:** dacă același insight e deja în curs, nu pornim altul.
- **Abort** (`AbortController`) când userul închide chat-ul, schimbă luna sau apasă Stop. Nu plătim tokeni pentru un răspuns pe care nu-l mai vede.
- **Limita de tool calls** per întrebare (max ~5 runde), ca modelul să nu intre în bucle.
- **Contor local** de tokeni folosiți (din `usageMetadata` în răspunsul Gemini), afișat discret în Profile. În modul dev se loghează tokenii pe fiecare request.

#### Performanța aplicației

- **Context building într-un Web Worker** (refolosim pattern-ul din `dataProcessor.worker.ts`), ca main thread-ul să nu se blocheze pe 5.000+ iteme.
- **Memoizare după hash-ul datelor:** sumarul și agregatele se recalculează doar după sync sau editare.
- **Lazy loading:** tot modulul AI (`src/ai/*`, `components/ai/*`, `react-markdown`) e un chunk separat, încărcat doar la primul click pe ✨. Bundle-ul inițial nu crește.
- **Streaming (SSE):** primul text apare în ~1s, chiar dacă răspunsul complet durează mai mult.
- **Worker-ul Cloudflare** rulează pe edge, aproape de user, fără cold start relevant și fără să depindă de Pantheon.

### 2.10 Securitate (rezumat complet)

| Zona | Măsură |
|---|---|
| Cheia API | Doar ca secret în Cloudflare Worker. Niciodată în repo, bundle, `localStorage` sau log-uri. Restricționată în Google Cloud Console doar la Gemini API |
| Acces la proxy | CORS strict pe domeniul aplicației, plus JWT Drupal validat la fiecare request, plus allowlist de `uid`-uri |
| Abuz / cost | Rate limit per user (pe minut și pe zi), limită de mărime pe request, whitelist de modele, `maxOutputTokens` impus de proxy (nu de client) |
| Prompt-uri | System prompt-urile stau în Worker. Clientul trimite doar `feature`, date și întrebare, nu poate rescrie instrucțiunile |
| Prompt injection | Descrierile tranzacțiilor sunt tratate ca **date**, nu ca instrucțiuni (delimitate clar în prompt). Tool-urile sunt **read-only** pe date locale. Tool-urile de UI (`prefill_transaction`) **nu scriu nimic** fără confirmarea userului |
| Randare răspuns | `react-markdown` **fără HTML brut** (fără `rehype-raw`). Link-urile externe sunt dezactivate sau marcate. Fără `dangerouslySetInnerHTML` |
| Date trimise | Minim necesar (2.4), fără ID-uri, nume, email. Toggle pentru descrieri. Panou "What was sent" pentru transparență |
| Date stocate | Cache-ul AI și istoricul de chat stau doar local (IndexedDB) și se șterg la logout. Worker-ul nu stochează conversații și nu loghează conținutul |
| Transport | Doar HTTPS. JWT-ul se trimite doar în header, nu în URL |
| Monitorizare | Alertă de buget în Google Cloud (dacă trecem pe paid tier) și log în Worker cu doar metadate (uid, feature, tokeni, status) |

### 2.8 Structura de fișiere propusă

```
expenses/
├── ai-proxy/                     # Cloudflare Worker (deploy separat cu wrangler)
│   ├── src/index.ts              # CORS, auth JWT, rate limit, forward la Gemini, SSE
│   ├── src/prompts.ts            # system prompts per feature
│   └── wrangler.toml
└── src/
    ├── ai/
    │   ├── client.ts             # fetch + parsare SSE, abort, retry, erori
    │   ├── config.ts             # AI_PROXY_URL (public, fără secret)
    │   ├── context/
    │   │   ├── buildContext.ts   # sumar + rânduri filtrate
    │   │   ├── serializers.ts    # format compact
    │   │   ├── aggregates.ts     # calcule exacte (refolosește dataProcessing)
    │   │   └── tokenBudget.ts
    │   ├── tools/
    │   │   ├── definitions.ts    # schema tools pentru Gemini
    │   │   └── executors.ts      # execuție locală pe date
    │   ├── cache.ts              # aiCache / aiChats în IndexedDB
    │   └── hooks/
    │       ├── useAiChat.ts      # conversație, streaming, tool loop
    │       └── useAiInsight.ts   # insight structurat + cache
    ├── components/ai/
    │   ├── AiButton.tsx          # butonul ✨ reutilizabil (Sparkles din lucide)
    │   ├── AiInsightCard.tsx     # randare insight structurat
    │   ├── AiSheet.tsx           # bottom sheet pe mobil / panou lateral pe desktop
    │   ├── AiChat.tsx, AiMessage.tsx, AiMarkdown.tsx, AiChart.tsx
    │   └── AiSuggestedPrompts.tsx
    └── pages/Assistant/index.tsx # ruta /expenses/assistant
```

Fără dependențe grele noi în frontend. Fără SDK Gemini în browser (vorbim doar cu proxy-ul prin `fetch`). Singurele adăugate: `react-markdown` + `remark-gfm` (lazy).

---

## 3. Funcționalități propuse

### 3.1 Chatbot (Assistant)

- **Acces [DECIZIE]:**
  - (a) tab nou în `Navbar` (iconiță `Sparkles`) cu ruta `/expenses/assistant`, sau
  - (b) buton flotant ✨ pe toate paginile, care deschide un `AiSheet`, sau
  - (c) ambele: pagina pentru conversații lungi, sheet-ul pentru întrebări rapide din context. **Recomand (c).**
- **Context-aware:** dacă deschizi chat-ul de pe Home cu luna "September 2026" și filtrul "Food", chat-ul știe asta ("Întreabă despre: Food, Sept 2026", cu un chip care se poate scoate).
- **Prompt chips sugerate**, schimbate după context:
  - "Cât am cheltuit pe mâncare luna asta vs. luna trecută?"
  - "Care sunt abonamentele mele și cât mă costă pe an?"
  - "Unde pot economisi 2000 luna viitoare?"
  - "Care a fost cea mai scumpă lună și de ce?"
  - "Câți bani am dat pe #happy hour în 2025?"
  - "Ce rată de economisire am avut anul ăsta?"
- Streaming, buton **Stop**, **Copy**, **Regenerate**, follow-up chips.
- **Transparență:** link discret "What was sent", care arată exact datele trimise la model.
- Răspunsuri cu **cifre exacte** (din tools) și **grafice inline** când ajută.

### 3.2 Home (luna selectată)

- **✨ AI Month Recap**: un card între StatCards și listă, colapsabil:
  - headline ("Octombrie: 8.420, cu 12% sub media pe 12 luni")
  - top 3 categorii vs. medie, cea mai mare cheltuială, cheltuieli neobișnuite
  - pentru **luna curentă**: **proiecție de final de lună** (calculată local) și "ritm" (ești pe drum să depășești media la Food)
  - 1–2 sugestii concrete
- **AI pe toată perioada**: "Your money story". Overview pe tot istoricul: evoluție, ani buni/răi, tendințe pe categorii, schimbări de obiceiuri.
- **Căutare în limbaj natural** în `Filters`: scrii "benzină anul trecut peste 500" și AI-ul (Flash-Lite, structured output) o traduce în filtre existente (categorie + text + interval). Ieftin și foarte util.
- **Explain item** (opțional, la swipe sau long-press): "De ce e neobișnuită cheltuiala asta?" (comparată cu istoricul aceleiași descrieri sau categorii).

### 3.3 Income

- **✨ Income Insights** pentru luna curentă și pentru toată perioada:
  - stabilitatea veniturilor (variație lună de lună), surse principale (din descrieri: salary, bonus, freelance…)
  - **rata de economisire** (income − spent) / income pe lună și an, cu trend
  - luni cu deficit și cauza lor
  - sugestii: "În luni cu bonus cheltuiești +30% pe Entertainment"
- Buton ✨ pe `IncomeSources` și `YearIncomeAverageTrend` (vezi 3.4).

### 3.4 Charts: "Explain this chart"

- Un wrapper generic `AiChartInsight` pus în jurul fiecărui `ChartSection`. Butonul ✨ din colț trimite **seriile exacte ale graficului** (ce vede userul) plus un prompt specific tipului de grafic.
- Exemple:
  - `MonthlyTotals` → "Care luni ies din tipar și de ce?"
  - `SavingsHistory` → "Ești pe trend bun? Ce s-a schimbat?"
  - `DailyAverageTrend` → "Media zilnică crește? De la ce categorie?"
  - `AllTimeSpendings` → "Ce procent merge pe necesități vs. dorințe?"
- Rezultatul apare ca `AiInsightCard` sub grafic, cu chip-uri "Ask more" care deschid chat-ul cu contextul graficului.

### 3.5 Add Transaction

- **Auto-categorie**: când scrii descrierea, sugerăm categoria. **Mai întâi local** (din istoric: "kaufland" → Food în 98% din cazuri, fără AI și fără cost), cu AI doar ca fallback pentru descrieri noi.
- **Quick add în limbaj natural**: "benzina 500 ieri" sau "cafea 45 și croissant 30 azi" → AI-ul precompletează formularul (unul sau mai multe items) → **userul confirmă**.
- (Viitor) **Scan bon fiscal**: fotografiezi bonul, Gemini (multimodal) extrage suma, data și categoria, apoi confirmi.

### 3.6 Profile: AI Settings

- On/off AI
- Limba răspunsurilor
- "Trimite descrierile" on/off
- Model preferat pentru chat (Fast / Smart)
- Clear AI history & cache
- (Opțional) contor de requesturi azi

### 3.7 Idei extra (faze ulterioare)

- **Detector de abonamente și recurente** (local plus explicație AI): lista lor, cost anual, "nu l-ai mai folosit?"
- **Bugete sugerate** pe categorie (media pe 3–6 luni, cu ajustare), afișate ca progres pe Home
- **Goals / What-if**: "Vreau să strâng 50.000 până în iunie. Cât trebuie să tai și de unde?", "Ce-ar fi dacă reduc Entertainment cu 30%?"
- **Digest lunar**: la începutul lunii, card "Luna trecută pe scurt" (din cache, generat o dată)
- **Comparații sezoniere**: "Decembrie e mereu cu +40%: pregătește-te"
- **Auto-hashtag**: sugestii de taguri din descriere
- **Data quality**: duplicate probabile (aceeași sumă și descriere în aceeași zi), descrieri goale

---

## 4. UI / stil

- **Iconiță consistentă:** `Sparkles` (lucide) peste tot unde e AI.
- **Accent:** gradient subtil pe baza `--accent-color` / `--accent-gradient-color` (urmează tema activă, ca restul aplicației).
- **Loading:** skeleton cu shimmer în forma cardului, nu spinner, plus text de stare ("Analyzing 342 transactions…").
- **Mobil:** `AiSheet` ca bottom sheet (swipe down ca să închizi). **Desktop:** panou lateral dreapta.
- **Erori prietenoase:** "Limit reached for today", "Offline", "Try again", cu buton retry.
- **Disclaimer mic:** "AI can make mistakes. Numbers are calculated from your data."
- Card-urile AI refolosesc stilul `.stat-card` / `.charts-section` (border radius, fundal, umbre), cu un mic badge "AI".

---

## 5. Faze de implementare

| Fază | Conținut | Rezultat |
|---|---|---|
| **0. Setup** | Proiect Google Cloud dedicat **fără billing**, cheie restricționată (API și referrer). **C+:** câmp `field_gemini_api_key` în Drupal, plus câmp în Profile, plus ștergerea la logout. **(sau A:** Cloudflare Worker cu CORS, JWT, rate limit, streaming**)** | Cheia configurată și testată ("Test key") |
| **1. Core + Chat MVP** | `src/ai/*` (client, context builder, tools de bază: `query_transactions`, `aggregate`, `get_month_summary`). Pagina Assistant și sheet-ul, markdown, streaming, chips. **Măsurăm tokenii reali** (`countTokens`) pentru fiecare format din 2.4 pe datele tale și ajustăm pragurile | Chat care răspunde exact la întrebări despre date, cu cost măsurat |
| **2. Insights pe pagini** | `useAiInsight` + `AiInsightCard` + cache IndexedDB. Month Recap (Home), All-time story, Income Insights | Butoane ✨ pe Home și Income |
| **3. Charts + căutare** | `AiChartInsight` pe toate graficele. Căutare în limbaj natural în `Filters` | AI pe fiecare grafic |
| **4. Add transaction** | Auto-categorie locală + AI fallback, quick add în limbaj natural | Adăugare mai rapidă |
| **5. Extra** | Abonamente, bugete, goals/what-if, `render_chart` în chat, settings, scan bon | Funcționalități avansate |

Fiecare fază e livrabilă separat (commit-uri sau PR-uri mici).

---

## 6. Riscuri și mitigări

| Risc | Mitigare |
|---|---|
| Cota free se termină | Strategia pe niveluri (2.4), cache, thinking budget mic, `maxOutputTokens`, istoric tăiat, Flash-Lite pentru task-uri mici, rate limit, mesaj clar în UI |
| Halucinații pe cifre | Cifrele le calculează JS-ul (context pre-calculat și tools). Prompt-ul cere explicit "use only provided numbers". Cifrele sunt randate din date, nu din text, unde se poate |
| Date personale la Google (free tier) | Toggle pentru descrieri, fără ID-uri sau nume, sau paid tier cu buget minim |
| Cheia expusă | Doar în Worker secrets. CORS, JWT, allowlist, rate limit |
| Bundle mai mare | Tot ce ține de AI e lazy-loaded (`React.lazy`), `react-markdown` doar în chat |
| Pantheon lent sau adormit | Proxy-ul nu depinde de Drupal (dacă validăm JWT local) |
| Modelele Gemini se redenumesc sau se retrag | Numele modelelor stau în config-ul Worker-ului, cu alias-uri `flash` / `pro` / `lite` |

---

## 7. Întrebări deschise pentru tine

1. **Hosting cheie:** pornim cu **C+** (câmp în profil Drupal + localStorage) sau direct cu **Cloudflare Worker** (A)? Pentru C+: poți crea câmpul `field_gemini_api_key` pe user în Drupal, cu acces doar pentru userul însuși?
2. **Free tier vs. paid tier minim** pentru privacy (2.1)?
3. **Descrierile** se trimit la AI by default sau nu?
4. **Acces chat:** tab nou în navbar, buton flotant, sau ambele?
5. **Limba răspunsurilor:** RO default, EN, sau "limba întrebării"?
6. **Cine folosește aplicația:** doar tu (allowlist de uid-uri) sau mai mulți useri?
7. **Insight-uri:** doar on-click, sau recap-ul lunii curente auto (o dată pe zi, cached)?
8. Cu ce fază începem după aprobare? (Recomand 0 + 1.)
9. Ai acces la configurația modulului JWT din Drupal (cheia/algoritmul), pentru validarea locală în Worker?

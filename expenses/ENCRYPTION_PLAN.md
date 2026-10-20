# Plan: criptare client-side („Lock my data”) pentru Expenses App

> Status: **implementat** (`src/crypto/`, `src/components/privacy/`). Motorul de lock/unlock e testat contra unui Drupal simulat; UI-ul încă nu e testat pe un cont real.
> Abateri mici față de plan:
> - Blocarea editării în timpul tranziției e în `offlineAPI.ts` (o verificare la început în add/update/delete), așa că formularele nu se ating.
> - `fetchServerItem` nu mai întoarce `null` la erori de rețea sau de decriptare, doar la 404. Înainte, o eroare de rețea ștergea itemul local și renunța la update.
> - Un item D (cu ambele versiuni) care nu se potrivește la verificare: la lock se recriptează din plain; la unlock e lăsat neatins și raportat.
> Drupal e gata: `payload` în `/api/expenses`, `current_user.encryption_status` la login, statusurile `off` · `migrating` · `on` · `unlocking`.

**Scop:** un user poate „bloca” contul. După lock, sumele, datele, descrierile și categoriile lui stau în Drupal doar criptate, cu o cheie pe care Drupal (și adminul) nu o are niciodată. Userul poate oricând să revină la date în clar (unlock).

**Principii, în ordinea priorității:**

1. **Zero data loss.** Niciun pas nu șterge o versiune a datelor (în clar sau criptată) până nu există cealaltă versiune, verificată pe server.
2. **Reluabil oricând.** Orice întrerupere (tab închis, offline, JWT expirat, eroare) lasă datele consistente. Procesul continuă de unde a rămas.
3. **Non-invaziv.** Aplicația rămâne offline-first, exact ca azi. Criptarea există doar la granița cu serverul.
4. **Fără surprize.** Când lipsește cheia, aplicația nu trimite nimic și nu ascunde nimic în tăcere: oprește sync-ul și cere cheia.

**Scope:** doar `transaction` și `incomes` (aplicația asta). Loans/payments sunt în altă aplicație, la alt developer (vezi [§13](#13-coordonare-cu-aplicația-de-loans)).

---

## 1. Ce avem acum (relevant pentru criptare)

| Zonă | Fișier | Ce face |
|---|---|---|
| Login | `context/actions.ts` → `loginUser` | POST `/user/login/google`, salvează tot răspunsul în `localStorage.currentUser` |
| Auth state | `context/reducer.ts` | `userDetails`, `token`, `currency` din `localStorage` |
| Citire server | `utils/syncService.ts` → `pullAndMergeFromServer` | GET `/api/expenses`, convertește, face merge cu IndexedDB |
| Citire un item | `syncService.ts` → `fetchServerItem` | GET `/node/{id}` (verificare de conflict la update) |
| Conversie | `syncService.ts` → `convertNodeDataToItem` | API/node → `TransactionOrIncomeItem` |
| Scriere | `utils/offlineAPI.ts` | Scrie în IndexedDB și pune operația în coadă, cu `data: formData` (body-ul Drupal) |
| Trimitere | `syncService.ts` → `syncOperation` | `JSON.stringify(operation.data)` → POST/PATCH/DELETE |
| Fallback | `utils/utils.ts` → `fetchData` | Dacă sync-ul eșuează, face GET direct pe `/api/expenses` și salvează în IndexedDB **fără conversie** |
| Logout | `actions.ts` → `logout` | Golește store-ul `expenses`. Coada offline și metadata rămân (**nu le schimbăm**) |

Formularele trimit:

```ts
{ type: 'transaction', title: [date], field_amount: [..], field_category: [..],
  field_date: [..], field_description: [..] }
```

`title` = data, deci e o scurgere în clar. Pentru userii blocați devine o constantă.

---

## 2. Unde se criptează: doar la granița cu serverul

Aplicația rămâne **offline-first, neschimbată**:

```
 Formulare ─► IndexedDB (plain) ─► coada offline (plain) ─┐
                    ▲                                     │
                    │ decrypt                             │ encrypt
                    │                                     ▼
                  ┌─┴─────────────── nodeCodec ──────────────┐
                  │   singurul loc unde există criptare      │
                  └─▲─────────────────────────────────────┬──┘
                    │ GET /api/expenses, GET /node/{id}   │ POST / PATCH /node
                    │ răspuns POST / PATCH                ▼
                  ─────────────────── Drupal ──────────────────
```

- IndexedDB (`expenses`, coada offline, metadata) conține date **în clar**, ca azi. Sunt pe device-ul userului, deci e OK.
- Listele, filtrele, `processData`, graficele, AI-ul și formularele citesc și scriu în clar, ca azi.
- Doar trimiterea spre Drupal și citirea de la Drupal trec prin `nodeCodec` (detalii în [§5](#5-citire-server--item) și [§6](#6-scriere-item--server)).

Consecință: offline, aplicația merge identic pentru userii blocați. Cheia e necesară doar când se vorbește cu serverul.

---

## 3. Model de date

### Drupal

| Câmp | Unde | Valori |
|---|---|---|
| `field_encrypted_payload` | `transaction`, `incomes` (și loan/payment) | text lung (ciphertext) sau gol |
| `field_encryption_status` | user | `off` · `migrating` · `on` · `unlocking` |
| `field_amount`, `field_date`, `field_description`, `field_category` | noduri | **non-required**, ca să poată fi golite |

`/api/expenses` întoarce în plus `payload` (`null` pentru itemele în clar).

### Statusul userului

```
          lock                        finalizare
  off ───────────► migrating ─────────────────► on
   ▲                  │                          │
   │                  │ cancel                   │ unlock
   │                  ▼                          ▼
   └──────────────── unlocking ◄─────────────────┘
       finalizare
```

- `migrating` și `unlocking` sunt stări de tranziție. În ambele, scrierile normale sunt blocate pe **orice** device.
- „Cancel” în timpul lock-ului înseamnă unlock pe datele deja migrate (motorul e același, vezi [§8](#8-flow-ul-de-unlock)).

### Starea unui item, pe server

| Stare | Plain | `payload` | Când apare |
|---|---|---|---|
| **P** (plain) | da | gol | user unlocked, sau neatins încă |
| **D** (dual) | da | da | la mijlocul unui lock sau unlock |
| **E** (encrypted) | gol | da | user locked |

Regula de citire e una singură: **dacă `payload` există, el e sursa adevărului; altfel, câmpurile plain.** Orice amestec P/D/E se citește corect, deci reluarea e sigură în ambele direcții.

### Ce rămâne vizibil adminului (asumat, documentat în UI)

- numărul de iteme, tipul (`transaction` / `incomes`), `created` / `changed`
- `title` = constantă (`"•"`)
- `field_currency`, numele și emailul userului
- `field_gemini_api_key`, nemodificat (vezi [§14](#14-ai-assistant))
- datele din aplicația de loans, dacă userul o folosește (vezi [§13](#13-coordonare-cu-aplicația-de-loans))

---

## 4. Criptografie

Totul cu **WebCrypto** (`crypto.subtle`), fără dependențe noi.

### Cheia

- 32 bytes random (`crypto.getRandomValues`), AES-GCM-256.
- Format afișat: `exk1-` + base32 fără ambiguități (fără `0/O/1/I`), grupat câte 4, plus un **checksum de 4 caractere** (primele biți din SHA-256 peste cheie).
  Exemplu: `exk1-7KQM-R2XD-…-H4TZ` (~60 caractere).
- Checksum-ul prinde orice typo la paste **înainte** să atingem datele.
- Nu există salt sau KDF: cheia e random, nu o parolă.

### Payload

Plaintext (JSON, înainte de criptare):

```json
{ "v": 1, "sum": "125.50", "dt": "2026-10-08", "dsc": "kaufland #lunch", "cat": "3" }
```

Format stocat în `field_encrypted_payload`:

```
v1.<iv base64url, 12 bytes>.<ciphertext+tag base64url>
```

- IV nou, random, pentru **fiecare** scriere.
- **AAD** (date autentificate, necriptate) = `exp:v1:<uid>:<type>`. Un payload copiat de admin la alt user sau la alt tip nu se decriptează.
- Prefixul `v1.` permite schimbarea formatului mai târziu fără ambiguitate.

### Verificarea cheii

Nu stocăm nimic despre cheie pe Drupal. O cheie se verifică astfel:

1. checksum-ul din format e valid;
2. decriptarea unui `payload` existent reușește (AES-GCM eșuează sigur cu cheie greșită).

Dacă nu există încă niciun payload (cont gol), e suficient checksum-ul.

### Unde ținem cheia local

- `localStorage`, cheia `expensesEncryptionKey`, în formatul `exk1-…`.
- La pornire se importă o dată într-un `CryptoKey` ținut în memorie, ca să nu parsăm la fiecare item.
- Durata de viață e aceeași ca JWT-ul: rămâne la refresh și se șterge la logout.
- **Profile → Privacy → „Copy key”** e disponibil oricând cât userul e logat și are cheia.

Compromisul asumat: un script XSS poate citi cheia din `localStorage`. Același script ar putea citi și JWT-ul și datele din IndexedDB, deci nu deschidem o suprafață nouă.

---

## 5. Citire: server → item

Un singur modul nou: `src/crypto/nodeCodec.ts`.

```ts
decodeServerRecord(record, ctx): Promise<DecodeResult>
// DecodeResult = { kind: 'ok', item } | { kind: 'locked', id } | { kind: 'corrupt', id }
```

Înlocuiește `convertNodeDataToItem` în **toate** locurile:

- `pullAndMergeFromServer` (lista)
- `fetchServerItem` (verificarea de conflict la update)
- răspunsul la POST/PATCH din `processPendingOperations`
- fallback-ul din `utils.fetchData`. Acesta azi salvează răspunsul brut. Îl trecem prin același decoder, iar pentru userii cu status ≠ `off` fallback-ul e dezactivat.

Logica pe item:

1. `payload` gol → item din câmpurile plain (exact codul de acum).
2. `payload` prezent + cheie → decriptare → item. Câmpurile plain se ignoră.
3. `payload` prezent, fără cheie → `locked` (aplicația intră în „Key needed”, vezi [§9](#9-device-nou--cheie-lipsă)).
4. Decriptarea eșuează cu cheia corectă (verificată pe alte iteme) → `corrupt`.

**Protecție de date la citire:**
- Itemele `locked` și `corrupt` **nu** se scriu în IndexedDB ca iteme goale sau cu sumă 0, ca să nu strice totalurile.
- Nu se pun niciodată în coadă pentru update sau delete.
- Merge-ul nu le consideră „șterse de pe server”: rămân ce erau local.
- Dacă există iteme `corrupt`, apare un banner: „N items couldn't be decrypted”. Nimic nu se șterge automat.

---

## 6. Scriere: item → server

Tot în `nodeCodec.ts`:

```ts
encodeNodeBody(formData, ctx): Promise<object>
```

Apelat **doar** în `syncOperation`, chiar înainte de `fetch`. Coada continuă să conțină `formData` în clar, ca acum.

| Status curent | Body trimis |
|---|---|
| `off` | `formData` neschimbat (comportament identic cu azi) |
| `on`, cu cheie | `type`, `title: ['•']`, `field_encrypted_payload: [ciphertext]`, `field_amount: []`, `field_date: []`, `field_description: []`, `field_category: []` |
| `on`, fără cheie | **nu se trimite.** Operația rămâne în coadă (fără `retryCount++`), sync-ul e pus pe pauză |
| `migrating` / `unlocking` | **nu se trimite.** Operația rămâne în coadă până se termină tranziția (scrierile sunt oricum blocate în UI) |

De ce criptăm la trimitere, nu la punerea în coadă:
- o operație pusă în coadă înainte de lock pleacă criptată după lock (și invers, după unlock pleacă în clar);
- dacă statusul se schimbă între timp (alt device), contează starea de la momentul trimiterii;
- un singur loc de testat.

**DELETE** nu are body, deci nu se schimbă.

**Regula de siguranță:** dacă statusul e necunoscut, se tratează ca `on` + „key needed”, nu ca `off`. E mai bine să nu trimitem decât să trimitem în clar.

---

## 7. Flow-ul de lock

### 7.1 UI: Profile → „Privacy”

Status `off`:

> **Lock my data**
> Your expenses get encrypted on this device before they're sent. Nobody else, including the server admin, can read them. **If you lose the key, your data is gone for good.**
> [Lock my data]

Status `on`:

> **Your data is locked** 🔒
> [Copy key] [Save key to Google Drive] [Unlock my data]

### 7.2 Wizard, pas cu pas

**Pasul 1 — Pre-flight.** Butonul Continue e dezactivat până trec toate:
- online;
- coada offline e **goală** (se face flush automat; dacă există iteme `failed`, userul le rezolvă întâi);
- un pull proaspăt de pe server a reușit;
- JWT-ul expiră în mai mult de 1h (altfel: „Log in again first”).

**Pasul 2 — Cheia**
- Dacă în Drive există deja o cheie (un lock anterior), wizard-ul o propune: „Use the key from Google Drive”. Așa nu se ajunge la două chei diferite.
- Altfel: „Generate key” → cheia afișată monospace, cu buton **Copy**.
- **Save to Google Drive** (recomandat). După salvare, fișierul se recitește din Drive și se compară cu cheia. Abia apoi apare ✓.
- Checkbox: „I saved my key somewhere safe”.
- Continue e activ doar dacă (Drive ✓) **sau** (Copy apăsat + checkbox bifat).
- Cheia se scrie în `localStorage` **înainte** de pasul 3.

**Pasul 3 — Confirmare.** Userul tastează `LOCK`. Textul spune clar:
- formularele sunt dezactivate în timpul procesului, dar datele se pot citi;
- tab-ul se poate închide, iar procesul continuă data viitoare.

**Pasul 4 — Rulare.** Motorul ([§7.3](#73-motorul-de-tranziție)), cu progresul din [§10](#10-progres-ui).

**Pasul 5 — Gata.** Status `on`, mesaj de succes, plus reminder: „Your key is in Google Drive / wherever you saved it”.

### 7.3 Motorul de tranziție

Fișier nou: `src/crypto/migration.ts`. E același pentru lock și unlock, cu direcția ca parametru.

Proprietatea principală: **e stateless față de server.** Ce mai e de făcut se deduce mereu dintr-un GET proaspăt pe `/api/expenses`, nu din progres salvat local. Reluarea e trivială și corectă de pe orice device care are cheia.

**Lock** (`direction = 'lock'`):

```
  0. PATCH user field_encryption_status = 'migrating'   (dacă nu e deja)
  1. GET /api/expenses → clasifică fiecare item: P / D / E

  Faza 1 — Encrypt  (P → D):  pentru fiecare item P
     - payload = encrypt(plain)
     - verificare locală: decrypt(payload) == plain (normalizat), altfel STOP
     - PATCH node: { type, field_encrypted_payload: [payload] }
       (câmpurile plain NU se ating)

  Faza 2 — Verify:
     - GET /api/expenses din nou
     - pentru FIECARE item D: decrypt(payload) == câmpurile plain
     - orice nepotrivire → itemul revine în faza 1, nu trece în faza 3

  Faza 3 — Clean up  (D → E):  doar pentru itemele verificate
     - PATCH node: { type, title: ['•'], field_amount: [], field_date: [],
                     field_description: [], field_category: [] }

  4. GET final: zero iteme P sau D?
     - da  → PATCH user status = 'on'
     - nu  → reia de la pasul 1 (max 3 bucle, apoi STOP cu raport)
```

De ce trei faze și nu un singur PATCH (criptează + golește):
- Până la faza 3, **fiecare item are încă versiunea în clar pe server.** Orice bug în criptare, în cheie sau în Drupal (ex: câmpul nu se salvează) e prins la verificare, fără pierderi.
- Faza 3 pornește doar după ce serverul a confirmat că păstrează ciphertext-ul corect.
- Costul e de ~2× requesturi. La ~5k iteme și concurență 8, estimez câteva minute pe fază.

**Concurență:** 8 requesturi în paralel, cu pauză scurtă la fiecare 50.

**Normalizarea la comparare:** `sum` numeric (`"125.5"` == `"125.50"`), `dt` primele 10 caractere, `cat` string, `dsc` cu trim (gol == `null`).

### 7.4 Retry și erori

Pe fiecare request, la fel pentru lock și unlock:

| Răspuns | Acțiune |
|---|---|
| rețea / timeout / 5xx / 429 | retry cu backoff 1s → 3s → 9s → 27s; după 4 eșecuri, **Pause** cu mesaj și buton Retry |
| 403 | verifică JWT-ul (ca `handleAuthError`). Dacă e expirat: **Pause**, statusul rămâne cel de tranziție, se cere re-login. Fără logout forțat în mijlocul procesului, ca să nu se șteargă cheia |
| 404 | itemul a fost șters între timp → skip |
| 422 / alt 4xx | STOP pe item, raport cu `id` și mesajul Drupal; celelalte continuă; itemul rămâne într-o stare sigură (P sau D) |

**Pause** e oricând sigur, în orice fază. Itemele rămân P, D sau E, toate citibile corect.

### 7.5 Ce se întâmplă cu restul aplicației în timpul tranziției

- Formularele add/edit/delete sunt dezactivate („Locking in progress” / „Unlocking in progress”). Citirea funcționează normal, din IndexedDB.
- `syncPendingOperations` și `pullAndMergeFromServer` nu pornesc cât rulează motorul. Se adaugă un flag `migrationActive` verificat în `runExclusive`.
- După final: pull complet + reprocesare, ca de obicei.

### 7.6 Reluare după întrerupere

La pornirea aplicației sau la login, dacă statusul e `migrating` sau `unlocking`:

| Cheie locală | Ce vede userul |
|---|---|
| da | bara de reluare ([§10](#10-progres-ui)) cu „Continue” |
| nu | flow-ul „Key needed” ([§9](#9-device-nou--cheie-lipsă)), apoi bara de reluare |

Reluarea e **manuală** (butonul Continue), nu automată: userul vede ce se întâmplă.

---

## 8. Flow-ul de unlock

Readuce datele în clar pe server. E și plasa de siguranță: cât există cheia, orice lock se poate anula.

### 8.1 Când se poate porni

- din Profile → Privacy → **Unlock my data** (status `on`);
- din bara de progres a unui lock în curs: **Cancel** (status `migrating`). Motorul pornește de la amestecul curent P/D/E.

### 8.2 Wizard

1. **Pre-flight:** la fel ca la lock (online, coadă goală, pull proaspăt, JWT valid, cheie prezentă).
2. **Confirmare:** userul tastează `UNLOCK`. Textul spune clar: „Your data will be readable by the server admin again.”
3. **Rulare:** motorul, cu `direction = 'unlock'`.
4. **Gata:** status `off`. Opțiuni:
   - checkbox „Also delete the key from Google Drive” (debifat implicit);
   - cheia din `localStorage` se șterge automat, nu mai e necesară.

### 8.3 Motorul, invers

```
  0. PATCH user field_encryption_status = 'unlocking'
  1. GET /api/expenses → clasifică: P / D / E

  Faza 1 — Decrypt  (E → D):  pentru fiecare item E
     - plain = decrypt(payload)   (eroare → STOP pe item, rămâne E, raport)
     - PATCH node: { type, title: [plain.dt], field_amount: [plain.sum],
                     field_date: [plain.dt], field_description: [plain.dsc],
                     field_category: [plain.cat] }
       (payload-ul NU se atinge)

  Faza 2 — Verify:
     - GET /api/expenses din nou
     - pentru FIECARE item D: câmpurile plain == decrypt(payload)
     - nepotrivire → itemul revine în faza 1

  Faza 3 — Clean up  (D → P):  doar itemele verificate
     - PATCH node: { type, field_encrypted_payload: [] }

  4. GET final: zero iteme D sau E?
     - da  → PATCH user status = 'off'
     - nu  → reia de la pasul 1 (max 3 bucle, apoi STOP cu raport)
```

Aceeași garanție ca la lock: payload-ul se șterge doar după ce versiunea în clar e pe server și verificată.

---

## 9. Device nou / cheie lipsă

Trigger: status ≠ `off` și nu există cheie în `localStorage`. Se întâmplă la login pe device nou, după logout, după ștergerea datelor browserului.

Ecran dedicat, „Unlock your data”, în locul listei:
- **[Get key from Google Drive]**
- **[Paste key]** → validează checksum-ul, apoi decriptează un payload de test.
- Link „Lost your key?” → explică onest că datele nu pot fi recuperate. Ce poate face userul: logout sau contact admin. **Nu** oferim din aplicație un „reset” care șterge date.

Până la deblocare:
- sync-ul de trimitere e pe pauză, coada se păstrează;
- itemele criptate nu se scriu în IndexedDB;
- formularele sunt dezactivate.

---

## 10. Progres UI

Componentă nouă: `MigrationProgress.tsx`, cu două forme. Folosește variabilele de temă existente (`--accent-color`, `--bg-color`), deci arată bine pe toate temele.

### Card mare (cât rulează)

```
 ┌──────────────────────────────────────────────┐
 │  🔒 Locking your data                        │
 │                                              │
 │   ● Encrypt ─── ● Verify ─── ○ Clean up      │
 │                                              │
 │  ███████████████████░░░░░░░░░░░░░   58%      │
 │                                              │
 │  2,790 of 4,812 items · about 3 min left     │
 │  You can keep browsing. Editing is paused.   │
 │                                              │
 │          [Minimize]      [Pause]             │
 └──────────────────────────────────────────────┘
```

- **Stepper** cu cele trei faze. Faza curentă pulsează ușor, cele terminate au ✓.
- **Bara de progres** cu gradient din culoarea temei și tranziție lină (`transition: width 300ms`). Procentul total e ponderat: Encrypt 45%, Verify 10%, Clean up 45%.
- **Numărătoare + ETA:** ETA din media mobilă a ultimelor ~20 de requesturi. Apare abia după primele 20, ca să nu sară.
- **Linie de status contextuală:** „Retrying in 9s…”, „Offline — waiting for connection”, „Session expired — log in to continue”.
- **Minimize** → card mic.
- La final: animație scurtă de succes (bara devine ✓, lacătul se închide), apoi cardul dispare.

### Card mic (minimizat sau pe pauză)

Un pill lângă `SyncStatusIndicator`, cu progresul circular și procentul („🔒 58%”). La click se redeschide cardul mare.

Pe pauză sau după întrerupere devine o bară sus în pagină:

> 🔒 Locking paused at 58% · [Continue]  ·  [Cancel]

(La unlock: „Unlocking paused at 40% · [Continue]”.)

### Raport de erori

Dacă unele iteme au eșuat (422 etc.), după final apare o listă scurtă: data, suma, motivul, cu **[Retry these]**. Itemele rămân într-o stare sigură până atunci.

---

## 11. Google Drive ca seif pentru cheie

Drive ține **doar cheia**, nu datele.

- **Login-ul nu se schimbă.** Rămâne `openid email profile`, același redirect implicit.
- Pentru Drive se cere un token separat, la click pe „Save to Drive” / „Get key from Drive”, cu scope `https://www.googleapis.com/auth/drive.appdata`.
- Mecanism: **Google Identity Services token client** (`google.accounts.oauth2.initTokenClient`, script încărcat lazy). E un popup, fără redirect, deci nu pierdem starea wizard-ului.
- Fișier: `expenses-key.json` în `appDataFolder`:
  ```json
  { "v": 1, "uid": "42", "key": "exk1-…", "createdAt": "2026-10-20T12:00:00Z" }
  ```
- La save: caută fișierul după nume. Dacă există cu **altă** cheie → STOP („A different key already exists in Drive”), nu suprascrie niciodată în tăcere. Apoi recitire și comparare.
- La read: verifică `uid` și apoi cheia ([§4](#verificarea-cheii)).
- La unlock: fișierul se șterge doar dacă userul bifează explicit.
- Token-ul Drive stă doar în memorie și nu se salvează nicăieri.

Google Cloud Console:
- scope-ul `drive.appdata` adăugat pe consent screen;
- în Testing, prietenul trebuie adăugat ca test user;
- dacă e In production, verifică dacă scope-ul cere verificare.

---

## 12. Logout

Singura schimbare: se șterge `expensesEncryptionKey` din `localStorage`. Coada offline și metadata **rămân ca azi**.

Ce înseamnă asta pentru un user blocat:
- operațiile din coadă nu se pierd la logout;
- la următorul login (același user), după ce introduce cheia, pleacă **criptate**;
- fără cheie nu pleacă deloc (vezi [§6](#6-scriere-item--server)).

Limită cunoscută, comportament existent pe care nu îl schimbăm: dacă pe același device se loghează **alt** user, coada rămasă se trimite cu contul lui, după regulile lui (în clar dacă e `off`).

---

## 13. Coordonare cu aplicația de loans

Nu implementăm nimic acolo. Le dăm developerului:

- spec-ul din [§4](#4-criptografie) (format cheie, format payload, AAD = `exp:v1:<uid>:<type>` cu `type` = `loan` / `payment`);
- regula de citire „`payload` există → sursa adevărului”;
- statusurile `off` · `migrating` · `on` · `unlocking` și regula „în tranziție nu se scrie”;
- `field_loan_reference` rămâne **în clar** (e required, iar `/api/payments/{loan_id}` filtrează după el);
- statusul userului e în login (`current_user.encryption_status`) și pe user;
- cheia din Drive: `appDataFolder` e per **proiect Google Cloud**. Dacă aplicația de loans folosește alt OAuth client din **același** proiect, poate citi același `expenses-key.json`. Dintr-un alt proiect, nu.

**Risc de semnalat:** până aplicația de loans suportă criptarea, un user blocat care o folosește scrie loans/payments în clar. Lock-ul din aplicația asta acoperă doar tranzacțiile și veniturile, iar textul din wizard trebuie să spună asta.

---

## 14. AI Assistant

**Nu se schimbă nimic.**
- Funcționează pe date decriptate, din IndexedDB/memorie, ca azi.
- Descrierile ajung la Google (Gemini) dacă userul are „Share descriptions” activ, ca azi.
- `field_gemini_api_key` rămâne salvat pe user în Drupal, în clar. Adminul poate vedea cheia Gemini a userului (nu datele lui). E asumat și trecut în lista din [§3](#ce-rămâne-vizibil-adminului-asumat-documentat-în-ui).

---

## 15. Structura codului

### Fișiere noi

```
src/crypto/
  keyFormat.ts        generare cheie, encode/decode exk1, checksum
  cipher.ts           encryptPayload / decryptPayload (AES-GCM, AAD)
  keyStore.ts         localStorage "expensesEncryptionKey" + CryptoKey cache în memorie
  encryptionState.ts  status (off/migrating/on/unlocking) + hasKey, subscribe; sursa unică pentru restul aplicației
  nodeCodec.ts        decodeServerRecord / encodeNodeBody  ← singurele puncte de integrare
  migration.ts        motorul (lock / unlock, faze, retry, pause, progres)
  driveVault.ts       GIS token client + read/write/delete în appDataFolder

src/components/privacy/
  PrivacySettings.tsx    secțiunea din Profile (Lock / Copy key / Save to Drive / Unlock)
  LockWizard.tsx         pașii de lock
  UnlockWizard.tsx       pașii de unlock
  MigrationProgress.tsx  card mare, pill, bară de reluare, raport de erori
  KeyNeededScreen.tsx    Drive / Paste
```

### Fișiere existente modificate (minim)

| Fișier | Schimbare |
|---|---|
| `context/actions.ts` | la login: `encryptionState.setStatus(current_user.encryption_status ?? 'off')`. La logout: șterge doar cheia |
| `context/reducer.ts` | `encryptionStatus` în `AuthState` (din `currentUser` la init) |
| `utils/syncService.ts` | `convertNodeDataToItem` → `decodeServerRecord` (async). În `syncOperation`, body prin `encodeNodeBody`. Pauză dacă lipsește cheia sau e tranziție. Respectă `migrationActive` |
| `utils/utils.ts` | fallback-ul din `fetchData`: decodare, sau dezactivat când status ≠ `off` |
| `pages/Profile/index.tsx` | `<PrivacySettings />` (o linie) |
| `App.tsx` | gate: dacă status ≠ `off` și nu există cheie → `KeyNeededScreen`. `MigrationProgress` global |
| `types/types.ts` | `encryptionStatus`, tipuri pentru decoder |

Formularele (`TransactionForm`, `IncomeForm`), `offlineAPI.ts`, `indexedDB.ts`, `processData`, graficele și AI-ul **nu se ating**.

### Refresh periodic al statusului

Pe lângă login, statusul se recitește cu GET `/user/{uid}?_format=json`:
- la pornirea aplicației;
- înainte de fiecare rundă de sync care trimite date.

Așa un device deschis de zile întregi află că alt device a pornit un lock sau unlock. `fetchApiKeyFromServer` face deja GET pe propriul user, deci endpoint-ul e accesibil.

---

## 16. Ordinea de implementare

Fiecare pas e livrabil separat și nu schimbă nimic pentru userii `off`.

1. `keyFormat.ts` + `cipher.ts` + teste de roundtrip.
2. `encryptionState.ts` + citire status la login/refresh. Doar se stochează, nimic nu se schimbă vizibil.
3. `nodeCodec.ts` + integrare în `syncService` / `utils`. Pentru `off`: identic cu azi (verificat). Pentru payload: decodare.
4. `keyStore.ts` + `KeyNeededScreen` (Paste) + gate în `App.tsx` + ștergerea cheii la logout.
5. `driveVault.ts` (save + read + delete + verificare).
6. `migration.ts` (ambele direcții) + `MigrationProgress`.
7. `LockWizard` + `PrivacySettings` (Lock, Copy key, Save to Drive).
8. `UnlockWizard` + Cancel din lock.
9. Text final, edge cases, test matrix ([§18](#18-plan-de-testare)).

---

## 17. Decizii luate

| # | Decizie |
|---|---|
| 1 | Cheia locală în `localStorage`, cu „Copy key” disponibil oricând în Profile |
| 2 | Offline-first neschimbat; criptarea doar la granița cu serverul |
| 3 | Coada offline și metadata rămân ca azi la logout; se șterge doar cheia |
| 4 | Tranziții în trei faze (transform → verify → clean up), în ambele direcții |
| 5 | Concurență 4 + pauză la fiecare 50 de requesturi |
| 6 | Reluare manuală (Continue), nu automată |
| 7 | Drive prin GIS popup, doar pentru cheie |
| 8 | Unlock inclus din prima versiune, cu statusul `unlocking`; Cancel din lock = unlock |
| 9 | Progres: card cu stepper, bară, ETA; pill minimizat; bară de reluare |
| 10 | GET pe propriul user pentru refresh-ul de status |
| 11 | AI și `field_gemini_api_key`: neschimbate |

---

## 18. Plan de testare

Pe un **user de test** în Drupal, cu ~200 de iteme copiate, nu pe contul real.

**Crypto (automat):**
- roundtrip; cheie greșită → eroare; AAD diferit → eroare;
- checksum prinde 1 caracter schimbat;
- IV diferit la fiecare criptare.

**Compatibilitate:**
- user `off`: add/edit/delete/offline/sync identic cu înainte, inclusiv body-urile trimise (comparate cu un snapshot).

**Lock, întreruperi la fiecare punct:**

| Scenariu | Așteptat |
|---|---|
| Tab închis în faza Encrypt | Continue → reia; iteme P/D amestecate citite corect |
| Offline în faza Clean up | Pause, apoi Retry; niciun item fără plain și fără payload |
| JWT expirat la mijloc | Pause + re-login; cheia nu se pierde; Continue |
| Un item dă 422 | Restul continuă; itemul rămâne P/D; apare în raport |
| Item șters pe alt device în timpul procesului | 404 → skip |
| Câmp payload care nu se salvează (simulat) | Verify prinde, Clean up nu pornește |
| Al doilea device deschis, status `off` în cache | Refresh-ul vede `migrating` → blochează scrierile |
| Cancel la 50% | Pornește unlock; la final totul e P, status `off` |

**Unlock:**

| Scenariu | Așteptat |
|---|---|
| Unlock complet | Totul P, `title` = data, status `off`, cheia ștearsă local |
| Tab închis în faza Decrypt | Continue → reia; amestec E/D citit corect |
| Un payload corupt | Itemul rămâne E, apare în raport, statusul nu trece la `off` |
| Bifat „delete from Drive” | Fișierul dispare din `appDataFolder` |
| Lock din nou după unlock (fișierul din Drive păstrat) | Wizard-ul propune cheia existentă |

**După lock:**
- device nou → Drive → date vizibile; Paste greșit → refuzat; Paste corect → OK;
- add/edit/delete offline → sync → în Drupal doar payload + `title = •`;
- operație din coadă creată **înainte** de lock, trimisă **după** → pleacă criptată;
- logout cu coadă nevidă → re-login + cheie → operațiile pleacă criptate;
- Copy key din Profile → aceeași cheie ca în Drive;
- în Drupal admin: verificare manuală că nu mai există sume, date sau descrieri în clar pentru userul de test.

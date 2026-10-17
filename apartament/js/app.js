(() => {
  const P = window.PROIECT;
  if (!P) {
    document.getElementById("main").innerHTML =
      "<p class='empty'>Lipsește js/data.js. Deschide folderul <code>site</code> cu ambele scripturi.</p>";
    return;
  }

  const CAT_META = [
    { id: "manopera", label: "Manoperă" },
    { id: "mobilier", label: "Mobilier" },
    { id: "sanitar", label: "Sanitar" },
    { id: "gresie", label: "Gresie" },
    { id: "vopsea", label: "Vopsea" },
    { id: "plinta", label: "Plintă" },
    { id: "adaos", label: "Adaosuri" },
  ];

  const CAT_COLOR = {
    manopera: "#1a3a6b",
    mobilier: "#d45a2a",
    sanitar: "#3a74b8",
    gresie: "#c9952a",
    vopsea: "#6d8a45",
    plinta: "#a56b3c",
    adaos: "#7a5a8a",
  };

  const ROOM_ORDER = P.rooms.map((r) => r.id).filter((id) => id !== "obiect");

  const PRESETS = [
    { id: "all", label: "Tot obiectul", rooms: [], excludeIds: [], note: "" },
    {
      id: "kbw",
      label: "Bucătărie + baie + WC",
      rooms: ["living_bucatarie", "baie", "gts"],
      excludeIds: ["living", "stratos"],
      note: "Livingul și bucătăria sunt o singură manoperă (58 457). Mobilierul de living (32 000) și Stratos (living) sunt scoase din acest scenariu. Gresia Marfil e pe tot obiectul, inclusiv terasa.",
    },
    {
      id: "wet",
      label: "Doar baie + WC",
      rooms: ["baie", "gts"],
      excludeIds: ["stratos"],
      note: "Gresia din ofertă nu e spartă pe încăperi; rămâne vizibilă dacă se potrivește pe baie/GTS.",
    },
    {
      id: "sleep",
      label: "Dormitoare",
      rooms: ["dormitor_matrimonial", "dormitor", "loggia_dormitor"],
      excludeIds: [],
      note: "",
    },
    {
      id: "day",
      label: "Living / bucătărie / antreu",
      rooms: ["antreu", "living_bucatarie", "loggia_bucatarie"],
      excludeIds: [],
      note: "",
    },
    {
      id: "labor",
      label: "Doar manoperă",
      rooms: [],
      cats: ["manopera", "adaos"],
      excludeIds: [],
      note: "Deviz 07.10.2026, fără TVA. Materialele nu sunt incluse.",
    },
    {
      id: "furn",
      label: "Doar mobilier",
      rooms: [],
      cats: ["mobilier"],
      excludeIds: [],
      note: "",
    },
  ];

  const state = {
    view: "sumar",
    preset: "all",
    rooms: new Set(),
    cats: new Set(),
    excludeIds: new Set(),
    q: "",
    includeOptions: false,
    allocateMarkups: false,
    showDups: false,
  };

  function lei(n) {
    if (n == null || Number.isNaN(n)) return "—";
    const neg = n < 0;
    const abs = Math.abs(n);
    const [i, f] = abs.toFixed(Math.round(abs * 100) % 100 === 0 ? 0 : 2).split(".");
    const grouped = i.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
    return (neg ? "−" : "") + grouped + (f ? "," + f : "");
  }

  function roomName(id) {
    const r = P.rooms.find((x) => x.id === id);
    return r ? r.name : id;
  }

  function itemTotal(line) {
    if (line.total != null) return line.total;
    if (line.option && line.qty != null && line.unit_price != null) {
      return Math.round(line.qty * line.unit_price * 100) / 100;
    }
    return 0;
  }

  const ITEMS = [];

  P.labor.lines.forEach((line, i) => {
    ITEMS.push({
      id: "lab-" + i,
      cat: "manopera",
      room: line.room,
      rooms: [line.room],
      name: line.name,
      code: line.code || "",
      qty: line.qty,
      um: line.um,
      unit: line.unit_price,
      total: itemTotal(line),
      option: !!line.option,
      source: "Deviz 07.10.2026",
      vat: "fără TVA",
      comment: line.comment || "",
      primary: !line.option,
    });
  });

  Object.entries(P.labor.direct_by_room).forEach(([room, official]) => {
    const got = ITEMS.filter((it) => it.cat === "manopera" && it.room === room && !it.option)
      .reduce((s, it) => s + it.total, 0);
    const delta = Math.round((official - got) * 100) / 100;
    if (delta) {
      ITEMS.push({
        id: "round-" + room,
        cat: "manopera",
        room,
        rooms: [room],
        name: "Ajustare rotunjire (totalul tipărit al încăperii în deviz)",
        code: "",
        total: delta,
        option: false,
        source: "Deviz 07.10.2026",
        vat: "fără TVA",
        comment: "Suma liniilor din PDF diferă cu " + lei(Math.abs(delta)) + " lei față de totalul de încăpere.",
        primary: true,
      });
    }
  });

  P.labor.markups.forEach((m) => {
    ITEMS.push({
      id: "mk-" + m.id,
      cat: "adaos",
      room: "obiect",
      rooms: ["obiect"],
      name: m.name,
      code: m.id,
      total: m.amount,
      option: false,
      source: "Deviz 07.10.2026",
      vat: "fără TVA",
      comment: "Pe tot obiectul, pe suma deja majorată.",
      primary: true,
      objectWide: true,
    });
  });

  P.furniture.items.forEach((f) => {
    ITEMS.push({
      id: f.id,
      cat: "mobilier",
      room: f.room,
      rooms: [f.room],
      name: f.name,
      code: "",
      qty: f.qty,
      um: "set",
      unit: f.price,
      total: f.price,
      option: false,
      source: "Ofertă mobilier 07.10.26",
      vat: "nedeclarat",
      comment: (f.specs || []).join(" · ") + (f.mapping_note ? " — " + f.mapping_note : ""),
      primary: true,
    });
  });

  P.sanitary.items.forEach((s) => {
    ITEMS.push({
      id: "san-" + s.nr,
      cat: "sanitar",
      room: s.rooms[0],
      rooms: s.rooms.slice(),
      name: s.name,
      code: String(s.nr),
      qty: s.qty,
      um: "buc",
      unit: s.unit_price,
      total: s.total,
      option: false,
      source: "Simplex 17.09.2026",
      vat: "nedeclarat",
      comment: (s.producer || "") + (s.promo ? " · promo" : "") + (s.note ? " — " + s.note : ""),
      primary: true,
    });
  });

  P.materials.gresie_plitka.items.forEach((g) => {
    ITEMS.push({
      id: "gresie-" + g.id,
      cat: "gresie",
      room: g.rooms[0],
      rooms: g.rooms.slice(),
      name: g.name + " " + g.size,
      code: String(g.id),
      qty: g.qty_m2,
      um: "m²",
      unit: g.unit_price,
      total: g.total_after,
      option: false,
      source: "plitka.md 13.10.2026 (−5%)",
      vat: "nedeclarat",
      comment: "Înainte de reducere: " + lei(g.total_before) + " lei. " + (g.note || ""),
      primary: true,
    });
  });

  ITEMS.push({
    id: "stratos",
    cat: "gresie",
    room: "living_bucatarie",
    rooms: ["living_bucatarie"],
    name: "Gresie Stratos Vein White 120×120",
    code: "F-5",
    qty: 5,
    um: "buc",
    unit: 1049,
    total: 7550,
    option: false,
    source: "Lista Constantin (nu e în oferta plitka.md)",
    vat: "nedeclarat",
    comment: "În proiect e pe living, nu pe baie. 7,2 m² / 5 buc.",
    primary: true,
  });

  P.materials.paint_sto.items.forEach((p) => {
    ITEMS.push({
      id: "sto-" + p.code,
      cat: "vopsea",
      room: "obiect",
      rooms: ["obiect"],
      name: p.name,
      code: p.code,
      qty: p.qty,
      um: p.um,
      unit: p.discount_price,
      total: p.total,
      option: false,
      source: "Cont 19210, 13.10.2026",
      vat: "cu TVA",
      comment: p.use,
      primary: true,
      objectWide: true,
    });
  });

  ITEMS.push({
    id: "plinta",
    cat: "plinta",
    room: "obiect",
    rooms: ["obiect"],
    name: "Plintă Arbiton STIQ S0611",
    code: "S0611",
    qty: 24,
    um: "buc",
    unit: 260,
    total: 1040,
    option: false,
    source: "Lista Constantin / dekora.md",
    vat: "nedeclarat",
    comment: "Manopera de montaj e F13 în deviz (6 370), nu e dublură de material.",
    primary: true,
    objectWide: true,
  });

  (P.lista_constantin.items || []).forEach((row, i) => {
    ITEMS.push({
      id: "lista-" + i,
      cat: "dublura",
      room: "obiect",
      rooms: ["obiect"],
      name: [row.category, row.position, row.name].filter(Boolean).join(" · "),
      code: "",
      qty: row.qty_text,
      um: "",
      unit: row.unit_price,
      total: row.total,
      option: false,
      source: "Lista Constantin (compilare)",
      vat: "",
      comment: row.duplicates || "",
      primary: false,
      duplicate: true,
      invalid: /cada/i.test(row.position || ""),
    });
  });

  function selectedRooms() {
    return state.rooms;
  }

  function matchesQuery(it, q) {
    if (!q) return true;
    const blob = [it.name, it.code, it.comment, it.source, it.cat, roomName(it.room)]
      .join(" ")
      .toLowerCase();
    return blob.includes(q);
  }

  function visibleItems() {
    const rooms = selectedRooms();
    const cats = state.cats;
    const q = state.q.trim().toLowerCase();
    return ITEMS.filter((it) => {
      if (it.duplicate) return state.showDups;
      if (it.option && !state.includeOptions) return false;
      if (state.excludeIds.has(it.id)) return false;
      if (it.cat === "adaos") {
        if (rooms.size && state.allocateMarkups) return false;
        if (rooms.size && !state.allocateMarkups) return false;
      }
      if (rooms.size) {
        const hit = (it.rooms || [it.room]).some((r) => rooms.has(r));
        if (!hit) return false;
      }
      if (cats.size && !cats.has(it.cat)) return false;
      if (!matchesQuery(it, q)) return false;
      return true;
    });
  }

  function laborDirectVisible(items) {
    return items
      .filter((it) => it.cat === "manopera" && !it.option)
      .reduce((s, it) => s + it.total, 0);
  }

  function allocatedMarkups(items) {
    if (!state.allocateMarkups || !state.rooms.size) return 0;
    const labor = laborDirectVisible(items);
    return Math.round((labor / 338304) * 105466);
  }

  function priced(items) {
    return items.filter((it) => !it.duplicate);
  }

  function sum(items) {
    return priced(items).reduce((s, it) => s + (Number(it.total) || 0), 0) + allocatedMarkups(items);
  }

  function byCat(items) {
    const map = {};
    priced(items).forEach((it) => {
      map[it.cat] = (map[it.cat] || 0) + (Number(it.total) || 0);
    });
    const alloc = allocatedMarkups(items);
    if (alloc) map.adaos = (map.adaos || 0) + alloc;
    return map;
  }

  function byRoom(items) {
    const map = {};
    items.forEach((it) => {
      const rs = it.rooms && it.rooms.length ? it.rooms : [it.room];
      if (rs.length === 1) {
        map[rs[0]] = (map[rs[0]] || 0) + (Number(it.total) || 0);
      } else {
        rs.forEach((r) => {
          if (!state.rooms.size || state.rooms.has(r)) {
            map[r] = (map[r] || 0) + 0;
          }
        });
        map[rs[0]] = (map[rs[0]] || 0) + (Number(it.total) || 0);
      }
    });
    return map;
  }

  /* ---------- chrome ---------- */

  function renderPresets() {
    const el = document.getElementById("presets");
    el.innerHTML = PRESETS.map(
      (p) =>
        `<button type="button" class="pill${state.preset === p.id ? " is-on" : ""}" data-preset="${p.id}">${p.label}</button>`
    ).join("");
  }

  function renderRoomPills() {
    const el = document.getElementById("rooms");
    el.innerHTML = ROOM_ORDER.map((id) => {
      const on = state.rooms.size > 0 && state.rooms.has(id);
      return `<button type="button" class="pill${on ? " is-on" : ""}" data-room="${id}">${roomName(id)}</button>`;
    }).join("");
  }

  function renderCatPills() {
    const el = document.getElementById("cats");
    el.innerHTML = CAT_META.map((c) => {
      const on = state.cats.size > 0 && state.cats.has(c.id);
      return `<button type="button" class="pill${on ? " is-on" : ""}" data-cat="${c.id}">${c.label}</button>`;
    }).join("");
  }

  function updateHeader(items) {
    const total = sum(items);
    document.getElementById("grand-total").textContent = lei(total) + " lei";
    const n = items.filter((it) => !it.duplicate).length;
    const extra = [];
    if (state.includeOptions) extra.push("cu opțiuni");
    if (state.rooms.size && !state.allocateMarkups) extra.push("fără adaosuri de obiect");
    if (state.allocateMarkups && state.rooms.size) {
      extra.push("adaosuri alocate " + lei(allocatedMarkups(items)));
    }
    document.getElementById("grand-meta").textContent =
      n + " linii" + (extra.length ? " · " + extra.join(" · ") : "");
    const preset = PRESETS.find((p) => p.id === state.preset);
    document.getElementById("filter-note").textContent = preset && preset.note ? preset.note : "";
  }

  /* ---------- views ---------- */

  function donutSvg(parts) {
    const total = parts.reduce((s, p) => s + p.value, 0) || 1;
    const r = 64;
    const c = 2 * Math.PI * r;
    let off = 0;
    const rings = parts
      .filter((p) => p.value > 0)
      .map((p) => {
        const len = (p.value / total) * c;
        const dash = `<circle cx="80" cy="80" r="${r}" fill="none" stroke="${p.color}" stroke-width="22" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-off}" transform="rotate(-90 80 80)"/>`;
        off += len;
        return dash;
      })
      .join("");
    return `<svg viewBox="0 0 160 160" width="180" height="180" aria-hidden="true">${rings}</svg>`;
  }

  function viewSumar(items) {
    const cats = byCat(items);
    const parts = CAT_META.map((c) => ({
      id: c.id,
      label: c.label,
      value: cats[c.id] || 0,
      color: CAT_COLOR[c.id],
    })).filter((p) => p.value > 0);
    const roomMap = {};
    ROOM_ORDER.forEach((id) => {
      const chunk = items.filter((it) => (it.rooms || [it.room]).includes(id) && it.cat !== "adaos");
      const shared = chunk.filter((it) => (it.rooms || []).length > 1);
      const own = chunk.filter((it) => (it.rooms || [it.room]).length === 1);
      roomMap[id] = own.reduce((s, it) => s + it.total, 0);
      void shared;
    });
    const maxRoom = Math.max(1, ...Object.values(roomMap));
    const kpis = [
      ["manopera", "Manoperă", (cats.manopera || 0) + (cats.adaos || 0)],
      ["mobilier", "Mobilier", cats.mobilier || 0],
      ["sanitar", "Sanitar", cats.sanitar || 0],
      ["finisaje", "Finisaje", (cats.gresie || 0) + (cats.vopsea || 0) + (cats.plinta || 0)],
    ];

    return `
      <div class="kpis">
        ${kpis
          .map(
            ([id, l, v]) =>
              `<div class="kpi kpi--${id}"><strong>${lei(v)}</strong><span>${l}</span></div>`
          )
          .join("")}
      </div>
      ${
        state.preset === "all" && !state.q && !state.includeOptions && !state.rooms.size
          ? `<div class="callout callout--info"><strong>Total din oferte, fără dubluri: ${lei(
              P.totals.primary_sources.total_using_simplex_line_sum
            )} lei.</strong> Simplex tipărit 61 704, suma liniilor 57 709. Lista Constantin nu e adunată.</div>`
          : ""
      }
      ${
        state.preset === "kbw"
          ? `<div class="callout callout--warn"><strong>Scenariu bucătărie + baie + WC.</strong> Ținta din documente (manoperă directă + mobilier fără living + sanitar + gresie Marfil): ${lei(
              P.scenarios.bucatarie_baie_gts.subtotal_labor_direct_plus_furniture_sanitary_gresie
            )} lei. Cu adaosuri alocate: ${lei(
              P.scenarios.bucatarie_baie_gts.subtotal_with_proportional_labor_markups
            )} lei — bifează «Alocă adaosurile» ca să le vezi în totalul de sus.</div>`
          : ""
      }
      <div class="split">
        <div class="panel">
          <h2>Pe încăperi</h2>
          <p style="margin:0 0 12px;color:var(--muted);font-size:13px">Manoperă + mobilier + sanitar alocate camerei. Gresia/vopseaua pe tot obiectul apar la prima încăpere din ofertă.</p>
          <div class="bars">
            ${ROOM_ORDER.filter((id) => !state.rooms.size || state.rooms.has(id))
              .map((id) => {
                const v = roomMap[id] || 0;
                const pct = (100 * v) / maxRoom;
                return `<div class="bar"><span>${roomName(id)}</span><div class="bar__track"><div class="bar__fill" style="width:${pct}%"></div></div><span class="bar__n">${lei(v)}</span></div>`;
              })
              .join("")}
          </div>
        </div>
        <div class="panel">
          <h2>Pe categorii</h2>
          <div class="donut-wrap">
            ${donutSvg(parts)}
            <ul class="legend">
              ${parts
                .map(
                  (p) =>
                    `<li><span><i class="swatch" style="background:${p.color}"></i>${p.label}</span><span>${lei(p.value)}</span></li>`
                )
                .join("")}
              <li><span>Total</span><span>${lei(sum(items))}</span></li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  function viewIncaperi(items) {
    const ids = ROOM_ORDER.filter((id) => !state.rooms.size || state.rooms.has(id));
    const cards = ids
      .map((id) => {
        const roomItems = items.filter((it) => (it.rooms || [it.room]).includes(id) && it.cat !== "adaos");
        const own = roomItems.filter((it) => (it.rooms || [it.room]).length === 1);
        const cats = byCat(own);
        const r = P.rooms.find((x) => x.id === id);
        const area = r && r.area_m2 != null ? r.area_m2 + " m²" : "—";
        const total = own.reduce((s, it) => s + it.total, 0);
        return `<article class="card">
          <h3>${roomName(id)}</h3>
          <p class="meta">${area}${r && r.note ? " · " + r.note : ""}</p>
          <p class="sum">${lei(total)} lei</p>
          <table class="mini">
            ${CAT_META.map((c) =>
              cats[c.id]
                ? `<tr><td><i class="swatch" style="background:${CAT_COLOR[c.id]}"></i>${c.label}</td><td class="n">${lei(cats[c.id])}</td></tr>`
                : ""
            ).join("")}
          </table>
        </article>`;
      })
      .join("");
    return `<div class="cards">${cards}</div>
      <p style="color:var(--muted);font-size:13px">Adaosurile de manoperă (105 466 lei) sunt pe tot obiectul, nu pe cameră — de aceea nu apar în carduri. Sanitarele atribuite unei camere după produs (duș → baie, WC → GTS).</p>`;
  }

  function viewLinii(items) {
    const rows = items
      .map((it) => {
        const cls = it.invalid ? "is-invalid" : it.duplicate ? "is-dup" : it.option ? "is-option" : "";
        return `<tr class="${cls}">
          <td>${roomName(it.room)}</td>
          <td><span class="tag tag--${it.cat}">${it.cat}</span></td>
          <td>${it.code ? `<code>${it.code}</code> ` : ""}${escapeHtml(it.name)}${
            it.comment
              ? `<div style="color:var(--muted);font-size:12px;margin-top:2px">${escapeHtml(it.comment)}</div>`
              : ""
          }</td>
          <td>${it.qty ?? ""} ${it.um || ""}</td>
          <td class="n">${it.unit != null ? lei(it.unit) : ""}</td>
          <td class="n">${lei(it.total)}</td>
          <td>${escapeHtml(it.source)}</td>
        </tr>`;
      })
      .join("");
    if (!items.length && !allocatedMarkups(items)) {
      return `<div class="empty">Nicio linie cu filtrele curente.</div>`;
    }
    const alloc = allocatedMarkups(items);
    const allocRow = alloc
      ? `<tr><td>Obiect</td><td><span class="tag tag--adaos">adaos</span></td><td>Adaosuri alocate (transport / regie / beneficiu) — calcul, nu linie din documente</td><td></td><td class="n"></td><td class="n">${lei(alloc)}</td><td>Deviz 07.10.2026</td></tr>`
      : "";
    return `<div class="panel"><div class="table-wrap"><table class="data">
      <thead><tr><th>Încăpere</th><th>Cat.</th><th>Denumire</th><th>Cant.</th><th class="n">Unitar</th><th class="n">Total</th><th>Sursă</th></tr></thead>
      <tbody>${rows}${allocRow}
        <tr><td colspan="5"><strong>Total filtrat</strong></td><td class="n"><strong>${lei(sum(items))}</strong></td><td></td></tr>
      </tbody>
    </table></div></div>`;
  }

  function viewDuplicate() {
    return P.duplicates
      .map(
        (d) => `<div class="dup">
          <div class="sev">${d.severity} · ${d.id}</div>
          <h3>${escapeHtml(d.what)}</h3>
          <p>${escapeHtml(d.action)}</p>
        </div>`
      )
      .join("");
  }

  function viewLipsa() {
    const miss = (P.missing_prices || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("");
    const apps = (P.unpriced_appliances_in_drawings || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("");
    const opts = P.totals.labor_options_not_in_total.items
      .map((x) => `<tr><td>${escapeHtml(x.name)}</td><td class="n">${lei(x.amount)}</td></tr>`)
      .join("");
    return `
      <div class="callout callout--warn"><strong>Acestea nu sunt în totalul de 965 152 lei.</strong> Nu am inventat prețuri pentru ele.</div>
      <div class="split">
        <div class="panel"><h2>Fără ofertă de produs</h2><ul>${miss}</ul>
          <h2>În planșe, fără preț</h2><ul>${apps}</ul></div>
        <div class="panel">
          <h2>Opțiuni manoperă — ${lei(P.totals.labor_options_not_in_total.sum)}</h2>
          <p style="color:var(--muted);font-size:13px">Bifează «Include opțiuni» ca să le vezi în total și în tabel.</p>
          <table class="data"><tbody>${opts}<tr><td><strong>Toate</strong></td><td class="n"><strong>${lei(
      P.totals.labor_options_not_in_total.sum
    )}</strong></td></tr></tbody></table>
        </div>
      </div>`;
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render() {
    renderPresets();
    renderRoomPills();
    renderCatPills();
    const items = visibleItems();
    updateHeader(items);
    const main = document.getElementById("main");
    if (state.view === "sumar") main.innerHTML = viewSumar(items);
    else if (state.view === "incaperi") main.innerHTML = viewIncaperi(items);
    else if (state.view === "linii") main.innerHTML = viewLinii(items);
    else if (state.view === "duplicate") main.innerHTML = viewDuplicate();
    else main.innerHTML = viewLipsa();
    document.querySelectorAll(".views button").forEach((b) => {
      b.classList.toggle("is-on", b.dataset.view === state.view);
    });
  }

  function applyPreset(id) {
    const p = PRESETS.find((x) => x.id === id);
    state.preset = id;
    state.rooms = new Set(p.rooms || []);
    state.cats = new Set(p.cats || []);
    state.excludeIds = new Set(p.excludeIds || []);
    state.q = "";
    const qEl = document.getElementById("q");
    if (qEl) qEl.value = "";
    if (id === "kbw") state.allocateMarkups = document.getElementById("opt-markups").checked;
  }

  document.getElementById("presets").addEventListener("click", (e) => {
    const b = e.target.closest("[data-preset]");
    if (!b) return;
    applyPreset(b.dataset.preset);
    render();
  });

  document.getElementById("rooms").addEventListener("click", (e) => {
    const b = e.target.closest("[data-room]");
    if (!b) return;
    const id = b.dataset.room;
    state.preset = "custom";
    state.excludeIds = new Set();
    if (!state.rooms.size) {
      state.rooms = new Set([id]);
    } else if (state.rooms.has(id)) {
      state.rooms.delete(id);
    } else {
      state.rooms.add(id);
    }
    render();
  });

  document.getElementById("cats").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    const id = b.dataset.cat;
    state.preset = "custom";
    if (!state.cats.size) {
      state.cats = new Set([id]);
    } else if (state.cats.has(id)) {
      state.cats.delete(id);
    } else {
      state.cats.add(id);
    }
    render();
  });

  document.querySelector(".views").addEventListener("click", (e) => {
    const b = e.target.closest("[data-view]");
    if (!b) return;
    state.view = b.dataset.view;
    render();
  });

  document.getElementById("q").addEventListener("input", (e) => {
    state.q = e.target.value;
    render();
  });
  document.getElementById("opt-options").addEventListener("change", (e) => {
    state.includeOptions = e.target.checked;
    render();
  });
  document.getElementById("opt-markups").addEventListener("change", (e) => {
    state.allocateMarkups = e.target.checked;
    render();
  });
  document.getElementById("opt-dups").addEventListener("change", (e) => {
    state.showDups = e.target.checked;
    if (state.showDups) state.view = "linii";
    render();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
      e.preventDefault();
      document.getElementById("q").focus();
    }
  });

  applyPreset("all");
  render();
})();

import "./styles.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { measures, programs, sources, starterPortfolio } from "./catalog.js";
import {
  evaluateProject,
  calculateBudget,
  validateImport,
  createReport,
  normalizePortfolio,
} from "./engine.js";

const icons = {
  home: '<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z"/><path d="M9 3v16M15 5v16"/>',
  leaf: '<path d="M20 3C9 1 2 7 5 15c7 7 16-2 15-12Z"/><path d="m4 21 12-13"/>',
  fund: '<path d="M3 8h18M5 8v11m7-11v11m7-11v11M2 21h20M12 2 2 6h20Z"/>',
  book: '<path d="M12 5C8 2 4 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-3-1-7-2-10 1Zm0 0v16"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M3 15v6h18v-6"/>',
  download: '<path d="M12 3v13m-5-5 5 5 5-5M3 17v4h18v-4"/>',
  shield:
    '<path d="m12 2 8 3v7c0 6-8 10-8 10S4 18 4 12V5Z"/><path d="m8 11 3 3 5-6"/>',
  water:
    '<path d="M12 2C9 7 4 11 4 15a8 8 0 0 0 16 0c0-4-5-8-8-13Z"/><path d="M8 15c0 3 2 4 4 4"/>',
  tree: '<path d="m12 2-7 9h4l-6 7h18l-6-7h4ZM12 18v4"/>',
  check: '<path d="m5 12 4 4L20 5"/>',
  area: '<path d="M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6M8 8h8v8H8Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  close: '<path d="m5 5 14 14M19 5 5 19"/>',
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.leaf}</svg>`;
const esc = (v = "") =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (n) =>
  new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
const num = (n, d = 2) =>
  new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: d }).format(
    Number(n) || 0,
  );
const copy = (o) => JSON.parse(JSON.stringify(o));
const catalog = { measures, programs, sources };
let portfolio = copy(starterPortfolio),
  view = "overview",
  selectedId = null,
  filter = "all",
  mapInstance = null,
  persist = false;
try {
  if (localStorage.getItem("krajina-opt-in") === "yes") {
    const saved = JSON.parse(localStorage.getItem("krajina-project"));
    if (saved && validateImport(saved).valid) {
      portfolio = normalizePortfolio(saved);
      persist = true;
    }
  }
} catch {}
let draft = null,
  draftBaseline = null,
  tilesEnabled = false;
const getProjects = () => portfolio.projects || [];
const measureName = (m) => m?.name || m?.title || "Záměr";
const projectMeasure = (p) =>
  measures.find((m) => m.id === p.measureId) || measures[0];
const projectIcon = (p) =>
  /water|pond|wet|stream|tůň|vod|mokř/i.test(
    `${p.measureId} ${measureName(projectMeasure(p))}`,
  )
    ? "water"
    : /forest|les|tree|strom/i.test(`${p.measureId}`)
      ? "tree"
      : "leaf";
const evaluation = (p) => {
  try {
    return evaluateProject(p, catalog);
  } catch {
    return {
      readiness: { percent: 0 },
      checks: [],
      nextSteps: [],
      funding: [],
      waterAdvice: [],
      summary: "Doplň podklady pro vyhodnocení.",
    };
  }
};
function save() {
  if (!persist) return true;
  try {
    localStorage.setItem("krajina-project", JSON.stringify(portfolio));
    localStorage.setItem("krajina-opt-in", "yes");
    return true;
  } catch {
    persist = false;
    try {
      localStorage.removeItem("krajina-opt-in");
    } catch {}
    toast(
      "Místní uložení selhalo. Projekt zůstává jen v paměti; exportuj JSON zálohu.",
    );
    return false;
  }
}
function mayLeaveDraft() {
  if (!draft) return true;
  collectDraft();
  return (
    JSON.stringify(draft) === draftBaseline ||
    confirm("Opustit kartu bez uložení změn? Neuložené změny se ztratí.")
  );
}
function toast(message) {
  document.querySelector(".toast")?.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.role = "status";
  el.textContent = message;
  document.body.append(el);
  setTimeout(() => el.remove(), 5000);
}
function download(filename, text, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function goto(next) {
  if (!mayLeaveDraft()) return;
  view = next;
  draft = null;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
const brand = `<svg class="brand-mark" viewBox="0 0 40 48" fill="none" aria-hidden="true"><path d="M20 3 4 31h32L20 3Z" stroke="#d8dfc9" stroke-width="1.4"/><path d="M20 12v32M10 28l10-10 10 10M7 36l13-8 13 8" stroke="#d8dfc9" stroke-width="1.2"/></svg><span>Krajinný kompas<small>PROSTOR PRO DOBRÉ ZÁMĚRY</small></span>`;
function render() {
  mapInstance?.remove();
  mapInstance = null;
  const views = {
    overview: ["Přehled", "home"],
    map: ["Mapa", "map"],
    projects: ["Záměry", "leaf"],
    funding: ["Podpory", "fund"],
    guide: ["Průvodce", "book"],
  };
  document.querySelector("#app").innerHTML =
    `<div class="shell"><aside class="sidebar"><div class="brand">${brand}</div><nav class="nav" aria-label="Hlavní navigace">${Object.entries(
      views,
    )
      .map(
        ([id, [label, ic]]) =>
          `<button data-nav="${id}" class="${view === id ? "active" : ""}" ${view === id ? 'aria-current="page"' : ""}>${icon(ic)}${label}</button>`,
      )
      .join(
        "",
      )}</nav><div class="sidebar-bottom"><strong>Krajina má své souvislosti.</strong><br>Rozhoduj se s podklady,<br>plánuj s výhledem.<br><br>Veřejné zdroje · vlastní rozhodnutí</div></aside><main class="main"><header class="topbar"><div class="breadcrumb">Pracovní prostor <span aria-hidden="true">/</span> <b>${views[view]?.[0] || "Záměr"}</b></div><div class="top-actions"><span class="privacy">${icon("shield")} Soukromá data zůstávají u tebe</span><button class="button secondary" data-action="data">${icon("upload")} Moje data</button></div></header><div class="content">${view === "overview" ? overview() : view === "map" ? mapView() : view === "projects" ? projectsView() : view === "funding" ? fundingView() : guideView()}</div></main></div><input type="file" id="file-import" accept=".json,application/json" hidden>`;
  bind();
  if (view === "map") mountMap();
}
function heading(eyebrow, title, description, action = "") {
  return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p class="subtitle">${description}</p></div>${action || `<span class="demo-tag"><span class="dot"></span>${portfolio.isDemo ? "Ukázková krajina · smyšlená data" : "Vlastní místní projekt"}</span>`}</div>`;
}
const landscape = `<svg class="hero-art" viewBox="0 0 650 290" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#547554"/><stop offset="1" stop-color="#a7b58b"/></linearGradient></defs><rect width="650" height="290" fill="url(#sky)"/><circle cx="488" cy="68" r="36" fill="#c9cca1" opacity=".55"/><path d="M0 140Q120 40 260 126T650 95V290H0Z" fill="#5c7b54"/><path d="M0 190Q170 75 370 173T650 153V290H0Z" fill="#779367"/><path d="M0 250Q180 134 365 218T650 188V290H0Z" fill="#405f43"/><path d="M650 210Q450 175 355 223T220 290h125q-5-35 80-42t225 14Z" fill="#a5b5a0" opacity=".8"/><path d="m0 196 190 72M50 168l195 93M106 147l199 89M162 142l198 71" stroke="#a8b684" opacity=".3"/><g fill="#294d38"><path d="m460 94-25 55h50Z"/><path d="m500 115-22 48h44Z"/><path d="m535 93-29 65h58Z"/><path d="m580 110-25 59h50Z"/><path d="m622 80-33 75h66Z"/><path d="m416 122-20 44h40Z"/></g><g fill="#31513b"><path d="m112 214-32 70h64Z"/><path d="m157 233-25 57h50Z"/><path d="m62 230-32 60h64Z"/></g><path d="M18 130q130-50 232 9M52 115q100-34 190 5M363 185q127-34 240 11" fill="none" stroke="#cfdbb1" opacity=".18"/></svg>`;
function overview() {
  const total =
    (portfolio.parcels || []).reduce((s, p) => s + (Number(p.areaM2) || 0), 0) /
    10000;
  const water = getProjects().filter((p) => projectIcon(p) === "water").length;
  return `${heading("Od pozemku k dobrému záměru", "Každý pozemek má potenciál.", "Najdi souvislosti, připrav smysluplný záměr a zjisti, co potřebuješ pro další krok.")}<section class="hero"><div class="hero-content"><div class="eyebrow">VODA · PŮDA · LES · PÉČE</div><h2>Zdravější krajina začíná<br>dobrým rozhodnutím.</h2><p>Propoj stav místa, možnosti péče a financování. Srozumitelně, s podklady a bez předčasných slibů.</p><button class="button" data-action="new">Prozkoumat nový záměr ${icon("arrow")}</button></div>${landscape}</section><div class="stats">${stat("Pozemky v přehledu", num(portfolio.parcels?.length || 0), "parcel", "Připravené pro společné plánování", "map")}${stat("Celková plocha", num(total), "ha", "Podle načtené evidence pozemků", "area")}${stat("Rozpracované záměry", num(getProjects().length), "", "Od nápadu k ověřenému podkladu", "leaf")}${stat("Voda v krajině", num(water), "záměrů", "Tůně, mokřady a přirozené toky", "water")}</div><div class="dashboard-grid"><section><div class="section-heading"><h2>Záměry v krajině</h2><button class="text-button" data-nav="projects">Všechny záměry ${icon("arrow")}</button></div><div class="project-list">${getProjects().slice(0, 3).map(projectCard).join("") || '<div class="panel empty">Začni prvním záměrem. Evidence pozemků sama zatím neříká, co je na místě vhodné.</div>'}</div></section><section><div class="section-heading"><h2>Nejbližší dobrý krok</h2></div><div class="next-card"><div class="eyebrow">NEJDŘÍV POCHOPIT MÍSTO</div><h3>Voda potřebuje prostor.<br>A záměr dobré podklady.</h3><div class="step-line"><span class="step-number">1</span><span>Zaznamenej, kudy voda přitéká, kde mizí a jak se místo mění po dešti.</span></div><div class="step-line"><span class="step-number">2</span><span>Prověř vlastníka, užívání a vztah k vodnímu toku.</span></div><div class="step-line"><span class="step-number">3</span><span>Porovnej tůň, mokřad a obnovu přirozeného toku. Rybník není jediná cesta.</span></div><button class="text-button" data-nav="guide">Otevřít průvodce ${icon("arrow")}</button></div></section></div>${sourceStrip()}`;
}
function stat(label, value, unit, note, ic) {
  return `<div class="stat"><div class="stat-head">${label}${icon(ic)}</div><div class="stat-value">${value}<small>${unit}</small></div><div class="stat-note">${note}</div></div>`;
}
function projectCard(p) {
  const e = evaluation(p);
  return `<article class="project-card"><div class="measure-icon">${icon(projectIcon(p))}</div><div><h3>${esc(p.name)}</h3><div class="project-meta">${esc(measureName(projectMeasure(p)))} · ${num(p.areaHa || 0)} ha</div><span class="pill ${e.readiness?.percent < 50 ? "amber" : ""}">${num(e.readiness?.percent || 0, 0)} % podkladů doplněno</span></div><button class="card-arrow" data-edit="${esc(p.id)}" aria-label="Otevřít ${esc(p.name)}">${icon("arrow")}</button></article>`;
}
function sourceStrip() {
  return `<div class="source-strip"><span>Opíráme se o veřejné odborné zdroje</span><a href="https://aopk.gov.cz/" target="_blank" rel="noopener">AOPK ČR ↗</a><a href="https://mze.gov.cz/" target="_blank" rel="noopener">Ministerstvo zemědělství ↗</a><a href="https://www.cuzk.gov.cz/" target="_blank" rel="noopener">ČÚZK ↗</a><a href="https://nli.gov.cz/" target="_blank" rel="noopener">Národní lesnický institut ↗</a><button class="text-button" data-nav="guide">Zdroje a omezení</button></div>`;
}
function newProject() {
  return {
    id: `zamer-${Date.now()}`,
    name: "",
    measureId: measures[0]?.id,
    parcelIds: [],
    areaHa: 0,
    evidence: {},
    budget: {
      preparation: 0,
      implementation: 0,
      annualMaintenance: 0,
      years: 5,
      ownWork: 0,
      eligibleCosts: 0,
      grantRate: 0,
      grantConfirmed: false,
    },
    notes: "",
  };
}
function projectsView() {
  if (draft) return editor();
  return `${heading("Nápad, který stojí na podkladech", "Záměry v krajině", "Každý záměr propojuje místo, potřebné ověření, ekonomiku a další postup.", `<button class="button" data-action="new">${icon("plus")} Nový záměr</button>`)}<div class="callout">${portfolio.isDemo ? "Pracuješ se smyšlenými ukázkami. Slouží k vyzkoušení postupu; nevztahují se k rodinným pozemkům." : "Pracuješ s místními daty. Vhodnost opatření vyžaduje ověření v terénu a podle konkrétních podmínek."}</div><div class="split"><div class="project-list">${getProjects().map(projectCard).join("") || '<div class="panel empty">Zatím nemáš žádný záměr. Vytvoř první a vyber, co chceš na místě prověřit.</div>'}</div><div class="panel"><div class="eyebrow">JAK POSTUPOVAT</div><h2 class="section-space">Od nápadu k rozhodnutí</h2><p>Začni cílem: více vody v půdě, zdravější les, pestřejší louka nebo bezpečná péče o stromy.</p><p>Doplň, co je skutečně ověřené. Nástroj sestaví seznam chybějících podkladů a předběžně porovná podpory.</p><p class="note">Výsledek není povolení, odborný posudek ani příslib dotace. Je to podklad pro konkrétní další jednání.</p></div></div>`;
}
function editor() {
  const p = draft,
    e = evaluation(p),
    b = calculateBudget(p.budget || {});
  return `${heading("Pracovní karta záměru", esc(p.name || "Nový záměr"), "Doplň fakta, porovnej varianty a připrav podklad pro další jednání.", `<button class="button secondary" data-action="back">${icon("close")} Zavřít kartu</button>`)}<form id="project-form"><div class="split"><section class="panel"><h2>Místo a cíl</h2><div class="form-grid"><label class="field wide">Název záměru<input name="name" required maxlength="150" value="${esc(p.name)}" placeholder="Například: Obnova vlhkého místa pod lesem"></label><label class="field wide">Co chceš prověřit<select name="measureId">${measures.map((m) => `<option value="${esc(m.id)}" ${p.measureId === m.id ? "selected" : ""}>${esc(measureName(m))}</option>`).join("")}</select></label><label class="field">Řešená plocha (ha)<input name="areaHa" type="number" min="0" step="0.0001" value="${p.areaHa || 0}"></label><label class="field">Pozemek<select name="parcelIds" multiple size="3">${(portfolio.parcels || []).map((a) => `<option value="${esc(a.id)}" ${p.parcelIds?.includes(a.id) ? "selected" : ""}>${esc(a.name || a.parcelNumber || a.id)}</option>`).join("")}</select></label><label class="field wide">Cíl a poznatky z místa<textarea maxlength="20000" name="notes" placeholder="Co se zde děje, čeho chceš dosáhnout, co ještě nevíš…">${esc(p.notes || "")}</textarea></label></div>${e.waterAdvice?.length ? `<div class="callout">${e.waterAdvice.map((x) => esc(x)).join("<br><br>")}</div>` : ""}<p class="note">${esc(projectMeasure(p)?.description || projectMeasure(p)?.summary || "Vhodnost opatření nejprve ověř podle skutečného stavu místa.")}</p></section><section class="panel"><h2>Připravenost podkladů</h2><p class="note">„Ano“ zvol jen pro doloženou skutečnost. „Ne“ je známá překážka; „Nevím“ znamená potřebu ověření.</p>${(e.checks || []).map((c) => `<div class="question"><label for="e-${esc(c.id)}">${esc(c.label)}${c.required ? " *" : ""}<small>${esc(c.help || "")}</small></label><select id="e-${esc(c.id)}" name="evidence.${esc(c.id)}"><option value="unknown" ${c.status === "unknown" ? "selected" : ""}>Nevím / chybí</option><option value="yes" ${c.status === "yes" ? "selected" : ""}>Ano, ověřeno</option><option value="no" ${c.status === "no" ? "selected" : ""}>Ne / překážka</option></select></div>`).join("")}<div class="inline-status">Doplněno ${num(e.readiness?.percent || 0, 0)} % podkladů. ${esc(e.summary || "")}</div></section></div><section class="panel"><h2>Ekonomika celého záměru</h2><p class="note">Orientační scénář. Procento podpory zadáváš sám; neznamená nárok ani schválené financování. Částky v Kč.</p><div class="form-grid">${[
    ["preparation", "Příprava a dokumentace"],
    ["implementation", "Realizace"],
    ["ownWork", "Ocenění vlastní práce"],
    ["annualMaintenance", "Roční následná péče"],
    ["years", "Počet let péče"],
    ["eligibleCosts", "Předpokládané způsobilé výdaje"],
    ["grantRate", "Scénář podpory (%)"],
  ]
    .map(
      ([key, label]) =>
        `<label class="field">${label}<input name="budget.${key}" type="number" min="0" ${key === "grantRate" ? 'max="100"' : ""} step="${key === "years" ? "1" : "0.01"}" value="${Number(p.budget?.[key]) || 0}"></label>`,
    )
    .join(
      "",
    )}</div><div class="form-actions"><button class="button secondary" type="button" data-action="recalculate">Přepočítat rozpočet</button></div><div class="result-grid section-space"><div class="result-box"><span>Celkové náklady včetně péče</span><strong>${money(b.total + b.maintenanceTotal)}</strong></div><div class="result-box"><span>Modelovaná podpora</span><strong>${money(b.grant)}</strong></div><div class="result-box"><span>Náklady po modelované podpoře</span><strong>${money(b.netCost ?? b.ownContribution)}</strong></div></div><div class="callout">Pro předfinancování počítej až s ${money(b.upfrontCash)}. Skutečný platební režim závisí na programu. ${[...(b.errors || []), ...(b.warnings || [])].map(esc).join(" ")}</div></section><div class="split"><section class="panel"><h2>Nejbližší kroky</h2>${e.nextSteps?.length ? e.nextSteps.map((step, i) => `<div class="step-line"><span class="step-number">${i + 1}</span><span>${esc(step)}</span></div>`).join("") : "<p>Podklady jsou doplněné. Ověř aktuální podmínky s příslušným odborníkem a poskytovatelem podpory.</p>"}</section><section class="panel"><h2>Předběžná vazba na podpory</h2>${e.funding?.length ? e.funding.map((f) => `<div class="step-line"><div><span class="pill ${f.status === "blocked" ? "red" : f.status === "candidate" ? "" : "amber"}">${f.status === "candidate" ? "K prověření" : f.status === "blocked" ? "Překážka" : "Chybí podklady"}</span><h3 style="margin-top:8px">${esc(f.program?.name || f.program?.title || f.program?.id)}</h3><span>${(f.reasons || []).map(esc).join(" ")}</span></div></div>`).join("") : "<p>Pro toto opatření není v katalogu vhodný kandidát. To nevylučuje jiné možnosti financování.</p>"}</section></div><div class="form-actions"><button class="button" type="submit">${icon("check")} Uložit záměr</button><button class="button secondary" type="button" data-action="report">${icon("download")} Podklad v Markdownu</button><button class="button secondary" type="button" data-action="project-json">Export záměru JSON</button>${getProjects().some((x) => x.id === p.id) ? '<button type="button" class="button danger" data-action="delete-project">Smazat záměr</button>' : ""}</div><p class="note section-space">Podklady se vyhodnocují průběžně, rozpočet aktualizuj tlačítkem „Přepočítat rozpočet“. Tlačítkem „Uložit záměr“ je potvrdíš do pracovního projektu. Bez zapnutého místního uložení je nutný export souboru.</p></form>${measureDetails(p)}`;
}
function fundingView() {
  const list = programs.filter(
    (p) =>
      filter === "all" ||
      (p.measureIds || p.measures || []).some((x) => x === filter),
  );
  return `${heading("Financování sleduje smysluplný záměr", "Podpory a příležitosti", "Kurátorovaný přehled cest financování. Způsobilost se prověřuje u konkrétního záměru.")}<div class="callout">Výzvy a jejich stav se mění. Odkaz na poskytovatele a datum kontroly jsou důležitější než obecný příslib procent. Před podáním vždy ověř aktuální znění podmínek.</div><div class="filter-row"><button class="filter ${filter === "all" ? "active" : ""}" data-filter="all">Všechny oblasti</button>${measures.map((m) => `<button class="filter ${filter === m.id ? "active" : ""}" data-filter="${esc(m.id)}">${esc(measureName(m))}</button>`).join("")}</div><div class="program-grid">${list.map((p) => `<article class="program"><span class="pill blue">${esc(p.provider || p.administrator || "Veřejná podpora")}</span><h3>${esc(p.name || p.title)}</h3><p>${esc(p.description || p.summary || "Podmínky a aktuální možnosti ověř u poskytovatele.")}</p>${programDetails(p)}${p.caution ? `<p>${esc(p.caution)}</p>` : ""}<div class="program-footer"><a href="${safeUrl(p.url || p.sourceUrl)}" target="_blank" rel="noopener">Podmínky u poskytovatele ↗</a><small>Kontrola: ${esc(p.checkedAt || p.verifiedAt || "ověř u zdroje")}</small></div></article>`).join("") || '<div class="panel empty">Pro tento filtr není v katalogu program. Zkus všechny oblasti.</div>'}</div>${sourceStrip()}`;
}
function programDetails(program) {
  const result = evaluateProject(
    { measureId: program.measureIds?.[0] },
    catalog,
  ).funding.find((f) => f.program.id === program.id);
  const status = result?.windowStatus || "verify";
  const labels = {
    open: "Příjem otevřen · ověř podmínky",
    upcoming: "Oznámený budoucí termín",
    closed: "Ukončená výzva",
    verify: "Aktuální příjem ověř u poskytovatele",
  };
  const date = (v) =>
    v ? new Date(`${v}T12:00:00`).toLocaleDateString("cs-CZ") : "neuvedeno";
  return `<p><span class="pill ${status === "closed" ? "red" : "amber"}">${esc(labels[status])}</span></p><p class="note">${program.window?.start || program.window?.end ? `Uvedené okno: ${date(program.window.start)} – ${date(program.window.end)}` : "Lhůta závisí na titulu a aktuálních podmínkách."}</p><p class="note">${esc(program.eligibilityNote)}</p>`;
}
function measureDetails(project) {
  const m = projectMeasure(project);
  const section = (title, items) =>
    items?.length
      ? `<h3>${title}</h3><ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`
      : "";
  return `<section class="panel guide"><h2>Jak připravit ${esc(m.title.toLocaleLowerCase("cs-CZ"))}</h2><div class="split"><div>${section("Co má záměr přinést", m.benefits)}${section("Postup přípravy", m.steps)}${section("Koho zapojit", m.experts)}</div><div>${section("Co si vyžádat jako výstup", m.outputs)}${section("Na co dát pozor", m.risks)}<h3>Podklady k tomuto opatření</h3>${(
    m.sourceIds || []
  )
    .map((id) => sources.find((s) => s.id === id))
    .filter(Boolean)
    .map(
      (s) =>
        `<p><a href="${safeUrl(s.url)}" target="_blank" rel="noopener">${esc(s.title)} ↗</a><br><small>Ověřeno ${esc(s.checkedAt)}</small></p>`,
    )
    .join("")}</div></div></section>`;
}
function safeUrl(url) {
  try {
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol) ? esc(u.href) : "#";
  } catch {
    return "#";
  }
}
function mapView() {
  return `${heading("Místo v souvislostech", "Mapa krajiny", "Propoj pozemky se záměry. Mapa pomáhá klást správné otázky; sama nenahrazuje průzkum.")}<div class="map-layout"><div><div class="form-actions" style="margin:0 0 12px"><button class="button secondary" data-action="tiles">${tilesEnabled ? "Vypnout online podklad" : "Zapnout online mapový podklad"}</button><span class="note">${tilesEnabled ? "Online podklad zapnut" : "Výchozí mapa bez požadavků externí mapové službě"}</span></div><div id="land-map" class="map-canvas" aria-label="Interaktivní mapa pozemků"></div><div class="map-legend"><span><i class="legend-dot" style="background:#557b45"></i>Les a stromy</span><span><i class="legend-dot" style="background:#b3b16e"></i>Pole a louky</span><span><i class="legend-dot" style="background:#6b9d98"></i>Vodní souvislosti</span></div><p class="note">${portfolio.isDemo ? "Polygony jsou záměrně smyšlené a nejsou katastrálními hranicemi." : "Zobrazují se pouze geometrie obsažené v importu. Chybějící hranice nelze odvodit z výměry nebo čísla parcely."} Podklad OpenStreetMap vyžaduje připojení; jeho poskytovatel přijímá běžné mapové požadavky.</p></div><aside class="map-side"><div class="panel"><h3>Pozemky</h3><p class="note">Klikni na řádek nebo plochu v mapě.</p>${(portfolio.parcels || []).map((p) => `<button class="parcel-row" data-parcel="${esc(p.id)}"><span>${esc(p.name || p.parcelNumber || p.id)}<br><small>${esc(p.landType || "Druh neuveden")}</small></span><span>${num(p.areaM2 / 10000)} ha</span></button>`).join("")}</div><div class="panel" id="parcel-detail"><div class="eyebrow">SOUVISLOSTI MÍSTA</div><h3 class="section-space">Začni pohledem na vodu</h3><p class="note">Kudy voda přichází? Co jí zrychluje odtok? Které místo zůstává přirozeně vlhké?</p><a class="text-button" href="https://mapy.vumop.cz/" target="_blank" rel="noopener">Půdní a erozní mapy ↗</a><a class="text-button" href="https://mapy.nature.cz/" target="_blank" rel="noopener">Mapy ochrany přírody ↗</a></div></aside></div>`;
}
const layers = new Map();
function mountMap() {
  layers.clear();
  mapInstance = L.map("land-map", { scrollWheelZoom: false }).setView(
    [49.72, 14.88],
    13,
  );
  if (tilesEnabled)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapInstance);
  const bounds = [];
  for (const p of portfolio.parcels || []) {
    if (!p.geometry) continue;
    try {
      const feature =
        p.geometry.type === "Feature"
          ? p.geometry
          : { type: "Feature", properties: {}, geometry: p.geometry };
      const color = /les|forest/i.test(p.landType || "")
        ? "#557b45"
        : /water|vod|mokř/i.test(p.landType || "")
          ? "#5a928c"
          : "#a2a15b";
      const layer = L.geoJSON(feature, {
        style: { color, weight: 2, fillOpacity: 0.35 },
      }).addTo(mapInstance);
      layer.bindPopup(
        `<strong>${esc(p.name || p.parcelNumber || p.id)}</strong><br>${esc(p.landType)} · ${num(p.areaM2 / 10000)} ha`,
      );
      layer.on("click", () => selectParcel(p.id));
      layers.set(p.id, layer);
      bounds.push(layer.getBounds());
    } catch {}
  }
  if (bounds.length) {
    const combined = bounds[0];
    bounds.slice(1).forEach((b) => combined.extend(b));
    mapInstance.fitBounds(combined, { padding: [40, 40], maxZoom: 15 });
  } else {
    document
      .querySelector("#parcel-detail")
      .insertAdjacentHTML(
        "afterbegin",
        '<div class="callout">V importu nejsou geometrie. Mapa nezobrazuje hranice vlastních pozemků.</div>',
      );
  }
}
function selectParcel(id) {
  const p = portfolio.parcels.find((x) => x.id === id);
  if (!p) return;
  const l = layers.get(id);
  if (l) {
    mapInstance.fitBounds(l.getBounds(), { padding: [50, 50], maxZoom: 16 });
    l.openPopup();
  }
  document.querySelector("#parcel-detail").innerHTML =
    `<div class="eyebrow">KARTA POZEMKU</div><h3 class="section-space">${esc(p.name || p.parcelNumber || p.id)}</h3><p>${esc(p.cadastralArea || "Katastrální území neuvedeno")}<br>${esc(p.landType)} · ${num(p.areaM2 / 10000)} ha</p><p class="note">${l ? "Geometrie převzata z pracovního projektu." : "Geometrie není k dispozici."} ${esc((p.protections || []).join?.(", ") || "")}</p><button class="button light" data-action="new-parcel" data-id="${esc(id)}">Připravit záměr ${icon("arrow")}</button>`;
  document.querySelector('[data-action="new-parcel"]').onclick = () => {
    draft = newProject();
    draft.parcelIds = [id];
    draft.areaHa = p.areaM2 / 10000;
    draftBaseline = JSON.stringify(draft);
    view = "projects";
    render();
  };
}
function guideView() {
  return `${heading("Souvislosti před sliby", "Průvodce dobrým rozhodnutím", "Praktické otázky pro vlastníka a podklady pro rozhovor s odborníkem.")}<div class="split"><section class="panel guide"><h2>Voda a zdraví krajiny</h2><details open><summary>Tůň, mokřad, nebo rybník?</summary><p>Nejdřív pojmenuj problém. Pro zpomalení odtoku může dávat smysl obnova mokřadu, mělká tůň nebo prostor pro přirozený tok. Rybník má jiné technické, provozní a povolovací souvislosti.</p><ul><li>Odkud bude voda a jaký je stav v suchém období?</li><li>Neodvádí voda z místa drenáž nebo příkop?</li><li>Je zásah napojený na vodní tok a koho ovlivní níže?</li><li>Jaké přírodní hodnoty zde už jsou?</li><li>Kdo bude zajišťovat péči a případné opravy?</li></ul></details><details><summary>Potok a les: řeš celé souvislosti</summary><p>Obnova přirozeného toku, nivy a vodního režimu lesa se posuzuje podle konkrétního místa. Ujasni správce toku, okolní vlastníky, přístup a odvodňovací zařízení. Bez posouzení nezasahuj do koryta ani nestav přehrážky.</p><p>Odborníkovi přines fotografie za různých podmínek, mapu, popis odtoku a cíl. Návrh řešení má navazovat na průzkum.</p></details><details><summary>Ochrana přírody: absence záznamu není absence druhu</summary><p>Veřejné mapy neobsahují všechny nálezy a citlivé údaje. Přítomnost druhu a vhodnost zásahu může vyžadovat místní průzkum. Mapa pouze pomůže včas rozpoznat, co ověřit.</p></details><details><summary>Les, půda a louka jako jeden celek</summary><p>Les potřebuje vhodnou skladbu a hospodaření, pole ochranu před erozí a louka odpovídající péči. Voda propojuje sousední plochy. Zvaž soulad se současným užíváním a lesnickými podklady; zapoj hospodáře a odborného lesního hospodáře.</p></details></section><section class="panel guide"><h2>Nabídky, finance a odpovědnost</h2><details open><summary>Co musí vysvětlit nabídka péče</summary><ul><li>Kdo je dodavatel, žadatel a příjemce podpory?</li><li>Co přesně bude hotové a jak se to převezme?</li><li>Kdo zaplatí, pokud dotace nevyjde?</li><li>Jaké vlastní náklady a budoucí závazky vzniknou?</li><li>Kdo zajišťuje odbornou kvalitu, škody a následnou péči?</li><li>Jak lze spolupráci ukončit?</li></ul><p>Označ nejasná ustanovení smlouvy a vyžádej vysvětlení. Samotný věk stromu neurčuje status památného stromu.</p></details><details><summary>Procento dotace není ekonomický výsledek</summary><p>Odděl způsobilé výdaje, skutečnou cenu, vlastní práci, předfinancování a dlouhodobou péči. Zohledni náklady na dokumentaci i situaci, kdy podpora nebude získána. Závazky vyčti z aktuálních podmínek a rozhodnutí.</p></details><details><summary>Co můžeš předat dalšímu vlastníkovi</summary><p>Přehled doložených faktů, chybějících podkladů, variant a konkrétních dalších kroků. Export v Markdownu jde dál upravovat a archivovat. Odborný posudek, povolení a příslib financování tento nástroj nevydává.</p></details><details><summary>Soukromí a profesní využití</summary><p>Importované soubory se zpracují místně v prohlížeči. Aplikace je sama neodesílá. Místní uložení je dobrovolné a neznamená zálohu nebo synchronizaci. Při používání externích odkazů a map platí pravidla jejich provozovatelů.</p><p>Při profesním využití používej pouze podklady, ke kterým máš oprávnění, a vyjasni případný střet zájmů. Tento nezávislý nástroj nepředstavuje oficiální stanovisko instituce.</p></details></section></div><section class="panel"><h2>Zdroje a kontrolovatelnost</h2><p class="note">Katalog představuje výběr, nikoli úplný přehled všech programů. Podmínky i dostupnost financování se mohou změnit. Záznam katastru a skutečný současný stav se mohou lišit.</p><div class="table-wrap"><table><thead><tr><th>Zdroj</th><th>K čemu slouží</th><th>Odkaz</th></tr></thead><tbody>${sources.map((s) => `<tr><td>${esc(s.name || s.title || s.id)}</td><td>${esc(s.description || s.purpose || s.note || "Veřejný odborný podklad")}</td><td><a href="${safeUrl(s.url)}" target="_blank" rel="noopener">Otevřít zdroj ↗</a></td></tr>`).join("")}</tbody></table></div></section>`;
}
function dataView() {
  mapInstance?.remove();
  mapInstance = null;
  document.querySelector(".content").innerHTML =
    `${heading("Data pod tvou kontrolou", "Moje data", "Pracovní projekt přenášej jako otevřený JSON. Import zpracovává tento prohlížeč.")}<div class="split"><section class="panel"><h2>Načíst a přenést projekt</h2><p>Načti soubor z evidence pozemků nebo dřívější export aplikace. Osobní identifikátory a adresy vlastníků nejsou pro plánování potřebné.</p><div class="form-actions"><button class="button" data-action="import">${icon("upload")} Načíst JSON</button><button class="button secondary" data-action="export">${icon("download")} Export projektu</button></div><p class="note section-space">Načtení nahradí aktuální pracovní projekt v aplikaci. Předem si exportuj rozpracované změny. Soubor není odesílán na server.</p><div id="import-status" class="inline-status" role="status"></div></section><section class="panel"><h2>Místní uložení</h2><p>Bez uložení projekt existuje pouze v otevřené stránce. Export je tvoje přenosná záloha.</p><label class="check-line"><input id="persist" type="checkbox" ${persist ? "checked" : ""}><span>Ukládat pracovní projekt v tomto prohlížeči na tomto zařízení.</span></label><p class="note">Na sdíleném počítači uložení nezapínej. Vymazání dat prohlížeče může projekt odstranit. Soukromý režim nemusí data zachovat.</p><div class="form-actions"><button class="button secondary" data-action="reset">Obnovit ukázková data</button><button class="button danger" data-action="clear">Vymazat místní projekt</button></div></section></div><div class="panel"><h2>Aktuální projekt</h2><p>${esc(portfolio.name || "Pracovní projekt")} · ${portfolio.parcels?.length || 0} parcel · ${getProjects().length} záměrů</p><p class="note">${portfolio.isDemo ? "Smyšlená demonstrační data — nepředstavují rodinný majetek." : "Vlastní místní projekt. Přesnost a aktuálnost vstupů ověř proti původním dokladům."}</p></div>`;
  bind();
  document.querySelector("#persist").onchange = (e) => {
    persist = e.target.checked;
    if (persist) {
      if (save())
        toast("Místní uložení zapnuto. Nezapomeň také exportovat zálohu.");
      else e.target.checked = false;
    } else {
      localStorage.removeItem("krajina-opt-in");
      localStorage.removeItem("krajina-project");
      toast("Místní uložení vypnuto a uložená kopie odstraněna.");
    }
  };
}
function collectDraft() {
  const form = document.querySelector("#project-form");
  if (!form || !draft) return;
  draft.parcelIds = new FormData(form).getAll("parcelIds").filter(Boolean);
  for (const [key, value] of new FormData(form)) {
    if (key.startsWith("evidence.")) draft.evidence[key.slice(9)] = value;
    else if (key.startsWith("budget."))
      draft.budget[key.slice(7)] = Number(value);
    else if (key === "parcelIds")
      draft.parcelIds = new FormData(form).getAll("parcelIds").filter(Boolean);
    else if (key === "areaHa") draft.areaHa = Number(value);
    else draft[key] = value;
  }
}
function bind() {
  document
    .querySelectorAll("[data-nav]")
    .forEach((b) => (b.onclick = () => goto(b.dataset.nav)));
  document.querySelectorAll("[data-edit]").forEach(
    (b) =>
      (b.onclick = () => {
        draft = copy(getProjects().find((p) => p.id === b.dataset.edit));
        draftBaseline = JSON.stringify(draft);
        view = "projects";
        render();
        window.scrollTo({ top: 0 });
      }),
  );
  document.querySelectorAll("[data-filter]").forEach(
    (b) =>
      (b.onclick = () => {
        filter = b.dataset.filter;
        render();
      }),
  );
  document
    .querySelectorAll("[data-parcel]")
    .forEach((b) => (b.onclick = () => selectParcel(b.dataset.parcel)));
  document
    .querySelectorAll("[data-action]")
    .forEach((b) => (b.onclick = () => action(b.dataset.action)));
  const form = document.querySelector("#project-form");
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      collectDraft();
      if (!draft.name.trim()) {
        toast("Doplň název záměru.");
        return;
      }
      const budgetCheck = calculateBudget(draft.budget);
      if (budgetCheck.errors.length) {
        toast(budgetCheck.errors.join(" "));
        return;
      }
      const list = [...getProjects()];
      const at = list.findIndex((p) => p.id === draft.id);
      if (at < 0) list.push(copy(draft));
      else list[at] = copy(draft);
      const candidate = { ...portfolio, projects: list };
      const validation = validateImport(candidate);
      if (!validation.valid) {
        toast(validation.errors.join(" "));
        return;
      }
      portfolio.projects = list;
      const stored = save();
      toast(
        stored
          ? "Záměr uložen do pracovního projektu."
          : "Záměr je jen v paměti. Místní uložení selhalo; exportuj zálohu JSON.",
      );
      draft = null;
      render();
    };
    form.addEventListener("change", (event) => {
      collectDraft();
      if (
        !event.target.name.startsWith("evidence.") &&
        event.target.name !== "measureId"
      )
        return;
      const active = document.activeElement?.name;
      render();
      if (active)
        document.querySelector(`[name="${CSS.escape(active)}"]`)?.focus();
    });
  }
  document.querySelector("#file-import").onchange = importFile;
}
function action(id) {
  if (id === "recalculate") {
    collectDraft();
    render();
  } else if (id === "tiles") {
    if (
      !tilesEnabled &&
      !confirm(
        "Načíst podklad OpenStreetMap? Poskytovatel obdrží tvou IP adresu a zobrazovanou oblast mapy. Názvy parcel ani poznámky se neodesílají.",
      )
    )
      return;
    tilesEnabled = !tilesEnabled;
    render();
  } else if (id === "new") {
    draft = newProject();
    draftBaseline = JSON.stringify(draft);
    view = "projects";
    render();
    window.scrollTo({ top: 0 });
  } else if (id === "back") {
    if (!mayLeaveDraft()) return;
    draft = null;
    render();
  } else if (id === "data") {
    if (!mayLeaveDraft()) return;
    draft = null;
    dataView();
  } else if (id === "import") document.querySelector("#file-import").click();
  else if (id === "export")
    download(
      "krajinný-kompas-projekt.json",
      JSON.stringify(portfolio, null, 2),
    );
  else if (id === "report") {
    collectDraft();
    download(
      "podklad-záměru.md",
      createReport(draft, evaluation(draft)),
      "text/markdown;charset=utf-8",
    );
  } else if (id === "project-json") {
    collectDraft();
    download(
      "záměr.json",
      JSON.stringify(
        { project: draft, evaluation: evaluation(draft) },
        null,
        2,
      ),
    );
  } else if (id === "delete-project") {
    if (confirm("Smazat tento záměr z pracovního projektu?")) {
      portfolio.projects = getProjects().filter((p) => p.id !== draft.id);
      draft = null;
      save();
      render();
      toast("Záměr odstraněn.");
    }
  } else if (id === "reset") {
    if (
      confirm(
        "Nahradit aktuální projekt ukázkovými daty? Neexportované změny se ztratí.",
      )
    ) {
      tilesEnabled = false;
      portfolio = copy(starterPortfolio);
      save();
      goto("overview");
    }
  } else if (id === "clear") {
    if (
      confirm(
        "Odstranit uložený projekt z tohoto prohlížeče a vyprázdnit pracovní prostor?",
      )
    ) {
      tilesEnabled = false;
      persist = false;
      localStorage.removeItem("krajina-opt-in");
      localStorage.removeItem("krajina-project");
      portfolio = {
        schemaVersion: 1,
        name: "Prázdný pracovní projekt",
        isDemo: false,
        parcels: [],
        projects: [],
        observations: [],
      };
      dataView();
      toast("Místní projekt odstraněn.");
    }
  }
}
async function importFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  let status = document.querySelector("#import-status");
  try {
    if (file.size > 10 * 1024 * 1024)
      throw new Error("Soubor je příliš velký. Limit je 10 MB.");
    const raw = JSON.parse(await file.text());
    const result = validateImport(raw);
    if (!result.valid)
      throw new Error(
        (result.errors || ["Neplatná struktura projektu."]).join(" "),
      );
    const next = normalizePortfolio(raw);
    if (
      !confirm(
        `Načíst projekt s ${next.parcels?.length || 0} parcelami? Aktuální pracovní projekt bude nahrazen.`,
      )
    )
      return;
    portfolio = next;
    const stored = save();
    dataView();
    status = document.querySelector("#import-status");
    status.textContent = `Načteno ${next.parcels?.length || 0} parcel. ${(result.warnings || []).join(" ")}`;
    toast(
      stored
        ? "Projekt načten místně v prohlížeči."
        : "Projekt je jen v paměti. Místní uložení selhalo; exportuj JSON.",
    );
  } catch (error) {
    if (status) status.textContent = `Import se nepodařil: ${error.message}`;
    toast(`Import se nepodařil: ${error.message}`);
  }
  event.target.value = "";
}
render();

window.addEventListener("beforeunload", (event) => {
  if (draft) {
    collectDraft();
    if (JSON.stringify(draft) !== draftBaseline) {
      event.preventDefault();
      event.returnValue = "";
    }
  }
});

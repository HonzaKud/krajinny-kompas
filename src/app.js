import "./styles.css";
import { recommend, portfolioSummary } from "./recommendations.js";
import { importDocuments } from "./importer.js";
import { sources } from "./catalog.js";
import { validateImport, normalizePortfolio } from "./engine.js";

const esc = (s = "") =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (n) =>
  new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(
    Number(n) || 0,
  );
const url = (u) => {
  try {
    const x = new URL(u);
    return x.protocol === "https:" ? x.href : "#";
  } catch {
    return "#";
  }
};
const cats = {
  all: "Všechny možnosti",
  forest: "Les",
  meadow: "Louky",
  arable: "Pole",
  water: "Voda v krajině",
  trees: "Stromy",
};
const marks = {
  forest: "↟",
  meadow: "〰",
  arable: "≋",
  water: "≈",
  trees: "♧",
  Les: "↟",
  Louky: "〰",
  Půda: "≋",
  Voda: "≈",
  Stromy: "♧",
};
let portfolio = null,
  focus = "all",
  closed = false,
  persist = false,
  busy = false,
  warnings = [],
  selected = new Set();
const key = "krajina-results-v2";
try {
  if (localStorage.getItem("krajina-results-consent") === "yes") {
    const stored = JSON.parse(localStorage.getItem(key));
    const p = stored?.portfolio || stored;
    if (p?.parcels?.length && validateImport(p).valid) {
      portfolio = normalizePortfolio(p);
      warnings = Array.isArray(stored.warnings)
        ? stored.warnings.filter((w) => typeof w === "string")
        : [
            "Import zachycuje dodané dokumenty; neověřuje aktuální katastr ani nárok na podporu.",
          ];
      persist = true;
    }
  }
} catch {}
const app = document.querySelector("#app");
const results = () => recommend(portfolio, { focus, showClosed: closed });
const find = (id) =>
  recommend(portfolio, { focus: "all", showClosed: true }).find(
    (r) => r.opportunity.id === id,
  );
const status = (r) =>
  r.windowLabel ||
  {
    open: "Otevřená výzva",
    upcoming: "Připravuje se",
    closed: "Výzva uzavřena",
    verify: "Ověřit aktuální výzvu",
  }[r.windowStatus] ||
  "Cesta bez dotační výzvy";
const list = (xs) =>
  `<ul class="detail-list">${(xs || []).map((x) => `<li>${esc(typeof x === "string" ? x : x.label || x.title || x.text || "")}</li>`).join("")}</ul>`;
const limits = (o) =>
  Array.isArray(o.costShare?.limitations)
    ? o.costShare.limitations.join(" ")
    : o.costShare?.limitations || "";
function save() {
  if (!persist) return;
  try {
    localStorage.setItem(key, JSON.stringify({ portfolio, warnings }));
    localStorage.setItem("krajina-results-consent", "yes");
  } catch {
    warnings.push("Prohlížeč data neuložil. Stáhněte si vlastní kopii.");
  }
}
function fit(r) {
  return `<div class="fit ${esc(r.fit.level)}"><i></i><div><strong>${esc(r.fit.label)}</strong><p>${esc(r.fit.reason)}</p></div></div>`;
}
function card(r) {
  const o = r.opportunity;
  return `<article class="opportunity"><div class="card-top"><span class="category">${esc(cats[o.category] || o.category || "Péče o krajinu")}</span><span class="status ${r.windowStatus === "open" ? "open" : ""}">${esc(status(r))}</span></div><div class="card-heading"><span class="nature-mark" aria-hidden="true">${marks[o.category] || "◈"}</span><h2><button data-detail="${esc(o.id)}">${esc(o.title)}</button></h2></div><p class="card-summary">${esc(o.summary)}</p>${fit(r)}<div class="metrics"><div><span>Podpora a spoluúčast</span><strong>${esc(o.costShare?.label || "Podle konkrétních podmínek")}</strong></div><div><span>Náročnost přípravy</span><strong>${esc(o.effort?.label || "Individuální")}</strong></div></div>${r.risks?.length ? `<p class="card-risk"><strong>Pozor:</strong> ${esc(r.risks[0])}</p>` : ""}<div class="card-footer"><button class="text-button" data-detail="${esc(o.id)}">Podmínky a další krok ↗</button><label><input type="checkbox" data-compare="${esc(o.id)}" ${selected.has(o.id) ? "checked" : ""} ${selected.size >= 3 && !selected.has(o.id) ? "disabled" : ""}> Porovnat</label></div></article>`;
}
const landscape = `<svg viewBox="0 0 520 350" role="img" aria-label="Les, louky, pole a voda tvoří propojenou krajinu"><circle cx="411" cy="72" r="31" fill="#d4ac70"/><path d="M0 185Q110 40 275 168T520 130V350H0Z" fill="#bcc8a9"/><path d="M0 235Q118 139 280 218T520 186V350H0Z" fill="#809879"/><path d="M0 275Q150 206 305 264T520 246V350H0Z" fill="#d7d5b7"/><path d="M282 162Q186 202 287 230T261 280T326 350" fill="none" stroke="#d8e6de" stroke-width="23"/><path d="M282 162Q186 202 287 230T261 280T326 350" fill="none" stroke="#8faeaa" stroke-width="9"/>${[45, 75, 105, 145, 175, 205].map((x, i) => `<path d="M${x} ${169 + (i % 3) * 12}l-21 57h42Z" fill="#345847"/><path d="M${x} ${213 + (i % 3) * 12}v25" stroke="#345847" stroke-width="4"/>`).join("")}<path d="M350 280l140-32M367 299l134-31M386 319l127-30" stroke="#aaa87e" fill="none" stroke-width="3"/></svg>`;
function render() {
  const s = portfolioSummary(portfolio),
    rs = results();
  app.innerHTML = `<a class="skip" href="#results">Přejít na možnosti</a><header><a class="brand" href="#"><span class="brand-mark" aria-hidden="true">⌘</span><span>Krajinný <b>kompas</b><small>Péče, která dává smysl.</small></span></a><nav><button class="quiet about" data-action="about">Jak číst výsledky</button><button class="button small" data-action="data">${s.hasData ? "Moje podklady" : "Načíst podklady"} ↗</button></nav></header><main><section class="hero"><div><p class="eyebrow">OD MOŽNOSTÍ K ROZHODNUTÍ</p><h1>Co může prospět<br> vaší krajině<span>.</span></h1><p class="hero-text">Najděte podporu pro lesy, louky, půdu i vodu. Rovnou s podmínkami, spoluúčastí a tím, na co si dát pozor.</p><div class="hero-note"><span aria-hidden="true">↗</span><p>${s.hasData ? `Výběr přizpůsobený evidenci <strong>${fmt(s.count)} ${s.count === 1 ? "parcela" : s.count >= 2 && s.count <= 4 ? "parcely" : "parcel"} · ${fmt(s.areaHa)} ha.</strong> Bez dalšího vyplňování.` : "Možnosti můžete procházet ihned. <strong>Podklady o pozemcích nejsou podmínkou.</strong>"}</p></div></div><aside class="landscape">${landscape}<div><span>Les · Louka · Pole · Voda</span><strong>Každé místo má své možnosti.</strong></div></aside></section>${warnings.length ? `<section class="notice" role="status"><strong>Co je potřeba vědět o podkladech</strong>${list(warnings)}</section>` : ""}<section class="results-section" id="results"><div class="section-heading"><div><p class="eyebrow">${s.hasData ? "PODLE VAŠICH PODKLADŮ" : "ZAČNĚTE TÍM, CO VÁS ZAJÍMÁ"}</p><h2>Možnosti pro krajinu</h2></div><button class="quiet export" data-action="report">Stáhnout přehled ↓</button></div><div class="filters" role="group" aria-label="Oblast zájmu">${Object.entries(
    cats,
  )
    .map(
      ([id, name]) =>
        `<button class="chip ${focus === id ? "active" : ""}" data-focus="${id}" aria-pressed="${focus === id}">${marks[id] ? `<span aria-hidden="true">${marks[id]}</span>` : ""}${name}</button>`,
    )
    .join(
      "",
    )}</div><div class="results-meta"><p><strong>${rs.length} možností</strong> · ${s.hasData ? "seřazeno podle shody s evidencí" : "podpory i cesty bez dotace"}</p><label><input id="closed" type="checkbox" ${closed ? "checked" : ""}> Zahrnout uzavřené výzvy</label></div><p class="interpretation">Shoda s evidencí vyjadřuje návaznost na známé údaje. Není to pravděpodobnost schválení dotace ani potvrzený nárok.</p><div class="cards">${rs.length ? rs.map(card).join("") : '<div class="empty"><h3>V tomto výběru teď není žádná možnost.</h3><p>Zkuste jinou oblast nebo zahrňte uzavřené výzvy.</p><button class="button" data-focus="all">Všechny oblasti</button></div>'}</div></section><section class="import-banner"><div><p class="eyebrow">MÁTE VLASTNÍ POZEMKY?</p><h2>Dokumenty dovnitř. Souvislosti ven.</h2><p>Načtěte soupis, poznámky nebo sken z katastru. Výběr se přizpůsobí dostupným údajům. Všechno se zpracuje v tomto prohlížeči.</p></div><button class="button" data-action="data">Načíst podklady ↗</button></section></main><footer><strong>Krajinný kompas</strong><p>Pracovní orientace z veřejných zdrojů. Konkrétní podmínky potvrzuje poskytovatel podpory.</p><button class="quiet" data-action="sources">Zdroje a aktuálnost</button></footer>${selected.size ? `<aside class="compare-bar" aria-label="Vybrané možnosti"><span><strong>${selected.size} ze 3</strong> možností k porovnání</span><button class="quiet" data-action="clear">Zrušit výběr</button><button class="button" data-action="compare">Porovnat možnosti →</button></aside>` : ""}<dialog id="modal"><div class="modal-top"><span>Krajinný kompas</span><button class="close" data-action="close" aria-label="Zavřít dialog">×</button></div><div id="modal-content"></div></dialog>`;
  document.querySelector(".hero").classList.toggle("has-data", s.hasData);
  bind();
}
function dialog(html, wide = false) {
  const d = document.querySelector("#modal");
  d.classList.toggle("wide", wide);
  document.querySelector("#modal-content").innerHTML = html;
  const title = document.querySelector("#modal-content h2");
  if (title) {
    title.id = "modal-title";
    d.setAttribute("aria-labelledby", title.id);
  }
  if (!d.open) d.showModal();
  else d.scrollTop = 0;
  bindDialog();
}
function sourceUrls(r) {
  return [
    ...new Set([
      ...(r.sourceUrls || []),
      ...(r.opportunity.sourceUrls || []),
      ...(r.opportunity.sourceIds || [])
        .map((id) => sources.find((s) => s.id === id)?.url)
        .filter(Boolean),
    ]),
  ];
}
function detail(id) {
  const r = find(id);
  if (!r) return;
  const o = r.opportunity;
  dialog(
    `<p class="eyebrow">${esc(cats[o.category] || "MOŽNOST PRO KRAJINU")}</p><h2 class="modal-title">${esc(o.title)}</h2><p class="lead">${esc(o.summary)}</p>${fit(r)}<p class="small muted">Shoda s podklady není odhad pravděpodobnosti získání podpory.</p><div class="detail-metrics"><section><h3>Podpora a spoluúčast</h3><strong class="metric-large">${esc(o.costShare?.label)}</strong><p>${esc(o.costShare?.basis)}</p><p>${esc(limits(o))}</p><span class="status">${esc(status(r))}</span>${r.program ? `<p>${esc(r.program.title)}</p>` : ""}</section><section><h3>Kolik práce to znamená</h3><strong class="metric-large">${esc(o.effort?.label)}</strong><p>${esc(o.effort?.reason)}</p></section></div>${
      r.parcels?.length
        ? `<section><h3>Návaznost na pozemky</h3><p>${fmt(r.parcels.length)} parcel · ${fmt(r.areaHa)} ha</p><div class="parcel-tags">${r.parcels
            .slice(0, 15)
            .map(
              (p) =>
                `<span>${esc(p.parcelNumber || p.name || p.id)}${p.cadastralArea ? ` · ${esc(p.cadastralArea)}` : ""}</span>`,
            )
            .join(
              "",
            )}${r.parcels.length > 15 ? "<span>… další v načteném soupisu</span>" : ""}</div></section>`
        : ""
    }<section><h3>Co může přinést</h3>${list(o.benefits)}</section><section class="risk-box"><h3>Na co si dát pozor</h3>${list([...new Set([...(r.risks || []), ...(o.risks || [])])])}</section>${r.missing?.length ? `<section><h3>Co z dokumentů zatím nevíme</h3>${list(r.missing)}<p class="small muted">Není potřeba nic vyplňovat. Tyto body ověřte, až se rozhodnete pokračovat.</p></section>` : ""}<section class="next-step"><p class="eyebrow">PRVNÍ SMYSLUPLNÝ KROK</p><h3>${esc(o.nextStep)}</h3></section><section><h3>Odkud informace pocházejí</h3><ul class="source-list">${sourceUrls(
      r,
    )
      .map(
        (u, i) =>
          `<li><a href="${esc(url(u))}" target="_blank" rel="noopener noreferrer">${esc(sources.find((s) => s.url === u)?.title || `Oficiální podklad ${i + 1}`)} ↗</a></li>`,
      )
      .join(
        "",
      )}</ul><p class="small muted">Ověření katalogu: ${esc(o.checkedAt || "neuvedeno")}. Termíny a pravidla se mohou změnit.</p></section><div class="dialog-actions"><button class="button" data-download-one="${esc(id)}">Stáhnout tuto možnost ↓</button><button class="quiet" data-action="close">Zavřít</button></div>`,
  );
}
function dataDialog() {
  dialog(
    `<p class="eyebrow">VOLITELNÉ SOUKROMÉ PODKLADY</p><h2 class="modal-title">Vaše pozemky, bez přepisování.</h2><p class="lead">Vyberte jeden nebo více dokumentů. Údaje přidáme k načteným pozemkům a rovnou seřadíme možnosti. Rozporné záznamy nepřepíšeme.</p><label class="dropzone" id="dropzone"><span class="upload-symbol" aria-hidden="true">↥</span><strong>Vybrat dokumenty</strong><span>nebo je přetáhnout sem</span><small>JSON, Markdown, TXT, PDF, JPG a PNG</small><input id="documents" type="file" multiple accept=".json,.md,.markdown,.txt,.pdf,.jpg,.jpeg,.png"></label><p id="import-progress" role="status" class="progress"></p><div class="privacy"><strong>Zpracování v tomto zařízení</strong><p>Obsah dokumentů se neodesílá na server ani do externího AI. Čtení skenů může trvat déle a může obsahovat chyby. Import nenahrazuje ověření katastru.</p></div>${portfolio ? `<div class="data-summary"><strong>Načtené parcely: ${fmt(portfolio.parcels?.length)}</strong><p>${esc(portfolio.name || "Vaše podklady")}</p><label class="remember"><input id="remember" type="checkbox" ${persist ? "checked" : ""}> Pamatovat údaje v tomto prohlížeči</label><div class="dialog-actions"><button class="quiet" data-action="download-data">Stáhnout vlastní kopii</button><button class="danger" data-action="delete-data">Odstranit moje data</button></div></div>` : '<p class="small muted">Bez uložení do prohlížeče podklady zmizí po zavření nebo obnovení stránky. Výsledky fungují i bez importu.</p>'}`,
  );
}
async function handleFiles(files) {
  if (busy || !files?.length) return;
  busy = true;
  document.querySelector("#modal .close").disabled = true;
  document
    .querySelectorAll("#modal .data-summary button, #modal #remember")
    .forEach((el) => (el.disabled = true));
  const progress = document.querySelector("#import-progress");
  const update = (s) => {
    if (progress)
      progress.textContent =
        typeof s === "string" ? s : s?.message || "Zpracovávám dokumenty…";
  };
  update("Načítám dokumenty. Okno prosím ponechte otevřené.");
  document.querySelector("#documents").disabled = true;
  try {
    const r = await importDocuments(Array.from(files), {
      onProgress: update,
      existingPortfolio: portfolio,
    });
    if (!r.portfolio?.parcels?.length)
      throw Error(
        "V podkladech se nepodařilo najít parcelní soupis. Zkuste textový přepis nebo JSON.",
      );
    portfolio = r.portfolio;
    warnings = [...new Set([...warnings, ...(r.warnings || [])])];
    selected.clear();
    save();
    document.querySelector("#modal").close();
    render();
    document.querySelector("#results").scrollIntoView({ behavior: "smooth" });
  } catch (e) {
    update(e.message || "Dokument se nepodařilo přečíst. Zkuste jiný podklad.");
    const input = document.querySelector("#documents");
    if (input) input.disabled = false;
  } finally {
    busy = false;
    const close = document.querySelector("#modal .close");
    if (close) close.disabled = false;
    document
      .querySelectorAll("#modal .data-summary button, #modal #remember")
      .forEach((el) => (el.disabled = false));
  }
}
function comparison() {
  const rs = [...selected].map(find).filter(Boolean);
  dialog(
    `<p class="eyebrow">VEDLE SEBE, V SOUVISLOSTECH</p><h2 class="modal-title">Porovnání možností</h2><p class="muted">Srovnání podmínek, nikoli predikce schválení.</p><div class="comparison">${rs.map((r) => `<article><h3>${esc(r.opportunity.title)}</h3><div><span>Shoda s evidencí</span><strong>${esc(r.fit.label)}</strong><p>${esc(r.fit.reason)}</p></div><div><span>Podpora a spoluúčast</span><strong>${esc(r.opportunity.costShare?.label)}</strong><p>${esc(r.opportunity.costShare?.basis)}</p></div><div><span>Náročnost</span><strong>${esc(r.opportunity.effort?.label)}</strong><p>${esc(r.opportunity.effort?.reason)}</p></div><div><span>Dostupnost</span><strong>${esc(status(r))}</strong></div><div><span>Hlavní rizika</span>${list((r.risks?.length ? r.risks : r.opportunity.risks || []).slice(0, 3))}</div><button class="text-button" data-detail="${esc(r.opportunity.id)}">Úplný detail ↗</button></article>`).join("")}</div>`,
    true,
  );
}
function report(rs = results()) {
  return `# Krajinný kompas – možnosti pro krajinu\n\nVytvořeno: ${new Date().toLocaleDateString("cs-CZ")}\n\n${portfolio ? `Načtený soupis: ${portfolio.parcels.length} parcel.` : "Obecný přehled bez soukromých podkladů."} Shoda s evidencí není pravděpodobnost schválení ani potvrzení nároku.\n\n${rs
    .map((r) => {
      const o = r.opportunity;
      return `## ${o.title}\n\n${o.summary}\n\n- Shoda: ${r.fit.label}. ${r.fit.reason}\n- Stav: ${status(r)}\n- Spoluúčast: ${o.costShare?.label || "Ověřit"}\n- Základ: ${o.costShare?.basis || ""}\n- Omezení: ${limits(o)}\n- Náročnost: ${o.effort?.label || ""}. ${o.effort?.reason || ""}\n\n### Rizika\n${[...new Set([...(r.risks || []), ...(o.risks || [])])].map((x) => `- ${x}`).join("\n")}\n\n### Co zatím nevíme\n${(r.missing || []).map((x) => `- ${x}`).join("\n")}\n\n### Další krok\n${o.nextStep}\n\n### Zdroje\n${sourceUrls(
        r,
      )
        .map((u) => `- ${u}`)
        .join("\n")}\n\nOvěření: ${o.checkedAt || "neuvedeno"}.\n`;
    })
    .join(
      "\n",
    )}${warnings.length ? `\n## Nejistoty importu\n${warnings.map((w) => `- ${w}`).join("\n")}` : ""}`;
}
function download(name, body, type = "text/markdown;charset=utf-8") {
  const u = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
function action(a) {
  if (a === "close") {
    document.querySelector("#modal").close();
    return;
  }
  if (a === "data") dataDialog();
  if (a === "clear") {
    selected.clear();
    render();
  }
  if (a === "compare") comparison();
  if (a === "report") download("krajina-moznosti.md", report());
  if (a === "download-data")
    download(
      "moje-pozemky.json",
      JSON.stringify(portfolio, null, 2),
      "application/json",
    );
  if (a === "delete-data") {
    portfolio = null;
    persist = false;
    warnings = [];
    selected.clear();
    for (const k of [
      key,
      "krajina-results-consent",
      "krajina-project",
      "krajina-opt-in",
    ])
      localStorage.removeItem(k);
    document.querySelector("#modal").close();
    render();
  }
  if (a === "about")
    dialog(
      `<p class="eyebrow">CO VÝSLEDKY ZNAMENAJÍ</p><h2 class="modal-title">Dobré rozhodnutí začíná souvislostmi.</h2><p class="lead">Nabídky fungují i bez podkladů. Po importu je řadíme podle typu a výměry doložených pozemků.</p><h3>Shoda, nikoli procenta úspěchu</h3><p>Samotný katastr neříká, kdo pozemek obhospodařuje, co na něm roste nebo zda je splněna podmínka výzvy. Bez dat o žádostech a jejich výsledcích by procento šance bylo smyšlené.</p><h3>Spoluúčast v kontextu</h3><p>Maximální podíl podpory se obvykle vztahuje k uznatelným nákladům. Neuznatelné výdaje, překročení limitu, předfinancování a následná péče mohou zůstat na žadateli.</p><h3>Nic nemusíte vyplňovat</h3><p>Chybějící údaje jsou body k ověření. Až u zajímavé možnosti dává smysl kontaktovat poskytovatele nebo odborníka.</p>`,
    );
  if (a === "sources")
    dialog(
      `<p class="eyebrow">DOHLEDATELNÉ PODKLADY</p><h2 class="modal-title">Zdroje a aktuálnost</h2><p>Podrobné odkazy jsou také u každé možnosti. Katalog nenahrazuje aktuální znění výzvy ani odborné posouzení místa.</p><ul class="source-list">${sources.map((s) => `<li><a href="${esc(url(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a><p class="small muted">${esc(s.organization || "")}${s.checkedAt ? ` · ${esc(s.checkedAt)}` : ""}</p></li>`).join("")}</ul>`,
    );
}
function bind() {
  app
    .querySelectorAll("[data-action]")
    .forEach((b) => (b.onclick = () => action(b.dataset.action)));
  app.querySelectorAll("[data-focus]").forEach(
    (b) =>
      (b.onclick = () => {
        focus = b.dataset.focus;
        render();
      }),
  );
  app
    .querySelectorAll("[data-detail]")
    .forEach((b) => (b.onclick = () => detail(b.dataset.detail)));
  app.querySelectorAll("[data-compare]").forEach(
    (b) =>
      (b.onchange = () => {
        b.checked
          ? selected.add(b.dataset.compare)
          : selected.delete(b.dataset.compare);
        const y = window.scrollY;
        render();
        window.scrollTo(0, y);
      }),
  );
  document.querySelector("#closed").onchange = (e) => {
    closed = e.target.checked;
    render();
  };
  document.querySelector("#modal").addEventListener("click", (e) => {
    if (!busy && e.target === e.currentTarget) e.currentTarget.close();
  });
  document.querySelector("#modal").addEventListener("cancel", (e) => {
    if (busy) e.preventDefault();
  });
}
function bindDialog() {
  const d = document.querySelector("#modal");
  d.querySelectorAll("[data-action]").forEach(
    (b) => (b.onclick = () => action(b.dataset.action)),
  );
  d.querySelectorAll("[data-detail]").forEach(
    (b) => (b.onclick = () => detail(b.dataset.detail)),
  );
  d.querySelectorAll("[data-download-one]").forEach(
    (b) =>
      (b.onclick = () =>
        download("krajina-moznost.md", report([find(b.dataset.downloadOne)]))),
  );
  const input = d.querySelector("#documents");
  if (input) {
    input.onchange = () => handleFiles(input.files);
    const zone = d.querySelector("#dropzone");
    zone.ondragover = (e) => {
      e.preventDefault();
      zone.classList.add("dragover");
    };
    zone.ondragleave = () => zone.classList.remove("dragover");
    zone.ondrop = (e) => {
      e.preventDefault();
      zone.classList.remove("dragover");
      handleFiles(e.dataTransfer.files);
    };
  }
  const remember = d.querySelector("#remember");
  if (remember)
    remember.onchange = (e) => {
      persist = e.target.checked;
      if (persist) save();
      else {
        localStorage.removeItem(key);
        localStorage.removeItem("krajina-results-consent");
      }
    };
}
render();

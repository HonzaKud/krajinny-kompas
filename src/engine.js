const clean = (v, n = 500) => String(v ?? "").slice(0, n);
const list = (v) => (Array.isArray(v) ? v : []);
const evidenceState = (v) =>
  v === "yes" || v === true
    ? "yes"
    : v === "no" || v === false
      ? "no"
      : "unknown";
const evidenceIds = [
  "ownership",
  "consent",
  "ecology",
  "waterAuthority",
  "siteVisit",
  "maintenance",
  "operator",
  "waterBalance",
  "flow",
  "sediment",
  "fish",
  "treeStatus",
];
const measureIds = [
  "pools",
  "wetland",
  "stream",
  "pond",
  "forest",
  "meadow",
  "trees",
  "soil",
];

export function validateImport(data) {
  const errors = [],
    warnings = [];
  if (!data || typeof data !== "object" || Array.isArray(data))
    return {
      valid: false,
      errors: ["Soubor musí obsahovat objekt portfolia."],
      warnings,
    };
  if (data.provenance != null) {
    const p = data.provenance;
    if (typeof p !== "object" || Array.isArray(p))
      errors.push("Neplatné informace o původu dat.");
    else {
      if (
        p.warnings != null &&
        (!Array.isArray(p.warnings) ||
          p.warnings.length > 100 ||
          p.warnings.some((w) => typeof w !== "string" || w.length > 3000))
      )
        errors.push(
          "Upozornění původu musí obsahovat nejvýše 100 textů po 3 000 znacích.",
        );
      if (
        p.sourceDates != null &&
        (!Array.isArray(p.sourceDates) ||
          p.sourceDates.length > 30 ||
          p.sourceDates.some((d) => typeof d !== "string" || d.length > 40))
      )
        errors.push("Neplatný seznam dat zdrojových dokumentů.");
    }
  }
  if (
    !Array.isArray(data.parcels) ||
    (!data.parcels.length && data.schemaVersion !== 1)
  )
    errors.push("Chybí seznam parcel.");
  if (list(data.parcels).length > 1000)
    errors.push("Limit importu je 1 000 parcel.");
  if (list(data.projects).length > 100)
    errors.push("Limit importu je 100 záměrů; soubor nebyl importován.");
  if (list(data.observations).length > 200)
    errors.push("Limit importu je 200 pozorování; soubor nebyl importován.");
  if (data.schemaVersion != null && data.schemaVersion !== 1)
    errors.push("Nepodporovaná verze portfolia.");
  const ids = new Set();
  let vertexCount = 0;
  for (const [i, p] of list(data.parcels).entries()) {
    if (!p || typeof p !== "object") {
      errors.push(`Parcela ${i + 1} nemá správný formát.`);
      continue;
    }
    const area = Number(p.areaM2 ?? p.area_m2);
    if (!Number.isFinite(area) || area <= 0 || area > 1e11)
      errors.push(`Parcela ${i + 1}: neplatná výměra.`);
    const id = clean(p.id || `parcel-${i + 1}`, 100);
    if (ids.has(id)) errors.push(`Duplicitní identifikátor parcely ${i + 1}.`);
    ids.add(id);
    if (p.geometry && !validGeometry(p.geometry))
      errors.push(
        `Parcela ${i + 1}: geometrie musí být WGS84 Polygon nebo MultiPolygon.`,
      );
    if (p.geometry && validGeometry(p.geometry))
      vertexCount += (
        p.geometry.type === "Polygon"
          ? [p.geometry.coordinates]
          : p.geometry.coordinates
      ).reduce(
        (s, poly) => s + poly.reduce((t, ring) => t + ring.length, 0),
        0,
      );
  }
  if (vertexCount > 60000)
    errors.push("Geometrie celého portfolia překračuje limit 60 000 bodů.");
  const projectIds = new Set();
  for (const [i, p] of list(data.projects).entries()) {
    if (!p || typeof p !== "object") {
      errors.push(`Záměr ${i + 1} má chybný formát.`);
      continue;
    }
    const id = clean(p.id || `project-${i + 1}`, 100);
    if (projectIds.has(id))
      errors.push(`Duplicitní identifikátor záměru ${i + 1}.`);
    projectIds.add(id);
    if (String(p.name || "").length > 150)
      errors.push(`Záměr ${i + 1}: název přesahuje 150 znaků.`);
    if (list(p.parcelIds).some((id) => !ids.has(id)))
      errors.push(`Záměr ${i + 1} odkazuje na neznámou parcelu.`);
    if (String(p.notes || "").length > 20000)
      errors.push(`Záměr ${i + 1}: poznámky přesahují limit 20 000 znaků.`);
    if (!measureIds.includes(p.measureId))
      errors.push(`Záměr ${i + 1}: neznámý typ opatření.`);
    if (
      p.areaHa != null &&
      (!Number.isFinite(Number(p.areaHa)) || Number(p.areaHa) < 0)
    )
      errors.push(`Záměr ${i + 1}: neplatná řešená plocha.`);
    for (const [key, value] of Object.entries(p.budget || {})) {
      if (key === "grantConfirmed") continue;
      if (!Number.isFinite(Number(value)) || Number(value) < 0)
        errors.push(`Záměr ${i + 1}: neplatný rozpočet (${clean(key, 30)}).`);
    }
    if (Number(p.budget?.grantRate) > 100 || Number(p.budget?.years) > 100)
      errors.push(
        `Záměr ${i + 1}: sazba nebo horizont přesahuje povolené rozmezí.`,
      );
    if (calculateBudget(p.budget).errors.length)
      errors.push(
        `Záměr ${i + 1}: ${calculateBudget(p.budget).errors.join(" ")}`,
      );
  }
  if (data.owners) warnings.push("Osobní údaje vlastníků se neimportují.");
  if (data.as_of)
    warnings.push(
      `Podklad platný k ${clean(data.as_of, 30)}; současné vlastnictví ověř zvlášť.`,
    );
  if (!list(data.parcels).some((p) => p?.geometry))
    warnings.push(
      "V podkladech chybí geometrie; hranice a místní podmínky nejsou ověřeny.",
    );
  return { valid: !errors.length, errors: errors.slice(0, 20), warnings };
}

function validGeometry(g) {
  if (
    !g ||
    !["Polygon", "MultiPolygon"].includes(g.type) ||
    !Array.isArray(g.coordinates)
  )
    return false;
  let count = 0;
  const polygons = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  return (
    polygons.length > 0 &&
    polygons.length <= 1000 &&
    polygons.every(
      (poly) =>
        Array.isArray(poly) &&
        poly.length > 0 &&
        poly.every((ring) => {
          if (!Array.isArray(ring) || ring.length < 4) return false;
          if (
            !ring.every(
              (p) =>
                ++count <= 50000 &&
                Array.isArray(p) &&
                p.length === 2 &&
                Number.isFinite(p[0]) &&
                Number.isFinite(p[1]) &&
                Math.abs(p[0]) <= 180 &&
                Math.abs(p[1]) <= 90,
            )
          )
            return false;
          const first = ring[0],
            last = ring.at(-1);
          return first[0] === last[0] && first[1] === last[1];
        }),
    )
  );
}

export function normalizePortfolio(data) {
  const validation = validateImport(data);
  if (!validation.valid) throw new Error(validation.errors.join(" "));
  const parcels = data.parcels.map((p, i) => ({
    id: clean(p.id || `parcel-${i + 1}`, 100),
    name: clean(
      p.name ||
        `${p.cadastralArea || p.cadastral_area || "Parcela"} ${p.parcelNumber || p.parcel_number || i + 1}`,
      150,
    ),
    parcelNumber: clean(p.parcelNumber || p.parcel_number, 40),
    cadastralArea: clean(p.cadastralArea || p.cadastral_area, 100),
    areaM2: Number(p.areaM2 ?? p.area_m2),
    landType: clean(p.landType || p.land_type, 100),
    protections: list(p.protections)
      .slice(0, 30)
      .map((x) => clean(x, 200)),
    geometry: p.geometry
      ? {
          type: p.geometry.type,
          coordinates: JSON.parse(JSON.stringify(p.geometry.coordinates)),
        }
      : null,
  }));
  const parcelIds = new Set(parcels.map((p) => p.id));
  const projects = list(data.projects)
    .slice(0, 100)
    .filter((p) => p && typeof p === "object")
    .map((p, i) => ({
      id: clean(p.id || `project-${i + 1}`, 100),
      name: clean(p.name, 150),
      notes: clean(p.notes, 20000),
      measureId: clean(p.measureId, 50),
      parcelIds: list(p.parcelIds).filter((id) => parcelIds.has(id)),
      areaHa: Math.max(0, Number(p.areaHa) || 0),
      evidence: Object.fromEntries(
        evidenceIds.map((id) => [id, evidenceState(p.evidence?.[id])]),
      ),
      budget: Object.fromEntries(
        [
          "preparation",
          "implementation",
          "maintenance",
          "annualMaintenance",
          "ownWork",
          "grantRate",
          "eligibleCosts",
          "years",
        ].map((id) => [
          id,
          Number.isFinite(Number(p.budget?.[id]))
            ? Number(p.budget[id])
            : id === "annualMaintenance"
              ? Number(p.budget?.maintenance) || 0
              : 0,
        ]),
      ),
    }));
  return {
    schemaVersion: 1,
    name: clean(data.name || data.title || "Moje pozemky", 150),
    isDemo: data.isDemo === true,
    provenance: {
      warnings: [
        ...new Set([
          ...list(data.provenance?.warnings),
          ...validation.warnings,
        ]),
      ]
        .slice(0, 100)
        .map((w) => clean(w, 3000)),
      containsDemo:
        data.isDemo === true || data.provenance?.containsDemo === true,
      sourceDates: [
        ...new Set([
          ...list(data.provenance?.sourceDates),
          ...(data.as_of ? [clean(data.as_of, 40)] : []),
        ]),
      ].slice(0, 30),
    },
    parcels,
    projects,
    observations: list(data.observations)
      .slice(0, 200)
      .map((o) => ({
        id: clean(o?.id, 100),
        parcelId: clean(o?.parcelId, 100),
        text: clean(o?.text, 2000),
        date: clean(o?.date, 30),
      })),
  };
}

export function calculateBudget(budget = {}) {
  const errors = [],
    warnings = [];
  const num = (key, fallback = 0) => {
    const v = Number(budget[key] ?? fallback);
    if (!Number.isFinite(v) || v < 0) {
      errors.push(`Neplatná částka: ${key}.`);
      return 0;
    }
    return v;
  };
  const total = num("preparation") + num("implementation") + num("ownWork");
  const enteredEligible = num("eligibleCosts");
  const eligibleCosts = Math.min(total, enteredEligible);
  if (enteredEligible > total)
    errors.push("Způsobilé náklady převyšují celkový rozpočet.");
  const rate = num("grantRate");
  if (rate > 100) errors.push("Míra podpory musí být mezi 0 a 100 %.");
  const grant = (eligibleCosts * Math.min(rate, 100)) / 100;
  if (total === 0)
    warnings.push(
      "Rozpočet zatím není vyčíslen. Nulové vstupy neznamenají bezplatnou realizaci.",
    );
  const annualMaintenance = num(
    budget.annualMaintenance != null ? "annualMaintenance" : "maintenance",
  );
  const years = num("years", 5);
  if (years > 100) errors.push("Horizont péče přesahuje 100 let.");
  const maintenanceTotal = annualMaintenance * Math.min(years, 100);
  warnings.push(
    "Podpora je pouze scénář zadaný uživatelem. Způsobilost, sazba ani přiznání dotace nejsou ověřeny.",
  );
  if (grant > 0)
    warnings.push(
      "Do obdržení podpory může být potřeba předfinancovat celou realizaci.",
    );
  return {
    total,
    eligibleCosts,
    grant,
    ownContribution: total - grant,
    upfrontCash: total,
    annualMaintenance,
    years,
    maintenanceTotal,
    netCost: total - grant + maintenanceTotal,
    errors,
    warnings,
  };
}

export function evaluateProject(
  project = {},
  { measures = [], programs = [], sources = [] } = {},
) {
  const measure = measures.find((m) => m.id === project.measureId);
  const checks = list(measure?.questions).map((q) => ({
    id: q.id,
    label: q.label,
    status: evidenceState(project.evidence?.[q.id]),
    required: q.required !== false,
    help: q.help || "",
    sourceId: q.sourceId,
  }));
  const blockers = checks
    .filter((c) => c.required && c.status === "no")
    .map((c) => c.label);
  const nextSteps = checks
    .filter((c) => c.status !== "yes")
    .map(
      (c) =>
        `${c.status === "no" ? "Vyřešit" : "Ověřit"}: ${c.label}${c.help ? ` — ${c.help}` : ""}`,
    );
  if (!list(project.parcelIds).length)
    nextSteps.unshift("Přiřadit konkrétní parcely a ověřit hranice záměru.");
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const funding = programs
    .filter(
      (p) =>
        list(measure?.programIds).includes(p.id) ||
        list(p.measureIds).includes(measure?.id),
    )
    .map((program) => {
      let windowStatus = program.status || "verify";
      if (program.window?.end && program.window.end < today)
        windowStatus = "closed";
      else if (program.window?.start && program.window.start > today)
        windowStatus = "upcoming";
      else if (windowStatus === "upcoming") windowStatus = "verify";
      const stale =
        !program.checkedAt ||
        (now - new Date(program.checkedAt)) / 86400000 > 30;
      if (stale && windowStatus !== "closed") windowStatus = "verify";
      const reasons = [];
      if (windowStatus === "closed") reasons.push("Uvedená výzva už skončila.");
      if (windowStatus === "upcoming")
        reasons.push("Příjem žádostí má začít později; ověř podmínky výzvy.");
      if (windowStatus === "verify")
        reasons.push(
          "Aktuální příjem a znění podmínek je třeba ověřit u poskytovatele.",
        );
      if (stale) reasons.push("Zdroj nebyl ověřen v posledních 30 dnech.");
      if (checks.some((c) => c.status !== "yes"))
        reasons.push("Chybí část podkladů k záměru.");
      reasons.push(
        program.eligibilityNote ||
          "Žadatele a způsobilost ověř podle úplných podmínek.",
      );
      return {
        program,
        status:
          windowStatus === "closed"
            ? "blocked"
            : blockers.length
              ? "unknown"
              : "candidate",
        reasons,
        windowStatus,
        checkedAt: program.checkedAt,
      };
    });
  const answered = checks.filter((c) => c.status !== "unknown").length;
  return {
    measure,
    readiness: {
      answered,
      total: checks.length,
      percent: checks.length ? Math.round((answered / checks.length) * 100) : 0,
    },
    checks,
    blockers,
    nextSteps,
    funding,
    sources: sources.filter((s) => list(measure?.sourceIds).includes(s.id)),
    summary: !measure
      ? "Vyber opatření."
      : blockers.length
        ? "Záměr má otevřené překážky. Nejdřív vyřeš uvedené podklady."
        : checks.some((c) => c.status === "unknown")
          ? "Záměr potřebuje doplnit podklady pro odborné posouzení."
          : "Podklady jsou vyplněné. Proveditelnost a povolení musí potvrdit příslušní odborníci a úřady.",
    waterAdvice: ["pools", "wetland", "stream", "pond"].includes(measure?.id)
      ? [
          "Před výběrem řešení zjisti zdroj vody, sezónnost a vliv na pozemky po proudu.",
          "Potok, tůň, mokřad a rybník nejsou zaměnitelné. Zásahy do toku či vodního režimu vyžadují místní odborné posouzení.",
        ]
      : [],
  };
}

export function createReport(project, evaluation) {
  const b = calculateBudget(project.budget);
  const money = (v) =>
    new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: 0,
    }).format(v);
  const safe = (v) => clean(v, 4000).replace(/[\r\n]+/g, " ");
  const section = (title, items) =>
    items?.length ? [`\n## ${title}`, ...items.map((x) => `- ${safe(x)}`)] : [];
  const statusLabel = {
    open: "otevřená – ověřit podmínky",
    upcoming: "oznámený budoucí termín",
    closed: "ukončená",
    verify: "aktuální příjem ověřit",
  };
  return [
    `# ${safe(project.name || "Pracovní záměr")}`,
    `Vytvořeno: ${new Date().toISOString().slice(0, 10)}`,
    `Opatření: ${safe(evaluation.measure?.title || project.measureId)}`,
    `Parcely (ID): ${list(project.parcelIds).map(safe).join(", ") || "nepřiřazeno"}`,
    ...list(evaluation.parcels).map(
      (p) =>
        `- ${safe(p.cadastralArea)} ${safe(p.parcelNumber)} — ${safe(p.landType)}, ${p.areaM2} m²`,
    ),
    `Řešená plocha: ${project.areaHa > 0 ? `${project.areaHa} ha` : "k upřesnění"}`,
    `\n${evaluation.summary}`,
    `\n## Cíl a poznatky`,
    clean(project.notes, 20000),
    `\n## Podklady (vyplnění není potvrzení proveditelnosti)`,
    ...evaluation.checks.map(
      (c) =>
        `- ${c.status === "yes" ? "ANO" : c.status === "no" ? "NE" : "NEOVĚŘENO"}: ${safe(c.label)}`,
    ),
    `\n## Další kroky`,
    ...evaluation.nextSteps.map((x) => `- ${safe(x)}`),
    ...section("Doporučený postup přípravy", evaluation.measure?.steps),
    ...section("Koho zapojit", evaluation.measure?.experts),
    ...section("Požadované výstupy", evaluation.measure?.outputs),
    ...section("Rizika k posouzení", evaluation.measure?.risks),
    `\n## Rozpočtový scénář`,
    `- Realizace a příprava: ${money(b.total)}`,
    `- Model podpory: ${money(b.grant)} (nepotvrzeno)`,
    `- Vlastní podíl: ${money(b.ownContribution)}`,
    `- Předfinancování až: ${money(b.upfrontCash)}`,
    `- Péče za ${b.years} let: ${money(b.maintenanceTotal)}`,
    `- Výdaje po modelové podpoře včetně péče: ${money(b.netCost)}`,
    ...b.errors.map((x) => `- CHYBA ROZPOČTU: ${x}`),
    ...b.warnings.map((x) => `- ${x}`),
    `\n## Podpory k prověření`,
    ...evaluation.funding.flatMap((f) => [
      `- ${safe(f.program.title)} — ${statusLabel[f.windowStatus] || "ověřit"}; ověřeno ${f.checkedAt || "neznámé datum"}`,
      `  ${f.program.url || ""}`,
      ...f.reasons.map((r) => `  - ${safe(r)}`),
    ]),
    "\n## Odborné zdroje",
    ...list(evaluation.sources).map(
      (s) =>
        `- ${safe(s.title)} (${safe(s.organization)}), kontrola ${safe(s.checkedAt)}: ${s.url}`,
    ),
    `\nPracovní podklad pro konzultaci. Nejde o potvrzení práv, povolení ani přiznání podpory.`,
  ].join("\n");
}

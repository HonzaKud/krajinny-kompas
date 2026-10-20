import { opportunities } from "./opportunities.js";
import { programs } from "./catalog.js";

const fold = (v) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const array = (v) => (Array.isArray(v) ? v : []);
export function landType(value) {
  const s = fold(value);
  if (/zastaven|stavba|built/.test(s)) return "built";
  if (/les|forest/.test(s)) return "forest";
  if (/travni|louka|louky|meadow|pastvin/.test(s)) return "meadow";
  if (/orna|arable|pole/.test(s)) return "arable";
  if (/vodni|water|rybnik|potok/.test(s)) return "water";
  if (/zahrad|garden|sad/.test(s)) return "garden";
  if (/ostatni|other/.test(s)) return "other";
  return "unknown";
}
export function portfolioSummary(p) {
  const parcels = array(p?.parcels);
  return {
    count: parcels.length,
    areaHa: parcels.reduce((s, p) => s + (Number(p.areaM2) || 0), 0) / 10000,
    types: [...new Set(parcels.map((p) => landType(p.landType)))],
    hasData: parcels.length > 0,
  };
}
export function programWindow(program, now = new Date()) {
  if (!program)
    return { status: "alternative", label: "Varianta bez dotační žádosti" };
  const today = now.toISOString().slice(0, 10);
  let status = program.status || "verify";
  if (program.window?.end && program.window.end < today) status = "closed";
  else if (program.window?.start && program.window.start > today)
    status = "upcoming";
  else if (status === "upcoming") status = "verify";
  const age = (now - new Date(program.checkedAt)) / 86400000;
  if (
    (!program.checkedAt || !Number.isFinite(age) || age > 30) &&
    status !== "closed"
  )
    status = "verify";
  const labels = {
    open: "Příjem žádostí probíhá",
    upcoming: "Oznámený budoucí příjem",
    closed: "Ukončený příjem",
    verify: "Aktuální příjem ověřit",
  };
  return { status, label: labels[status] || labels.verify };
}

/** Ranks thematic relevance, never a probability of approval or a legal eligibility decision. */
export function recommend(
  portfolio = null,
  { focus = "all", showClosed = false, now = new Date() } = {},
) {
  const summary = portfolioSummary(portfolio);
  const allParcels = array(portfolio?.parcels);
  const mentionsWater = array(portfolio?.projects).some((p) =>
    ["pools", "wetland", "stream", "pond"].includes(p.measureId),
  );
  return opportunities
    .filter(
      (o) =>
        focus === "all" ||
        (focus === "trees"
          ? o.measureId === "trees"
          : focus === "water"
            ? ["pools", "wetland", "stream", "pond"].includes(o.measureId)
            : array(o.landTypes).includes(focus)),
    )
    .map((opportunity) => {
      const program =
        programs.find((p) => p.id === opportunity.programId) || null;
      const window = programWindow(program, now);
      const parcels = allParcels.filter((p) =>
        array(opportunity.landTypes).includes(landType(p.landType)),
      );
      const areaHa =
        parcels.reduce((s, p) => s + (Number(p.areaM2) || 0), 0) / 10000;
      const water = ["pools", "wetland", "stream", "pond"].includes(
        opportunity.measureId,
      );
      const trees = opportunity.measureId === "trees";
      const missing = [];
      let fit = {
        level: "general",
        label: "Obecná možnost",
        reason: opportunity.fitReason || opportunity.summary,
      };
      if (summary.hasData) {
        if (water)
          fit = {
            level: "conditional",
            label: "Záleží na místě a vodním režimu",
            reason: mentionsWater
              ? "V podkladech je vodní záměr. Samotná evidence parcel nepotvrzuje tok, průtok ani vhodnost zásahu."
              : "Z evidence parcel nelze poznat hydrologii. Tuto variantu posuzuj podle skutečného místa; vodní parcela není podmínkou každého opatření.",
          };
        else if (trees)
          fit = {
            level: "conditional",
            label: "Nejdřív ověřit konkrétní stromy",
            reason:
              "Druh pozemku nepotvrzuje existenci stromů, jejich stav ani památkovou ochranu. Nabídka péče vyžaduje určení konkrétních dřevin.",
          };
        else if (parcels.length)
          fit = {
            level: "strong",
            label: "Odpovídá druhu vašich pozemků",
            reason: `Odpovídající parcely v evidenci: ${parcels.length} (${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(areaHa)} ha). Jde o tematickou shodu, nikoli šanci na schválení.`,
          };
        else
          fit = {
            level: "conditional",
            label: "Pro jiné nebo dosud nedoložené využití",
            reason:
              "V importu není odpovídající druh pozemku. Varianta zůstává pro srovnání; nárok na podporu z toho nevyplývá.",
          };
        if (
          parcels.some((p) =>
            array(p.protections).some((x) =>
              /evropsky|natura|chranen/i.test(fold(x)),
            ),
          )
        )
          missing.push(
            "Evidence uvádí ochranný režim. Zjistit jeho aktuální rozsah a vztah k opatření; ochrana sama není automatický zákaz ani příslib podpory.",
          );
      }
      if (program) {
        missing.push(
          "Ověřit aktuální právo žadatele, souhlasy a konkrétní podmínky výzvy.",
        );
        if (
          array(program.applicantTypes).length === 1 &&
          program.applicantTypes[0] === "farmer"
        )
          missing.unshift(
            "Žadatelem je způsobilý hospodář; vlastnictví parcely samo nestačí. Zjistit uživatele, LPIS a existující závazky.",
          );
        if (window.status === "verify")
          missing.push(
            "Příjem žádostí nebo rozhodné lhůty je nutné zkontrolovat u poskytovatele.",
          );
      }
      if (water)
        missing.push(
          "Poloha toku, zdroj vody, dopad na sousedy a potřebné povolení nejsou vyhodnocené z katastru.",
        );
      const risks = [...array(opportunity.risks)];
      if (program && opportunity.costShare?.grantPercentMax != null)
        risks.push(
          "Procento podpory platí pro příslušný dotační základ. Rozdíl oproti faktuře, nezpůsobilé výdaje a následná péče mohou zvýšit vlastní náklady.",
        );
      let score = Number(opportunity.priority) || 40;
      if (summary.hasData)
        score +=
          fit.level === "strong"
            ? 35
            : water && mentionsWater
              ? 20
              : trees
                ? 5
                : -10;
      if (window.status === "open") score += 8;
      if (window.status === "closed") score -= 60;
      return {
        opportunity,
        fit,
        program,
        windowStatus: window.status,
        windowLabel: window.label,
        parcels,
        areaHa,
        missing,
        risks,
        score,
        sourceUrls: [
          ...new Set([
            ...array(opportunity.sourceUrls),
            ...(program?.url ? [program.url] : []),
          ]),
        ],
      };
    })
    .filter((r) => showClosed || r.windowStatus !== "closed")
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.opportunity.title.localeCompare(b.opportunity.title, "cs"),
    );
}

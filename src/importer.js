import { normalizePortfolio, validateImport } from "./engine.js";

const fold = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const types = [
  "zastavěná plocha a nádvoří",
  "trvalý travní porost",
  "lesní pozemek",
  "orná půda",
  "ostatní plocha",
  "zahrada",
  "vodní plocha",
  "ovocný sad",
  "vinice",
  "chmelnice",
];
const number = (s) =>
  Number(
    String(s)
      .replace(/[\s\u00a0]/g, "")
      .replace(",", "."),
  );
const parcelPattern = /^(?:st\.?\s*)?\d+(?:\s*\/\s*\d+)?$/i;
const cells = (line, sep) =>
  line
    .replace(/^\s*\||\|\s*$/g, "")
    .split(sep)
    .map((s) => s.trim().replace(/^"|"$/g, ""));
const idFor = (ku, p) =>
  `import-${fold(ku).replace(/[^a-z0-9]+/g, "-")}-${p.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
const parcelKey = (p) =>
  fold(p)
    .replace(/\s+/g, "")
    .replace(/^st\.?/, "st:");

/** Conservative parser: only explicit parcel/area/type records, never prose mentions. */
export function parseParcelText(text, { filename = "Dokument" } = {}) {
  if (String(text).length > 5_000_000)
    throw new Error("Text překračuje limit 5 MB.");
  const parcels = [],
    warnings = [];
  const lines = String(text).split(/\r?\n/);
  const sourceDates = [];
  for (const match of String(text).matchAll(
    /\bstav\s+k\s+(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/gi,
  )) {
    const day = Number(match[1]),
      month = Number(match[2]),
      year = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    )
      sourceDates.push(date.toISOString().slice(0, 10));
  }
  let defaultKu = "";
  let header = null,
    sep = "|",
    blocked = false;
  const add = (p, lineNo) => {
    const kind = types.find((t) => fold(p.landType) === fold(t));
    const areaText = String(p.areaM2)
      .trim()
      .replace(/\u00a0/g, " ");
    const area = /^(?:\d+|\d{1,3}(?: \d{3})+)(?:[.,]\d+)?$/.test(areaText)
      ? number(areaText)
      : NaN;
    if (
      !parcelPattern.test(p.parcelNumber) ||
      !kind ||
      !Number.isFinite(area) ||
      area <= 0 ||
      area > 1e11
    ) {
      warnings.push(
        `${filename}, řádek ${lineNo}: neúplný nebo nejednoznačný záznam vynechán.`,
      );
      return;
    }
    const parcelNumber = p.parcelNumber
      .replace(/\s*\/\s*/g, "/")
      .replace(/^st\.?\s*/i, "St. ");
    const cadastralArea = p.cadastralArea || defaultKu;
    parcels.push({
      id: p.id || idFor(cadastralArea, parcelNumber),
      name: `${cadastralArea || "Neurčené území"} ${parcelNumber}`,
      parcelNumber,
      cadastralArea,
      landType: kind,
      areaM2: area,
      protections: (p.protections || "")
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s && s !== "—" && s !== "-"),
      geometry: null,
    });
  };
  for (const [i, raw] of lines.entries()) {
    const line = raw.trim();
    const kuMatch = line.match(
      /(?:Kat\.\s*území|Katastrální území)\s*:\s*(?:\d{6}\s+)?([^\r\n*]+)/i,
    );
    if (kuMatch) {
      defaultKu = kuMatch[1].trim().replace(/\.$/, "");
      header = null;
      blocked = false;
      continue;
    }
    if (/^(?:#{1,6}\s*)?(?:B1\b|[C-F]\s*[–—-]|Co do evidence)/i.test(line)) {
      blocked = true;
      header = null;
    }
    if (/^(?:#{1,6}\s*)?B\s*[–—-]\s*(?:Nemovitosti|Pozemky)/i.test(line))
      blocked = false;
    if (blocked) continue;
    if (line.includes("|") || line.includes(";") || line.includes("\t")) {
      const candidateSep = line.includes("|")
        ? "|"
        : line.includes("\t")
          ? "\t"
          : ";";
      const row = cells(line, candidateSep),
        folded = row.map(fold);
      const index = (re) => folded.findIndex((s) => re.test(s));
      if (
        index(/^(parcela|parcelni cislo|cislo parcely)$/) >= 0 &&
        index(/^(vymera|plocha)/) >= 0 &&
        index(/^(druh|landtype)/) >= 0
      ) {
        sep = candidateSep;
        header = {
          parcelNumber: index(/^(parcela|parcelni cislo|cislo parcely)$/),
          areaM2: index(/^(vymera|plocha)/),
          landType: index(/^(druh|landtype)/),
          cadastralArea: index(/^katastralni uzemi$/),
          protections: index(/^ochrana$/),
          id: index(/^id$/),
        };
        continue;
      }
      if (
        header &&
        candidateSep === sep &&
        !row.every((s) => /^[-:\s]*$/.test(s))
      ) {
        if (
          row.length <=
          Math.max(header.parcelNumber, header.areaM2, header.landType)
        )
          continue;
        add(
          Object.fromEntries(
            Object.entries(header).map(([key, pos]) => [
              key,
              pos < 0 ? "" : row[pos],
            ]),
          ),
          i + 1,
        );
      }
      continue;
    }
    if (line.startsWith("#") || !line) {
      header = null;
      continue;
    }
    // Plain LV: starts with a parcel number and explicitly names the land type.
    const start = line.match(/^((?:St\.?\s*)?\d+(?:\s*\/\s*\d+)?)\s+(.+)$/i);
    if (!start) continue;
    const kind = types.find((t) => fold(start[2]).includes(fold(t)));
    if (!kind) continue;
    const at = fold(start[2]).indexOf(fold(kind));
    const before = start[2].slice(0, at).trim(),
      after = start[2].slice(at + kind.length).trim();
    // Only an isolated area, no guessing among multiple numeric columns.
    const areaText = /^\d[\d\s.,]*$/.test(before)
      ? before
      : /^\d[\d\s.,]*$/.test(after)
        ? after
        : "";
    if (areaText)
      add(
        {
          parcelNumber: start[1],
          areaM2: areaText,
          landType: kind,
          cadastralArea: defaultKu,
        },
        i + 1,
      );
    else
      warnings.push(
        `${filename}, řádek ${i + 1}: výměra není jednoznačná, záznam vynechán.`,
      );
  }
  if (parcels.some((p) => !p.cadastralArea))
    warnings.push(
      `${filename}: chybí katastrální území. Stejná čísla v různých územích nelze bezpečně spojit.`,
    );
  if (!parcels.length)
    warnings.push(
      `${filename}: nebyl nalezen jednoznačný soupis parcel s výměrou a druhem pozemku.`,
    );
  return { parcels, warnings, sourceDates: [...new Set(sourceDates)] };
}

const asset = (path) => `${import.meta.env?.BASE_URL || "/"}vendor/${path}`;
async function recognize(image, onProgress) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("ces+eng", 1, {
    workerPath: asset("tesseract/worker.min.js"),
    corePath: asset("tesseract-core/"),
    langPath: asset("tessdata/"),
    workerBlobURL: false,
    logger: (m) =>
      onProgress?.(`OCR: ${m.status} ${Math.round((m.progress || 0) * 100)} %`),
  });
  try {
    return (await worker.recognize(image)).data.text;
  } finally {
    await worker.terminate();
  }
}

async function readPDF(file, onProgress) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = asset("pdf.worker.min.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    isEvalSupported: false,
    useSystemFonts: true,
  });
  const texts = [],
    warnings = [];
  let ocr = false;
  try {
    const document = await loadingTask.promise;
    if (document.numPages > 30)
      throw new Error(
        "PDF má více než 30 stran. Rozděl jej na menší dokumenty.",
      );
    for (let n = 1; n <= document.numPages; n++) {
      onProgress?.(`${file.name}: strana ${n}/${document.numPages}`);
      const page = await document.getPage(n),
        content = await page.getTextContent();
      const rows = new Map();
      for (const item of content.items) {
        if (!item.str) continue;
        const y = Math.round(item.transform[5] / 3) * 3;
        if (!rows.has(y)) rows.set(y, []);
        rows.get(y).push({ x: item.transform[4], str: item.str });
      }
      let text = [...rows.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([, r]) =>
          r
            .sort((a, b) => a.x - b.x)
            .map((x) => x.str)
            .join(" "),
        )
        .join("\n");
      if (text.trim().length < 40) {
        if (n > 3) {
          warnings.push(
            `${file.name}: OCR je omezené na první 3 strany; další skenované strany nebyly přečteny.`,
          );
          continue;
        }
        ocr = true;
        const viewport = page.getViewport({
          scale: Math.min(2, 2200 / page.getViewport({ scale: 1 }).width),
        });
        const canvas = globalThis.document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        if (canvas.width * canvas.height > 12_000_000)
          throw new Error("Strana PDF je příliš velká pro bezpečné OCR.");
        await page.render({ canvasContext: canvas.getContext("2d"), viewport })
          .promise;
        text = await recognize(canvas, onProgress);
        canvas.width = canvas.height = 0;
      }
      texts.push(text);
      page.cleanup();
    }
  } finally {
    await loadingTask.destroy();
  }
  return { text: texts.join("\n"), warnings, ocr };
}

/** All processing stays on this device. No user document is sent to a server. */
export async function importDocuments(
  files,
  { onProgress, existingPortfolio = null } = {},
) {
  files = Array.from(files || []);
  if (!files.length) throw new Error("Vyber soubor pro import.");
  if (
    files.length > 20 ||
    files.reduce((s, f) => s + f.size, 0) > 30 * 1024 * 1024
  )
    throw new Error(
      "Najednou lze načíst nejvýše 20 souborů o celkové velikosti 30 MB.",
    );
  const pieces = [],
    warnings = [];
  if (existingPortfolio?.parcels?.length)
    pieces.push(normalizePortfolio(existingPortfolio));
  const initialPieces = pieces.length;
  let usedOCR = false;
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024)
      throw new Error(`${file.name}: limit jednoho souboru je 10 MB.`);
    onProgress?.(`Načítám ${file.name}`);
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "json") {
      const raw = JSON.parse((await file.text()).replace(/^\uFEFF/, ""));
      warnings.push(...validateImport(raw).warnings);
      if (raw.isDemo)
        warnings.push(
          "Soubor obsahuje smyšlené demonstrační parcely, nikoli ověřený skutečný majetek.",
        );
      pieces.push(normalizePortfolio(raw));
      continue;
    }
    let text;
    if (["md", "markdown", "txt", "csv", "tsv"].includes(ext))
      text = await file.text();
    else if (ext === "pdf") {
      const pdf = await readPDF(file, onProgress);
      text = pdf.text;
      warnings.push(...pdf.warnings);
      usedOCR ||= pdf.ocr;
    } else if (["png", "jpg", "jpeg", "webp"].includes(ext)) {
      const bitmap = await createImageBitmap(file);
      try {
        if (bitmap.width * bitmap.height > 24_000_000)
          throw new Error(
            `${file.name}: obrázek má více než 24 megapixelů. Zmenši jej.`,
          );
        const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas
          .getContext("2d")
          .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        text = await recognize(canvas, onProgress);
        canvas.width = canvas.height = 0;
        usedOCR = true;
      } finally {
        bitmap.close();
      }
    } else
      throw new Error(
        `${file.name}: podporujeme JSON, Markdown, TXT, CSV, PDF, JPG, PNG a WebP.`,
      );
    const parsed = parseParcelText(text, { filename: file.name });
    warnings.push(...parsed.warnings);
    if (parsed.parcels.length)
      pieces.push({
        schemaVersion: 1,
        name: "Importované pozemky",
        parcels: parsed.parcels,
        projects: [],
        observations: [],
        provenance: {
          sourceDates: parsed.sourceDates,
          warnings: [],
          containsDemo: false,
        },
      });
  }
  if (!pieces.slice(initialPieces).some((p) => p.parcels.length))
    throw new Error(
      "Nenašel jsem spolehlivě čitelné parcely. Zkus Markdown se sloupci Parcela, Výměra m², Druh a Katastrální území nebo původní JSON. OCR nemusí rozpoznat složitý list vlastnictví.",
    );
  const parcels = [],
    projects = [],
    observations = [],
    keys = new Map(),
    ids = new Set(),
    projectIds = new Set();
  for (const piece of pieces) {
    const remap = new Map();
    for (const p of piece.parcels) {
      const key = `${fold(p.cadastralArea)}|${parcelKey(p.parcelNumber)}`;
      const previous = p.parcelNumber && p.cadastralArea ? keys.get(key) : null;
      if (previous) {
        if (
          previous.areaM2 !== p.areaM2 ||
          fold(previous.landType) !== fold(p.landType)
        )
          throw new Error(
            `Rozporné údaje pro parcelu ${p.parcelNumber} v území ${p.cadastralArea}. Soubory nejprve porovnej.`,
          );
        remap.set(p.id, previous.id);
        previous.protections = [
          ...new Set([...previous.protections, ...p.protections]),
        ];
        if (!previous.geometry && p.geometry) previous.geometry = p.geometry;
        continue;
      }
      let id = p.id;
      while (ids.has(id)) id = `${id}-next`;
      ids.add(id);
      remap.set(p.id, id);
      const copy = { ...p, id };
      parcels.push(copy);
      keys.set(key, copy);
    }
    for (const project of piece.projects || []) {
      let id = project.id;
      const next = {
        ...project,
        parcelIds: project.parcelIds.map((id) => remap.get(id)).filter(Boolean),
      };
      const prior = projects.find((p) => p.id === id);
      if (prior) {
        if (JSON.stringify(prior) === JSON.stringify(next)) continue;
        throw new Error(
          `Rozporné verze záměru ${project.name || id}. Původní data zůstávají zachována.`,
        );
      }
      projectIds.add(id);
      projects.push({
        ...next,
        id,
        parcelIds: project.parcelIds.map((id) => remap.get(id)).filter(Boolean),
      });
    }
    observations.push(
      ...(piece.observations || []).map((o) => ({
        ...o,
        parcelId: remap.get(o.parcelId) || o.parcelId,
      })),
    );
  }
  const sourceDates = [
    ...new Set(pieces.flatMap((p) => p.provenance?.sourceDates || [])),
  ].slice(0, 30);
  const containsDemo = pieces.some(
    (p) => p.isDemo || p.provenance?.containsDemo,
  );
  warnings.unshift(...pieces.flatMap((p) => p.provenance?.warnings || []));
  if (containsDemo)
    warnings.unshift(
      "Podklady obsahují smyšlené demonstrační parcely. Jejich evidence není skutečný majetek.",
    );
  if (sourceDates.length)
    warnings.unshift(
      `Zdrojové dokumenty zachycují stav k: ${sourceDates.join(", ")}. Nejde o ověření současného stavu.`,
    );
  if (usedOCR)
    warnings.push(
      "Text byl čten automaticky pomocí OCR. Čísla parcel, výměry i úplnost porovnej s originálem; OCR neověřuje vlastnictví a může vynechat řádky.",
    );
  warnings.push(
    "Import zachycuje obsah dodaných dokumentů; neověřuje aktuální katastr ani nárok na podporu.",
  );
  let retainedWarnings = [...new Set(warnings)];
  if (retainedWarnings.length > 95)
    retainedWarnings = [
      ...retainedWarnings.slice(0, 90),
      "Další řádková upozornění byla zkrácena; soupis může být neúplný. Ověřte originály.",
      ...retainedWarnings.slice(-4),
    ];
  const portfolio = normalizePortfolio({
    schemaVersion: 1,
    name: pieces[0].name || "Moje pozemky",
    isDemo: pieces.every((p) => p.isDemo === true),
    provenance: { warnings: retainedWarnings, sourceDates, containsDemo },
    parcels,
    projects,
    observations,
  });
  return {
    portfolio,
    warnings: portfolio.provenance.warnings,
    summary: {
      files: files.length,
      parcels: parcels.length,
      areaM2: parcels.reduce((s, p) => s + p.areaM2, 0),
      usedOCR,
      confidence: usedOCR ? "ocr-needs-review" : "structured",
    },
  };
}

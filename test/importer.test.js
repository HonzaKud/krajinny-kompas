import test from "node:test";
import assert from "node:assert/strict";
import { parseParcelText, importDocuments } from "../src/importer.js";
test("Markdown source date persists without needing a form", async () => {
  const text = "Stav k 5. 6. 2020\nKatastrální území: Testov\n1 100 orná půda";
  const r = await importDocuments([
    { name: "old.md", size: text.length, text: async () => text },
  ]);
  assert.deepEqual(r.portfolio.provenance.sourceDates, ["2020-06-05"]);
  assert.ok(r.warnings.some((w) => w.includes("2020-06-05")));
});
test("origin warnings, source age and demo presence survive JSON roundtrip", async () => {
  const file = (raw) => ({
    name: "test.json",
    size: 100,
    text: async () => JSON.stringify(raw),
  });
  const base = {
    schemaVersion: 1,
    name: "Model",
    isDemo: true,
    as_of: "2020-01-01",
    parcels: [
      {
        id: "p",
        parcelNumber: "1",
        cadastralArea: "Testov",
        landType: "orná půda",
        areaM2: 100,
      },
    ],
    projects: [],
    observations: [],
    provenance: {
      warnings: ["Text přečetlo OCR; ověřit originál."],
      containsDemo: true,
      sourceDates: [],
    },
  };
  const first = await importDocuments([file(base)]);
  const again = await importDocuments([file(first.portfolio)]);
  assert.ok(again.warnings.some((w) => w.includes("OCR")));
  assert.ok(again.warnings.some((w) => w.includes("2020-01-01")));
  assert.equal(again.portfolio.provenance.containsDemo, true);
});
test("building prefix variants do not duplicate the same parcel", async () => {
  const existingPortfolio = {
    schemaVersion: 1,
    name: "Test",
    parcels: [
      {
        id: "a",
        parcelNumber: "St57/1",
        cadastralArea: "Testov",
        landType: "zastavěná plocha a nádvoří",
        areaM2: 100,
      },
    ],
    projects: [],
    observations: [],
  };
  const text =
    "| Katastrální území | Parcela | Výměra m² | Druh |\n|---|---|---|---|\n|Testov|St. 57/1|100|zastavěná plocha a nádvoří|";
  const r = await importDocuments(
    [{ name: "new.md", size: text.length, text: async () => text }],
    { existingPortfolio },
  );
  assert.equal(r.portfolio.parcels.length, 1);
  assert.equal(r.summary.areaM2, 100);
});
test("sequential cadastral headers never assign later parcels to first area", () => {
  const r = parseParcelText(
    "Katastrální území: První\n1 100 orná půda\nKatastrální území: Druhé\n2 200 lesní pozemek",
  );
  assert.deepEqual(
    r.parcels.map((p) => p.cadastralArea),
    ["První", "Druhé"],
  );
});
test("Markdown extension and historic JSON retain source warnings", async () => {
  const file = (name, text) => ({
    name,
    size: text.length,
    text: async () => text,
  });
  const md =
    "| Katastrální území | Parcela | Výměra m² | Druh |\n|---|---|---|---|\n|Testov|1|100|orná půda|";
  assert.equal(
    (await importDocuments([file("test.markdown", md)])).portfolio.parcels
      .length,
    1,
  );
  const raw = {
    as_of: "2020-01-01",
    owners: [{ name: "PRIVATE" }],
    parcels: [
      {
        id: "a",
        area_m2: 100,
        parcel_number: "1",
        cadastral_area: "Testov",
        land_type: "orná půda",
      },
    ],
  };
  const r = await importDocuments([file("test.json", JSON.stringify(raw))]);
  assert.ok(r.warnings.some((w) => w.includes("2020-01-01")));
  assert.ok(!JSON.stringify(r.portfolio).includes("PRIVATE"));
});
test("adding documents preserves previous portfolio and rejects unreadable new input", async () => {
  const old = {
    schemaVersion: 1,
    name: "Test",
    parcels: [
      {
        id: "a",
        areaM2: 100,
        parcelNumber: "1",
        cadastralArea: "Testov",
        landType: "orná půda",
      },
    ],
    projects: [],
    observations: [],
  };
  const file = (name, text) => ({
    name,
    size: text.length,
    text: async () => text,
  });
  const r = await importDocuments(
    [file("new.txt", "Katastrální území: Testov\n2 200 lesní pozemek")],
    { existingPortfolio: old },
  );
  assert.equal(r.portfolio.parcels.length, 2);
  await assert.rejects(
    importDocuments([file("bad.txt", "Nečitelné")], { existingPortfolio: old }),
    /spolehlivě/,
  );
  assert.equal(old.parcels.length, 1);
});
const md = `| ID | Katastrální území | Parcela | Výměra m² | Druh | Ochrana |
| --- | --- | --- | --- | --- | --- |
| test-p-1 | Testov | 12/3 | 2 450 | lesní pozemek | ochrana lesa |
| test-st-2 | Testov | St. 9 | 320 | zastavěná plocha a nádvoří | — |
## C – Věcná práva
Parcela 99/7 je povinná z věcného břemene.
| Parcela | BPEJ | Výměra m² |
| 99/7 | 12345 | 500 |
`;
const file = (name, text) => ({
  name,
  size: Buffer.byteLength(text),
  text: async () => text,
});
test("Markdown selects actual parcel table, preserves building series, skips BPEJ and easements", () => {
  const { parcels } = parseParcelText(md);
  assert.equal(parcels.length, 2);
  assert.equal(parcels[0].areaM2, 2450);
  assert.equal(parcels[1].parcelNumber, "St. 9");
});
test("plain LV accepts unambiguous area and refuses numeric ambiguity", () => {
  const result = parseParcelText(
    "Kat. území: 123456 Testov.\n12/3 500 lesní pozemek\n14/2 200 99 orná půda\nB1 – Věcná práva\n18/1 700 lesní pozemek",
  );
  assert.equal(result.parcels.length, 1);
  assert.equal(result.parcels[0].cadastralArea, "Testov");
});
test("no ownership invented from prose", () =>
  assert.equal(
    parseParcelText("Parcela 123/4 má věcné břemeno. Výměra budovy je 40 m².")
      .parcels.length,
    0,
  ));
test("multi document import deduplicates and preserves native projects", async () => {
  const native = {
    schemaVersion: 1,
    name: "Test",
    parcels: [
      {
        id: "p1",
        parcelNumber: "12/3",
        cadastralArea: "Testov",
        areaM2: 2450,
        landType: "lesní pozemek",
        protections: [],
      },
    ],
    projects: [
      {
        id: "j1",
        name: "Les",
        measureId: "forest",
        parcelIds: ["p1"],
        evidence: {},
        budget: {},
      },
    ],
    observations: [],
  };
  const result = await importDocuments([
    file("a.md", md),
    file("b.json", JSON.stringify(native)),
  ]);
  assert.equal(result.portfolio.parcels.length, 2);
  assert.equal(result.portfolio.projects.length, 1);
  assert.equal(result.portfolio.projects[0].id, "j1");
  assert.deepEqual(result.portfolio.projects[0].parcelIds, ["test-p-1"]);
});
test("conflicting documents rejected rather than silently picking area", async () => {
  await assert.rejects(
    importDocuments([
      file("a.md", md),
      file("b.md", md.replace("2 450", "2 451")),
    ]),
    /Rozporné/,
  );
});
test("file sizes and unreadable documents fail with actionable errors", async () => {
  await assert.rejects(
    importDocuments([{ name: "huge.pdf", size: 11 * 1024 * 1024 }]),
    /limit/,
  );
  await assert.rejects(
    importDocuments([file("empty.md", "Žádné parcely")]),
    /spolehlivě/,
  );
});

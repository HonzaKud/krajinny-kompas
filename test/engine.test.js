import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateImport,
  normalizePortfolio,
  calculateBudget,
  evaluateProject,
  createReport,
} from "../src/engine.js";
import {
  measures,
  programs,
  sources,
  starterPortfolio,
} from "../src/catalog.js";
test("roundtrip retains demo notice, notes, multiple parcels and legacy upkeep", () => {
  const data = structuredClone(starterPortfolio);
  data.projects[0].notes = "Záznam z místa\nDruhý řádek";
  data.projects[0].budget = {
    implementation: 10000,
    maintenance: 2000,
    years: 5,
  };
  const imported = normalizePortfolio(data);
  assert.equal(imported.isDemo, true);
  assert.equal(imported.projects[0].parcelIds.length, 2);
  assert.equal(imported.projects[0].notes, data.projects[0].notes);
  assert.equal(
    calculateBudget(imported.projects[0].budget).maintenanceTotal,
    10000,
  );
});
test("import rejects silent loss and strips arbitrary geometry metadata", () => {
  const data = structuredClone(starterPortfolio);
  data.parcels[0].geometry.secret = "PRIVATE";
  assert.ok(!JSON.stringify(normalizePortfolio(data)).includes("PRIVATE"));
  data.projects = Array.from({ length: 101 }, (_, i) => ({
    ...starterPortfolio.projects[0],
    id: `p${i}`,
  }));
  assert.equal(validateImport(data).valid, false);
  data.projects = [
    {
      ...starterPortfolio.projects[0],
      budget: { implementation: 100, eligibleCosts: 200 },
    },
  ];
  assert.equal(validateImport(data).valid, false);
});
test("future announcement becomes verification after its start and closed after end", () => {
  const makeProgram = (start, end, status = "upcoming") => ({
    id: "date-test",
    measureIds: ["pond"],
    status,
    window: { start, end },
    checkedAt: new Date().toISOString().slice(0, 10),
  });
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const run = (p) =>
    evaluateProject({ measureId: "pond" }, { measures, programs: [p], sources })
      .funding[0].windowStatus;
  assert.equal(run(makeProgram(yesterday, tomorrow)), "verify");
  assert.equal(run(makeProgram(yesterday, yesterday)), "closed");
  assert.equal(run(makeProgram(tomorrow, tomorrow)), "upcoming");
});
test("private legacy import strips identities and retains parcel facts", () => {
  const p = normalizePortfolio({
    owners: [{ name: "SECRET" }],
    parcels: [
      {
        id: "a",
        area_m2: 12345,
        land_type: "orná půda",
        parcel_number: "17/2",
        owner_id: "SECRET",
        protections: ["ZPF"],
      },
    ],
  });
  assert.equal(p.parcels[0].areaM2, 12345);
  assert.equal(p.parcels[0].parcelNumber, "17/2");
  assert.ok(!JSON.stringify(p).includes("SECRET"));
});
test("reject invalid area, duplicate IDs and projected geometry", () => {
  assert.equal(
    validateImport({ parcels: [{ id: "a", areaM2: -1 }] }).valid,
    false,
  );
  assert.equal(
    validateImport({
      parcels: [
        { id: "a", areaM2: 1 },
        { id: "a", areaM2: 2 },
      ],
    }).valid,
    false,
  );
  assert.equal(
    validateImport({
      parcels: [
        {
          areaM2: 1,
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [1000, 2000],
                [2, 3],
                [3, 4],
                [1000, 2000],
              ],
            ],
          },
        },
      ],
    }).valid,
    false,
  );
});
test("demo schema and source references are internally complete", () => {
  assert.equal(validateImport(starterPortfolio).valid, true);
  for (const m of measures) {
    assert.ok(m.questions.length);
    for (const id of m.programIds) assert.ok(programs.some((p) => p.id === id));
    for (const id of m.sourceIds) assert.ok(sources.some((s) => s.id === id));
  }
});
test("unknown evidence never becomes approved and refusal blocks", () => {
  const ev = evaluateProject(
    { measureId: "pond" },
    { measures, programs, sources },
  );
  assert.equal(ev.readiness.percent, 0);
  assert.ok(ev.nextSteps.length > 5);
  assert.ok(ev.funding.every((f) => f.status !== "eligible"));
  const refused = evaluateProject(
    { measureId: "pond", evidence: { ownership: "no" } },
    { measures, programs, sources },
  );
  assert.ok(refused.blockers.length);
});
test("cost scenario accounts for upkeep and catches invalid subsidy base", () => {
  const b = calculateBudget({
    preparation: 10000,
    implementation: 90000,
    eligibleCosts: 80000,
    grantRate: 50,
    annualMaintenance: 2000,
    years: 5,
  });
  assert.equal(b.total, 100000);
  assert.equal(b.grant, 40000);
  assert.equal(b.netCost, 70000);
  assert.equal(b.upfrontCash, 100000);
  assert.ok(
    calculateBudget({ implementation: 5, eligibleCosts: 10 }).errors.length,
  );
  assert.ok(calculateBudget({ implementation: -1 }).errors.length);
});
test("native roundtrip keeps specialist evidence and report is useful", () => {
  const p = normalizePortfolio({
    ...starterPortfolio,
    projects: [
      {
        id: "p",
        measureId: "trees",
        name: "Péče",
        parcelIds: ["demo-forest"],
        evidence: { treeStatus: "yes" },
        budget: {},
      },
    ],
  });
  assert.equal(p.projects[0].evidence.treeStatus, "yes");
  const ev = evaluateProject(p.projects[0], { measures, programs, sources });
  assert.match(createReport(p.projects[0], ev), /NEOVĚŘENO/);
  assert.match(createReport(p.projects[0], ev), /Koho zapojit/);
  assert.match(createReport(p.projects[0], ev), /aopk.gov.cz/);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  recommend,
  portfolioSummary,
  landType,
  programWindow,
} from "../src/recommendations.js";
const p = {
  schemaVersion: 1,
  parcels: [
    { id: "test-f", landType: "lesní pozemek", areaM2: 50000, protections: [] },
    {
      id: "test-m",
      landType: "trvalý travní porost",
      areaM2: 2500,
      protections: ["evropsky významná lokalita"],
    },
  ],
  projects: [],
};
test("buildings and unknown land types are not treated as other open land", () => {
  assert.equal(landType("zastavěná plocha a nádvoří"), "built");
  assert.equal(landType(""), "unknown");
  assert.equal(landType("ostatní plocha"), "other");
  const r = recommend({
    ...p,
    parcels: [
      ...p.parcels,
      { id: "building", landType: "zastavěná plocha a nádvoří", areaM2: 1000 },
      { id: "unclear", landType: "neznámý druh", areaM2: 1000 },
    ],
  });
  assert.ok(
    r.every((x) =>
      x.parcels.every((p) => !["building", "unclear"].includes(p.id)),
    ),
  );
});
test("first opening offers real opportunities without input or demo parcels", () => {
  const r = recommend();
  assert.ok(r.length >= 6);
  assert.ok(r.every((x) => x.fit.level === "general"));
  assert.ok(r.some((x) => x.opportunity.type === "alternative"));
  assert.equal(portfolioSummary(null).count, 0);
});
test("land categories are normalized and actual records drive explanation", () => {
  assert.equal(landType("orná půda"), "arable");
  assert.equal(landType("trvalý travní porost"), "meadow");
  assert.equal(portfolioSummary(p).areaHa, 5.25);
  const r = recommend(p, { focus: "forest" });
  assert.ok(r.length);
  assert.ok(r.some((x) => x.fit.level === "strong"));
  assert.ok(r.every((x) => !("probability" in x)));
});
test("meadow protection is a verification point, not automatic rejection", () => {
  const r = recommend(p, { focus: "meadow" });
  assert.ok(r.some((x) => x.missing.some((s) => s.includes("ochranný režim"))));
  assert.ok(r.some((x) => x.parcels.length));
});
test("water cannot be inferred from land type or an intended action", () => {
  const r = recommend(
    { ...p, projects: [{ measureId: "stream" }] },
    { focus: "water" },
  );
  assert.ok(r.length);
  assert.ok(r.every((x) => x.fit.level === "conditional"));
  assert.ok(r.every((x) => x.missing.some((s) => s.includes("Poloha toku"))));
});
test("program date and freshness never make a future announcement automatically open", () => {
  const now = new Date("2026-10-22T12:00:00Z");
  const program = {
    status: "upcoming",
    checkedAt: "2026-10-20",
    window: { start: "2026-10-21", end: "2026-11-04" },
  };
  assert.equal(programWindow(program, now).status, "verify");
  assert.equal(
    programWindow(
      { ...program, status: "open" },
      new Date("2026-11-05T12:00:00Z"),
    ).status,
    "closed",
  );
  assert.equal(
    programWindow(
      { ...program, status: "open", window: {} },
      new Date("2026-12-05T12:00:00Z"),
    ).status,
    "verify",
  );
});

// Balance (DESIGN-v2 §4.8): 8 simulated children play 600 races each with the real systems.
// Nobody gets stuck for long, legendaries come early enough, the end comes neither too fast
// nor never. Numbers for the parent are in DESIGN-v2 §4.8.

import { test } from "node:test";
import assert from "node:assert/strict";
import { simulate } from "./progress-sim.mjs";

test("8 simulated children: progress without getting stuck, reaching Space 5", () => {
  const warn = console.warn;
  console.warn = () => {};
  const runs = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => simulate({ seed, races: 600 }));
  console.warn = warn;
  const sorted = (k) => runs.map((r) => r[k] ?? Infinity).sort((a, b) => a - b);
  const space5 = sorted("space5");
  assert.ok(space5.every(Number.isFinite), `someone never reached Space 5: ${space5}`);
  assert.ok(space5[4] >= 80 && space5[4] <= 300, `median race of Space 5: ${space5[4]}`);
  assert.ok(sorted("maxGap").every((g) => g <= 150), `longest stretch without a new level: ${sorted("maxGap")}`);
  assert.ok(sorted("firstLegendary").every((r) => r <= 60), `first legendary: ${sorted("firstLegendary")}`);
  assert.ok(sorted("fullSetFound").every(Number.isFinite), "everyone finds a full set");
});

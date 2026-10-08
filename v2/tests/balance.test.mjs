// Balance (DESIGN-v2 §4.8): 8 simulated children play 600 races each with the real systems.
// Nobody gets stuck for long, the first part ability comes early enough, the end comes
// neither too fast nor never. Numbers for the parent are in DESIGN-v2 §4.8.

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
  assert.ok(space5[4] >= 60 && space5[4] <= 200, `median race of Space 5: ${space5[4]}`);
  assert.ok(sorted("maxGap").every((g) => g <= 80), `longest stretch without a new level: ${sorted("maxGap")}`);
  assert.ok(sorted("firstAbility").every((r) => r <= 40), `first ability: ${sorted("firstAbility")}`);
  assert.ok(sorted("allAbilities").every((r) => r <= 150), `all 12 abilities: ${sorted("allAbilities")}`);
  assert.ok(sorted("fullCar").every((r) => r >= 120 && r <= 400), `whole car on level 20: ${sorted("fullCar")}`);
});

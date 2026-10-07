// Crew (DESIGN-v2 §6, part 5 "done when": the buddy is visible in the car and its ability
// is felt in the race): data, eggs and hatching, levels, evolution, candy, clothes, the screen.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { CREW, CREW_RARITIES, CREW_RULES, CLOTHES } from "../js/data/crew.js";
import { STAT_IDS } from "../js/data/stats.js";
import { setup, openGame, screenshot, WIDTHS, openChest } from "./helpers.mjs";

let env;
before(async () => {
  env = await setup();
});
after(async () => {
  await env.teardown();
});

const quiet = { settings: { sound: false, voice: false }, cheats: { shortRaces: true } };

test("data: 20 buddies in 4 rarities, 3 stages each, every ability known, clothes", () => {
  assert.equal(CREW.length, 20);
  assert.equal(new Set(CREW.map((c) => c.id)).size, 20);
  assert.deepEqual([...new Set(CREW.map((c) => c.rarity))].sort(), CREW_RARITIES.map((r) => r.id).sort());
  for (const c of CREW) {
    assert.equal(c.stages.length, 3, c.id);
    assert.ok(!c.stages.some((ic) => ic === "🥚" || ic === "🔩"), `${c.id} looks like an egg or scrap`);
    assert.ok(["stat", "coins", "shield"].includes(c.ability.kind), c.id);
    if (c.ability.kind === "stat") assert.ok(STAT_IDS.includes(c.ability.stat), c.id);
  }
  assert.ok(CLOTHES.hat.length >= 5 && CLOTHES.glasses.length >= 4);
  assert.equal(CREW_RULES.hatchRaces, 3);
});

/** Run the real game code inside the page. */
const inPage = (page, fn, arg) =>
  page.evaluate(
    async ({ src, arg }) => {
      const crew = await import("./js/systems/crew.js");
      const stats = await import("./js/systems/stats.js");
      const g = window.__game;
      return new Function("crew", "stats", "g", "arg", `return (${src})(crew, stats, g, arg)`)(crew, stats, g, arg);
    },
    { src: fn.toString(), arg },
  );

test("eggs hatch after 3 races; new buddies first, duplicates give candy; first buddy rides along", async () => {
  const page = await openGame(env.browser, env.server.url, { storage: quiet });
  const r = await inPage(page, (crew, stats, g) => {
    g.rng.setSeed(2);
    const egg = crew.addEgg("chest");
    const early = crew.hatch(egg.id, g.rng); // not ready yet
    crew.tickEggs();
    crew.tickEggs();
    const stillEarly = crew.hatch(egg.id, g.rng);
    crew.tickEggs();
    const first = crew.hatch(egg.id, g.rng);
    // hatch many more: the collection fills, duplicates turn into candy
    let dup = 0;
    for (let i = 0; i < 80; i++) {
      const e = crew.addEgg(i % 2 ? "roadKing" : "chest");
      e.races = 3;
      g.state.update((s) => (s.eggs.find((x) => x.id === e.id).races = 3));
      const res = crew.hatch(e.id, g.rng);
      if (!res.isNew) dup++;
    }
    const s = g.state.getState();
    return { early, stillEarly, first: first?.def.id, active: s.crew.active, owned: Object.keys(s.crew.owned).length, candy: s.crew.candy, dup, eggs: s.eggs.length };
  });
  assert.equal(r.early, null);
  assert.equal(r.stillEarly, null);
  assert.ok(r.first);
  assert.equal(r.active, r.first, "the first buddy goes into the car");
  assert.ok(r.owned >= 16, `collection after 81 eggs: ${r.owned}`);
  assert.ok(r.dup > 0 && r.candy > 0);
  assert.equal(r.eggs, 0);
  await page.context().close();
});

test("buddy ability is felt: speed buddy makes the car faster, dog adds a shield, pig more coins", async () => {
  const page = await openGame(env.browser, env.server.url, { storage: quiet });
  const r = await inPage(page, (crew, stats, g) => {
    const out = {};
    const base = stats.raceEffects(stats.carStats(), new Set(), crew.crewBonus());
    crew.ownAllCrew();
    const effectsWith = (id, level = 1) => {
      crew.setActive(id);
      g.state.update((s) => (s.crew.owned[id].level = level));
      return stats.raceEffects(stats.carStats(), new Set(), crew.crewBonus());
    };
    out.baseSpeed = base.topSpeed;
    out.dragon1 = effectsWith("dragon", 1).topSpeed;
    out.dragon20 = effectsWith("dragon", 20).topSpeed;
    out.baseShields = base.shields;
    out.pupShields = effectsWith("pup").shields;
    out.pigCoins = effectsWith("pig", 10).coinMult;
    out.powerBunny = (crew.setActive("bunny"), stats.carPower());
    out.powerNone = stats.carPower(stats.carStats(g.state.getState().car.equipped, false));
    return out;
  });
  assert.ok(r.dragon1 > r.baseSpeed * 1.05, `${r.dragon1} vs ${r.baseSpeed}`);
  assert.ok(r.dragon20 > r.dragon1 * 1.15, "ability grows with level");
  assert.equal(r.pupShields, r.baseShields + 1);
  assert.ok(r.pigCoins > 1.15);
  assert.ok(r.powerBunny > r.powerNone, "buddy adds to car power");
  await page.context().close();
});

test("levels from racing, evolution with candy, clothes bought with coins", async () => {
  const page = await openGame(env.browser, env.server.url, { storage: { ...quiet, coins: 500 } });
  const r = await inPage(page, (crew, stats, g) => {
    crew.ownAllCrew();
    crew.setActive("lizard");
    const levels = [];
    for (let i = 0; i < 80; i++) levels.push(...crew.giveCrewXp(i % 2 === 0));
    const b = g.state.getState().crew.owned.lizard;
    const tooPoor = crew.evolve("lizard"); // no candy yet
    g.state.update((s) => (s.crew.candy = 30));
    const e1 = crew.evolve("lizard");
    const stageAfter1 = b.stage;
    const e2 = b.level >= 14 ? crew.evolve("lizard") : "low";
    const icon = crew.buddyIcon(b);
    const wore = crew.wear("lizard", "hat", "crown") && crew.wear("lizard", "glasses", "sun");
    const look = crew.buddyLook(b);
    return { level: b.level, levels: levels.length, tooPoor, e1, stageAfter1, e2, icon, wore, look, coins: g.state.getState().coins, candy: g.state.getState().crew.candy };
  });
  assert.ok(r.level >= 14 && r.levels >= 13, `level ${r.level}`);
  assert.equal(r.tooPoor, false);
  assert.equal(r.e1, true);
  assert.equal(r.stageAfter1, 1);
  assert.equal(r.e2, true);
  assert.equal(r.icon, "🦖", "fully evolved lizard is a T-rex");
  assert.equal(r.wore, true);
  assert.deepEqual(r.look, { icon: "🦖", hat: "👑", glasses: "🕶️" });
  assert.equal(r.coins, 500 - 400 - 100);
  assert.equal(r.candy, 30 - 5 - 15);
  await page.context().close();
});

test("races give eggs: the first one is sure in race 3, eggs tick and the buddy rides in the race", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: quiet });
  for (let i = 1; i <= 3; i++) {
    await page.evaluate((seed) => {
      window.__game.rng.setSeed(seed);
      window.__game.testTimeScale = 6;
      location.hash = "#/game/race/city/1";
    }, 10 + i);
    await page.getByTestId("reward-modal").waitFor({ timeout: 40000 });
    await openChest(page);
    if (i === 3) await page.getByTestId("chest-egg").waitFor();
    await page.getByTestId("reward-home").click();
    await page.getByTestId("screen-home").waitFor();
  }
  let s = await page.evaluate(() => window.__game.state.getState());
  assert.ok(s.eggs.length >= 1, "egg from the 3rd race");
  // three more races hatch it
  await page.evaluate(async () => {
    const crew = await import("./js/systems/crew.js");
    crew.tickEggs();
    crew.tickEggs();
    crew.tickEggs();
  });
  await page.getByTestId("home-crew").click();
  await page.getByTestId("screen-crew").waitFor();
  const egg = page.locator('.egg[data-ready="true"]').first();
  await egg.click();
  await page.getByTestId("hatch-modal").waitFor();
  await page.getByTestId("hatch-ok").click();
  s = await page.evaluate(() => window.__game.state.getState());
  const buddy = s.crew.active;
  assert.ok(buddy, "a buddy hatched and sits in the car");
  const icon = await page.evaluate(async () => (await import("./js/systems/crew.js")).buddyIcon(window.__game.state.getState().crew.owned[window.__game.state.getState().crew.active]));

  // visible in the car: home, garage, and in the race
  await page.getByTestId("topbar-home").click();
  assert.equal(await page.locator("[data-testid=home-car] svg").getAttribute("data-passenger"), icon);
  await page.getByTestId("home-garage").click();
  assert.equal(await page.locator(".lift-car svg").getAttribute("data-passenger"), icon);
  await page.evaluate(() => (location.hash = "#/game/race/city/1"));
  await page.waitForFunction(() => window.__game.race?.phase === "racing");
  assert.equal(await page.evaluate(() => window.__game.race.buddy?.icon), icon);
  await page.waitForTimeout(800);
  await screenshot(page, "390-race-buddy");
  const xpBefore = await page.evaluate(() => window.__game.state.getState().crew.owned[window.__game.state.getState().crew.active].xp);
  await page.getByTestId("reward-modal").waitFor({ timeout: 40000 });
  const after = await page.evaluate(() => window.__game.state.getState().crew.owned[window.__game.state.getState().crew.active]);
  assert.ok(after.xp > xpBefore || after.level > 1, "buddy gained XP from the race");
  assert.deepEqual(await page.evaluate(() => window.__game.loopStats), { caughtErrors: 0, crashes: 0 });
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

for (const width of WIDTHS) {
  test(`crew screen at ${width}px: pet, choose, evolve, wardrobe, shadows`, async () => {
    const page = await openGame(env.browser, env.server.url, { width, storage: { ...quiet, coins: 300 }, hash: "#/crew" });
    await page.getByTestId("screen-crew").waitFor();
    await screenshot(page, `${width}-crew-empty`);
    await inPage(page, (crew, stats, g) => {
      g.state.update((s) => {
        for (const id of ["chick", "kitten", "lizard", "dragon", "pup"]) s.crew.owned[id] = { id, level: id === "lizard" ? 8 : 3, xp: 5, stage: 0, hat: "none", glasses: "none", pets: 0 };
        s.crew.active = "lizard";
        s.crew.candy = 6;
      });
      const e = crew.addEgg("bear");
      crew.addEgg("chest");
      g.state.update((s) => (s.eggs.find((x) => x.id === e.id).races = 3));
    });
    await page.evaluate(() => (location.hash = "#/home"));
    await page.getByTestId("home-crew").click();
    await page.getByTestId("buddy-card").waitFor();
    await screenshot(page, `${width}-crew`);
    assert.equal(await page.locator('.crew-tile[data-owned="false"]').count(), 15, "15 grey shadows");
    assert.equal(await page.locator('.egg[data-ready="true"]').count(), 1);

    await page.getByTestId("pet").click();
    assert.equal(await page.evaluate(() => window.__game.state.getState().crew.owned.lizard.pets), 1);

    // evolve: level 8 and 6 candy are enough for stage 2
    await page.getByTestId("evolve").click();
    assert.equal(await page.getByTestId("buddy-card").getAttribute("data-stage"), "1");
    assert.equal(await page.getByTestId("evolve").isDisabled(), true, "stage 3 needs level 14");

    // choose another buddy
    await page.getByTestId("buddy-kitten").click();
    assert.equal(await page.getByTestId("buddy-card").getAttribute("data-buddy"), "kitten");
    await page.getByTestId("buddy-unicorn").click(); // a shadow: nothing happens
    assert.equal(await page.evaluate(() => window.__game.state.getState().crew.active), "kitten");

    // wardrobe
    await page.getByTestId("wardrobe-open").click();
    await page.getByTestId("wear-hat-cap").click();
    await page.getByTestId("wear-glasses-sun").click();
    await screenshot(page, `${width}-wardrobe`);
    const k = await page.evaluate(() => window.__game.state.getState().crew.owned.kitten);
    assert.deepEqual([k.hat, k.glasses], ["cap", "sun"]);
    assert.equal(await page.evaluate(() => window.__game.state.getState().coins), 300 - 80 - 100);
    assert.equal(await page.getByTestId("wear-hat-crown").isDisabled(), true, "too expensive");
    await page.getByRole("button", { name: "✖" }).click();
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}

test("dismantling can give candy; blue parts always do", async () => {
  const page = await openGame(env.browser, env.server.url, { storage: quiet });
  const r = await page.evaluate(async () => {
    const loot = await import("./js/systems/loot.js");
    const garage = await import("./js/systems/garage.js");
    const rng = window.__game.rng;
    rng.setSeed(4);
    garage.addParts([loot.generatePart({ rarity: "rare", budget: 20, rng })]);
    const uid = window.__game.state.getState().inventory[0].uid;
    const one = garage.dismantle(uid);
    garage.addParts(Array.from({ length: 20 }, () => loot.generatePart({ rarity: "common", budget: 5, rng })));
    const many = garage.dismantleLow();
    return { one, many, candy: window.__game.state.getState().crew.candy };
  });
  assert.ok(r.one.scrap > 0 && r.one.candy === 1);
  assert.ok(r.many.candy >= 1 && r.many.candy <= 15, `candy ${r.many.candy}`);
  assert.equal(r.candy, r.one.candy + r.many.candy);
  await page.context().close();
});

test("version-5 saves migrate to the current schema; boss eggs are kept", async () => {
  const page = await openGame(env.browser, env.server.url, { storage: { version: 5, coins: 5, eggs: [{ id: "e1", from: "bear", races: 2, at: 1 }] } });
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.equal(s.version, await page.evaluate(() => window.__game.state.CURRENT_VERSION));
  assert.equal(s.eggs.length, 1);
  assert.equal(s.crew.eggsEver, 1);
  assert.equal(s.crew.active, null);
  await page.goto(env.server.url + "#/crew");
  await page.getByTestId("screen-crew").waitFor();
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
